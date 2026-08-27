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
  RotateCw
} from "lucide-react";
import { parseExcelFile } from "../utils/excelHelper";
import { useAuth } from "../context/AuthContext";
import { useCurrency } from "../context/CurrencyContext";

export const OperatorWorkspace = ({ onBulkUpload }) => {
  const { currentProfile } = useAuth();
  const { formatAmount } = useCurrency();
  const fileInputRef = useRef();

  const [dragActive, setDragActive] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [parsedResult, setParsedResult] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Upload History (stored in localStorage)
  const [uploadHistory, setUploadHistory] = useState(() => {
    const saved = localStorage.getItem("operator_upload_history");
    return saved
      ? JSON.parse(saved)
      : [
          {
            id: 1,
            fileName: "2026-07월매입매출현황_원본.xlsx",
            date: "2026-08-27 15:30",
            operator: "조인주",
            itemCount: 142,
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
    if (!parsedResult || !parsedResult.items) return;
    setUploading(true);
    try {
      if (onBulkUpload) {
        await onBulkUpload(parsedResult.items);
      }

      // Add to history
      const newRecord = {
        id: Date.now(),
        fileName: parsedResult.fileName,
        date: new Date().toLocaleString("ko-KR", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit"
        }),
        operator: currentProfile?.name || "조인주",
        itemCount: parsedResult.items.length,
        status: "동기화 완료"
      };

      const updatedHistory = [newRecord, ...uploadHistory.slice(0, 9)];
      setUploadHistory(updatedHistory);
      localStorage.setItem("operator_upload_history", JSON.stringify(updatedHistory));

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
      {/* Operator Welcome Banner */}
      <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 space-y-2.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 border border-white/30 text-white text-xs font-bold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>작업자 전용 엑셀 업데이트 워크스페이스</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
            안녕하세요, {currentProfile?.name || "조인주"} 작업자님! 🛠️
          </h2>
          <p className="text-xs sm:text-sm text-amber-100 max-w-xl">
            오늘 작성하신 매입·매출 엑셀 파일(`.xlsx`)을 업로드해 주세요. 시스템이 자동으로 분석하여 최신 실적을 반영합니다.
          </p>
        </div>
      </div>

      {uploadSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            <div>
              <p className="font-extrabold text-sm">일일 엑셀 파일이 성공적으로 동기화되었습니다!</p>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">
                관리자(최미영, 권태형) 대시보드에 최신 실적이 실시간 업데이트되었습니다.
              </p>
            </div>
          </div>
          <button
            onClick={() => setUploadSuccess(false)}
            className="text-xs font-bold px-3 py-1.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700"
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
          <div className="w-16 h-16 rounded-3xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-lg shadow-amber-500/10">
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
              또는 클릭하여 컴퓨터/스마트폰에서 <span className="font-semibold text-amber-600">2026-XX월매입매출현황.xlsx</span> 파일 선택
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-500">
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>.xlsx, .xls 형식 지원 (시트 자동 분리)</span>
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
                <h4 className="font-extrabold text-base text-slate-900 dark:text-white">
                  {parsedResult.fileName}
                </h4>
                <p className="text-xs text-slate-400">
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
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
              <span className="text-[11px] font-semibold text-slate-400">총 감지 품목</span>
              <p className="text-xl font-black text-slate-900 dark:text-white mt-1">
                {parsedResult.items.length.toLocaleString()} 건
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/60">
              <span className="text-[11px] font-semibold text-blue-500">감지된 매출 합계</span>
              <p className="text-xl font-black text-blue-600 dark:text-blue-400 mt-1">
                {formatAmount(parsedResult.totalSales || 0)}
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/30 border border-rose-200/60 dark:border-rose-900/60">
              <span className="text-[11px] font-semibold text-rose-500">감지된 매입 합계</span>
              <p className="text-xl font-black text-rose-600 dark:text-rose-400 mt-1">
                {formatAmount(parsedResult.totalExpenses || 0)}
              </p>
            </div>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleConfirmUpload}
            disabled={uploading}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-black text-sm shadow-xl shadow-amber-500/25 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            {uploading ? (
              <>
                <RotateCw className="w-4 h-4 animate-spin" />
                <span>데이터 동기화 진행 중...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                <span>최신 엑셀 실적 동기화 완료 및 전송</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Recent Upload History */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-500" />
            <span>최근 엑셀 업데이트 이력</span>
          </h4>
          <span className="text-xs text-slate-400">작업자: {currentProfile?.name || "조인주"}</span>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
          {uploadHistory.map((item) => (
            <div key={item.id} className="py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">{item.fileName}</p>
                  <p className="text-[11px] text-slate-400">{item.date} • {item.itemCount}건 처리</p>
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
