import React, { useState, useRef } from "react";
import {
  FileSpreadsheet,
  Upload,
  Download,
  X,
  CheckCircle2,
  AlertCircle,
  FileText
} from "lucide-react";
import { downloadExcelTemplate, parseExcelFile } from "../utils/excelHelper";
import { useCurrency } from "../context/CurrencyContext";

export const ExcelUploadModal = ({ isOpen, onClose, onBulkUpload }) => {
  const { formatAmount } = useCurrency();
  const [file, setFile] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setErrorMsg("");
    setLoading(true);

    try {
      const parsed = await parseExcelFile(selectedFile);
      if (parsed.length === 0) {
        setErrorMsg("유효한 매입/손익 데이터(금액 > 0)가 발견되지 않았습니다.");
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

  const handleConfirmUpload = async () => {
    if (previewData.length === 0) return;
    setLoading(true);
    try {
      await onBulkUpload(previewData);
      alert(`총 ${previewData.length}건의 매입/손익 데이터가 성공적으로 등록되었습니다!`);
      handleClose();
    } catch (err) {
      setErrorMsg("등록 중 오류가 발생했습니다: " + err.message);
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

  const totalAmount = previewData.reduce((acc, cur) => acc + (cur.amount || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                매입 / 손익 자료 엑셀 일괄 업로드
              </h3>
              <p className="text-xs text-slate-400">
                엑셀(.xlsx, .xls) 또는 CSV 파일을 업로드하여 대량의 매입 내역을 한 번에 등록합니다.
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
        <div className="p-6 space-y-5 overflow-y-auto flex-1 text-sm">
          {/* Template Download Guide Banner */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <FileText className="w-5 h-5 text-blue-500 shrink-0" />
              <div>
                <p className="font-semibold text-xs text-slate-800 dark:text-slate-200">
                  표준 엑셀 업로드 양식 파일이 필요하신가요?
                </p>
                <p className="text-[11px] text-slate-400">
                  일자, 구분, 카테고리, 항목명, 금액, 거래처 컬럼이 포함된 양식을 다운로드하세요.
                </p>
              </div>
            </div>
            <button
              onClick={downloadExcelTemplate}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors shrink-0"
            >
              <Download className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>양식 다운로드 (.xlsx)</span>
            </button>
          </div>

          {/* Upload Drop Zone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 rounded-2xl p-8 text-center cursor-pointer transition-colors bg-slate-50/50 dark:bg-slate-800/30"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".xlsx,.xls,.csv"
              className="hidden"
            />
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-3">
              <Upload className="w-6 h-6" />
            </div>
            <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">
              {file ? file.name : "클릭하여 엑셀 파일(.xlsx, .csv)을 선택하세요"}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              파일을 선택하면 아래에 데이터 미리보기가 생성됩니다.
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Preview Table */}
          {previewData.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                <span>데이터 미리보기 (총 {previewData.length}건)</span>
                <span className="text-blue-600 dark:text-blue-400">
                  합계: {formatAmount(totalAmount)}
                </span>
              </div>

              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 sticky top-0">
                    <tr>
                      <th className="py-2 px-3">일자</th>
                      <th className="py-2 px-3">구분</th>
                      <th className="py-2 px-3">카테고리</th>
                      <th className="py-2 px-3">항목명</th>
                      <th className="py-2 px-3 text-right">금액</th>
                      <th className="py-2 px-3">거래처</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {previewData.slice(0, 10).map((row, i) => (
                      <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="py-1.5 px-3 whitespace-nowrap">{row.date}</td>
                        <td className="py-1.5 px-3 whitespace-nowrap">
                          <span className={`px-1.5 py-0.5 rounded font-semibold ${row.type === "revenue" ? "text-blue-600" : "text-rose-600"}`}>
                            {row.type === "revenue" ? "수익" : "지출"}
                          </span>
                        </td>
                        <td className="py-1.5 px-3 whitespace-nowrap">{row.category}</td>
                        <td className="py-1.5 px-3 max-w-xs truncate font-medium">{row.title}</td>
                        <td className="py-1.5 px-3 text-right whitespace-nowrap font-bold">
                          {formatAmount(row.amount)}
                        </td>
                        <td className="py-1.5 px-3 whitespace-nowrap">{row.client || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {previewData.length > 10 && (
                <p className="text-[11px] text-slate-400 text-right">
                  ...외 {previewData.length - 10}건 추가
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
            닫기
          </button>
          <button
            type="button"
            disabled={previewData.length === 0 || loading}
            onClick={handleConfirmUpload}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-40 text-white text-xs font-bold shadow-md shadow-emerald-500/20 active:scale-95 transition-all"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{loading ? "등록 처리 중..." : `총 ${previewData.length}건 일괄 등록하기`}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
