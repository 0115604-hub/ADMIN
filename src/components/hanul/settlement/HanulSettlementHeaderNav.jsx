import React from "react";
import {
  X,
  RotateCcw,
  CheckCircle2,
  Download,
  Trash2,
  Receipt,
  Building2,
  UploadCloud,
  FileText,
  FileSpreadsheet,
  Image as ImageIcon,
  Eye,
  Columns2,
  AlertCircle,
  RefreshCw,
  Plus
} from "lucide-react";

/**
 * HanulSettlementHeaderNav
 * 한울 정산/지출공제 모달의 상단 헤더, 월 선택기, 뷰모드 탭, 파일 업로드/변환 바 및 KPI 카드
 */
export default function HanulSettlementHeaderNav({
  status,
  handleModalClose,
  selectedMonth,
  handleMonthChange,
  monthDropdownOptions,
  viewMode,
  setViewMode,
  attachments,
  handleOpenViewer,
  fileInputRef,
  handleFileUpload,
  isConverting,
  handleExportExcel,
  handleResetExpenses,
  uploadProgress,
  conversionError,
  setConversionError,
  activeViewerAttId,
  setActiveViewerAttId,
  setActiveViewerPageIndex,
  handleDeleteAttachment,
  visibleExpenses,
  expenses,
  showOnlyWithAmount,
  setShowOnlyWithAmount,
  calculatedTotals,
  formatAmount
}) {
  return (
    <>
      {/* Top Header */}
      <div className="flex items-center justify-between px-3.5 py-2.5 sm:px-4 bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 text-white border-b border-emerald-500/30 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-1.5 rounded-xl bg-emerald-600/90 text-white shadow-sm ring-1 ring-white/20 shrink-0">
            <Receipt className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-200" />
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-xs sm:text-sm md:text-base font-black text-white tracking-tight truncate">
                (주)한울 지출내역 등록
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500 text-slate-950 shrink-0">
                {status === "CONFIRMED" ? "✓ 등록완료" : "✏️ 작성중"}
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleModalClose}
          className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Top Controls: Dropdown Month Selector, View Mode Switches & Actions */}
      <div className="px-3 py-2 bg-slate-50 dark:bg-slate-950/70 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 shrink-0">
        {/* Left: Dropdown Month Selector */}
        <div className="flex items-center gap-2 min-w-0">
          <label className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5 shrink-0">
            <Building2 className="w-4 h-4 text-emerald-600" />
            <span>정산월 :</span>
          </label>
          <select
            value={selectedMonth}
            onChange={(e) => handleMonthChange(e.target.value)}
            className="px-2.5 py-1 rounded-xl border-2 border-emerald-500/60 bg-white dark:bg-slate-800 text-xs sm:text-sm font-black text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs cursor-pointer"
          >
            {monthDropdownOptions.map((opt) => (
              <option key={opt.ym} value={opt.ym}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Center: View Mode Toggle Tabs */}
        <div className="flex items-center bg-slate-200/80 dark:bg-slate-800/80 p-0.5 rounded-xl gap-0.5">
          <button
            type="button"
            onClick={() => setViewMode("split")}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
              viewMode === "split"
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
            title="좌측 항목 입력창과 우측 증빙 이미지 뷰어를 나란히 보며 작성"
          >
            <Columns2 className="w-3.5 h-3.5" />
            <span>나란히 보기 (좌:항목 / 우:뷰어)</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("form")}
            className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
              viewMode === "form"
                ? "bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-300 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
            title="항목 입력창만 넓게 보기"
          >
            📝 항목만 보기
          </button>
          {attachments.length > 0 && (
            <button
              type="button"
              onClick={() => handleOpenViewer()}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-900 transition-all cursor-pointer"
              title="변환된 증빙 이미지만 크게 보기"
            >
              <Eye className="w-3.5 h-3.5 text-emerald-600" />
              <span>이미지만 보기</span>
            </button>
          )}
        </div>

        {/* Right: File Upload & Actions */}
        <div className="flex items-center gap-1.5 ml-auto">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            multiple
            accept=".pdf,.xlsx,.xls,.csv,image/*"
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isConverting}
            className="px-2.5 py-1 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black flex items-center gap-1 shadow-sm shadow-emerald-600/30 cursor-pointer active:scale-95 transition-all disabled:opacity-50"
            title="엑셀, PDF, 영수증 파일을 업로드하면 지출내역을 자동 분석하여 왼쪽 항목에 즉시 입력하고 우측 뷰어에 고화질 이미지로 표시합니다"
          >
            {isConverting ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <UploadCloud className="w-3.5 h-3.5 text-emerald-200" />
            )}
            <span>{isConverting ? "분석 및 변환중..." : "지출/증빙 파일 업로드 (자동분석)"}</span>
          </button>

          <button
            type="button"
            onClick={handleExportExcel}
            className="px-2 py-1 rounded-xl bg-white dark:bg-slate-800 hover:bg-emerald-50 text-slate-700 dark:text-slate-200 hover:text-emerald-700 text-xs font-bold border border-slate-200 dark:border-slate-700 flex items-center gap-1 cursor-pointer transition-all shadow-2xs"
            title="지출공제 엑셀 파일 다운로드"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">엑셀</span>
          </button>

          <button
            type="button"
            onClick={handleResetExpenses}
            className="px-2 py-1 rounded-xl bg-white dark:bg-slate-800 hover:bg-rose-50 text-slate-500 hover:text-rose-600 text-xs font-bold border border-slate-200 dark:border-slate-700 flex items-center gap-1 cursor-pointer transition-all shadow-2xs"
            title="모든 항목 금액을 0원으로 초기화"
          >
            <RotateCcw className="w-3 h-3" />
            <span className="hidden sm:inline">초기화</span>
          </button>
        </div>
      </div>

      {/* Multi-File Upload & Real-Time Progress Bar Banner */}
      {isConverting && (
        <div className="px-4 py-2 bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 text-white border-b border-emerald-500/40 flex flex-col gap-1.5 shrink-0 animate-fadeIn shadow-inner">
          <div className="flex items-center justify-between gap-2 min-w-0">
            <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
              <div className="p-1 rounded-lg bg-emerald-500 text-slate-950 shrink-0 shadow-xs flex items-center justify-center">
                {uploadProgress.stage === "completed" ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-slate-950 font-black" />
                ) : (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-950" />
                )}
              </div>
              <div className="flex items-center gap-1.5 min-w-0 truncate">
                <span className="text-xs font-black text-white truncate">
                  {uploadProgress.statusText}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-black bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-500/40 flex items-center gap-1">
                <span>{uploadProgress.percent}%</span>
                {uploadProgress.totalFiles > 1 && (
                  <span className="text-[10px] font-bold text-slate-900/80">
                    ({uploadProgress.currentFileIndex}/{uploadProgress.totalFiles} 파일)
                  </span>
                )}
              </span>
            </div>
          </div>

          <div className="w-full h-2 rounded-full bg-slate-800 border border-slate-700/80 overflow-hidden relative shadow-inner">
            <div
              className={`h-full rounded-full transition-all duration-300 ease-out relative ${
                uploadProgress.stage === "completed"
                  ? "bg-gradient-to-r from-emerald-400 to-teal-300 shadow-md shadow-emerald-400/50"
                  : "bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400"
              }`}
              style={{ width: `${Math.max(4, uploadProgress.percent)}%` }}
            >
              <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
            </div>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {conversionError && (
        <div className="px-4 py-1.5 bg-rose-50 dark:bg-rose-950/60 border-b border-rose-300 dark:border-rose-800 flex items-center justify-between gap-2 text-xs font-bold text-rose-800 dark:text-rose-200 shrink-0">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{conversionError}</span>
          </div>
          <button
            type="button"
            onClick={() => setConversionError("")}
            className="p-1 text-rose-500 hover:text-rose-700 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Attached Files & Converted Images Quick Badge Bar */}
      {attachments.length > 0 && (
        <div className="px-3 py-1.5 bg-slate-100 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto shrink-0 scrollbar-none">
          <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase shrink-0 flex items-center gap-1">
            <ImageIcon className="w-3 h-3 text-emerald-600" />
            <span>증빙 이미지 ({attachments.length}개):</span>
          </span>

          {attachments.map((att) => {
            const numPages = att.pages?.length || 1;
            const isSelected = activeViewerAttId === att.id;
            return (
              <div
                key={att.id}
                className={`flex items-center rounded-lg border shadow-2xs overflow-hidden shrink-0 transition-all ${
                  isSelected
                    ? "bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 ring-1 ring-emerald-400"
                    : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-emerald-400"
                }`}
              >
                <button
                  type="button"
                  onClick={() => {
                    setActiveViewerAttId(att.id);
                    setActiveViewerPageIndex(0);
                  }}
                  className="flex items-center gap-1 px-2 py-0.5 text-xs font-bold text-slate-800 dark:text-slate-200 hover:text-emerald-600 cursor-pointer"
                  title={`클릭하여 우측 뷰어에 '${att.fileName}' 표시`}
                >
                  {att.fileType === "pdf" ? (
                    <FileText className="w-3 h-3 text-rose-500 shrink-0" />
                  ) : att.fileType === "excel" ? (
                    <FileSpreadsheet className="w-3 h-3 text-emerald-500 shrink-0" />
                  ) : (
                    <ImageIcon className="w-3 h-3 text-blue-500 shrink-0" />
                  )}
                  <span className="truncate max-w-[120px] sm:max-w-[160px] text-[11px]">
                    {att.fileName}
                  </span>
                  <span className="px-1 py-0.2 rounded-full text-[9px] font-black bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                    {numPages}p
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDeleteAttachment(att.id)}
                  className="px-1 py-0.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer border-l border-slate-100 dark:border-slate-700"
                  title="증빙 삭제"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            );
          })}

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-2 py-0.5 rounded-lg border border-dashed border-emerald-500/70 text-emerald-700 dark:text-emerald-400 text-[11px] font-bold hover:bg-emerald-50 dark:hover:bg-emerald-950/30 flex items-center gap-0.5 cursor-pointer shrink-0"
          >
            <Plus className="w-2.5 h-2.5" />
            <span>추가</span>
          </button>
        </div>
      )}

      {/* KPI Summary Card: Total Expense & Active Items Filter */}
      <div className="px-3.5 py-2 bg-rose-50/60 dark:bg-rose-950/20 border-b border-rose-200/80 dark:border-rose-800/60 flex flex-wrap items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
            {selectedMonth} 지출/공제 항목:{" "}
            <strong className="text-slate-950 dark:text-white font-black">{visibleExpenses.length}개</strong>
          </span>
          <button
            type="button"
            onClick={() => setShowOnlyWithAmount((prev) => !prev)}
            className={`px-2 py-0.5 rounded-lg text-[10.5px] font-bold border transition-all cursor-pointer flex items-center gap-1 ${
              showOnlyWithAmount
                ? "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/80 dark:text-rose-300 dark:border-rose-800 shadow-2xs"
                : "bg-white text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 shadow-2xs"
            }`}
            title={
              showOnlyWithAmount
                ? "금액 0원 항목 숨김 상태 (클릭 시 전체 항목 표시)"
                : "전체 항목 표시 상태 (클릭 시 금액 있는 항목만 표시)"
            }
          >
            <span>{showOnlyWithAmount ? "금액 있는 항목만 표시" : "전체 항목 표시"}</span>
            <span className="opacity-75 font-mono text-[10px]">
              ({showOnlyWithAmount ? `${visibleExpenses.length}개` : `${expenses.length}개`})
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <span className="text-xs font-black text-rose-700 dark:text-rose-300">
            공통비 / 지출공제 총합계 :
          </span>
          <span className="text-base sm:text-lg font-black text-rose-600 dark:text-rose-400 font-mono">
            - {formatAmount(calculatedTotals.totalExpense)}
          </span>
        </div>
      </div>
    </>
  );
}
