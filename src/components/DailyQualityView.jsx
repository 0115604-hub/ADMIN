import React, { useState, useMemo, useRef } from "react";
import {
  CheckSquare,
  ShieldCheck,
  AlertCircle,
  AlertTriangle,
  Download,
  Upload,
  Search,
  CheckCircle2,
  BarChart2,
  TrendingUp,
  Award,
  Flame,
  ArrowUpDown,
  FileSpreadsheet
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
    worstReason: "수포 (318건), 둔_어퍼떨어짐 (198건)",
    lossAmount: 2281050
  },
  {
    id: "nx4a",
    name: "NX4a G-RUN",
    carModel: "NX4a",
    inspectQty: 50400,
    defectQty: 302,
    defectRate: 0.60,
    worstReason: "스코치 (148건), 직_찢어짐 (62건)",
    lossAmount: 1735594
  },
  {
    id: "nx4",
    name: "NX4 G-RUN",
    carModel: "NX4",
    inspectQty: 25880,
    defectQty: 34,
    defectRate: 0.13,
    worstReason: "사상불량, 둔_삽입불량",
    lossAmount: 195398
  },
  {
    id: "hr",
    name: "HR G-RUN",
    carModel: "HR",
    inspectQty: 20858,
    defectQty: 270,
    defectRate: 1.29,
    worstReason: "직_어퍼떨어짐 (218건), 둔_어퍼떨어짐 (46건)",
    lossAmount: 640380
  }
];

// Daily Trend for 4 Core Items
const INITIAL_DAILY_DATA = [
  { date: "08/07 (금)", ja: { insp: 1592, def: 19, rate: 1.19 }, nx4a: { insp: 1680, def: 24, rate: 1.43 }, nx4: { insp: 0, def: 0, rate: 0.00 }, hr: { insp: 703, def: 0, rate: 0.00 } },
  { date: "08/10 (월)", ja: { insp: 1624, def: 37, rate: 2.28 }, nx4a: { insp: 1920, def: 10, rate: 0.52 }, nx4: { insp: 0, def: 0, rate: 0.00 }, hr: { insp: 651, def: 8, rate: 1.23 } },
  { date: "08/11 (화)", ja: { insp: 2205, def: 39, rate: 1.77 }, nx4a: { insp: 1200, def: 6, rate: 0.50 }, nx4: { insp: 1600, def: 0, rate: 0.00 }, hr: { insp: 909, def: 64, rate: 7.04 } },
  { date: "08/12 (수)", ja: { insp: 1967, def: 41, rate: 2.08 }, nx4a: { insp: 1200, def: 6, rate: 0.50 }, nx4: { insp: 1800, def: 1, rate: 0.06 }, hr: { insp: 879, def: 23, rate: 2.62 } },
  { date: "08/13 (목)", ja: { insp: 1928, def: 22, rate: 1.14 }, nx4a: { insp: 1200, def: 10, rate: 0.83 }, nx4: { insp: 1800, def: 2, rate: 0.11 }, hr: { insp: 730, def: 0, rate: 0.00 } },
  { date: "08/14 (금)", ja: { insp: 1689, def: 27, rate: 1.60 }, nx4a: { insp: 960, def: 2, rate: 0.21 }, nx4: { insp: 720, def: 0, rate: 0.00 }, hr: { insp: 745, def: 10, rate: 1.34 } },
  { date: "08/18 (화)", ja: { insp: 1682, def: 28, rate: 1.66 }, nx4a: { insp: 2160, def: 5, rate: 0.23 }, nx4: { insp: 0, def: 0, rate: 0.00 }, hr: { insp: 638, def: 8, rate: 1.25 } },
  { date: "08/19 (수)", ja: { insp: 1682, def: 13, rate: 0.77 }, nx4a: { insp: 2160, def: 11, rate: 0.51 }, nx4: { insp: 0, def: 0, rate: 0.00 }, hr: { insp: 725, def: 5, rate: 0.69 } },
  { date: "08/20 (목)", ja: { insp: 1685, def: 19, rate: 1.13 }, nx4a: { insp: 2160, def: 13, rate: 0.60 }, nx4: { insp: 0, def: 0, rate: 0.00 }, hr: { insp: 800, def: 0, rate: 0.00 } },
  { date: "08/21 (금)", ja: { insp: 1440, def: 14, rate: 0.97 }, nx4a: { insp: 2160, def: 6, rate: 0.28 }, nx4: { insp: 0, def: 0, rate: 0.00 }, hr: { insp: 610, def: 0, rate: 0.00 } },
  { date: "08/22 (토)", ja: { insp: 1624, def: 24, rate: 1.48 }, nx4a: { insp: 960, def: 5, rate: 0.52 }, nx4: { insp: 0, def: 0, rate: 0.00 }, hr: { insp: 0, def: 0, rate: 0.00 } },
  { date: "08/24 (월)", ja: { insp: 1687, def: 32, rate: 1.90 }, nx4a: { insp: 1200, def: 2, rate: 0.17 }, nx4: { insp: 1440, def: 1, rate: 0.07 }, hr: { insp: 520, def: 0, rate: 0.00 } },
  { date: "08/25 (화)", ja: { insp: 1501, def: 8, rate: 0.53 }, nx4a: { insp: 960, def: 3, rate: 0.31 }, nx4: { insp: 1440, def: 6, rate: 0.42 }, hr: { insp: 520, def: 0, rate: 0.00 } },
  { date: "08/26 (수)", ja: { insp: 1744, def: 16, rate: 0.92 }, nx4a: { insp: 1200, def: 26, rate: 2.17 }, nx4: { insp: 1600, def: 4, rate: 0.25 }, hr: { insp: 742, def: 10, rate: 1.35 } },
  { date: "08/27 (목)", ja: { insp: 1500, def: 5, rate: 0.33 }, nx4a: { insp: 1200, def: 9, rate: 0.75 }, nx4: { insp: 1440, def: 0, rate: 0.00 }, hr: { insp: 630, def: 0, rate: 0.00 } },
  { date: "08/28 (금)", ja: { insp: 1685, def: 15, rate: 0.89 }, nx4a: { insp: 960, def: 5, rate: 0.52 }, nx4: { insp: 1100, def: 3, rate: 0.27 }, hr: { insp: 627, def: 7, rate: 1.12 } },
  { date: "08/29 (토)", ja: { insp: 1563, def: 7, rate: 0.45 }, nx4a: { insp: 960, def: 4, rate: 0.42 }, nx4: { insp: 0, def: 0, rate: 0.00 }, hr: { insp: 0, def: 0, rate: 0.00 } }
];

