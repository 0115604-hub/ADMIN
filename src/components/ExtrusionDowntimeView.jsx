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
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Edit3,
  Save,
  Check,
  X,
  Camera,
  UploadCloud,
  Image as ImageIcon,
  Loader2,
  AlertCircle,
  Eye,
  FileText,
  FileCheck
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import * as XLSX from "xlsx";
import masterExtrusionData from "../data/extrusion4LinesMasterData.json";
import { analyzeExtrusionImageFile, EXTRUSION_LINES, detectExtrusionLine } from "../utils/extrusionImageParser";

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

// Auto-resolve real current week key based on system date & WEEK_CALENDAR_MAP
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
      // Cross-month week (e.g. 8/31 ~ 9/06 or 12/28 ~ 01/03)
      if ((curMonth === startM && curDay >= startD) || (curMonth === endM && curDay <= endD)) {
        return weekKey;
      }
    }
  }

  // Fallback based on day
  let weekNum = 1;
  if (curDay <= 6) weekNum = 1;
  else if (curDay <= 13) weekNum = 2;
  else if (curDay <= 20) weekNum = 3;
  else if (curDay <= 27) weekNum = 4;
  else weekNum = 5;

  return `${curMonth}월${weekNum}주`;
};

// Helper: Ensure all weeks up to targetWeek exist for all 4 extrusion lines
export const ensureStoreHasWeeks = (store, targetWeekKey) => {
  if (!store) return store;
  let updatedStore = { ...store };
  const allWeekKeys = Object.keys(WEEK_CALENDAR_MAP);
  const targetIdx = allWeekKeys.indexOf(targetWeekKey);
  const weeksToEnsure = targetIdx >= 0 ? allWeekKeys.slice(0, targetIdx + 1) : [targetWeekKey];

  let hasChanges = false;
  const lineIds = ["pcm1", "pcm3", "pvc", "tpe"];

  lineIds.forEach((lineId) => {
    const lineObj = updatedStore[lineId] || {
      id: lineId,
      name: lineId,
      weeklyData: {}
    };
    const weeklyData = { ...(lineObj.weeklyData || {}) };

    weeksToEnsure.forEach((wKey) => {
      if (!weeklyData[wKey]) {
        const stdInfo = WEEK_CALENDAR_MAP[wKey] || {
          period: "미지정",
          daysList: ["01일 (월)", "02일 (화)", "03일 (수)", "04일 (목)", "05일 (금)", "06일 (토)", "07일 (일)"]
        };
        weeklyData[wKey] = {
          sheetName: wKey,
          period: stdInfo.period,
          daysList: stdInfo.daysList,
          rows: [],
          totalMinutes: 0,
          totalWeight: 0
        };
        hasChanges = true;
      }
    });

    if (hasChanges) {
      updatedStore[lineId] = {
        ...lineObj,
        weeklyData
      };
    }
  });

  return hasChanges ? updatedStore : store;
};

// Storage key with v8 for clean analyzed downtime data
const STORAGE_KEY = "factory_extrusion_downtime_4lines_v8_analyzed";

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

const DEFAULT_MONTHLY_OP_RATES = {
  pcm1: { "7월": "94.2%", "8월": "95.1%", "9월": "93.4%", default: "93.0%" },
  pcm3: { "7월": "93.5%", "8월": "94.0%", "9월": "92.8%", default: "92.8%" },
  pvc: { "7월": "89.6%", "8월": "96.5%", "9월": "91.5%", default: "91.5%" },
  tpe: { "7월": "96.3%", "8월": "89.7%", "9월": "95.2%", default: "95.2%" }
};

const ALL_MONTHS = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"];

const getLineOpRate = (lineObj, lineId, month) => {
  if (lineObj?.monthlyOperatingRates?.[month] !== undefined) {
    return lineObj.monthlyOperatingRates[month];
  }
  return DEFAULT_MONTHLY_OP_RATES[lineId]?.[month] || DEFAULT_MONTHLY_OP_RATES[lineId]?.default || "93.0%";
};

const getLineLossRate = (lineObj, month) => {
  if (lineObj?.monthlyLossRates?.[month] !== undefined) {
    return lineObj.monthlyLossRates[month];
  }
  if (lineObj?.monthlyLossRates?.default !== undefined) {
    return lineObj.monthlyLossRates.default;
  }
  return "6.0%";
};

export const LINE_DISPLAY_NAMES = {
  pcm1: "PCM #1 LINE",
  pcm3: "PCM #3 LINE",
  pvc: "PVC LINE",
  tpe: "TPE LINE"
};

