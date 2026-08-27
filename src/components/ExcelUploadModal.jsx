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
  Layers
} from "lucide-react";
import { downloadExcelTemplate, parseExcelFile } from "../utils/excelHelper";
import { useCurrency } from "../context/CurrencyContext";

export const ExcelUploadModal = ({ isOpen, onClose, onBulkUpload }) => {
  const { formatAmount } = useCurrency();
  const [file, setFile] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [targetYearMonth, setTargetYearMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
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
        setErrorMsg("유효한 매입/손익 데이터가 발견되지 않았습니다.");
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
      alert(`총 ${previewData.length}건의 매입/손익 내역이 성공적으로 자동 등록되었습니다!`);
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

  // Group preview by category for clear summary
  const categoryCounts = {};
  previewData.forEach((item) => {
    categoryCounts[item.category] = (categoryCounts[item.category] || 0) + item.amount;
  });

  const totalAmount = previewData.reduce((acc, cur) => acc + (cur.amount || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-md shadow-emerald-500/20">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                <span>기존 엑셀 파일 스마트 자동 인식 & 일괄 업로드</span>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                  무가공 원본 지원
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                기존에 사용하시던 엑셀 명세표를 가공 없이 그대로 올리면 스마트 엔진이 자동으로 계정과목을 분류합니다.
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
          {/* Smart Features Highlight */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200/80 dark:border-blue-800/50 flex items-start gap-3 text-xs">
            <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div className="space-y-1 text-slate-700 dark:text-slate-300 leading-relaxed">
              <p className="font-bold text-slate-900 dark:text-white">
                💡 별도의 사전 엑셀 가공이 필요 없습니다:
              </p>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-600 dark:text-slate-400">
                <li><strong>계정과목 자동 전파</strong>: 병합되거나 상단에만 적힌 계정과목(원자재, 부자재, 임가공비 등) 자동 인식</li>
                <li><strong>소계/합계 중복 방지</strong>: 중간중간 포함된 소계/합계 행은 자동으로 걸러내어 중복 계산을 방지</li>
                <li><strong>공급가액 & 거래처 자동 추출</strong>: 쉼표(,)가 포함된 금액 및 업체명 자동 정제</li>
              </ul>
            </div>
          </div>

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
            className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 rounded-2xl p-7 text-center cursor-pointer transition-colors bg-slate-50/50 dark:bg-slate-800/30"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".xlsx,.xls,.csv"
              className="hidden"
            />
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-2.5">
              <Upload className="w-6 h-6" />
            </div>
            <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">
              {file ? file.name : "회사에서 기존에 사용하시던 엑셀 파일(.xlsx, .xls)을 선택하세요"}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              클릭하거나 파일을 드래그하여 올려놓으시면 즉시 계정과목별로 자동 분류됩니다.
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Preview Breakdown by Category */}
          {previewData.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>자동 인식 완료: 총 {previewData.length}건</span>
                </span>
                <span className="text-emerald-600 dark:text-emerald-400 text-sm">
                  총 공급가액 합계: {formatAmount(totalAmount)}
                </span>
              </div>

              {/* Category Pills Summary */}
              <div className="flex flex-wrap gap-2">
                {Object.entries(categoryCounts).map(([cat, amt]) => (
                  <div
                    key={cat}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5"
                  >
                    <span className="font-bold text-slate-900 dark:text-white">{cat}</span>
                    <span className="text-slate-400">({formatAmount(amt)})</span>
                  </div>
                ))}
              </div>

              {/* Preview Table */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden max-h-52 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 sticky top-0">
                    <tr>
                      <th className="py-2 px-3">일자</th>
                      <th className="py-2 px-3">계정과목</th>
                      <th className="py-2 px-3">매입업체명</th>
                      <th className="py-2 px-3">품목 (적요)</th>
                      <th className="py-2 px-3 text-right">공급가액</th>
                      <th className="py-2 px-3">메모</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {previewData.slice(0, 15).map((row, i) => (
                      <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="py-1.5 px-3 whitespace-nowrap text-slate-500">{row.date}</td>
                        <td className="py-1.5 px-3 whitespace-nowrap font-bold text-blue-600 dark:text-blue-400">
                          {row.category}
                        </td>
                        <td className="py-1.5 px-3 whitespace-nowrap font-semibold text-slate-800 dark:text-slate-200">
                          {row.client}
                        </td>
                        <td className="py-1.5 px-3 max-w-xs truncate">{row.title}</td>
                        <td className="py-1.5 px-3 text-right whitespace-nowrap font-bold text-slate-900 dark:text-white">
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
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/50">
          <button
            onClick={downloadExcelTemplate}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-semibold"
          >
            <Download className="w-3.5 h-3.5" />
            <span>샘플 양식 다운로드</span>
          </button>

          <div className="flex items-center gap-2.5">
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
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-40 text-white text-xs font-bold shadow-md shadow-emerald-500/20 active:scale-95 transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{loading ? "등록 처리 중..." : `총 ${previewData.length}건 즉시 일괄 등록`}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
