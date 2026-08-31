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
  Check
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

  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([
    "G-RUN 불량율 집계.xlsx",
    "01. 08월 AB동-최종검사 정리.xlsx"
  ]);
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState("");

  // Sort items strictly by Inspection Quantity in descending order (검사수량 많은 순서대로 나열)
  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => b.inspectQty - a.inspectQty);
  }, [items]);

  // Find the item with the highest defect rate (불량률이 제일 높은 아이템)
  const maxDefectRateItem = useMemo(() => {
    return items.reduce((max, it) => (it.defectRate > max.defectRate ? it : max), items[0]);
  }, [items]);

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
      ["아이템별 품질 검사실적 및 불량률 보고서"],
      ["조회일자", new Date().toLocaleDateString(), "관리목표", "불량률 0.70% 이하"],
      [],
      ["아이템명", "검사수량(EA)", "불량수량(EA)", "불량률(%)", "상태", "주요 불량 사유"]
    ];

    sortedItems.forEach((it) => {
      const isMaxRate = it.id === maxDefectRateItem.id;
      rows.push([
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
      {/* 1. TOP HEADER & EXCEL EXPORT */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900 dark:text-white">
              아이템별 품질 검사실적 및 불량률
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              품질 관리 목표치: <strong className="text-emerald-600 font-black">0.70% 이하</strong> | 담당: <strong>이창엽 책임</strong>
            </p>
          </div>
        </div>

        <button
          onClick={handleExportExcel}
          className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-black transition-all shadow-sm self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5 text-emerald-400" />
          <span>엑셀 다운로드</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 2. ⭐ [핵심 업로더] 2개 엑셀 파일 드래그 앤 드롭 업로드 영역 (Drag & Drop Zone) */}
      {/* ========================================================================= */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`p-5 sm:p-6 rounded-3xl border-2 border-dashed transition-all cursor-pointer flex flex-col sm:flex-row items-center justify-between gap-4 ${
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

        <div className="flex items-center gap-3.5">
          <div className={`p-3 rounded-2xl transition-all ${
            isDragging ? "bg-indigo-600 text-white scale-110" : "bg-indigo-100 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400"
          }`}>
            <FileUp className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white">
              G-RUN 불량율 집계 & AB동 최종검사 파일 드래그 업로드
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              바탕화면의 엑셀 파일 2개를 이곳에 <strong>한 번에 드래그하여 놓거나 클릭</strong>하여 업로드하세요.
            </p>
          </div>
        </div>

        {/* Linked Files Status Badges */}
        <div className="flex flex-wrap items-center gap-2">
          {uploadedFiles.map((fn, idx) => (
            <div
              key={idx}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 shadow-sm"
            >
              <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span className="truncate max-w-[180px]">{fn}</span>
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

      {/* ========================================================================= */}
      {/* 3. ⭐ [핵심 1] 아이템별 품질 실적 카드 (검사수량 순 나열 & 최고 불량률 붉은색 경고) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {sortedItems.map((item) => {
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
              {/* Top Row: Item Name & Alert Badge */}
              <div>
                <div className="flex items-center justify-between">
                  <h3 className={`text-lg font-black ${isMaxRate ? "text-rose-950 dark:text-rose-100" : "text-slate-900 dark:text-white"}`}>
                    {item.name}
                  </h3>

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
      {/* 4. ⭐ [핵심 2] 아이템별 불량률(%) 비교 가로형 바 차트 */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <BarChart2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-black text-base text-slate-900 dark:text-white">
                아이템별 불량률(%) 비교
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
          {sortedItems.map((item) => {
            const isMaxRate = item.id === maxDefectRateItem.id;
            const isGood = item.defectRate <= 0.70;
            const maxRate = 1.6;
            const barWidthPct = Math.min(100, Math.max(8, (item.defectRate / maxRate) * 100));

            return (
              <div key={item.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-black">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-900 dark:text-white font-extrabold text-sm">
                      {item.name}
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
      {/* 5. ⭐ [핵심 3] 아이템별 검사실적 일람표 */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
            <h3 className="font-black text-base text-slate-900 dark:text-white">
              아이템별 검사실적 및 불량률 종합 일람표
            </h3>
          </div>
          <span className="text-xs font-bold text-slate-400">
            총 {sortedItems.length}개 핵심 아이템
          </span>
        </div>

        {/* Detailed Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse table-fixed min-w-[750px]">
            <thead>
              <tr className="border-b-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 font-black">
                <th className="py-3 px-3 w-[22%]">아이템명</th>
                <th className="py-3 px-3 text-right w-[18%]">검사 수량</th>
                <th className="py-3 px-3 text-right w-[16%]">불량 수량</th>
                <th className="py-3 px-3 text-center w-[16%]">불량률 (%)</th>
                <th className="py-3 px-3 text-center w-[14%]">상태 구분</th>
                <th className="py-3 px-3 w-[24%]">주요 불량 사유</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {sortedItems.map((item) => {
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