export const ExtrusionDowntimeView = () => {
  const { currentProfile } = useAuth();

  const realCurrentWeek = useMemo(() => getRealCurrentWeekKey(), []);

  const [dataStore, setDataStore] = useState(() => {
    let initialStore = masterExtrusionData;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        initialStore = JSON.parse(saved);
      } else {
        const prevSaved = localStorage.getItem("factory_extrusion_downtime_4lines_v6_clean");
        if (prevSaved) initialStore = JSON.parse(prevSaved);
      }
    } catch (e) {
      console.error("Failed to load store:", e);
    }
    return ensureStoreHasWeeks(initialStore, getRealCurrentWeekKey());
  });

  const [selectedLineId, setSelectedLineId] = useState("pcm1");
  const [selectedWeek, setSelectedWeek] = useState(() => realCurrentWeek);
  const [monthFilter, setMonthFilter] = useState("전체"); // "전체" | "7월" | "8월" | "9월" | "10월" ...
  const [toastMessage, setToastMessage] = useState("");
  const [dragActiveTarget, setDragActiveTarget] = useState(null); // null | "batch" | "pcm1" | "pcm3" | "pvc" | "tpe"

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

  // Auto-select current week on line switch or login
  useEffect(() => {
    if (weeklySheets.length > 0) {
      if (weeklySheets.includes(realCurrentWeek)) {
        setSelectedWeek(realCurrentWeek);
      } else if (!weeklySheets.includes(selectedWeek)) {
        setSelectedWeek(weeklySheets[weeklySheets.length - 1]);
      }
    }
  }, [selectedLineId, currentProfile?.id, realCurrentWeek]);

  // Auto-scroll the active week badge into view so the user doesn't need to manually scroll
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

  // 1~12월 수동 지표 입력 모달 상태
  const [modalEditMonth, setModalEditMonth] = useState(null);
  const [modalOpRate, setModalOpRate] = useState("");
  const [modalLossRate, setModalLossRate] = useState("");

  const handleOpenMonthEditModal = (month) => {
    const op = getLineOpRate(currentLine, selectedLineId, month);
    const loss = getLineLossRate(currentLine, month);
    setModalEditMonth(month);
    setModalOpRate(op);
    setModalLossRate(loss);
  };

  const handleCloseMonthEditModal = () => {
    setModalEditMonth(null);
    setModalOpRate("");
    setModalLossRate("");
  };

  const handleSaveModalRates = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!modalEditMonth) return;

    let formattedOp = (modalOpRate || "").trim();
    if (formattedOp && !formattedOp.endsWith("%") && !isNaN(Number(formattedOp))) {
      formattedOp = `${formattedOp}%`;
    }
    if (!formattedOp) formattedOp = getLineOpRate(currentLine, selectedLineId, modalEditMonth);

    let formattedLoss = (modalLossRate || "").trim();
    if (formattedLoss && !formattedLoss.endsWith("%") && !isNaN(Number(formattedLoss))) {
      formattedLoss = `${formattedLoss}%`;
    }
    if (!formattedLoss) formattedLoss = getLineLossRate(currentLine, modalEditMonth);

    setDataStore((prev) => {
      const lineObj = { ...prev[selectedLineId] };
      const opRates = { ...(lineObj.monthlyOperatingRates || {}) };
      const lossRates = { ...(lineObj.monthlyLossRates || {}) };

      opRates[modalEditMonth] = formattedOp;
      lossRates[modalEditMonth] = formattedLoss;

      lineObj.monthlyOperatingRates = opRates;
      lineObj.monthlyLossRates = lossRates;

      return {
        ...prev,
        [selectedLineId]: lineObj
      };
    });

    showToast(`💾 [${currentLine.name}] ${modalEditMonth} 가동율(${formattedOp}) & LOSS율(${formattedLoss})이 저장되었습니다!`);
    handleCloseMonthEditModal();
  };

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

  // 4 Lines Image Upload & OCR Analysis State (PCM 1호, PCM 3호, PVC, TPE)
  const [photosByLine, setPhotosByLine] = useState({
    pcm1: null,
    pcm3: null,
    pvc: null,
    tpe: null
  });
  const [isAnalyzingPhotos, setIsAnalyzingPhotos] = useState(false);
  const [analyzingProgressText, setAnalyzingProgressText] = useState("");
  const [analysisResults, setAnalysisResults] = useState(null);
  const [isManualAddOpen, setIsManualAddOpen] = useState(false);

  const batchFileInputRef = useRef(null);
  const singleFileInputRefs = {
    pcm1: useRef(null),
    pcm3: useRef(null),
    pvc: useRef(null),
    tpe: useRef(null)
  };

  const handleSinglePhotoSelect = (lineId, file) => {
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    const sizeStr = (file.size / 1024).toFixed(1) + " KB";
    setPhotosByLine((prev) => ({
      ...prev,
      [lineId]: {
        file,
        previewUrl,
        name: file.name,
        size: sizeStr
      }
    }));
    const lineObj = EXTRUSION_LINES.find((l) => l.id === lineId);
    showToast(`📷 [${lineObj?.name || lineId}] 비가동 사진이 등록되었습니다.`);
  };

  const handleBatchFilesSelect = (fileList) => {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList).slice(0, 4);
    const updated = { ...photosByLine };
    const unassignedLineIds = ["pcm1", "pcm3", "pvc", "tpe"];
    const matchedLineIds = new Set();

    // First pass: try keyword detection
    files.forEach((file) => {
      const detected = detectExtrusionLine(file.name, "", null);
      if (detected && !matchedLineIds.has(detected)) {
        matchedLineIds.add(detected);
        const idx = unassignedLineIds.indexOf(detected);
        if (idx !== -1) unassignedLineIds.splice(idx, 1);
        updated[detected] = {
          file,
          previewUrl: URL.createObjectURL(file),
          name: file.name,
          size: (file.size / 1024).toFixed(1) + " KB"
        };
      }
    });

    // Second pass: assign remaining files to remaining slots
    files.forEach((file) => {
      const alreadyAssigned = Object.values(updated).some((item) => item?.file === file);
      if (!alreadyAssigned && unassignedLineIds.length > 0) {
        const lineId = unassignedLineIds.shift();
        updated[lineId] = {
          file,
          previewUrl: URL.createObjectURL(file),
          name: file.name,
          size: (file.size / 1024).toFixed(1) + " KB"
        };
      }
    });

    setPhotosByLine(updated);
    showToast(`📂 ${files.length}장의 비가동 사진이 라인별로 자동 배치되었습니다!`);
  };

  const handleRemovePhoto = (lineId) => {
    setPhotosByLine((prev) => {
      const next = { ...prev };
      if (next[lineId]?.previewUrl) {
        try {
          URL.revokeObjectURL(next[lineId].previewUrl);
        } catch (e) {}
      }
      next[lineId] = null;
      return next;
    });
  };

  // Drag and Drop Event Handlers
  const handleDragOver = (e, targetId) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = "copy";
    }
    if (dragActiveTarget !== targetId) {
      setDragActiveTarget(targetId);
    }
  };

  const handleDragLeave = (e, targetId) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget)) return;
    if (dragActiveTarget === targetId) {
      setDragActiveTarget(null);
    }
  };

  const handleLineCardDrop = (e, lineId) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActiveTarget(null);

    const files = e.dataTransfer?.files;
    if (!files || files.length === 0) return;

    if (files.length === 1) {
      handleSinglePhotoSelect(lineId, files[0]);
    } else {
      handleBatchFilesSelect(files);
    }
  };

  const handleBatchPanelDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActiveTarget(null);

    const files = e.dataTransfer?.files;
    if (!files || files.length === 0) return;
    handleBatchFilesSelect(files);
  };

  const handleAnalyzeLinePhoto = async (lineId) => {
    const photoObj = photosByLine[lineId];
    if (!photoObj || !photoObj.file) {
      alert("해당 라인에 등록된 사진이 없습니다.");
      return;
    }

    const lineMeta = EXTRUSION_LINES.find((l) => l.id === lineId) || { name: lineId };
    setIsAnalyzingPhotos(true);
    setAnalyzingProgressText(`[${lineMeta.name}] 비가동 현황 사진 OCR 분석 중...`);

    try {
      const result = await analyzeExtrusionImageFile(
        photoObj.file,
        lineId,
        selectedWeek,
        (pText) => setAnalyzingProgressText(`[${lineMeta.name}] ${pText}`)
      );

      if (result.success && result.rows.length > 0) {
        setDataStore((prev) => {
          const lineObj = { ...prev[lineId] };
          const weekObj = { ...(lineObj.weeklyData[selectedWeek] || currentWeekData) };
          weekObj.rows = result.rows;
          lineObj.weeklyData[selectedWeek] = weekObj;

          return {
            ...prev,
            [lineId]: lineObj
          };
        });

        setSelectedLineId(lineId);
        showToast(`🎉 [${lineMeta.name}] 사진 분석 완료! ${result.rows.length}개 실적 행이 등록되었습니다.`);
      } else {
        alert("사진에서 비가동 데이터를 추출하지 못했습니다. 기본 형식으로 자동 변환 등록합니다.");
      }
    } catch (err) {
      console.error("OCR Analysis error:", err);
      showToast("⚠️ 분석 중 오류가 발생했습니다.");
    } finally {
      setIsAnalyzingPhotos(false);
      setAnalyzingProgressText("");
    }
  };

  const handleAnalyzeAllPhotos = async () => {
    const attachedEntries = Object.entries(photosByLine).filter(([_, p]) => p && p.file);
    if (attachedEntries.length === 0) {
      alert("분석할 비가동 사진을 최소 1장 이상 업로드해 주세요.");
      return;
    }

    setIsAnalyzingPhotos(true);
    const summary = {};

    try {
      for (let i = 0; i < attachedEntries.length; i++) {
        const [lineId, photoObj] = attachedEntries[i];
        const lineMeta = EXTRUSION_LINES.find((l) => l.id === lineId) || { name: lineId };
        setAnalyzingProgressText(`[${i + 1}/${attachedEntries.length}] ${lineMeta.name} OCR 분석 중...`);

        const result = await analyzeExtrusionImageFile(
          photoObj.file,
          lineId,
          selectedWeek,
          (pText) => setAnalyzingProgressText(`[${i + 1}/${attachedEntries.length}] ${lineMeta.name} ${pText}`)
        );

        if (result.success && result.rows && result.rows.length > 0) {
          setDataStore((prev) => {
            const lineObj = { ...prev[lineId] };
            const weekObj = { ...(lineObj.weeklyData[selectedWeek] || currentWeekData) };
            weekObj.rows = result.rows;
            lineObj.weeklyData[selectedWeek] = weekObj;

            return {
              ...prev,
              [lineId]: lineObj
            };
          });

          summary[lineId] = {
            name: lineMeta.name,
            rowCount: result.rows.length,
            totalMinutes: result.totalMinutes,
            totalWeight: result.totalWeight
          };
        }
      }

      setAnalysisResults(summary);
      showToast(`🚀 ${attachedEntries.length}개 라인의 비가동 사진 분석 및 실적표 자동 등록이 완료되었습니다!`);
    } catch (err) {
      console.error("Batch OCR Analysis error:", err);
      showToast("⚠️ 사진 일괄 분석 중 일부 오류가 발생했습니다.");
    } finally {
      setIsAnalyzingPhotos(false);
      setAnalyzingProgressText("");
    }
  };

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
    const allWeekKeys = Object.keys(WEEK_CALENDAR_MAP);
    const existingIdxs = weeklySheets
      .map((w) => allWeekKeys.indexOf(w))
      .filter((idx) => idx !== -1);
    const maxIdx = existingIdxs.length > 0 ? Math.max(...existingIdxs) : -1;
    const nextCandidate =
      maxIdx !== -1 && maxIdx + 1 < allWeekKeys.length
        ? allWeekKeys[maxIdx + 1]
        : "9월4주";

    const nextWeekName = prompt(
      "새로 생성할 주차 이름을 입력하세요 (예: 9월2주, 9월3주, 9월4주, 10월1주):",
      nextCandidate
    );
    if (!nextWeekName || !nextWeekName.trim()) return;

    const trimmed = nextWeekName.trim();
    if (weeklySheets.includes(trimmed)) {
      alert("이미 동일한 이름의 주차가 존재합니다. 해당 주차로 이동합니다.");
      setSelectedWeek(trimmed);
      return;
    }

    const stdInfo = WEEK_CALENDAR_MAP[trimmed] || {
      period: "미지정",
      daysList: ["01일 (월)", "02일 (화)", "03일 (수)", "04일 (목)", "05일 (금)", "06일 (토)", "07일 (일)"]
    };

    setDataStore((prev) => {
      const nextStore = { ...prev };
      const lineIds = ["pcm1", "pcm3", "pvc", "tpe"];

      lineIds.forEach((lId) => {
        const lineObj = { ...(nextStore[lId] || {}) };
        const updatedWeekly = { ...(lineObj.weeklyData || {}) };
        if (!updatedWeekly[trimmed]) {
          updatedWeekly[trimmed] = {
            sheetName: trimmed,
            period: stdInfo.period,
            daysList: stdInfo.daysList,
            rows: [],
            totalMinutes: 0,
            totalWeight: 0
          };
        }
        lineObj.weeklyData = updatedWeekly;
        nextStore[lId] = lineObj;
      });

      return nextStore;
    });

    setSelectedWeek(trimmed);
    showToast(`🎉 [${trimmed} (${stdInfo.period})] 신규 주차가 4개 라인에 모두 생성되었습니다!`);
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
      [`오륙산업 삼랑진공장 - ${currentLineName} 주간 비가동 및 생산 일지`],
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

    rows.push([
      `■ [${currentMonthStr}] 월간 누적 관리 지표`,
      "",
      `월가동율: ${getLineOpRate(currentLine, selectedLineId, currentMonthStr)}`,
      `월누적LOSS율: ${getLineLossRate(currentLine, currentMonthStr)}`,
      "",
      "",
      "수동 지표 연동",
      "관리자 수동 입력 완료"
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

      {/* 4 Lines Selector Tabs (Simple & Compact: PCM #1 LINE, PCM #3 LINE, PVC LINE, TPE LINE) */}
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
              className={`py-2 px-3 sm:px-4 rounded-xl text-left border transition-all flex items-center justify-between cursor-pointer active:scale-98 ${
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
                <span className="text-[9.5px] font-black px-1.5 py-0.2 rounded-md bg-teal-600 text-white shrink-0">
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

      {/* 3. Week Tabs Navigation with Auto-Scroll & Quick Month Jump (스크롤 최소화) */}
      <div className="bg-white rounded-2xl p-3 border border-slate-200/90 shadow-xs space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-2 flex-wrap">
            <Calendar className="w-4 h-4 text-teal-600" />
            <span className="text-xs font-black text-slate-700">주차 선택:</span>

            {/* Month Filter Jump Pills */}
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
            {/* Quick jump to current week button */}
            <button
              type="button"
              onClick={() => {
                setMonthFilter("전체");
                setSelectedWeek(realCurrentWeek);
              }}
              className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-black text-[11px] shadow-xs transition active:scale-95 cursor-pointer flex items-center gap-1"
            >
              <span>⭐ 금주 ({realCurrentWeek}) 바로보기</span>
            </button>

            <span>선택:</span>
            <span className="px-2.5 py-0.5 rounded-lg bg-teal-50 text-teal-800 font-black border border-teal-200">
              {selectedWeek} ({currentWeekData.period})
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
              const isThisWeek = w === realCurrentWeek;
              const wPeriod = WEEK_CALENDAR_MAP[w]?.period || currentLine?.weeklyData?.[w]?.period || "";

              return (
                <button
                  key={w}
                  ref={isSelected ? activeWeekTabRef : null}
                  type="button"
                  onClick={() => setSelectedWeek(w)}
                  className={`px-3.5 py-2.5 rounded-xl text-xs font-black whitespace-nowrap transition flex flex-col items-center gap-0.5 cursor-pointer relative shrink-0 ${
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
                            : "bg-amber-500 text-white font-black shadow-xs animate-pulse"
                        }`}
                      >
                        ⭐ 금주
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

          <button
            type="button"
            onClick={handleCreateNextWeek}
            className="px-4 py-2.5 rounded-xl text-xs font-black bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 whitespace-nowrap flex items-center gap-1 cursor-pointer self-stretch transition active:scale-95 shadow-xs shrink-0"
          >
            <Plus className="w-3.5 h-3.5" /> 새 주차 생성
          </button>
        </div>
      </div>

      {/* 4. 4-Lines Downtime Image Upload & OCR AI Smart Analysis Panel with Drag-and-Drop */}
      <div
        onDragOver={(e) => handleDragOver(e, "batch")}
        onDragEnter={(e) => handleDragOver(e, "batch")}
        onDragLeave={(e) => handleDragLeave(e, "batch")}
        onDrop={handleBatchPanelDrop}
        className={`bg-white rounded-2xl p-5 border shadow-xs space-y-4 transition-all relative ${
          dragActiveTarget === "batch"
            ? "border-2 border-dashed border-teal-500 bg-teal-50/40 ring-4 ring-teal-500/20"
            : "border-slate-200/90"
        }`}
      >
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="p-1.5 rounded-lg bg-teal-500/10 text-teal-600 border border-teal-500/20">
                <Camera className="w-4 h-4" />
              </div>
              <h2 className="text-sm sm:text-base font-black text-slate-900">
                📸 [4개 라인 비가동 현황 사진 업로드 & OCR AI 자동 분석]
              </h2>
              <span className="text-[11px] font-bold text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-lg border border-teal-200">
                선택 주차: [{selectedWeek}] ({currentWeekData.period})
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              PCM 1호, PCM 3호, PVC, TPE 비가동 현황 사진을 등록하시면 AI/OCR이 텍스트와 수치를 분석하여 아래 상세작업 실적표에 자동 반영합니다. (파일 드래그 & 드롭 지원)
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Hidden Batch Input */}
            <input
              type="file"
              ref={batchFileInputRef}
              multiple
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                handleBatchFilesSelect(e.target.files);
                e.target.value = "";
              }}
            />
            <button
              type="button"
              onClick={() => batchFileInputRef.current?.click()}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-black border border-slate-200 flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
            >
              <UploadCloud className="w-4 h-4 text-slate-600" />
              <span>사진 4장 일괄 등록 (또는 드래그)</span>
            </button>

            <button
              type="button"
              disabled={isAnalyzingPhotos || Object.values(photosByLine).filter(Boolean).length === 0}
              onClick={handleAnalyzeAllPhotos}
              className={`px-4 py-2 rounded-xl text-xs font-black shadow-md flex items-center gap-2 transition active:scale-95 cursor-pointer ${
                isAnalyzingPhotos || Object.values(photosByLine).filter(Boolean).length === 0
                  ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                  : "bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white"
              }`}
            >
              {isAnalyzingPhotos ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>분석 진행 중...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>⚡ 비가동 사진 일괄 분석 및 실적표 자동 반영</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Analyzing Progress Alert */}
        {isAnalyzingPhotos && (
          <div className="p-3.5 bg-teal-50 border border-teal-200 rounded-xl flex items-center gap-3 animate-pulse">
            <Loader2 className="w-5 h-5 text-teal-600 animate-spin flex-shrink-0" />
            <div className="text-xs">
              <span className="font-black text-teal-900">AI OCR 텍스트 및 수치 정밀 추출 중:</span>{" "}
              <span className="font-bold text-teal-700">{analyzingProgressText}</span>
            </div>
          </div>
        )}

        {/* 4 Line Cards Grid with Individual Drag & Drop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {EXTRUSION_LINES.map((line) => {
            const photo = photosByLine[line.id];
            const isSelected = selectedLineId === line.id;
            const isDraggingThis = dragActiveTarget === line.id;

            return (
              <div
                key={line.id}
                onDragOver={(e) => handleDragOver(e, line.id)}
                onDragEnter={(e) => handleDragOver(e, line.id)}
                onDragLeave={(e) => handleDragLeave(e, line.id)}
                onDrop={(e) => handleLineCardDrop(e, line.id)}
                className={`rounded-xl border transition-all p-3.5 flex flex-col justify-between space-y-2.5 ${
                  isDraggingThis
                    ? "border-2 border-teal-500 bg-teal-50 ring-4 ring-teal-500/30 scale-[1.02]"
                    : photo
                    ? "bg-white border-teal-300 ring-1 ring-teal-400/30 shadow-xs"
                    : "bg-slate-50/70 border-dashed border-slate-300 hover:border-slate-400 hover:bg-slate-50"
                }`}
              >
                {/* Card Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider bg-slate-200 text-slate-800">
                      {line.code}
                    </span>
                    <span className="text-xs font-black text-slate-900">{line.name}</span>
                  </div>
                  {photo ? (
                    <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-0.5">
                      <Check className="w-3 h-3 text-emerald-600" /> 준비완료
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-slate-400">사진 미등록</span>
                  )}
                </div>

                {/* Card Body: Preview or Upload Box */}
                {photo ? (
                  <div className="space-y-2">
                    <div className="relative group rounded-lg overflow-hidden border border-slate-200 bg-slate-900/5 aspect-video flex items-center justify-center">
                      <img
                        src={photo.previewUrl}
                        alt={photo.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => window.open(photo.previewUrl, "_blank")}
                          className="p-1.5 rounded-lg bg-white/90 text-slate-800 hover:bg-white text-xs font-bold shadow-xs cursor-pointer"
                          title="크게 보기"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemovePhoto(line.id)}
                          className="p-1.5 rounded-lg bg-rose-600 text-white hover:bg-rose-700 text-xs font-bold shadow-xs cursor-pointer"
                          title="삭제"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-600">
                      <span className="truncate max-w-[150px] font-medium" title={photo.name}>
                        {photo.name}
                      </span>
                      <span className="text-slate-400 font-bold">{photo.size}</span>
                    </div>

                    <div className="flex items-center gap-1.5 pt-1">
                      <button
                        type="button"
                        disabled={isAnalyzingPhotos}
                        onClick={() => handleAnalyzeLinePhoto(line.id)}
                        className="flex-1 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-black flex items-center justify-center gap-1 transition active:scale-95 cursor-pointer disabled:opacity-50"
                      >
                        <Sparkles className="w-3 h-3 text-amber-300" />
                        <span>개별 분석</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(line.id)}
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                        title="사진 삭제"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => singleFileInputRefs[line.id]?.current?.click()}
                    className={`aspect-video rounded-lg border border-dashed transition flex flex-col items-center justify-center gap-1.5 cursor-pointer p-3 text-center group ${
                      isDraggingThis
                        ? "border-teal-500 bg-teal-100/60"
                        : "border-slate-300 hover:border-teal-400 hover:bg-teal-50/30"
                    }`}
                  >
                    <input
                      type="file"
                      ref={singleFileInputRefs[line.id]}
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          handleSinglePhotoSelect(line.id, e.target.files[0]);
                          e.target.value = "";
                        }
                      }}
                    />
                    <div className="p-2 rounded-full bg-slate-200/60 group-hover:bg-teal-100 text-slate-500 group-hover:text-teal-600 transition">
                      <UploadCloud className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-700 group-hover:text-teal-700">
                      {line.code} 사진 선택
                    </span>
                    <span className="text-[10px] text-slate-400">
                      클릭 또는 <strong className="text-teal-600">파일 드래그</strong>
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer info & Collapsible Manual Form Toggle */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-2 text-slate-500 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>지원 파일: JPG, PNG, WEBP (스마트폰 촬영 사진 즉시 등록 가능)</span>
          </div>

          <button
            type="button"
            onClick={() => setIsManualAddOpen((prev) => !prev)}
            className="text-xs font-bold text-slate-600 hover:text-teal-700 flex items-center gap-1 transition cursor-pointer"
          >
            {isManualAddOpen ? "▲ 수동 등록창 닫기" : "➕ 수동 데이터 1건 직접 등록 열기"}
          </button>
        </div>

        {/* Collapsible Manual Registration Form */}
        {isManualAddOpen && (
          <div className="pt-3 border-t border-slate-100 space-y-3 animate-fadeIn">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-teal-500"></span>
              <h3 className="text-xs font-black text-slate-800">
                [수동 직접 등록] {currentLine.name} • [{selectedWeek}] 실적 1건 추가
              </h3>
            </div>

            <form onSubmit={handleRegister} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2.5">
                <div>
                  <label className="block text-[11px] font-black text-slate-700 mb-1">일자/요일 (선택▼)</label>
                  <select
                    value={inputForm.day}
                    onChange={(e) => setInputForm({ ...inputForm, day: e.target.value })}
                    className="w-full text-xs font-bold px-3 py-2 rounded-xl border border-slate-200 bg-amber-50/60 focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none cursor-pointer"
                  >
                    {daysOptions.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-black text-slate-700 mb-1">근무조 (선택▼)</label>
                  <select
                    value={inputForm.shift}
                    onChange={(e) => setInputForm({ ...inputForm, shift: e.target.value })}
                    className="w-full text-xs font-bold px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none cursor-pointer"
                  >
                    {SHIFTS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-black text-slate-700 mb-1">구분 (선택▼)</label>
                  <select
                    value={inputForm.category}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    className="w-full text-xs font-bold px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none cursor-pointer"
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
                    placeholder="예: GL3 PART'G SEAL 형교환"
                    value={inputForm.task}
                    onChange={(e) => setInputForm({ ...inputForm, task: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black text-slate-700 mb-1">비가동(분)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={inputForm.minutes}
                    onChange={(e) => setInputForm({ ...inputForm, minutes: e.target.value })}
                    className="w-full text-xs font-black text-right px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 outline-none text-rose-600"
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
                    className="w-full text-xs font-black text-right px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 outline-none text-blue-700"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black text-slate-700 mb-1">LOSS율/비고</label>
                  <input
                    type="text"
                    placeholder="-. LOSS율 6.5%"
                    value={inputForm.note}
                    onChange={(e) => setInputForm({ ...inputForm, note: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 outline-none text-center font-medium"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-1">
                <div className="w-full flex-1">
                  <input
                    type="text"
                    placeholder="조치사항 및 결과 (예: 금형 체결 및 승온 정상화, 양품 확인)"
                    value={inputForm.action}
                    onChange={(e) => setInputForm({ ...inputForm, action: e.target.value })}
                    className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none font-medium"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full sm:w-auto px-6 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-black shadow-xs flex items-center justify-center gap-1.5 whitespace-nowrap transition cursor-pointer active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>수동 등록</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* 5. Main Weekly Production Table (시인성 대폭 강화) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-slate-700" />
            <span className="font-black text-sm text-slate-900">
              {currentLineName} - [{selectedWeek}] 주간 상세 작업 실적표
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
                <td colSpan={4} className="py-3 px-4 text-center font-black text-sm">
                  ■ 주간 총 비가동 및 LOSS 합계 (실시간 자동 연동)
                </td>
                <td className="py-3 px-3.5 text-right text-rose-600 text-base font-black">
                  {weeklyTotals.totalMin.toLocaleString()}
                </td>
                <td className="py-3 px-3.5 text-right text-blue-700 text-base font-black">
                  {weeklyTotals.totalKg}
                </td>
                <td colSpan={3} className="py-3 px-3 text-slate-500 italic text-xs">
                  (=SUM 실시간 자동 계산 연동)
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* 상세작업실적표 맨 아래: 1~12월 정렬된 작은 패널 그리드 (탭하면 가동율/LOSS율 수동 입력 모달) */}
        <div className="p-3 sm:p-3.5 bg-slate-900 border-t border-slate-800 text-white space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-1.5 border-b border-slate-800">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-teal-400"></div>
              <span className="text-xs sm:text-sm font-black text-white">
                📊 [{currentLineName}] 1~12월 가동율 및 LOSS율 관리 패널
              </span>
              <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/40 font-bold">
                탭 ➔ 수동 입력
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-medium">
              원하는 월 패널을 탭(클릭)하면 가동율과 LOSS율을 수동으로 입력/수정할 수 있습니다.
            </span>
          </div>

          {/* 1~12월 12개 정렬된 패널 그리드 */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-12 gap-1.5">
            {ALL_MONTHS.map((m) => {
              const opRate = getLineOpRate(currentLine, selectedLineId, m);
              const lossRate = getLineLossRate(currentLine, m);
              const isCurrent = m === currentMonthStr;

              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => handleOpenMonthEditModal(m)}
                  className={`p-1.5 sm:p-2 rounded-lg border text-left transition-all flex flex-col justify-between group cursor-pointer active:scale-95 ${
                    isCurrent
                      ? "bg-slate-800/95 border-teal-500 ring-1 ring-teal-500/40 shadow-xs hover:bg-slate-800"
                      : "bg-slate-800/60 border-slate-700/70 hover:border-teal-400/60 hover:bg-slate-800"
                  }`}
                >
                  <div className="flex items-center justify-between pb-0.5 border-b border-slate-700/60 mb-1">
                    <span className={`text-[11px] font-black ${isCurrent ? "text-amber-400" : "text-slate-200 group-hover:text-white"}`}>
                      {m}
                    </span>
                    {isCurrent ? (
                      <span className="text-[7.5px] px-1 py-0 rounded bg-amber-400/20 text-amber-300 font-bold border border-amber-400/30">
                        당월
                      </span>
                    ) : (
                      <Edit3 className="w-2.5 h-2.5 text-slate-500 group-hover:text-teal-400 transition" />
                    )}
                  </div>

                  <div className="space-y-0.5 text-[9px] leading-tight">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-bold">가동</span>
                      <span className="text-emerald-400 font-black">{opRate || "-"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-bold">LOSS</span>
                      <span className="text-amber-400 font-black">{lossRate || "-"}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 1~12월 개별 지표 수동 입력 모달 */}
      {modalEditMonth && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xl w-full max-w-sm space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-teal-50 text-teal-700 border border-teal-200">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-900">
                    [{currentLineName}] {modalEditMonth} 지표 수동 입력
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    가동율과 LOSS율을 수동으로 입력해 주세요.
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseMonthEditModal}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveModalRates} className="space-y-3.5">
              {/* 1. 월가동율 입력 */}
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  <span>{modalEditMonth} 월가동율 (%)</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={modalOpRate}
                    onChange={(e) => setModalOpRate(e.target.value)}
                    placeholder="예: 93.4 또는 93.4%"
                    autoFocus
                    className="w-full px-3.5 py-2.5 text-sm font-black rounded-xl border border-slate-200 bg-emerald-50/40 text-emerald-900 focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">
                    %
                  </span>
                </div>
              </div>

              {/* 2. 월누적 LOSS율 입력 */}
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1 flex items-center gap-1.5">
                  <TrendingDown className="w-4 h-4 text-amber-600" />
                  <span>{modalEditMonth} 월누적 LOSS율 (%)</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={modalLossRate}
                    onChange={(e) => setModalLossRate(e.target.value)}
                    placeholder="예: 6.6 또는 6.6%"
                    className="w-full px-3.5 py-2.5 text-sm font-black rounded-xl border border-slate-200 bg-amber-50/40 text-amber-900 focus:bg-white focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">
                    %
                  </span>
                </div>
              </div>

              {/* 버튼 그룹 */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleCloseMonthEditModal}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-black hover:bg-slate-100 transition cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-black flex items-center gap-1.5 shadow-md transition active:scale-95 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  {modalEditMonth} 지표 저장
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExtrusionDowntimeView;
