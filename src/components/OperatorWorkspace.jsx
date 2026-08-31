import React, { useState, useRef } from "react";
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  FileCheck,
  RotateCw,
  Factory
} from "lucide-react";
import { parseExcelFile } from "../utils/excelHelper";
import { useAuth } from "../context/AuthContext";
import { useCurrency } from "../context/CurrencyContext";
import { useMonth } from "../context/MonthContext";

export const OperatorWorkspace = ({ onBulkUpload }) => {
  const { currentProfile } = useAuth();
  const { formatAmount } = useCurrency();
  const { uploadMonthlyData } = useMonth();
  const fileInputRef = useRef();

  const [dragActive, setDragActive] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [parsedResult, setParsedResult] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const plantName = currentProfile?.plant || "사업장";
  const workerName = currentProfile?.name || "작업자";

  // Upload History
  const [uploadHistory, setUploadHistory] = useState(() => {
    const saved = localStorage.getItem("operator_upload_history_clean_v2");
    return saved
      ? JSON.parse(saved)
      : [
          {
            id: 1,
            fileName: "2026.07 매입매출 내역서.xlsx",
            month: "2026-07",
            date: "2026-08-27 15:30",
            operator: `조인주 (삼랑진공장)`,
            salesAmount: 2873777826,
            purchaseAmount: 1831147543.4,
            status: "동기화 완료"
          }
        ];
  });

  const handleFile = async (file) => {
    if (!file) return;
    setParsing(true);
    setUploadSuccess(false);
    try {
      const result = await parseExcelFile(file);
      setParsedResult({
        file,
        fileName: file.name,
        fileSize: (file.size / 1024).toFixed(1) + " KB",
        ...result
      });
    } catch (err) {
      alert("엑셀 파일 파싱 오류: " + err.message);
    } finally {
      setParsing(false);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleConfirmUpload = async () => {
    if (!parsedResult) return;
    setUploading(true);
    try {
      const targetYM = parsedResult.yearMonth || "2026-08";

      // Save into MonthContext
      uploadMonthlyData(targetYM, parsedResult);

      // Save into transactions DB if items exist
      if (onBulkUpload && parsedResult.items && parsedResult.items.length > 0) {
        await onBulkUpload(parsedResult.items);
      }

      // Add to history
      const newRecord = {
        id: Date.now(),
        fileName: parsedResult.fileName,
        month: targetYM,
        date: new Date().toLocaleString("ko-KR", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit"
        }),
        operator: `${workerName} (${plantName})`,
        salesAmount: parsedResult.totalSales,
        purchaseAmount: parsedResult.totalExpenses,
        status: "동기화 완료"
      };

      const updatedHistory = [newRecord, ...uploadHistory.slice(0, 9)];
      setUploadHistory(updatedHistory);
      localStorage.setItem("operator_upload_history", JSON.stringify(updatedHistory));

      const ymLabel = `${targetYM.split("-")[0]}년 ${targetYM.split("-")[1]}월`;
      setSuccessMessage("성공적으로 동기화 및 반영되었습니다.");
      setUploadSuccess(true);
      setParsedResult(null);
    } catch (err) {
      alert("업로드 처리 중 오류: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn pb-12">
      {/* Compact Minimized Operator Welcome Banner */}
      <div className={`rounded-2xl px-5 py-3.5 text-white shadow-sm border border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${
        plantName === "한림공장"
          ? "bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900"
          : "bg-gradient-to-r from-amber-800 via-orange-900 to-slate-900"
      }`}>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-white/10 text-white shrink-0">
            <Factory className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-black tracking-tight">
                안녕하세요, {workerName} 작업자님! 🛠️
              </span>
              <span className="px-2 py-0.5 rounded-md bg-white/20 text-[10px] font-extrabold text-white">
                {plantName}
              </span>
            </div>
            <p className="text-[11px] text-white/70">
              {plantName} 매입·매출 엑셀 파일(.xlsx) 업로드 워크스페이스
            </p>
          </div>
        </div>
      </div>

      {uploadSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <p className="font-extrabold text-sm">{successMessage || "성공적으로 동기화 및 반영되었습니다."}</p>
          </div>
          <button
            onClick={() => setUploadSuccess(false)}
            className="text-xs font-bold px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 shrink-0 ml-2"
          >
            확인
          </button>
        </div>
      )}

      {/* Main Upload Dropzone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current.click()}
        className={`bg-white dark:bg-slate-900 rounded-3xl p-8 sm:p-12 border-2 border-dashed text-center cursor-pointer transition-all ${
          dragActive
            ? "border-amber-500 bg-amber-50/50 dark:bg-amber-950/20 scale-[1.01]"
            : "border-slate-300 dark:border-slate-700 hover:border-amber-400 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 shadow-sm"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx, .xls, .csv"
          className="hidden"
          onChange={(e) => handleFile(e.target.files[0])}
        />

        <div className="flex flex-col items-center gap-3.5">
          <div className={`w-16 h-16 rounded-3xl flex items-center justify-center shadow-lg ${
            plantName === "한림공장"
              ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 shadow-emerald-500/10"
              : "bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 shadow-amber-500/10"
          }`}>
            {parsing ? (
              <RotateCw className="w-8 h-8 animate-spin" />
            ) : (
              <UploadCloud className="w-8 h-8" />
            )}
          </div>

          <div className="space-y-1">
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
              {parsing ? "엑셀 데이터 분석 중..." : "엑셀 파일을 이곳에 끌어다 놓으세요"}
            </h3>
            <p className="text-xs text-slate-400">
              또는 클릭하여 컴퓨터/스마트폰에서 <span className="font-semibold text-blue-600">2026-XX월매입매출현황.xlsx</span> 파일 선택
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-500">
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>.xlsx, .xls 형식 지원 (시트 및 해당 월 자동 감지)</span>
          </div>
        </div>
      </div>

      {/* Parsed File Preview & Confirmation */}
      {parsedResult && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-lg space-y-5 animate-fadeIn">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600">
                <FileCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-extrabold text-base text-slate-900 dark:text-white">
                    {parsedResult.fileName}
                  </h4>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-blue-600 text-white">
                    {parsedResult.yearMonth} 인식됨
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  파일 크기 {parsedResult.fileSize} • 감지된 시트 {parsedResult.sheetCount || 1}개
                </p>
              </div>
            </div>

            <button
              onClick={() => setParsedResult(null)}
              className="text-xs font-bold text-slate-400 hover:text-slate-600"
            >
              취소
            </button>
          </div>

          {/* Validation Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/60">
              <span className="text-[11px] font-semibold text-blue-500">감지된 매출 합계</span>
              <p className="text-xl font-black text-blue-600 dark:text-blue-400 mt-1">
                {formatAmount(parsedResult.totalSales || 0)}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">차종 {parsedResult.vehicleSales?.length || 0}개군</p>
            </div>
            <div className="p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/30 border border-rose-200/60 dark:border-rose-900/60">
              <span className="text-[11px] font-semibold text-rose-500">감지된 매입 합계</span>
              <p className="text-xl font-black text-rose-600 dark:text-rose-400 mt-1">
                {formatAmount(parsedResult.totalExpenses || 0)}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">자재 {parsedResult.jajaeGroups?.length || 0}개군</p>
            </div>
            <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-900/60 col-span-2 sm:col-span-1">
              <span className="text-[11px] font-semibold text-emerald-500">당기 손익 (예상)</span>
              <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                {formatAmount((parsedResult.totalSales || 0) - (parsedResult.totalExpenses || 0))}
              </p>
            </div>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleConfirmUpload}
            disabled={uploading}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 text-white font-black text-sm shadow-xl shadow-blue-500/25 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            {uploading ? (
              <>
                <RotateCw className="w-4 h-4 animate-spin" />
                <span>데이터 동기화 진행 중...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                <span>{parsedResult.yearMonth} 엑셀 실적 동기화 완료 및 전송</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Recent Upload History */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-500" />
            <span>최근 엑셀 업데이트 이력</span>
          </h4>
          <span className="text-xs text-slate-400">{workerName} ({plantName})</span>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
          {uploadHistory.map((item) => (
            <div key={item.id} className="py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-slate-900 dark:text-white">{item.fileName}</p>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {item.month}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {item.date} • {item.operator}
                  </p>
                </div>
              </div>

              <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                {item.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
