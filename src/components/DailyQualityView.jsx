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
import * as XLSX from "xlsx";

// 12 Items Real Data from "01. 08월 AB동-최종검사 정리.xlsx" and "G-RUN 불량율 집계.xlsx"
const INITIAL_ITEMS = [
  // NX4 / NX4a (4 items)
  { id: "nx4-frt-lh", group: "NX4", name: "NX4 FRT LH", carModel: "NX4", part: "FRT LH", inspectQty: 12400, defectQty: 10, defectRate: 0.08, status: "good", worstReason: "사상불량", lossAmount: 57470 },
  { id: "nx4-frt-rh", group: "NX4", name: "NX4 FRT RH", carModel: "NX4", part: "FRT RH", inspectQty: 13480, defectQty: 24, defectRate: 0.18, status: "good", worstReason: "사상불량", lossAmount: 137928 },
  { id: "nx4a-frt-lh", group: "NX4a", name: "NX4a FRT LH", carModel: "NX4a", part: "FRT LH", inspectQty: 27360, defectQty: 144, defectRate: 0.53, status: "good", worstReason: "스코치 (74%)", lossAmount: 827568 },
  { id: "nx4a-frt-rh", group: "NX4a", name: "NX4a FRT RH", carModel: "NX4a", part: "FRT RH", inspectQty: 23040, defectQty: 158, defectRate: 0.69, status: "good", worstReason: "스코치 (68%)", lossAmount: 908026 },

  // HR (4 items)
  { id: "hr-frt-lh", group: "HR", name: "HR FRT LH", carModel: "HR", part: "FRT LH", inspectQty: 9174, defectQty: 52, defectRate: 0.57, status: "good", worstReason: "직_어퍼떨어짐", lossAmount: 137904 },
  { id: "hr-frt-rh", group: "HR", name: "HR FRT RH", carModel: "HR", part: "FRT RH", inspectQty: 9174, defectQty: 24, defectRate: 0.26, status: "good", worstReason: "직_어퍼떨어짐", lossAmount: 63648 },
  { id: "hr-rr-lh", group: "HR", name: "HR RR LH", carModel: "HR", part: "RR LH", inspectQty: 1370, defectQty: 154, defectRate: 11.24, status: "warning", worstReason: "직_어퍼떨어짐 (88%)", lossAmount: 408408 },
  { id: "hr-rr-rh", group: "HR", name: "HR RR RH", carModel: "HR", part: "RR RH", inspectQty: 1140, defectQty: 40, defectRate: 3.51, status: "warning", worstReason: "둔_어퍼떨어짐 (46%)", lossAmount: 106080 },

  // JA (4 items)
  { id: "ja-frt-lh", group: "JA", name: "JA FRT LH", carModel: "JA", part: "FRT LH", inspectQty: 14640, defectQty: 212, defectRate: 1.45, status: "normal", worstReason: "수포 (85%)", lossAmount: 608440 },
  { id: "ja-frt-rh", group: "JA", name: "JA FRT RH", carModel: "JA", part: "FRT RH", inspectQty: 14670, defectQty: 246, defectRate: 1.68, status: "normal", worstReason: "수포 (82%)", lossAmount: 706020 },
  { id: "ja-rr-lh", group: "JA", name: "JA RR LH", carModel: "JA", part: "RR LH", inspectQty: 14630, defectQty: 136, defectRate: 0.93, status: "normal", worstReason: "둔_어퍼떨어짐", lossAmount: 390320 },
  { id: "ja-rr-rh", group: "JA", name: "JA RR RH", carModel: "JA", part: "RR RH", inspectQty: 14720, defectQty: 260, defectRate: 1.77, status: "normal", worstReason: "둔_어퍼떨어짐", lossAmount: 746200 }
];

const STORAGE_KEY_ITEMS = "factory_item_quality_data_v1";

