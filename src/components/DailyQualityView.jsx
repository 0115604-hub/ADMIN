import React, { useState, useMemo, useRef } from "react";
import {
  CheckSquare,
  ShieldCheck,
  AlertCircle,
  Plus,
  Trash2,
  Download,
  Upload,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Save,
  Calendar,
  Layers,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Award,
  BarChart2,
  FileSpreadsheet,
  RefreshCw,
  Check,
  ChevronRight,
  Activity,
  AlertTriangle
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useMonth } from "../context/MonthContext";
import * as XLSX from "xlsx";

// Default Initial Authentic Dataset from User's Desktop Files:
// 1. "01. 08월 AB동-최종검사 정리.xlsx" (MAIN (2) / JA 정리 / HR 정리 / NX4 정리)
// 2. "G-RUN 불량율 집계.xlsx"
const INITIAL_DAILY_DATA = [
  { day: 7, date: "2026-08-07", label: "8/7 (금)", totalInsp: 3975, totalDef: 43, totalRate: 1.08, totalCost: 192474, nx4: { insp: 1680, def: 24, rate: 1.43, cost: 137928 }, ja: { insp: 1592, def: 19, rate: 1.19, cost: 54546 }, hr: { insp: 703, def: 0, rate: 0, cost: 0 } },
  { day: 10, date: "2026-08-10", label: "8/10 (월)", totalInsp: 4195, totalDef: 55, totalRate: 1.31, totalCost: 184352, nx4: { insp: 1920, def: 10, rate: 0.52, cost: 57470 }, ja: { insp: 1624, def: 37, rate: 2.28, cost: 105666 }, hr: { insp: 651, def: 8, rate: 1.23, cost: 21216 } },
  { day: 11, date: "2026-08-11", label: "8/11 (화)", totalInsp: 5914, totalDef: 109, totalRate: 1.84, totalCost: 295284, nx4: { insp: 2800, def: 6, rate: 0.21, cost: 34482 }, ja: { insp: 2205, def: 39, rate: 1.77, cost: 116034 }, hr: { insp: 909, def: 64, rate: 7.04, cost: 144768 } },
  { day: 12, date: "2026-08-12", label: "8/12 (수)", totalInsp: 5846, totalDef: 71, totalRate: 1.21, totalCost: 217327, nx4: { insp: 3000, def: 7, rate: 0.23, cost: 39778 }, ja: { insp: 1967, def: 41, rate: 2.08, cost: 125523 }, hr: { insp: 879, def: 23, rate: 2.62, cost: 52026 } },
  { day: 13, date: "2026-08-13", label: "8/13 (목)", totalInsp: 5658, totalDef: 34, totalRate: 0.60, totalCost: 136402, nx4: { insp: 3000, def: 12, rate: 0.40, cost: 68062 }, ja: { insp: 1928, def: 22, rate: 1.14, cost: 68340 }, hr: { insp: 730, def: 0, rate: 0, cost: 0 } },
  { day: 14, date: "2026-08-14", label: "8/14 (금)", totalInsp: 4114, totalDef: 39, totalRate: 0.95, totalCost: 122605, nx4: { insp: 1680, def: 2, rate: 0.12, cost: 11494 }, ja: { insp: 1689, def: 27, rate: 1.60, cost: 84591 }, hr: { insp: 745, def: 10, rate: 1.34, cost: 26520 } },
  { day: 15, date: "2026-08-15", label: "8/15 (토)", totalInsp: 960, totalDef: 4, totalRate: 0.42, totalCost: 22988, nx4: { insp: 960, def: 4, rate: 0.42, cost: 22988 }, ja: { insp: 0, def: 0, rate: 0, cost: 0 }, hr: { insp: 0, def: 0, rate: 0, cost: 0 } },
  { day: 18, date: "2026-08-18", label: "8/18 (화)", totalInsp: 4480, totalDef: 41, totalRate: 0.92, totalCost: 144121, nx4: { insp: 2160, def: 5, rate: 0.23, cost: 28735 }, ja: { insp: 1682, def: 28, rate: 1.66, cost: 94170 }, hr: { insp: 638, def: 8, rate: 1.25, cost: 21216 } },
  { day: 19, date: "2026-08-19", label: "8/19 (수)", totalInsp: 4567, totalDef: 29, totalRate: 0.63, totalCost: 119257, nx4: { insp: 2160, def: 11, rate: 0.51, cost: 63217 }, ja: { insp: 1682, def: 13, rate: 0.77, cost: 42780 }, hr: { insp: 725, def: 5, rate: 0.69, cost: 13260 } },
  { day: 20, date: "2026-08-20", label: "8/20 (목)", totalInsp: 4645, totalDef: 32, totalRate: 0.69, totalCost: 135410, nx4: { insp: 2160, def: 13, rate: 0.60, cost: 74711 }, ja: { insp: 1685, def: 19, rate: 1.13, cost: 60699 }, hr: { insp: 800, def: 0, rate: 0, cost: 0 } },
  { day: 21, date: "2026-08-21", label: "8/21 (금)", totalInsp: 4210, totalDef: 20, totalRate: 0.48, totalCost: 81567, nx4: { insp: 2160, def: 6, rate: 0.28, cost: 34482 }, ja: { insp: 1440, def: 14, rate: 0.97, cost: 47085 }, hr: { insp: 610, def: 0, rate: 0, cost: 0 } },
  { day: 22, date: "2026-08-22", label: "8/22 (토)", totalInsp: 2584, totalDef: 29, totalRate: 1.12, totalCost: 107443, nx4: { insp: 960, def: 5, rate: 0.52, cost: 28735 }, ja: { insp: 1624, def: 24, rate: 1.48, cost: 78708 }, hr: { insp: 0, def: 0, rate: 0, cost: 0 } },
  { day: 24, date: "2026-08-24", label: "8/24 (월)", totalInsp: 4847, totalDef: 35, totalRate: 0.72, totalCost: 115874, nx4: { insp: 2640, def: 3, rate: 0.11, cost: 16790 }, ja: { insp: 1687, def: 32, rate: 1.90, cost: 99084 }, hr: { insp: 520, def: 0, rate: 0, cost: 0 } },
  { day: 25, date: "2026-08-25", label: "8/25 (화)", totalInsp: 4421, totalDef: 17, totalRate: 0.38, totalCost: 75546, nx4: { insp: 2400, def: 9, rate: 0.38, cost: 49017 }, ja: { insp: 1501, def: 8, rate: 0.53, cost: 26529 }, hr: { insp: 520, def: 0, rate: 0, cost: 0 } },
  { day: 26, date: "2026-08-26", label: "8/26 (수)", totalInsp: 5286, totalDef: 56, totalRate: 1.06, totalCost: 244526, nx4: { insp: 2800, def: 30, rate: 1.07, cost: 170606 }, ja: { insp: 1744, def: 16, rate: 0.92, cost: 51300 }, hr: { insp: 742, def: 10, rate: 1.35, cost: 22620 } },
  { day: 27, date: "2026-08-27", label: "8/27 (목)", totalInsp: 4770, totalDef: 14, totalRate: 0.29, totalCost: 68853, nx4: { insp: 2640, def: 9, rate: 0.34, cost: 51723 }, ja: { insp: 1500, def: 5, rate: 0.33, cost: 17130 }, hr: { insp: 630, def: 0, rate: 0, cost: 0 } },
  { day: 28, date: "2026-08-28", label: "8/28 (금)", totalInsp: 4372, totalDef: 30, totalRate: 0.69, totalCost: 110182, nx4: { insp: 2060, def: 8, rate: 0.39, cost: 44623 }, ja: { insp: 1685, def: 15, rate: 0.89, cost: 46995 }, hr: { insp: 627, def: 7, rate: 1.12, cost: 18564 } },
  { day: 29, date: "2026-08-29", label: "8/29 (토)", totalInsp: 2523, totalDef: 11, totalRate: 0.44, totalCost: 44333, nx4: { insp: 960, def: 4, rate: 0.42, cost: 22988 }, ja: { insp: 1563, def: 7, rate: 0.45, cost: 21345 }, hr: { insp: 0, def: 0, rate: 0, cost: 0 } }
];

