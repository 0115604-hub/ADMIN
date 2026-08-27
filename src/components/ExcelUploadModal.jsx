import React, { useState, useRef } from "react";
import {
  FileSpreadsheet,
  Upload,
  Download,
  X,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Layers
} from "lucide-react";
import { parseExcelFile } from "../utils/excelHelper";
import { useCurrency } from "../context/CurrencyContext";

export const ExcelUploadModal = ({ isOpen, onClose, onBulkUpload }) => {
  const { formatAmount } = useCurrency();
  const [file, setFile] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [targetYearMonth, setTargetYearMonth] = useState("2026-07");
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileProcess = async (selectedFile, ym) => {
    if (!selectedFile) return;

    setFile(selectedFile);
    setErrorMsg("");
    setLoading(true);

    try {
      const parsed = await parseExcelFile(selectedFile, ym);
      if (parsed.length === 0) {
        setErrorMsg("유효한 매출/매입 데이터가 발견되지 않았습니다.");
        setPreviewData([]);
      } else {
        setPreviewData(parsed);
      }
    } catch (err) {
      setErrorMsg("엑셀 파일 분석 실패: " + (err.message || "올바른 엑셀 파일인지 확인해 주세요."));
      setPreviewData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileProcess(selectedFile, targetYearMonth);
    }
  };

  const handleMonthChange = (newYm) => {
    setTargetYearMonth(newYm);
    if (file) {
      handleFileProcess(file, newYm);
    }
  };

  const handleConfirmUpload = async () => {
    if (previewData.length === 0) return;
    setLoading(true);
    try {
      await onBulkUpload(previewData);
      alert(`총 ${previewData.length}건의 매출/매입 데이터가 성공적으로 등록되었습니다!`);
      handleClose();
    } catch (err) {
      setErrorMsg("등록 중 오류 발생: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setPreviewData([]);
    setErrorMsg("");
    onClose();
  };

  // Group calculations
  const revenues = previewData.filter((i) => i.type === "revenue");
  const expenses = previewData.filter((i) => i.type === "expense");
  const totalRev = revenues.reduce((a, b) => a + (b.amount || 0), 0);
  const totalExp = expenses.reduce((a, b) => a + (b.amount || 0), 0);
  const netProfit = totalRev - totalExp;

  const categoryCounts = {};
  expenses.forEach((item) => {
    categoryCounts[item.category] = (categoryCounts[item.category] || 0) + item.amount;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                <span>월간 매입·매출 원본 엑셀 스마트 일괄 업로드</span>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                  다중 시트 / 무가공 지원
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                기존 매입매출현황 원본 파일(.xlsx)을 그대로 올리면 매출과 매입이 한 번에 자동 분류됩니다.
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1 text-sm">
          {/* Target Month Picker */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-500" />
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                적용 대상 연월:
              </span>
            </div>
            <input
              type="month"
              value={targetYearMonth}
              onChange={(e) => handleMonthChange(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white"
            />
          </div>

          {/* Upload Drop Zone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 rounded-2xl p-7 text-center cursor-pointer transition-colors bg-slate-50/50 dark:bg-slate-800/30"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".xlsx,.xls,.csv"
              className="hidden"
            />
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-2.5">
              <Upload className="w-6 h-6" />
            </div>
            <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">
              {file ? file.name : "회사 매입매출 원본 엑셀 파일(.xlsx)을 선택하세요"}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              클릭하거나 파일을 드래그하여 올리면 매출세금계산서와 매입내역을 자동으로 동시에 추출합니다.
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Preview Section */}
          {previewData.length > 0 && (
            <div className="space-y-4">
              {/* Summary KPIs */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 text-xs font-semibold">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    <span>총 매출 ({revenues.length}건)</span>
                  </div>
                  <p className="text-base font-extrabold text-blue-700 dark:text-blue-300 mt-1">
                    {formatAmount(totalRev)}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800">
                  <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 text-xs font-semibold">
                    <ArrowDownRight className="w-3.5 h-3.5" />
                    <span>총 매입 ({expenses.length}건)</span>
                  </div>
                  <p className="text-base font-extrabold text-rose-700 dark:text-rose-300 mt-1">
                    {formatAmount(totalExp)}
                  </p>
                </div>

                <div className={`p-3 rounded-xl border ${netProfit >= 0 ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800" : "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800"}`}>
                  <div className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                    당월 순손익
                  </div>
                  <p className={`text-base font-extrabold mt-1 ${netProfit >= 0 ? "text-emerald-700 dark:text-emerald-300" : "text-amber-700 dark:text-amber-300"}`}>
                    {formatAmount(netProfit)}
                  </p>
                </div>
              </div>

              {/* Expense Category Breakdown Pills */}
              {Object.keys(categoryCounts).length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    매입 계정과목별 소계:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(categoryCounts).map(([cat, amt]) => (
                      <div
                        key={cat}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1"
                      >
                        <span className="font-bold text-slate-900 dark:text-white">{cat}</span>
                        <span className="text-slate-400">({formatAmount(amt)})</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Preview Table */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden max-h-52 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 sticky top-0">
                    <tr>
                      <th className="py-2 px-3">구분</th>
                      <th className="py-2 px-3">계정과목</th>
                      <th className="py-2 px-3">업체명/거래처</th>
                      <th className="py-2 px-3">품목 (적요)</th>
                      <th className="py-2 px-3 text-right">금액</th>
                      <th className="py-2 px-3">메모</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {previewData.slice(0, 15).map((row, i) => (
                      <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="py-1.5 px-3 whitespace-nowrap">
                          <span
                            className={`px-1.5 py-0.5 rounded font-bold text-[11px] ${
                              row.type === "revenue"
                                ? "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300"
                                : "bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300"
                            }`}
                          >
                            {row.type === "revenue" ? "매출" : "매입"}
                          </span>
                        </td>
                        <td className="py-1.5 px-3 whitespace-nowrap font-medium text-slate-800 dark:text-slate-200">
                          {row.category}
                        </td>
                        <td className="py-1.5 px-3 whitespace-nowrap font-bold text-slate-900 dark:text-white">
                          {row.client}
                        </td>
                        <td className="py-1.5 px-3 max-w-xs truncate">{row.title}</td>
                        <td
                          className={`py-1.5 px-3 text-right whitespace-nowrap font-bold ${
                            row.type === "revenue"
                              ? "text-blue-600 dark:text-blue-400"
                              : "text-rose-600 dark:text-rose-400"
                          }`}
                        >
                          {formatAmount(row.amount)}
                        </td>
                        <td className="py-1.5 px-3 text-slate-400 truncate max-w-[120px]">{row.memo}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {previewData.length > 15 && (
                <p className="text-[11px] text-slate-400 text-right">
                  ...외 {previewData.length - 15}건 추가
                </p>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3 bg-slate-50/50 dark:bg-slate-900/50">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            취소
          </button>
          <button
            type="button"
            disabled={previewData.length === 0 || loading}
            onClick={handleConfirmUpload}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-40 text-white text-xs font-bold shadow-md shadow-blue-500/20 active:scale-95 transition-all"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{loading ? "등록 처리 중..." : `총 ${previewData.length}건 즉시 일괄 등록`}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