export const DailyQualityView = () => {
  const { currentProfile } = useAuth();
  const fileInputRef = useRef(null);

  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ITEMS);
      return saved ? JSON.parse(saved) : INITIAL_ITEMS;
    } catch {
      return INITIAL_ITEMS;
    }
  });

  const [selectedGroup, setSelectedGroup] = useState("ALL");
  const [sortBy, setSortBy] = useState("rate_desc"); // "rate_desc", "rate_asc", "inspect_desc", "name"
  const [searchTerm, setSearchTerm] = useState("");
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState("");

  // Filtered and Sorted Items
  const filteredItems = useMemo(() => {
    return items
      .filter((item) => {
        const matchesGroup = selectedGroup === "ALL" || item.group === selectedGroup || (selectedGroup === "NX4" && (item.group === "NX4" || item.group === "NX4a"));
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || item.worstReason.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesGroup && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === "rate_desc") return b.defectRate - a.defectRate;
        if (sortBy === "rate_asc") return a.defectRate - b.defectRate;
        if (sortBy === "inspect_desc") return b.inspectQty - a.inspectQty;
        return a.name.localeCompare(b.name);
      });
  }, [items, selectedGroup, sortBy, searchTerm]);

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

          const newItems = [...INITIAL_ITEMS];

          // Parse AB동-최종검사 정리 sheets
          ["JA 정리", "HR 정리", "NX4 정리"].forEach((sheetName) => {
            const ws = wb.Sheets[sheetName];
            if (!ws) return;
            const json = XLSX.utils.sheet_to_json(ws, { header: 1, defval: 0 });

            for (let i = 0; i < 4; i++) {
              const partName = json[35 + i] ? (json[35 + i][2] || json[35 + i][1]) : "";
              const inspSum = json[35 + i] ? json[35 + i].slice(3).reduce((a, b) => a + (typeof b === "number" ? b : 0), 0) : 0;
              const defSum = json[40 + i] ? json[40 + i].slice(3).reduce((a, b) => a + (typeof b === "number" ? b : 0), 0) : 0;
              const rate = inspSum > 0 ? Number(((defSum / inspSum) * 100).toFixed(2)) : 0;

              const matchedItem = newItems.find((it) => it.name.includes(partName) || (partName.includes(it.part) && sheetName.includes(it.carModel)));
              if (matchedItem && inspSum > 0) {
                matchedItem.inspectQty = inspSum;
                matchedItem.defectQty = defSum;
                matchedItem.defectRate = rate;
              }
            }
          });

          setItems(newItems);
          localStorage.setItem(STORAGE_KEY_ITEMS, JSON.stringify(newItems));
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

  // Export to Excel
  const handleExportExcel = () => {
    const rows = [
      ["아이템별 품질 검사실적 및 불량률 보고서"],
      ["조회일자", new Date().toLocaleDateString(), "관리 기준", "당월 목표 불량률: 0.70%"],
      [],
      ["차종", "품목명", "부위", "검사수량(EA)", "불량수량(EA)", "불량률(%)", "상태", "주요 불량 사유", "손실금액(원)"]
    ];

    items.forEach((item) => {
      rows.push([
        item.carModel,
        item.name,
        item.part,
        item.inspectQty,
        item.defectQty,
        `${item.defectRate}%`,
        item.defectRate <= 0.70 ? "목표달성" : item.defectRate <= 1.50 ? "주의" : "집중관리",
        item.worstReason,
        item.lossAmount
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "아이템별_품질현황");
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
                12개 품목 실시간 분석
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
      {/* 2. FILTER TABS & SORT CONTROLS */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Car Model Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          <button
            onClick={() => setSelectedGroup("ALL")}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all ${
              selectedGroup === "ALL"
                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
            }`}
          >
            전체 아이템 ({items.length})
          </button>
          <button
            onClick={() => setSelectedGroup("NX4")}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all ${
              selectedGroup === "NX4"
                ? "bg-indigo-600 text-white shadow-sm shadow-indigo-500/20"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
            }`}
          >
            NX4 / NX4a (4)
          </button>
          <button
            onClick={() => setSelectedGroup("JA")}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all ${
              selectedGroup === "JA"
                ? "bg-indigo-600 text-white shadow-sm shadow-indigo-500/20"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
            }`}
          >
            JA (4)
          </button>
          <button
            onClick={() => setSelectedGroup("HR")}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all ${
              selectedGroup === "HR"
                ? "bg-indigo-600 text-white shadow-sm shadow-indigo-500/20"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
            }`}
          >
            HR (4)
          </button>
        </div>

        {/* Sort & Search */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none"
          >
            <option value="rate_desc">불량률 높은순 ▼</option>
            <option value="rate_asc">불량률 낮은순 ▲</option>
            <option value="inspect_desc">검사수량 많은순 ▼</option>
            <option value="name">품목명순</option>
          </select>

          <div className="relative w-44">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
            <input
              type="text"
              placeholder="품목 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. ⭐ [핵심 1] 아이템별 검사수량 & 불량률 고가시성 카드 그리드 (Visual Cards) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredItems.map((item) => {
          const isTargetAchieved = item.defectRate <= 0.70;
          const isCritical = item.defectRate > 2.0;

          return (
            <div
              key={item.id}
              className={`p-5 rounded-3xl border transition-all shadow-sm flex flex-col justify-between ${
                isTargetAchieved
                  ? "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-emerald-300"
                  : isCritical
                  ? "bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60 ring-1 ring-rose-400/20"
                  : "bg-white dark:bg-slate-900 border-amber-200/80 dark:border-amber-900/50 hover:border-amber-300"
              }`}
            >
              {/* Item Header */}
              <div>
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-black">
                    {item.carModel}
                  </span>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-black ${
                    isTargetAchieved
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300"
                      : isCritical
                      ? "bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300"
                      : "bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300"
                  }`}>
                    {isTargetAchieved ? "목표달성" : isCritical ? "집중개선" : "관리주의"}
                  </span>
                </div>

                <h3 className="text-base font-black text-slate-900 dark:text-white mt-2.5">
                  {item.name}
                </h3>
              </div>

              {/* Big High-Visibility Metrics (불량률 & 검사수량) */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
                {/* Defect Rate & Qty */}
                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="text-xs text-slate-400 font-bold block">불량률</span>
                    <span className={`text-2xl font-black ${
                      isTargetAchieved
                        ? "text-emerald-600 dark:text-emerald-400"
                        : isCritical
                        ? "text-rose-600 dark:text-rose-400"
                        : "text-amber-600 dark:text-amber-400"
                    }`}>
                      {item.defectRate}%
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-400 font-bold block">불량수량</span>
                    <span className="text-base font-black text-rose-600 dark:text-rose-400">
                      {item.defectQty.toLocaleString()} <span className="text-xs text-slate-400 font-normal">EA</span>
                    </span>
                  </div>
                </div>

                {/* Inspection Qty */}
                <div className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs">
                  <span className="font-bold text-slate-500 dark:text-slate-400">검사 수량</span>
                  <span className="font-black text-slate-900 dark:text-white text-sm">
                    {item.inspectQty.toLocaleString()} EA
                  </span>
                </div>

                {/* Worst Cause Pill */}
                <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                  <span className="font-bold">주요 불량:</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300 truncate max-w-[130px]">
                    {item.worstReason}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* 4. ⭐ [핵심 2] 아이템별 불량률 순위 & 비교 가로형 바 차트 (High-Visibility Bars) */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <BarChart2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-black text-base text-slate-900 dark:text-white">
                아이템별 불량률(%) 비교 차트
              </h2>
              <p className="text-xs text-slate-400">
                당월 품질 관리 목표치: 0.70% 이하
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs font-bold">
            <span className="flex items-center gap-1 text-emerald-600">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span>달성 (≤0.70%)</span>
            </span>
            <span className="flex items-center gap-1 text-rose-500">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
              <span>초과 (&gt;0.70%)</span>
            </span>
          </div>
        </div>

        {/* Horizontal Progress Bars */}
        <div className="space-y-3 pt-2">
          {filteredItems.map((item) => {
            const isGood = item.defectRate <= 0.70;
            const maxRate = 12.0;
            const barWidthPct = Math.min(100, Math.max(3, (item.defectRate / maxRate) * 100));

            return (
              <div key={item.id} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-black">
                  <div className="flex items-center gap-2">
                    <span className="w-24 text-slate-800 dark:text-slate-200 font-extrabold truncate">
                      {item.name}
                    </span>
                    <span className="text-[11px] text-slate-400 font-normal">
                      (검사 {item.inspectQty.toLocaleString()} EA / 불량 {item.defectQty} EA)
                    </span>
                  </div>
                  <span className={isGood ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}>
                    {item.defectRate}%
                  </span>
                </div>

                <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden relative">
                  {/* Target 0.70% Line Marker */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-slate-400 dark:bg-slate-500 z-10"
                    style={{ left: `${(0.70 / maxRate) * 100}%` }}
                    title="목표선 0.70%"
                  ></div>

                  {/* Progress Fill */}
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isGood
                        ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                        : item.defectRate > 2.0
                        ? "bg-gradient-to-r from-rose-600 to-red-500"
                        : "bg-gradient-to-r from-amber-500 to-rose-400"
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
      {/* 5. ⭐ [핵심 3] 아이템별 검사실적 & 불량률 상세 대장 표 (Detailed Matrix Table) */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
            <h3 className="font-black text-base text-slate-900 dark:text-white">
              품목별 검사수량 및 불량률 종합 일람표
            </h3>
          </div>
          <span className="text-xs font-bold text-slate-400">
            총 {filteredItems.length}개 품목 표시
          </span>
        </div>

        {/* Detailed Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse table-fixed min-w-[850px]">
            <thead>
              <tr className="border-b-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 font-black">
                <th className="py-3 px-3 w-[12%]">차종</th>
                <th className="py-3 px-3 w-[18%]">품목명</th>
                <th className="py-3 px-2 text-right w-[15%]">검사 수량</th>
                <th className="py-3 px-2 text-right w-[12%]">불량 수량</th>
                <th className="py-3 px-2 text-center w-[13%]">불량률 (%)</th>
                <th className="py-3 px-2 text-center w-[12%]">상태 판정</th>
                <th className="py-3 px-3 w-[18%]">주요 불량 사유</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredItems.map((item) => {
                const isGood = item.defectRate <= 0.70;
                const isCritical = item.defectRate > 2.0;

                return (
                  <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors h-11">
                    <td className="py-2 px-3 font-black text-slate-900 dark:text-white">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-black text-[11px] border border-slate-200 dark:border-slate-700">
                        {item.carModel}
                      </span>
                    </td>
                    <td className="py-2 px-3 font-bold text-slate-900 dark:text-white">
                      {item.name}
                    </td>
                    <td className="py-2 px-2 text-right font-black text-slate-900 dark:text-white">
                      {item.inspectQty.toLocaleString()} EA
                    </td>
                    <td className="py-2 px-2 text-right font-black text-rose-600 dark:text-rose-400">
                      {item.defectQty.toLocaleString()} EA
                    </td>
                    <td className="py-2 px-2 text-center font-black">
                      <span className={`px-2.5 py-1 rounded-lg text-xs ${
                        isGood
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                          : isCritical
                          ? "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300"
                          : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                      }`}>
                        {item.defectRate}%
                      </span>
                    </td>
                    <td className="py-2 px-2 text-center">
                      <span className={`text-[11px] font-extrabold ${
                        isGood ? "text-emerald-600" : isCritical ? "text-rose-600" : "text-amber-600"
                      }`}>
                        {isGood ? "● 목표달성" : isCritical ? "▲ 집중개선" : "■ 주의관리"}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-slate-600 dark:text-slate-300 font-medium truncate" title={item.worstReason}>
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