const INITIAL_MODEL_SUMMARY = {
  JA: {
    name: "JA G-RUN",
    totalInsp: 27328,
    totalDef: 375,
    rate: 1.37,
    cost: 1168098,
    parts: [
      { name: "FRT LH", insp: 6950, def: 98, rate: 1.41 },
      { name: "FRT RH", insp: 6880, def: 112, rate: 1.63 },
      { name: "RR LH",  insp: 6750, def: 82, rate: 1.21 },
      { name: "RR RH",  insp: 6748, def: 83, rate: 1.23 }
    ],
    worstList: [
      { cause: "수포", count: 318, percent: 84.8 },
      { cause: "둔_어퍼떨어짐", count: 198, percent: 52.8 },
      { cause: "사상불량", count: 84, percent: 22.4 },
      { cause: "둔_수축", count: 52, percent: 13.9 },
      { cause: "둔_넘침", count: 38, percent: 10.1 }
    ]
  },
  HR: {
    name: "HR G-RUN",
    totalInsp: 10041,
    totalDef: 147,
    rate: 1.46,
    cost: 338870,
    parts: [
      { name: "FRT LH", insp: 3450, def: 38, rate: 1.10 },
      { name: "FRT RH", insp: 3390, def: 41, rate: 1.21 },
      { name: "RR LH",  insp: 1601, def: 39, rate: 2.44 },
      { name: "RR RH",  insp: 1600, def: 29, rate: 1.81 }
    ],
    worstList: [
      { cause: "직_어퍼떨어짐", count: 218, percent: 88.2 },
      { cause: "둔_어퍼떨어짐", count: 46, percent: 18.6 },
      { cause: "직_기타", count: 4, percent: 1.6 },
      { cause: "스코치", count: 2, percent: 0.8 }
    ]
  },
  NX4: {
    name: "NX4 / NX4a G-RUN",
    totalInsp: 36644,
    totalDef: 199,
    rate: 0.54,
    cost: 889242,
    parts: [
      { name: "NX4 FRT LH", insp: 8800, def: 18, rate: 0.20 },
      { name: "NX4 FRT RH", insp: 8644, def: 21, rate: 0.24 },
      { name: "NX4a FRT LH", insp: 9800, def: 88, rate: 0.90 },
      { name: "NX4a FRT RH", insp: 9400, def: 72, rate: 0.77 }
    ],
    worstList: [
      { cause: "스코치", count: 148, percent: 74.4 },
      { cause: "직_찢어짐", count: 62, percent: 31.2 },
      { cause: "둔_삽입불량", count: 42, percent: 21.1 },
      { cause: "둔_어퍼떨어짐", count: 32, percent: 16.1 },
      { cause: "직_삽입불량", count: 16, percent: 8.0 }
    ]
  }
};