const STORAGE_KEY_CORE_ITEMS = "factory_core_items_quality_v1";

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

  const [uploadSuccessMsg, setUploadSuccessMsg] = useState("");

  // Sort items strictly by Inspection Quantity in descending order (검사수량 많은 순서대로 나열)
  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => b.inspectQty - a.inspectQty);
  }, [items]);

  // Find the item with the highest defect rate (불량률이 제일 높은 아이템)
  const maxDefectRateItem = useMemo(() => {
    return items.reduce((max, it) => (it.defectRate > max.defectRate ? it : max), items[0]);
  }, [items]);

  // Handle Excel Upload
  const handleFileUpload = (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const buffer = evt.target.result;
          const wb = XLSX.read(buffer, { type: "array" });

          const newItems = [...INITIAL_CORE_ITEMS];

          // Parse NX4, JA, HR sheets
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
  };

  // Export Analysis to Excel
  const handleExportExcel = () => {
    const rows = [
      ["아이템별 품질 검사실적 및 불량률 보고서"],
      ["조회일자", new Date().toLocaleDateString(), "관리목표", "불량률 0.70% 이하"],
      [],
      ["순위 (검사량순)", "아이템명", "검사수량(EA)", "불량수량(EA)", "불량률(%)", "상태", "주요 불량 사유"]
    ];

    sortedItems.forEach((it, idx) => {
      const isMaxRate = it.id === maxDefectRateItem.id;
      rows.push([
        `${idx + 1}위`,
        it.name,
        it.inspectQty,
        it.defectQty,
        `${it.defectRate}%`,
        isMaxRate ? "🚨 최고 불량률 경고" : it.defectRate <= 0.70 ? "목표달성" : "주의관리",
        it.worstReason
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "아이템별_불량현황");
    XLSX.writeFile(wb, `아이템별_품질현황_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-24 max-w-[1600px] mx-auto">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER & ACTION BAR */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black text-slate-900 dark:text-white">
                아이템별 품질 검사실적 및 불량률
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-black">
                검사수량 순 정렬
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              관리목표: <strong className="text-emerald-600 font-black">0.70% 이하</strong> | 담당: <strong>이창엽 책임</strong>
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
            <span>엑셀 다운로드</span>
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
      {/* 2. ⭐ [핵심 1] 아이템별 검사수량 많은 순 카드 그리드 (최고 불량률 붉은색 경고) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {sortedItems.map((item, idx) => {
          const isMaxRate = item.id === maxDefectRateItem.id;
          const isTargetAchieved = item.defectRate <= 0.70;

          return (
            <div
              key={item.id}
              className={`p-5 rounded-3xl border transition-all shadow-sm flex flex-col justify-between relative overflow-hidden ${
                isMaxRate
                  ? "bg-rose-50/90 dark:bg-rose-950/40 border-rose-500 ring-2 ring-rose-500/40 shadow-lg shadow-rose-500/15 animate-pulse-subtle"
                  : "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-slate-300"
              }`}
            >
              {/* Top Row: Rank & Alert Badge */}
              <div>
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-black">
                    검사수량 {idx + 1}위
                  </span>

                  {isMaxRate ? (
                    <span className="px-2.5 py-1 rounded-xl bg-rose-600 text-white text-xs font-black flex items-center gap-1 shadow-md shadow-rose-600/30">
                      <AlertTriangle className="w-3.5 h-3.5 animate-bounce" />
                      <span>최고 불량률 경고</span>
                    </span>
                  ) : isTargetAchieved ? (
                    <span className="px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 text-[11px] font-black">
                      목표달성
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-lg bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 text-[11px] font-black">
                      주의관리
                    </span>
                  )}
                </div>

                {/* Item Name */}
                <h3 className={`text-lg font-black mt-3 ${isMaxRate ? "text-rose-950 dark:text-rose-100" : "text-slate-900 dark:text-white"}`}>
                  {item.name}
                </h3>
              </div>

              {/* Metrics: Defect Rate & Inspection Qty */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-3">
                {/* Defect Rate Highlight */}
                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="text-xs text-slate-400 font-bold block">불량률</span>
                    <span className={`text-3xl font-black ${
                      isMaxRate
                        ? "text-rose-600 dark:text-rose-400 font-black"
                        : isTargetAchieved
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-amber-600 dark:text-amber-400"
                    }`}>
                      {item.defectRate}%
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-xs text-slate-400 font-bold block">불량수량</span>
                    <span className={`text-lg font-black ${isMaxRate ? "text-rose-600 dark:text-rose-400" : "text-slate-800 dark:text-slate-200"}`}>
                      {item.defectQty.toLocaleString()} <span className="text-xs text-slate-400 font-normal">EA</span>
                    </span>
                  </div>
                </div>

                {/* Inspection Qty Strip */}
                <div className={`p-3 rounded-2xl flex items-center justify-between text-xs font-black ${
                  isMaxRate
                    ? "bg-rose-100/70 dark:bg-rose-900/40 text-rose-950 dark:text-rose-100"
                    : "bg-slate-50 dark:bg-slate-800/70 text-slate-800 dark:text-slate-200"
                }`}>
                  <span className="text-slate-500 dark:text-slate-400 font-bold">검사 수량</span>
                  <span className="text-base font-black">
                    {item.inspectQty.toLocaleString()} EA
                  </span>
                </div>

                {/* Worst Cause */}
                <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-start gap-1">
                  <span className="font-bold shrink-0">주요 원인:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300 truncate">
                    {item.worstReason}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* 3. ⭐ [핵심 2] 아이템별 불량률 & 검사수량 비교 가로형 바 차트 */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <BarChart2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-black text-base text-slate-900 dark:text-white">
                아이템별 불량률(%) 및 검사규모 비교
              </h2>
              <p className="text-xs text-slate-400">
                품질 관리 목표치: 0.70% 이하 (불량률 최고 아이템 붉은색 경고 표시)
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs font-bold">
            <span className="flex items-center gap-1 text-emerald-600">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span>목표달성 (≤0.70%)</span>
            </span>
            <span className="flex items-center gap-1 text-rose-600">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600"></span>
              <span>최고 불량 경고</span>
            </span>
          </div>
        </div>

        {/* Horizontal Progress Bars */}
        <div className="space-y-4 pt-2">
          {sortedItems.map((item, idx) => {
            const isMaxRate = item.id === maxDefectRateItem.id;
            const isGood = item.defectRate <= 0.70;
            const maxRate = 1.6;
            const barWidthPct = Math.min(100, Math.max(8, (item.defectRate / maxRate) * 100));

            return (
              <div key={item.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-black">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px]">
                      {idx + 1}위
                    </span>
                    <span className="text-slate-900 dark:text-white font-extrabold text-sm">
                      {item.name}
                    </span>
                    <span className="text-xs text-slate-400 font-bold">
                      (검사 {item.inspectQty.toLocaleString()} EA / 불량 {item.defectQty} EA)
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {isMaxRate && (
                      <span className="px-2 py-0.5 rounded-md bg-rose-600 text-white text-[10px] font-black">
                        최고 불량 🚨
                      </span>
                    )}
                    <span className={`text-base font-black ${
                      isMaxRate
                        ? "text-rose-600 dark:text-rose-400"
                        : isGood
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-amber-600 dark:text-amber-400"
                    }`}>
                      {item.defectRate}%
                    </span>
                  </div>
                </div>

                <div className="w-full bg-slate-100 dark:bg-slate-800 h-3.5 rounded-full overflow-hidden relative">
                  {/* Progress Fill */}
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isMaxRate
                        ? "bg-gradient-to-r from-rose-600 to-red-500 shadow-md shadow-rose-500/30"
                        : isGood
                        ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                        : "bg-gradient-to-r from-amber-500 to-orange-400"
                    }`}
                    style={{ width: `${barWidthPct}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. ⭐ [핵심 3] 아이템별 검사실적 일람표 (검사량순 정렬 & 최고 불량 강조) */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
            <h3 className="font-black text-base text-slate-900 dark:text-white">
              아이템별 검사실적 및 불량률 종합 일람표 (검사량순)
            </h3>
          </div>
          <span className="text-xs font-bold text-slate-400">
            총 {sortedItems.length}개 핵심 아이템
          </span>
        </div>

        {/* Detailed Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse table-fixed min-w-[800px]">
            <thead>
              <tr className="border-b-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 font-black">
                <th className="py-3 px-3 w-[10%] text-center">검사량 순위</th>
                <th className="py-3 px-3 w-[20%]">아이템명</th>
                <th className="py-3 px-3 text-right w-[16%]">검사 수량</th>
                <th className="py-3 px-3 text-right w-[14%]">불량 수량</th>
                <th className="py-3 px-3 text-center w-[14%]">불량률 (%)</th>
                <th className="py-3 px-3 text-center w-[14%]">상태 구분</th>
                <th className="py-3 px-3 w-[22%]">주요 불량 사유</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {sortedItems.map((item, idx) => {
                const isMaxRate = item.id === maxDefectRateItem.id;
                const isGood = item.defectRate <= 0.70;

                return (
                  <tr
                    key={item.id}
                    className={`transition-colors h-12 ${
                      isMaxRate
                        ? "bg-rose-50/80 dark:bg-rose-950/30 font-bold"
                        : "hover:bg-slate-50/80 dark:hover:bg-slate-800/50"
                    }`}
                  >
                    <td className="py-2.5 px-3 text-center">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-black text-xs">
                        {idx + 1}위
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-black text-slate-900 dark:text-white text-sm">
                      {item.name}
                    </td>
                    <td className="py-2.5 px-3 text-right font-black text-slate-900 dark:text-white text-sm">
                      {item.inspectQty.toLocaleString()} EA
                    </td>
                    <td className={`py-2.5 px-3 text-right font-black text-sm ${isMaxRate ? "text-rose-600 dark:text-rose-400" : "text-slate-800 dark:text-slate-200"}`}>
                      {item.defectQty.toLocaleString()} EA
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`px-3 py-1 rounded-lg font-black text-xs ${
                        isMaxRate
                          ? "bg-rose-600 text-white shadow-sm shadow-rose-600/30"
                          : isGood
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                          : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                      }`}>
                        {item.defectRate}%
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center font-black">
                      {isMaxRate ? (
                        <span className="text-rose-600 dark:text-rose-400 flex items-center justify-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>최고 불량 🚨</span>
                        </span>
                      ) : isGood ? (
                        <span className="text-emerald-600">● 목표달성</span>
                      ) : (
                        <span className="text-amber-600">■ 주의관리</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300 font-medium truncate" title={item.worstReason}>
                      {item.worstReason}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
