import React, { useState, useEffect, useRef } from "react";
import {
  X,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight,
  Download,
  Trash2,
  FileText,
  FileSpreadsheet,
  Image as ImageIcon,
  RotateCw,
  Sparkles,
  Layers,
  Eye,
  ArrowDownToLine,
  RefreshCw
} from "lucide-react";

export const HanulDocumentImageViewer = ({
  attachments = [],
  activeAttachmentId = null,
  initialPageIndex = 0,
  isOpen = false,
  onClose,
  onDeleteAttachment,
  isEmbedded = false, // If true, renders inside a panel/split view instead of full screen modal
  onAutoFillData // Optional callback to auto-fill expense fields from parsed excel data
}) => {
  const [selectedAttachmentId, setSelectedAttachmentId] = useState(activeAttachmentId);
  const [selectedPageIndex, setSelectedPageIndex] = useState(initialPageIndex);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef(null);

  // Sync selected attachment
  useEffect(() => {
    if (activeAttachmentId) {
      setSelectedAttachmentId(activeAttachmentId);
      setSelectedPageIndex(initialPageIndex || 0);
    } else if (attachments && attachments.length > 0) {
      if (!selectedAttachmentId || !attachments.some(a => a.id === selectedAttachmentId)) {
        setSelectedAttachmentId(attachments[0].id);
        setSelectedPageIndex(0);
      }
    }
  }, [activeAttachmentId, attachments, initialPageIndex]);

  // Reset zoom & rotation on page change
  useEffect(() => {
    setZoom(1);
    setRotation(0);
  }, [selectedAttachmentId, selectedPageIndex]);

  if (!isOpen && !isEmbedded) return null;
  if (!attachments || attachments.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center p-8 text-center rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 ${isEmbedded ? 'h-full min-h-[300px]' : 'p-12'}`}>
        <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center mb-3">
          <ImageIcon className="w-7 h-7" />
        </div>
        <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 mb-1">
          변환된 증빙 이미지가 없습니다
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
          정산표 파일(PDF, 엑셀, 영수증 사진)을 업로드하시면 자동으로 고화질 이미지로 변환되어 이곳에서 바로 확인할 수 있습니다.
        </p>
      </div>
    );
  }

  const currentAttachment = attachments.find(a => a.id === selectedAttachmentId) || attachments[0];
  const pages = currentAttachment?.pages || [];
  const currentPage = pages[selectedPageIndex] || pages[0] || null;

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3.5));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.4));
  const handleResetZoom = () => { setZoom(1); setRotation(0); };
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);

  const handlePrevPage = () => {
    if (selectedPageIndex > 0) {
      setSelectedPageIndex(prev => prev - 1);
    } else {
      // Find prev attachment
      const curIdx = attachments.findIndex(a => a.id === selectedAttachmentId);
      if (curIdx > 0) {
        const prevAtt = attachments[curIdx - 1];
        setSelectedAttachmentId(prevAtt.id);
        setSelectedPageIndex(prevAtt.pages.length - 1);
      }
    }
  };

  const handleNextPage = () => {
    if (selectedPageIndex < pages.length - 1) {
      setSelectedPageIndex(prev => prev + 1);
    } else {
      // Find next attachment
      const curIdx = attachments.findIndex(a => a.id === selectedAttachmentId);
      if (curIdx < attachments.length - 1) {
        const nextAtt = attachments[curIdx + 1];
        setSelectedAttachmentId(nextAtt.id);
        setSelectedPageIndex(0);
      }
    }
  };

  const handleDownloadImage = () => {
    if (!currentPage?.dataUrl) return;
    const a = document.createElement("a");
    a.href = currentPage.dataUrl;
    a.download = `${currentAttachment.fileName}_page${selectedPageIndex + 1}_변환이미지.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const renderTypeIcon = (type) => {
    switch (type) {
      case "pdf":
        return <FileText className="w-4 h-4 text-rose-500" />;
      case "excel":
        return <FileSpreadsheet className="w-4 h-4 text-emerald-500" />;
      default:
        return <ImageIcon className="w-4 h-4 text-blue-500" />;
    }
  };

  const content = (
    <div className={`flex flex-col h-full bg-slate-900 text-white rounded-2xl overflow-hidden border border-slate-700 shadow-2xl relative select-none ${isEmbedded ? 'min-h-[460px]' : ''}`}>
      {/* Top Header Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 bg-slate-950/90 border-b border-slate-800 shrink-0 z-10">
        {/* Left: Attachment & Page Selector */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-800 text-slate-200 text-xs font-bold shrink-0">
            {renderTypeIcon(currentAttachment?.fileType)}
            <span className="uppercase text-[10px] font-black tracking-wider text-emerald-400">
              {currentAttachment?.fileType || "IMAGE"}
            </span>
          </div>

          {/* Attachment Select Dropdown if multiple */}
          {attachments.length > 1 ? (
            <select
              value={selectedAttachmentId}
              onChange={(e) => {
                setSelectedAttachmentId(e.target.value);
                setSelectedPageIndex(0);
              }}
              className="px-2 py-1 rounded-lg bg-slate-800 border border-slate-700 text-xs font-bold text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer max-w-[180px] sm:max-w-[240px] truncate"
            >
              {attachments.map((att, idx) => (
                <option key={att.id || idx} value={att.id}>
                  {idx + 1}. {att.fileName} ({att.pages?.length || 1}p)
                </option>
              ))}
            </select>
          ) : (
            <span className="text-xs font-bold text-slate-200 truncate max-w-[200px]" title={currentAttachment?.fileName}>
              {currentAttachment?.fileName}
            </span>
          )}

          {/* Page Badge */}
          {pages.length > 1 && (
            <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 text-[11px] font-black shrink-0">
              {selectedPageIndex + 1} / {pages.length} 페이지
            </span>
          )}
        </div>

        {/* Right: Zoom & Action Buttons */}
        <div className="flex items-center gap-1.5 shrink-0 ml-auto">
          {/* Zoom Buttons */}
          <div className="flex items-center bg-slate-800/80 rounded-xl p-0.5 border border-slate-700/80">
            <button
              type="button"
              onClick={handleZoomOut}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
              title="축소"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleResetZoom}
              className="px-1.5 text-[10px] font-mono font-bold text-emerald-400 hover:text-emerald-300 cursor-pointer"
              title="100% 원본 크기"
            >
              {Math.round(zoom * 100)}%
            </button>
            <button
              type="button"
              onClick={handleZoomIn}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
              title="확대"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Rotate Button */}
          <button
            type="button"
            onClick={handleRotate}
            className="p-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
            title="90도 회전"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>

          {/* Download Converted Image */}
          <button
            type="button"
            onClick={handleDownloadImage}
            className="p-1.5 rounded-xl bg-slate-800 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/60 border border-slate-700 transition-colors cursor-pointer flex items-center gap-1"
            title="변환된 고화질 이미지 다운로드"
          >
            <ArrowDownToLine className="w-3.5 h-3.5" />
            <span className="text-[10px] font-bold hidden sm:inline">저장</span>
          </button>

          {/* Delete Attachment Button */}
          {onDeleteAttachment && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm(`'${currentAttachment.fileName}' 증빙을 삭제하시겠습니까?`)) {
                  onDeleteAttachment(currentAttachment.id);
                }
              }}
              className="p-1.5 rounded-xl bg-slate-800 text-rose-400 hover:text-rose-300 hover:bg-rose-950/60 border border-slate-700 transition-colors cursor-pointer"
              title="증빙 삭제"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Fullscreen Toggle / Close in Modal Mode */}
          {!isEmbedded && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Image Canvas Viewport */}
      <div
        ref={containerRef}
        className="flex-1 relative overflow-auto bg-slate-950 flex items-center justify-center p-4 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent"
        style={{ minHeight: isEmbedded ? "360px" : "480px" }}
      >
        {currentPage?.dataUrl ? (
          <div
            className="transition-transform duration-150 ease-out origin-center flex items-center justify-center shadow-2xl rounded-lg overflow-hidden bg-white"
            style={{
              transform: `scale(${zoom}) rotate(${rotation}deg)`,
              maxWidth: zoom <= 1 ? "100%" : "none",
              maxHeight: zoom <= 1 ? "100%" : "none"
            }}
          >
            <img
              src={currentPage.dataUrl}
              alt={currentPage.title || "증빙 이미지"}
              className="block max-w-full max-h-full object-contain pointer-events-auto select-none"
              draggable={false}
            />
          </div>
        ) : (
          <div className="flex flex-col items-center text-slate-500 gap-2">
            <RefreshCw className="w-6 h-6 animate-spin text-emerald-500" />
            <span className="text-xs">이미지 불러오는 중...</span>
          </div>
        )}

        {/* Floating Prev / Next Navigation Arrows */}
        {pages.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrevPage}
              disabled={selectedPageIndex === 0 && attachments.findIndex(a => a.id === selectedAttachmentId) === 0}
              className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-slate-900/80 hover:bg-emerald-600 text-white shadow-lg backdrop-blur-xs disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer z-10"
              title="이전 페이지"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={handleNextPage}
              disabled={selectedPageIndex === pages.length - 1 && attachments.findIndex(a => a.id === selectedAttachmentId) === attachments.length - 1}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-slate-900/80 hover:bg-emerald-600 text-white shadow-lg backdrop-blur-xs disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer z-10"
              title="다음 페이지"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}
      </div>

      {/* Bottom Thumbnail Strip if multiple pages/attachments */}
      {(pages.length > 1 || attachments.length > 1) && (
        <div className="px-3 py-2 bg-slate-950/90 border-t border-slate-800 flex items-center gap-2 overflow-x-auto shrink-0 scrollbar-none">
          <span className="text-[10px] font-black text-slate-500 uppercase shrink-0">
            페이지 목록:
          </span>
          {pages.map((p, idx) => {
            const isSelected = idx === selectedPageIndex;
            return (
              <button
                key={p.pageNumber || idx}
                type="button"
                onClick={() => setSelectedPageIndex(idx)}
                className={`relative flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  isSelected
                    ? "bg-emerald-600 text-white ring-2 ring-emerald-400/50 shadow-xs shadow-emerald-500/30"
                    : "bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700"
                }`}
              >
                <span>{p.title || `P.${idx + 1}`}</span>
                {isSelected && (
                  <Eye className="w-3 h-3 text-emerald-200" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );

  if (isEmbedded) {
    return content;
  }

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-6xl h-[90vh] flex flex-col">
        {content}
      </div>
    </div>
  );
};
export default HanulDocumentImageViewer;