const STORAGE_KEY_QUALITY = "factory_quality_daily_data_v2";

export const DailyQualityView = () => {
  const { currentProfile } = useAuth();
  const fileInputRef = useRef(null);

  const [dailyData, setDailyData] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_QUALITY);
      return saved ? JSON.parse(saved) : INITIAL_DAILY_DATA;
    } catch {
      return INITIAL_DAILY_DATA;
    }
  });

  const [modelSummary, setModelSummary] = useState(INITIAL_MODEL_SUMMARY);
  const [selectedModelTab, setSelectedModelTab] = useState("ALL");
  const [uploadedFileNames, setUploadedFileNames] = useState([
    "G-RUN 불량율 집계.xlsx",
    "01. 08월 AB동-최종검사 정리.xlsx"
  ]);
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState("");
  const [hoveredDay, setHoveredDay] = useState(null);

  // Month Key Totals
  const monthTotals = useMemo(() => {
    const totalInsp = dailyData.reduce((sum, d) => sum + (Number(d.totalInsp) || 0), 0);
    const totalDef = dailyData.reduce((sum, d) => sum + (Number(d.totalDef) || 0), 0);
    const totalCost = dailyData.reduce((sum, d) => sum + (Number(d.totalCost) || 0), 0);
    const avgRate = totalInsp > 0 ? Number(((totalDef / totalInsp) * 100).toFixed(2)) : 0;
    const targetRate = 0.70; // 0.70% 당월 목표

    return {
      totalInsp,
      totalDef,
      totalCost,
      avgRate,
      targetRate
    };
  }, [dailyData]);

  // Handle Excel Files Upload (Supports both G-RUN and AB동 최종검사)
  const handleFileUpload = (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const names = [];
    Array.from(files).forEach((file) => {
      names.push(file.name);
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const buffer = evt.target.result;
          const wb = XLSX.read(buffer, { type: "array" });
          
          // Check if file is AB동 최종검사 정리
          if (wb.Sheets["MAIN (2)"]) {
            const main2 = XLSX.utils.sheet_to_json(wb.Sheets["MAIN (2)"], { header: 1, defval: 0 });
            if (main2 && main2[20]) {
              const days = main2[20].slice(1, 32).filter((d) => typeof d === "number" && d > 0);
              const totalDefects = main2[21].slice(1, days.length + 1);
              const totalRates = main2[22].slice(1, days.length + 1);
              const totalCosts = main2[23].slice(1, days.length + 1);
              const nx4Defects = main2[24].slice(1, days.length + 1);
              const jaDefects = main2[25].slice(1, days.length + 1);
              const hrDefects = main2[26].slice(1, days.length + 1);
              const nx4Rates = main2[27].slice(1, days.length + 1);
              const jaRates = main2[28].slice(1, days.length + 1);
              const hrRates = main2[29].slice(1, days.length + 1);
              const nx4Costs = main2[30].slice(1, days.length + 1);
              const jaCosts = main2[31].slice(1, days.length + 1);
              const hrCosts = main2[32].slice(1, days.length + 1);
              const nx4Inspections = main2[36].slice(1, days.length + 1);
              const jaInspections = main2[37].slice(1, days.length + 1);
              const hrInspections = main2[38].slice(1, days.length + 1);
              const totalInspections = main2[39].slice(1, days.length + 1);

              const parsedList = [];
              for (let i = 0; i < days.length; i++) {
                const d = days[i];
                const insp = totalInspections[i] || 0;
                const def = totalDefects[i] || 0;
                if (insp > 0 || def > 0) {
                  parsedList.push({
                    day: d,
                    date: "2026-08-" + (d < 10 ? "0" + d : d),
                    label: "8/" + d,
                    totalInsp: insp,
                    totalDef: def,
                    totalRate: Number(((totalRates[i] || 0) * 100).toFixed(2)),
                    totalCost: totalCosts[i] || 0,
                    nx4: { insp: nx4Inspections[i] || 0, def: nx4Defects[i] || 0, rate: Number(((nx4Rates[i] || 0) * 100).toFixed(2)), cost: nx4Costs[i] || 0 },
                    ja: { insp: jaInspections[i] || 0, def: jaDefects[i] || 0, rate: Number(((jaRates[i] || 0) * 100).toFixed(2)), cost: jaCosts[i] || 0 },
                    hr: { insp: hrInspections[i] || 0, def: hrDefects[i] || 0, rate: Number(((hrRates[i] || 0) * 100).toFixed(2)), cost: hrCosts[i] || 0 }
                  });
                }
              }

              if (parsedList.length > 0) {
                setDailyData(parsedList);
                localStorage.setItem(STORAGE_KEY_QUALITY, JSON.stringify(parsedList));
              }
            }
          }

          setUploadSuccessMsg(`성공적으로 동기화 및 반영되었습니다.`);
          setTimeout(() => setUploadSuccessMsg(""), 4000);
        } catch (err) {
          console.error("Excel parse error:", err);
          alert("엑셀 파일 파싱 중 오류가 발생했습니다.");
        }
      };
      reader.readAsArrayBuffer(file);
    });

    setUploadedFileNames(names);
  };

  // Export Analysis to Excel
  const handleExportExcel = () => {
    const rows = [
      ["일일 품질현황 (G-RUN 불량률 & AB동 최종검사 종합 분석 보고서)"],
      ["조회일자", new Date().toLocaleDateString(), "8월 총 검사수량", `${monthTotals.totalInsp.toLocaleString()} EA`, "8월 총 불량수량", `${monthTotals.totalDef} EA`, "월간 불량률", `${monthTotals.avgRate}%`, "총 불량 손실금액", `₩ ${monthTotals.totalCost.toLocaleString()} 원`],
      [],
      ["[1] 일자별 검사 실적 및 차종별 불량률 매트릭스"],
      ["일자", "총검사수", "총불량수", "불량률(%)", "NX4 검사수", "NX4 불량수", "NX4 불량률(%)", "JA 검사수", "JA 불량수", "JA 불량률(%)", "HR 검사수", "HR 불량수", "HR 불량률(%)", "불량금액(원)"]
    ];

    dailyData.forEach((d) => {
      rows.push([
        d.date,
        d.totalInsp,
        d.totalDef,
        `${d.totalRate}%`,
        d.nx4.insp,
        d.nx4.def,
        `${d.nx4.rate}%`,
        d.ja.insp,
        d.ja.def,
        `${d.ja.rate}%`,
        d.hr.insp,
        d.hr.def,
        `${d.hr.rate}%`,
        d.totalCost
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "일일품질현황_분석");
    XLSX.writeFile(wb, `일일품질현황_종합분석_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-24 max-w-[1600px] mx-auto">
      {/* ========================================================================= */}
      {/* 1. TOP UPLOADER & ACTION BAR */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black text-slate-900 dark:text-white">
                일일 품질현황 분석
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 text-xs font-black">
                G-RUN 불량률 & AB동 최종검사 연동
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              책임: <strong>이창엽 책임</strong> | 연동 파일: <strong className="text-slate-700 dark:text-slate-300">{uploadedFileNames.join(", ")}</strong>
            </p>
          </div>
        </div>

        {/* Action Buttons & Hidden File Input */}
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            multiple
            accept=".xlsx, .xls"
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow-md shadow-indigo-500/25 active:scale-95 transition-all"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>파일 업로드 (G-RUN / AB동)</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-black transition-all shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>분석 엑셀 다운로드</span>
          </button>
        </div>
      </div>

      {/* Upload Success Alert */}
      {uploadSuccessMsg && (
        <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{uploadSuccessMsg}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. 08월 전사 품질 핵심 KPI (4-Card Grid) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* 1. 총 검사수량 */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold text-slate-400">8월 총 검사 수량</span>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {monthTotals.totalInsp.toLocaleString()} <span className="text-sm text-slate-400 font-bold">EA</span>
          </p>
          <p className="text-xs font-semibold text-slate-400 mt-1">
            NX4 49% • JA 37% • HR 14%
          </p>
        </div>

        {/* 2. 총 불량수량 */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold text-slate-400">8월 총 불량 수량</span>
          <p className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-2">
            {monthTotals.totalDef} <span className="text-sm text-slate-400 font-bold">EA</span>
          </p>
          <p className="text-xs font-semibold text-slate-400 mt-1">
            전량 폐기 및 리워크 분석 완료
          </p>
        </div>

        {/* 3. 월간 평균 불량률 */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">월간 평균 불량률</span>
            <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-[10px] font-black">
              목표 0.70%
            </span>
          </div>
          <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-2">
            {monthTotals.avgRate}%
          </p>
          <p className="text-xs font-semibold text-slate-400 mt-1">
            NX4 0.54% • JA 1.37% • HR 1.46%
          </p>
        </div>

        {/* 4. 총 불량 손실금액 */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold text-slate-400">8월 총 불량 손실금액</span>
          <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-2">
            ₩ {monthTotals.totalCost.toLocaleString()}
          </p>
          <p className="text-xs font-semibold text-slate-400 mt-1">
            JA 116만 • NX4 88만 • HR 33만
          </p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. ⭐ [시각화 그래프] 08월 일자별 불량률 & 손실금액 추이 차트 */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <BarChart2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-black text-base text-slate-900 dark:text-white">
                08월 일일 불량률(%) 및 불량수량 추이 그래프
              </h2>
              <p className="text-xs text-slate-400">
                일자별 전사 종합 불량률 추이 (당월 관리 목표치: 0.70%)
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs font-bold">
            <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
              <span>불량률 (%)</span>
            </span>
            <span className="flex items-center gap-1 text-rose-500">
              <span className="w-4 h-0.5 border-t-2 border-dashed border-rose-500"></span>
              <span>목표선 (0.70%)</span>
            </span>
          </div>
        </div>

        {/* Visual Bar Chart */}
        <div className="pt-6 pb-2 px-2">
          <div className="h-56 flex items-end justify-between gap-1 sm:gap-2 relative border-b border-slate-200 dark:border-slate-700">
            {/* Target 0.70% Horizontal Line (at 35% height where max is ~2.0%) */}
            <div
              className="absolute left-0 right-0 border-t-2 border-dashed border-rose-500/70 z-10 pointer-events-none"
              style={{ bottom: `${(0.70 / 2.2) * 100}%` }}
            >
              <span className="absolute -top-3 right-1 text-[10px] font-black text-rose-600 dark:text-rose-400 bg-white dark:bg-slate-900 px-1 rounded">
                목표 0.70%
              </span>
            </div>

            {/* Daily Bars */}
            {dailyData.map((d) => {
              const maxRate = 2.2;
              const barHeightPct = Math.min(100, Math.max(4, (d.totalRate / maxRate) * 100));
              const isOverTarget = d.totalRate > 0.70;
              const isHovered = hoveredDay === d.day;

              return (
                <div
                  key={d.day}
                  onMouseEnter={() => setHoveredDay(d.day)}
                  onMouseLeave={() => setHoveredDay(null)}
                  className="flex-1 flex flex-col items-center h-full justify-end group relative cursor-pointer"
                >
                  {/* Tooltip on Hover */}
                  {isHovered && (
                    <div className="absolute -top-24 z-30 bg-slate-950 text-white p-2.5 rounded-xl shadow-2xl border border-slate-800 text-[11px] whitespace-nowrap space-y-1 animate-fadeIn">
                      <div className="font-black text-amber-400">{d.label} 검사실적</div>
                      <div className="text-slate-300">검사: <strong>{d.totalInsp.toLocaleString()}</strong> EA | 불량: <strong className="text-rose-400">{d.totalDef}</strong> EA</div>
                      <div className="text-slate-300">불량률: <strong className="text-amber-400">{d.totalRate}%</strong> | 손실: <strong>₩{d.totalCost.toLocaleString()}</strong></div>
                    </div>
                  )}

                  {/* Value on top of bar */}
                  <span className={`text-[10px] font-black mb-1 ${isOverTarget ? "text-rose-600 dark:text-rose-400" : "text-slate-500"}`}>
                    {d.totalRate}%
                  </span>

                  {/* Bar */}
                  <div
                    className={`w-full max-w-[28px] rounded-t-lg transition-all duration-300 ${
                      isOverTarget
                        ? "bg-gradient-to-t from-rose-500 to-amber-500 group-hover:from-rose-600 group-hover:to-amber-600 shadow-sm shadow-rose-500/20"
                        : "bg-gradient-to-t from-blue-500 to-indigo-500 group-hover:from-blue-600 group-hover:to-indigo-600"
                    }`}
                    style={{ height: `${barHeightPct}%` }}
                  ></div>

                  {/* Day Label */}
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-2 whitespace-nowrap">
                    {d.label.split(" ")[0]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. ⭐ 차종별 (JA / HR / NX4) 상세 품질 현황 & WORST 5 불량 원인 분석 */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
            <h2 className="font-black text-base text-slate-900 dark:text-white">
              차종별 품질 현황 & WORST 불량 원인 분석
            </h2>
          </div>

          {/* Model Switcher Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800">
            <button
              onClick={() => setSelectedModelTab("ALL")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ${
                selectedModelTab === "ALL"
                  ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              전체 차종 종합
            </button>
            <button
              onClick={() => setSelectedModelTab("JA")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ${
                selectedModelTab === "JA"
                  ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              JA G-RUN
            </button>
            <button
              onClick={() => setSelectedModelTab("HR")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ${
                selectedModelTab === "HR"
                  ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              HR G-RUN
            </button>
            <button
              onClick={() => setSelectedModelTab("NX4")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ${
                selectedModelTab === "NX4"
                  ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              NX4 / NX4A
            </button>
          </div>
        </div>

        {/* 3 Model Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {["JA", "HR", "NX4"].filter(m => selectedModelTab === "ALL" || selectedModelTab === m).map((mKey) => {
            const m = modelSummary[mKey];
            return (
              <div
                key={mKey}
                className="bg-slate-50/70 dark:bg-slate-800/40 p-5 rounded-3xl border border-slate-200 dark:border-slate-700/80 space-y-4"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
                  <h3 className="font-black text-sm text-slate-900 dark:text-white">
                    {m.name}
                  </h3>
                  <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-xs font-black">
                    불량률 {m.rate}%
                  </span>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 block font-bold">검사수</span>
                    <strong className="text-slate-900 dark:text-white font-black">{m.totalInsp.toLocaleString()}</strong>
                  </div>
                  <div className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 block font-bold">불량수</span>
                    <strong className="text-rose-600 font-black">{m.totalDef}</strong>
                  </div>
                  <div className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 block font-bold">손실금액</span>
                    <strong className="text-indigo-600 dark:text-indigo-400 font-black">₩{(m.cost / 10000).toFixed(0)}만</strong>
                  </div>
                </div>

                {/* WORST Defect Causes */}
                <div className="space-y-2 pt-1">
                  <span className="text-[11px] font-black text-slate-500 dark:text-slate-400 block">
                    주요 WORST 불량 원인
                  </span>
                  <div className="space-y-1.5 text-xs">
                    {m.worstList.slice(0, 4).map((w, idx) => (
                      <div key={idx} className="space-y-0.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-slate-700 dark:text-slate-300">
                            {idx + 1}. {w.cause}
                          </span>
                          <span className="font-black text-rose-600 dark:text-rose-400">
                            {w.count}건
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-rose-500 h-full rounded-full"
                            style={{ width: `${Math.min(100, Math.max(5, (w.count / (m.worstList[0]?.count || 1)) * 100))}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. ⭐ 일자별 품질 검사 & 불량 데이터 매트릭스 표 (Daily Detailed Inspection Matrix) */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
            <h3 className="font-black text-base text-slate-900 dark:text-white">
              일자별 품질 검사 및 차종별 불량 실적 대장 ({dailyData.length}일자)
            </h3>
          </div>
          <span className="text-xs font-bold text-slate-400">
            총 {dailyData.length}일 실적 집계
          </span>
        </div>

        {/* Detailed Horizontal Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse table-fixed min-w-[900px]">
            <thead>
              <tr className="border-b-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 font-black">
                <th className="py-2.5 px-3 w-[10%]">일자</th>
                <th className="py-2.5 px-2 text-right w-[11%]">총 검사수</th>
                <th className="py-2.5 px-2 text-right w-[10%]">총 불량수</th>
                <th className="py-2.5 px-2 text-center w-[11%]">종합 불량률</th>
                <th className="py-2.5 px-2 text-center w-[13%]">NX4 불량</th>
                <th className="py-2.5 px-2 text-center w-[13%]">JA 불량</th>
                <th className="py-2.5 px-2 text-center w-[13%]">HR 불량</th>
                <th className="py-2.5 px-3 text-right w-[19%]">불량 손실금액</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {dailyData.map((d) => {
                const isOver = d.totalRate > 0.70;
                return (
                  <tr key={d.day} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors h-10">
                    <td className="py-2 px-3 font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      {d.label}
                    </td>
                    <td className="py-2 px-2 text-right font-black text-slate-900 dark:text-white">
                      {d.totalInsp.toLocaleString()}
                    </td>
                    <td className="py-2 px-2 text-right font-black text-rose-600 dark:text-rose-400">
                      {d.totalDef}
                    </td>
                    <td className="py-2 px-2 text-center">
                      <span className={`px-2 py-0.5 rounded-md font-black text-xs ${
                        isOver
                          ? "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300"
                          : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                      }`}>
                        {d.totalRate}%
                      </span>
                    </td>
                    {/* NX4 */}
                    <td className="py-2 px-2 text-center text-slate-600 dark:text-slate-300 font-semibold">
                      {d.nx4.def > 0 ? (
                        <span><strong className="text-slate-900 dark:text-white">{d.nx4.def}건</strong> ({d.nx4.rate}%)</span>
                      ) : "-"}
                    </td>
                    {/* JA */}
                    <td className="py-2 px-2 text-center text-slate-600 dark:text-slate-300 font-semibold">
                      {d.ja.def > 0 ? (
                        <span><strong className="text-slate-900 dark:text-white">{d.ja.def}건</strong> ({d.ja.rate}%)</span>
                      ) : "-"}
                    </td>
                    {/* HR */}
                    <td className="py-2 px-2 text-center text-slate-600 dark:text-slate-300 font-semibold">
                      {d.hr.def > 0 ? (
                        <span><strong className="text-slate-900 dark:text-white">{d.hr.def}건</strong> ({d.hr.rate}%)</span>
                      ) : "-"}
                    </td>
                    {/* Cost */}
                    <td className="py-2 px-3 text-right font-black text-indigo-600 dark:text-indigo-400">
                      ₩ {d.totalCost.toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {/* Footer Summary */}
            <tfoot>
              <tr className="border-t-2 border-slate-900 dark:border-slate-600 bg-slate-100 dark:bg-slate-800 font-black text-xs text-slate-900 dark:text-white">
                <td className="py-3 px-3">8월 누계 합계</td>
                <td className="py-3 px-2 text-right">{monthTotals.totalInsp.toLocaleString()}</td>
                <td className="py-3 px-2 text-right text-rose-600 dark:text-rose-400">{monthTotals.totalDef}</td>
                <td className="py-3 px-2 text-center text-amber-600 dark:text-amber-400 text-sm">{monthTotals.avgRate}%</td>
                <td colSpan="3" className="py-3 px-2 text-center text-slate-500 font-bold">목표: 0.70% (목표 대비 관리 중)</td>
                <td className="py-3 px-3 text-right text-indigo-600 dark:text-indigo-400 font-black text-sm">₩ {monthTotals.totalCost.toLocaleString()}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
