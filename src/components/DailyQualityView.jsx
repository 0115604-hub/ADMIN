import React, { useState, useMemo, useRef } from "react";
import {
  ShieldCheck,
  AlertTriangle,
  Download,
  Upload,
  Search,
  CheckCircle2,
  BarChart2,
  FileSpreadsheet,
  FileUp,
  Check,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  DollarSign,
  AlertCircle,
  Activity
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import * as XLSX from "xlsx";

// 4 Core Main Items (JA, NX4a, NX4, HR) from User's Excel Files
const INITIAL_CORE_ITEMS = [
  {
    id: "ja",
    name: "JA G-RUN",
    carModel: "JA",
    inspectQty: 57596,
    defectQty: 732,
    defectRate: 1.27,
    worstReason: "수포 (318건), 둔_어퍼떨어짐 (198건), 직_어퍼떨어짐 (112건)",
    lossAmount: 2281050,
    dailySummary: [
      { date: "08/24 (월)", insp: 1687, def: 32, rate: 1.90 },
      { date: "08/25 (화)", insp: 1501, def: 8, rate: 0.53 },
      { date: "08/26 (수)", insp: 1744, def: 16, rate: 0.92 },
      { date: "08/27 (목)", insp: 1500, def: 5, rate: 0.33 },
      { date: "08/28 (금)", insp: 1685, def: 15, rate: 0.89 },
      { date: "08/29 (토)", insp: 1563, def: 7, rate: 0.45 }
    ]
  },
  {
    id: "nx4a",
    name: "NX4a G-RUN",
    carModel: "NX4a",
    inspectQty: 50400,
    defectQty: 302,
    defectRate: 0.60,
    worstReason: "스코치 (148건), 직_찢어짐 (62건), 사상불량 (44건)",
    lossAmount: 1735594,
    dailySummary: [
      { date: "08/24 (월)", insp: 1200, def: 2, rate: 0.17 },
      { date: "08/25 (화)", insp: 960, def: 3, rate: 0.31 },
      { date: "08/26 (수)", insp: 1200, def: 26, rate: 2.17 },
      { date: "08/27 (목)", insp: 1200, def: 9, rate: 0.75 },
      { date: "08/28 (금)", insp: 960, def: 5, rate: 0.52 },
      { date: "08/29 (토)", insp: 960, def: 4, rate: 0.42 }
    ]
  },
  {
    id: "nx4",
    name: "NX4 G-RUN",
    carModel: "NX4",
    inspectQty: 25880,
    defectQty: 34,
    defectRate: 0.13,
    worstReason: "사상불량 (18건), 둔_삽입불량 (9건), 기타 (7건)",
    lossAmount: 195398,
    dailySummary: [
      { date: "08/24 (월)", insp: 1440, def: 1, rate: 0.07 },
      { date: "08/25 (화)", insp: 1440, def: 6, rate: 0.42 },
      { date: "08/26 (수)", insp: 1600, def: 4, rate: 0.25 },
      { date: "08/27 (목)", insp: 1440, def: 0, rate: 0.00 },
      { date: "08/28 (금)", insp: 1100, def: 3, rate: 0.27 },
      { date: "08/29 (토)", insp: 0, def: 0, rate: 0.00 }
    ]
  },
  {
    id: "hr",
    name: "HR G-RUN",
    carModel: "HR",
    inspectQty: 20858,
    defectQty: 270,
    defectRate: 1.29,
    worstReason: "직_어퍼떨어짐 (218건), 둔_어퍼떨어짐 (46건), 치수불량 (6건)",
    lossAmount: 640380,
    dailySummary: [
      { date: "08/24 (월)", insp: 520, def: 0, rate: 0.00 },
      { date: "08/25 (화)", insp: 520, def: 0, rate: 0.00 },
      { date: "08/26 (수)", insp: 742, def: 10, rate: 1.35 },
      { date: "08/27 (목)", insp: 630, def: 0, rate: 0.00 },
      { date: "08/28 (금)", insp: 627, def: 7, rate: 1.12 },
      { date: "08/29 (토)", insp: 0, def: 0, rate: 0.00 }
    ]
  }
];

const STORAGE_KEY_CORE_ITEMS = "factory_core_items_quality_v2_expandable";

export const DailyQualityView = () => {
  const { currentProfile } = useAuth();
  const fileInputRef = useRef(null);

  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CORE_ITEMS);
      return saved ? JSON.parse(saved) : INITIAL_CORE_ITEMS;
    } catch {
      return INITIAL_CORE_ITEMS;
    }
  });

  // Track expanded item ID for interactive detail breakdown
  const [expandedItemId, setExpandedItemId] = useState("hr"); // Default expand highest defect rate item
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([
    "G-RUN 불량율 집계.xlsx",
    "01. 08월 AB동-최종검사 정리.xlsx"
  ]);
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState("");

  // Sort items strictly by Inspection Quantity descending
  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => b.inspectQty - a.inspectQty);
  }, [items]);

  // Highest defect rate item
  const maxDefectRateItem = useMemo(() => {
    return items.reduce((max, it) => (it.defectRate > max.defectRate ? it : max), items[0]);
  }, [items]);

  // Toggle item expansion
  const toggleItemExpand = (id) => {
    setExpandedItemId((prev) => (prev === id ? null : id));
  };

  // Process files from Input or Drag & Drop
  const processFiles = (files) => {
    if (!files || files.length === 0) return;

    const fileList = Array.from(files);
    const names = fileList.map((f) => f.name);

    fileList.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const buffer = evt.target.result;
          const wb = XLSX.read(buffer, { type: "array" });

          const newItems = [...INITIAL_CORE_ITEMS];

          // Parse NX4, JA, HR sheets from AB동-최종검사 정리
          if (wb.Sheets["NX4 정리"] && wb.Sheets["JA 정리"] && wb.Sheets["HR 정리"]) {
            const nx4Json = XLSX.utils.sheet_to_json(wb.Sheets["NX4 정리"], { header: 1, defval: 0 });
            const jaJson = XLSX.utils.sheet_to_json(wb.Sheets["JA 정리"], { header: 1, defval: 0 });
            const hrJson = XLSX.utils.sheet_to_json(wb.Sheets["HR 정리"], { header: 1, defval: 0 });

            // NX4 Only
            const nx4Insp = nx4Json[35].slice(3).reduce((a, b) => a + (typeof b === "number" ? b : 0), 0) + nx4Json[36].slice(3).reduce((a, b) => a + (typeof b === "number" ? b : 0), 0);
            const nx4Def = nx4Json[40].slice(3).reduce((a, b) => a + (typeof b === "number" ? b : 0), 0) + nx4Json[41].slice(3).reduce((a, b) => a + (typeof b === "number" ? b : 0), 0);
            
            // NX4a
            const nx4aInsp = nx4Json[37].slice(3).reduce((a, b) => a + (typeof b === "number" ? b : 0), 0) + nx4Json[38].slice(3).reduce((a, b) => a + (typeof b === "number" ? b : 0), 0);
            const nx4aDef = nx4Json[42].slice(3).reduce((a, b) => a + (typeof b === "number" ? b : 0), 0) + nx4Json[43].slice(3).reduce((a, b) => a + (typeof b === "number" ? b : 0), 0);

            // JA
            const jaInsp = jaJson[39].slice(3).reduce((a, b) => a + (typeof b === "number" ? b : 0), 0);
            const jaDef = jaJson[44].slice(3).reduce((a, b) => a + (typeof b === "number" ? b : 0), 0);

            // HR
            const hrInsp = hrJson[39].slice(3).reduce((a, b) => a + (typeof b === "number" ? b : 0), 0);
            const hrDef = hrJson[44].slice(3).reduce((a, b) => a + (typeof b === "number" ? b : 0), 0);

            newItems.forEach((it) => {
              if (it.id === "nx4") { it.inspectQty = nx4Insp; it.defectQty = nx4Def; it.defectRate = nx4Insp > 0 ? Number(((nx4Def / nx4Insp) * 100).toFixed(2)) : 0; }
              if (it.id === "nx4a") { it.inspectQty = nx4aInsp; it.defectQty = nx4aDef; it.defectRate = nx4aInsp > 0 ? Number(((nx4aDef / nx4aInsp) * 100).toFixed(2)) : 0; }
              if (it.id === "ja") { it.inspectQty = jaInsp; it.defectQty = jaDef; it.defectRate = jaInsp > 0 ? Number(((jaDef / jaInsp) * 100).toFixed(2)) : 0; }
              if (it.id === "hr") { it.inspectQty = hrInsp; it.defectQty = hrDef; it.defectRate = hrInsp > 0 ? Number(((hrDef / hrInsp) * 100).toFixed(2)) : 0; }
            });

            setItems(newItems);
            localStorage.setItem(STORAGE_KEY_CORE_ITEMS, JSON.stringify(newItems));
          }

          setUploadSuccessMsg("성공적으로 동기화 및 반영되었습니다.");
          setTimeout(() => setUploadSuccessMsg(""), 4000);
        } catch (err) {
          console.error("Upload error:", err);
          alert("엑셀 파일 파싱 중 오류가 발생했습니다.");
        }
      };
      reader.readAsArrayBuffer(file);
    });

    setUploadedFiles(names);
  };

  // Drag & Drop Handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  // Export Analysis to Excel
  const handleExportExcel = () => {
    const rows = [
      ["아이템별 불량률 보고서"],
      ["조회일자", new Date().toLocaleDateString(), "관리목표", "0.70% 이하"],
      [],
      ["아이템명", "검사수량(EA)", "불량수량(EA)", "불량률(%)", "상태", "주요 불량 사유", "손실금액(원)"]
    ];

    sortedItems.forEach((it) => {
      const isMaxRate = it.id === maxDefectRateItem.id;
      rows.push([
        it.name,
        it.inspectQty,
        it.defectQty,
        `${it.defectRate}%`,
        isMaxRate ? "🚨 최고 불량률 경고" : it.defectRate <= 0.70 ? "목표달성" : "주의관리",
        it.worstReason,
        it.lossAmount
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "아이템별_불량현황");
    XLSX.writeFile(wb, `아이템별_품질현황_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  return (
    <div className="space-y-4 sm:space-y-5 animate-fadeIn pb-24 max-w-[1600px] mx-auto px-1.5 sm:px-0">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER & EXCEL EXPORT */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
              일일 품질현황
            </h1>
            <p className="text-[11px] text-slate-400">
              품질 관리 목표치: <strong className="text-emerald-600 font-bold">0.70% 이하</strong>
            </p>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. ⭐ [핵심 1] 아이템별 불량률(%) 비교 탭 (클릭 시 세부내용 아코디언 확장) */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3.5">
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600">
              <BarChart2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-black text-sm sm:text-base text-slate-900 dark:text-white">
                아이템별 불량률(%) 비교
              </h2>
              <p className="text-[11px] text-slate-400">
                각 아이템 항목을 <strong>클릭</strong>하면 상세 검사 수량, 주요 불량 원인 및 일자별 실적이 펼쳐집니다.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold shrink-0">
            <span className="flex items-center gap-1 text-emerald-600 text-[11px]">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>목표달성</span>
            </span>
            <span className="flex items-center gap-1 text-rose-600 text-[11px]">
              <span className="w-2 h-2 rounded-full bg-rose-600"></span>
              <span>최고불량</span>
            </span>
          </div>
        </div>

        {/* Clickable Interactive Item Bars with Smooth Expansion */}
        <div className="space-y-2.5 pt-1">
          {sortedItems.map((item) => {
            const isMaxRate = item.id === maxDefectRateItem.id;
            const isGood = item.defectRate <= 0.70;
            const maxRate = 1.6;
            const barWidthPct = Math.min(100, Math.max(8, (item.defectRate / maxRate) * 100));
            const isExpanded = expandedItemId === item.id;

            return (
              <div
                key={item.id}
                className={`rounded-2xl border transition-all overflow-hidden ${
                  isExpanded
                    ? isMaxRate
                      ? "bg-rose-50/70 dark:bg-rose-950/30 border-rose-400 ring-2 ring-rose-500/20 shadow-md"
                      : "bg-slate-50/90 dark:bg-slate-800/80 border-indigo-300 ring-2 ring-indigo-500/20 shadow-md"
                    : isMaxRate
                    ? "bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40 hover:border-rose-400"
                    : "bg-slate-50/40 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800 hover:border-slate-300"
                }`}
              >
                {/* Header Row (Clickable) */}
                <div
                  onClick={() => toggleItemExpand(item.id)}
                  className="p-3.5 sm:p-4 cursor-pointer flex flex-col gap-2 select-none"
                >
                  <div className="flex items-center justify-between text-xs font-black">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-900 dark:text-white font-extrabold text-sm sm:text-base">
                        {item.name}
                      </span>
                      {isMaxRate && (
                        <span className="px-2 py-0.5 rounded-md bg-rose-600 text-white text-[10px] font-black flex items-center gap-1 shadow-sm">
                          <AlertTriangle className="w-3 h-3" />
                          <span>최고 불량 🚨</span>
                        </span>
                      )}
                      {isGood && (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 text-[10px] font-black">
                          목표달성
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`text-base sm:text-xl font-black ${
                        isMaxRate
                          ? "text-rose-600 dark:text-rose-400"
                          : isGood
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-amber-600 dark:text-amber-400"
                      }`}>
                        {item.defectRate}%
                      </span>
                      <div className="p-1 rounded-lg bg-slate-200/60 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-200/70 dark:bg-slate-700/70 h-3 rounded-full overflow-hidden relative">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isMaxRate
                          ? "bg-gradient-to-r from-rose-600 to-red-500 shadow-sm shadow-rose-500/30"
                          : isGood
                          ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                          : "bg-gradient-to-r from-amber-500 to-orange-400"
                      }`}
                      style={{ width: `${barWidthPct}%` }}
                    ></div>
                  </div>
                </div>

                {/* ⭐ Expandable Detailed View (펼쳐지는 세부내용) */}
                {isExpanded && (
                  <div className="px-3.5 pb-4 sm:px-4 pt-1 border-t border-slate-200/60 dark:border-slate-700/60 space-y-3 animate-fadeIn">
                    {/* 3 Metric Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
                      <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                        <span className="text-[10px] text-slate-400 font-bold block">총 검사수량</span>
                        <strong className="text-sm font-black text-slate-900 dark:text-white">
                          {item.inspectQty.toLocaleString()} EA
                        </strong>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                        <span className="text-[10px] text-slate-400 font-bold block">총 불량수량</span>
                        <strong className={`text-sm font-black ${isMaxRate ? "text-rose-600 dark:text-rose-400" : "text-slate-900 dark:text-white"}`}>
                          {item.defectQty.toLocaleString()} EA
                        </strong>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                        <span className="text-[10px] text-slate-400 font-bold block">불량률</span>
                        <strong className={`text-sm font-black ${isMaxRate ? "text-rose-600 dark:text-rose-400" : "text-emerald-600"}`}>
                          {item.defectRate}%
                        </strong>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                        <span className="text-[10px] text-slate-400 font-bold block">품질 손실금액</span>
                        <strong className="text-sm font-black text-rose-600 dark:text-rose-400">
                          ₩ {item.lossAmount.toLocaleString()}
                        </strong>
                      </div>
                    </div>

                    {/* Worst Reason Box */}
                    <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs">
                      <strong className="text-slate-900 dark:text-white font-black block mb-1">
                        주요 불량 원인 및 유형:
                      </strong>
                      <span className="text-slate-700 dark:text-slate-300 font-semibold leading-relaxed">
                        {item.worstReason}
                      </span>
                    </div>

                    {/* Daily Trend Strip */}
                    {item.dailySummary && (
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold text-slate-400 block">최근 8월 일자별 실적 추이:</span>
                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 text-center text-[10px]">
                          {item.dailySummary.map((d, i) => (
                            <div key={i} className="p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700">
                              <span className="text-slate-400 block font-bold">{d.date.slice(0, 5)}</span>
                              <strong className="text-slate-800 dark:text-slate-200 block">{d.insp}EA</strong>
                              <span className={`font-black ${d.rate > 0.70 ? "text-rose-600 font-extrabold" : "text-emerald-600"}`}>
                                {d.rate}%
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. ⭐ [사용자 요청] 2개 파일 드래그 앤 드롭 업로드 탭 (맨 밑으로 이동) */}
      {/* ========================================================================= */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`p-4 sm:p-5 rounded-2xl border-2 border-dashed transition-all cursor-pointer flex flex-col sm:flex-row items-center justify-between gap-3 ${
          isDragging
            ? "border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/40 ring-4 ring-indigo-500/20 scale-[1.01]"
            : "border-slate-300 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/60 hover:border-indigo-400 hover:bg-indigo-50/30"
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={(e) => processFiles(e.target.files)}
          multiple
          accept=".xlsx, .xls"
          className="hidden"
        />

        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl transition-all shrink-0 ${
            isDragging ? "bg-indigo-600 text-white scale-110" : "bg-indigo-100 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400"
          }`}>
            <FileUp className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
              G-RUN 불량율 집계 & AB동 최종검사 파일 드래그 업로드
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              바탕화면의 엑셀 파일 2개를 이곳에 <strong>한 번에 드래그하여 놓거나 클릭</strong>하여 업로드하세요.
            </p>
          </div>
        </div>

        {/* Linked Files Status Badges */}
        <div className="flex flex-wrap items-center gap-1.5 shrink-0">
          {uploadedFiles.map((fn, idx) => (
            <div
              key={idx}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-700 dark:text-slate-200 shadow-sm"
            >
              <Check className="w-3 h-3 text-emerald-500 shrink-0" />
              <span className="truncate max-w-[160px]">{fn}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Upload Success Alert */}
      {uploadSuccessMsg && (
        <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{uploadSuccessMsg}</span>
        </div>
      )}
    </div>
  );
};
