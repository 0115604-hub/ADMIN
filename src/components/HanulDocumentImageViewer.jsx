import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  X,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
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
  RefreshCw,
  Move,
  Maximize,
  LocateFixed,
  RotateCcw,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown
} from "lucide-react";

export const HanulDocumentImageViewer = ({
  attachments = [],
  activeAttachmentId = null,
  initialPageIndex = 0,
  isOpen = false,
  onClose,
  onDeleteAttachment,
  isEmbedded = false,
  onAutoFillData
}) => {
  const [selectedAttachmentId, setSelectedAttachmentId] = useState(activeAttachmentId);
  const [selectedPageIndex, setSelectedPageIndex] = useState(initialPageIndex);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  // Refs to always have the latest values synchronously without state lag
  const panRef = useRef({ x: 0, y: 0 });
  const zoomRef = useRef(1);
  const rotationRef = useRef(0);
  const isDraggingRef = useRef(false);
  const viewportRef = useRef(null);

  // Drag state for cursor styling
  const [isDragging, setIsDragging] = useState(false);

  // Keep refs in sync
  useEffect(() => {
    panRef.current = pan;
  }, [pan]);
  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);
  useEffect(() => {
    rotationRef.current = rotation;
  }, [rotation]);

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

  // Reset zoom, pan & rotation on page/attachment switch
  useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setRotation(0);
    panRef.current = { x: 0, y: 0 };
    zoomRef.current = 1;
    rotationRef.current = 0;
  }, [selectedAttachmentId, selectedPageIndex]);

  // 🌟 Mouse Wheel Zoom inside the viewport with cursor-centered scaling
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const handleWheelZoom = (e) => {
      e.preventDefault();
      e.stopPropagation();

      const delta = e.deltaY;
      const zoomFactor = delta < 0 ? 1.18 : 0.85;

      setZoom((prevZoom) => {
        const nextZoom = Math.min(Math.max(Number((prevZoom * zoomFactor).toFixed(2)), 0.35), 6.0);
        if (nextZoom === prevZoom) return prevZoom;

        // Calculate cursor relative to viewport center to pan towards cursor
        const rect = viewport.getBoundingClientRect();
        const mouseX = e.clientX - rect.left - rect.width / 2;
        const mouseY = e.clientY - rect.top - rect.height / 2;

        setPan((prevPan) => {
          if (nextZoom <= 1.05 && prevZoom <= 1.05) {
            panRef.current = { x: 0, y: 0 };
            return { x: 0, y: 0 };
          }
          const scaleChange = nextZoom / prevZoom;
          const newPanX = mouseX - (mouseX - prevPan.x) * scaleChange;
          const newPanY = mouseY - (mouseY - prevPan.y) * scaleChange;
          const res = {
            x: Math.round(newPanX),
            y: Math.round(newPanY)
          };
          panRef.current = res;
          return res;
        });

        zoomRef.current = nextZoom;
        return nextZoom;
      });
    };

    viewport.addEventListener("wheel", handleWheelZoom, { passive: false });
    return () => {
      viewport.removeEventListener("wheel", handleWheelZoom);
    };
  }, []);

  // 🌟 Keyboard Arrow Keys for Smooth Panning
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!viewportRef.current) return;
      const isHovered = viewportRef.current.matches(":hover");
      if (!isHovered) return;

      const step = 80;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        setPan((p) => {
          const np = { ...p, x: p.x + step };
          panRef.current = np;
          return np;
        });
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        setPan((p) => {
          const np = { ...p, x: p.x - step };
          panRef.current = np;
          return np;
        });
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setPan((p) => {
          const np = { ...p, y: p.y + step };
          panRef.current = np;
          return np;
        });
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setPan((p) => {
          const np = { ...p, y: p.y - step };
          panRef.current = np;
          return np;
        });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // 🌟 Direct Pan Adjustment Helpers (버튼으로 상하좌우 이동)
  const panBy = (dx, dy) => {
    setPan((p) => {
      const np = { x: p.x + dx, y: p.y + dy };
      panRef.current = np;
      return np;
    });
  };

  const handleZoomIn = () => {
    setZoom((prev) => {
      const next = Math.min(Number((prev + 0.25).toFixed(2)), 6.0);
      zoomRef.current = next;
      return next;
    });
  };

  const handleZoomOut = () => {
    setZoom((prev) => {
      const next = Math.max(Number((prev - 0.25).toFixed(2)), 0.35);
      if (next <= 1) {
        setPan({ x: 0, y: 0 });
        panRef.current = { x: 0, y: 0 };
      }
      zoomRef.current = next;
      return next;
    });
  };

  const handleResetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setRotation(0);
    panRef.current = { x: 0, y: 0 };
    zoomRef.current = 1;
    rotationRef.current = 0;
  };

  const handleFitWidth = () => {
    setZoom(1.5);
    setPan({ x: 0, y: 0 });
    setRotation(0);
    panRef.current = { x: 0, y: 0 };
    zoomRef.current = 1.5;
  };

  const handleRotate = () => {
    setRotation((prev) => {
      const next = (prev + 90) % 360;
      rotationRef.current = next;
      return next;
    });
  };

  // 🌟 Bulletproof Window-Level Pointer Drag to Pan (마우스 클릭 홀딩 상하좌우 완전 자유 이동)
  const handlePointerDown = (e) => {
    if (e.button !== undefined && e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();

    isDraggingRef.current = true;
    setIsDragging(true);

    const startX = e.clientX;
    const startY = e.clientY;
    const startPanX = panRef.current.x;
    const startPanY = panRef.current.y;

    const handleWindowPointerMove = (moveEvt) => {
      if (!isDraggingRef.current) return;
      moveEvt.preventDefault();
      const dx = moveEvt.clientX - startX;
      const dy = moveEvt.clientY - startY;
      const nextPan = {
        x: startPanX + dx,
        y: startPanY + dy
      };
      panRef.current = nextPan;
      setPan(nextPan);
    };

    const handleWindowPointerUp = (upEvt) => {
      isDraggingRef.current = false;
      setIsDragging(false);
      window.removeEventListener("pointermove", handleWindowPointerMove);
      window.removeEventListener("pointerup", handleWindowPointerUp);
      window.removeEventListener("pointercancel", handleWindowPointerUp);
    };

    window.addEventListener("pointermove", handleWindowPointerMove, { passive: false });
    window.addEventListener("pointerup", handleWindowPointerUp);
    window.addEventListener("pointercancel", handleWindowPointerUp);
  };

  // Double Click Toggle Zoom & Center Reset
  const handleDoubleClick = (e) => {
    if (zoom > 1.1) {
      handleResetZoom();
    } else {
      const rect = viewportRef.current?.getBoundingClientRect();
      if (rect) {
        const mouseX = e.clientX - rect.left - rect.width / 2;
        const mouseY = e.clientY - rect.top - rect.height / 2;
        setZoom(2.0);
        setPan({ x: -mouseX * 1.2, y: -mouseY * 1.2 });
      } else {
        setZoom(2.0);
      }
    }
  };

  const renderTypeIcon = (type) => {
    switch (type) {
      case "pdf":
        return <FileText className="w-3.5 h-3.5 text-rose-400" />;
      case "excel":
        return <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />;
      default:
        return <ImageIcon className="w-3.5 h-3.5 text-blue-400" />;
    }
  };

  const content = (
    <div className={`flex flex-col h-full bg-slate-900 text-white rounded-2xl overflow-hidden border border-slate-700/80 shadow-2xl relative select-none ${isEmbedded ? 'min-h-[460px]' : ''}`}>
      {/* Top Header Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-1.5 px-3 py-2 bg-slate-950 border-b border-slate-800 shrink-0 z-10">
        {/* Left: Attachment & Page Selector */}
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-800 text-slate-200 text-xs font-bold shrink-0">
            {renderTypeIcon(currentAttachment?.fileType)}
            <span className="uppercase text-[10px] font-black text-emerald-400">
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
              className="px-2 py-1 rounded-lg bg-slate-800 border border-slate-700 text-xs font-bold text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer max-w-[150px] sm:max-w-[200px] truncate"
            >
              {attachments.map((att, idx) => (
                <option key={att.id || idx} value={att.id}>
                  {idx + 1}. {att.fileName} ({att.pages?.length || 1}장)
                </option>
              ))}
            </select>
          ) : (
            <span className="text-xs font-bold text-slate-200 truncate max-w-[150px] sm:max-w-[200px]" title={currentAttachment?.fileName}>
              {currentAttachment?.fileName}
            </span>
          )}

          {/* Page Badge */}
          {pages.length > 1 && (
            <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-black shrink-0">
              {selectedPageIndex + 1}/{pages.length}p
            </span>
          )}
        </div>

        {/* Right: Zoom & Pan Navigation Controls */}
        <div className="flex items-center gap-1 shrink-0 ml-auto">
          {/* Quick Pan Buttons Group */}
          <div className="flex items-center bg-slate-800/90 rounded-lg p-0.5 border border-slate-700">
            <button
              type="button"
              onClick={() => panBy(120, 0)}
              className="p-1 rounded text-slate-300 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
              title="왼쪽으로 시점 이동 (좌측 보기)"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => panBy(-120, 0)}
              className="p-1 rounded text-slate-300 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
              title="오른쪽으로 시점 이동 (우측 보기)"
            >
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => panBy(0, 120)}
              className="p-1 rounded text-slate-300 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
              title="위쪽으로 시점 이동 (상단 보기)"
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => panBy(0, -120)}
              className="p-1 rounded text-slate-300 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
              title="아래쪽으로 시점 이동 (하단 보기)"
            >
              <ArrowDown className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Zoom Buttons Group */}
          <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700">
            <button
              type="button"
              onClick={handleZoomOut}
              className="p-1 rounded text-slate-300 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
              title="축소 (휠 아래로 스크롤)"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleResetZoom}
              className="px-1.5 text-[10px] font-mono font-black text-emerald-400 hover:text-emerald-300 cursor-pointer"
              title="100% 원본 크기 및 위치 리셋 (더블클릭)"
            >
              {Math.round(zoom * 100)}%
            </button>
            <button
              type="button"
              onClick={handleZoomIn}
              className="p-1 rounded text-slate-300 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
              title="확대 (휠 위로 스크롤)"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Re-center Pan Button */}
          <button
            type="button"
            onClick={() => {
              setPan({ x: 0, y: 0 });
              panRef.current = { x: 0, y: 0 };
            }}
            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
              pan.x !== 0 || pan.y !== 0
                ? "bg-emerald-950/80 text-emerald-400 border-emerald-700 hover:bg-emerald-900"
                : "bg-slate-800 text-slate-400 border-slate-700 hover:text-white hover:bg-slate-700"
            }`}
            title="화면 중앙으로 위치 초기화"
          >
            <LocateFixed className="w-3.5 h-3.5" />
          </button>

          {/* Rotate Button */}
          <button
            type="button"
            onClick={handleRotate}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
            title="90도 회전"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>

          {/* Download Converted Image */}
          <button
            type="button"
            onClick={handleDownloadImage}
            className="p-1.5 rounded-lg bg-slate-800 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/60 border border-slate-700 transition-colors cursor-pointer"
            title="변환된 고화질 이미지 다운로드"
          >
            <ArrowDownToLine className="w-3.5 h-3.5" />
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
              className="p-1.5 rounded-lg bg-slate-800 text-rose-400 hover:text-rose-300 hover:bg-rose-950/60 border border-slate-700 transition-colors cursor-pointer"
              title="증빙 삭제"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Modal Close Button */}
          {!isEmbedded && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer ml-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Image Canvas Viewport with 2D Drag Pan & Cursor-Centered Wheel Zoom */}
      <div
        ref={viewportRef}
        onMouseDown={handlePointerDown}
        onTouchStart={handlePointerDown}
        onDoubleClick={handleDoubleClick}
        className={`flex-1 relative overflow-hidden bg-slate-950 flex items-center justify-center p-3 select-none touch-none ${
          isDragging ? "cursor-grabbing" : "cursor-grab"
        }`}
        style={{ minHeight: isEmbedded ? "380px" : "480px" }}
      >
        {currentPage?.dataUrl ? (
          <div
            className="shadow-2xl rounded-lg overflow-hidden bg-white flex items-center justify-center select-none"
            style={{
              transform: `translate3d(${pan.x}px, ${pan.y}px, 0px) scale(${zoom}) rotate(${rotation}deg)`,
              transformOrigin: "center center",
              transition: isDragging ? "none" : "transform 90ms cubic-bezier(0.2, 0, 0, 1)",
              maxWidth: "94%",
              maxHeight: "94%",
              willChange: "transform"
            }}
          >
            <img
              src={currentPage.dataUrl}
              alt={currentPage.title || "증빙 이미지"}
              className="block max-w-full max-h-full object-contain pointer-events-none select-none"
              draggable={false}
            />
          </div>
        ) : (
          <div className="flex flex-col items-center text-slate-500 gap-2">
            <RefreshCw className="w-6 h-6 animate-spin text-emerald-500" />
            <span className="text-xs">이미지 불러오는 중...</span>
          </div>
        )}

        {/* Floating Controls & Pan Helper Guide Overlay */}
        <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-md bg-slate-900/85 backdrop-blur-xs border border-slate-700/80 text-[11px] text-slate-300 pointer-events-none flex items-center gap-2 shadow-lg">
          <span className="flex items-center gap-1 text-slate-300">
            <Move className="w-3 h-3 text-emerald-400" />
            <span>마우스 홀딩 드래그 또는 방향키(← → ↑ ↓)로 상하좌우 이동</span>
          </span>
          <span className="text-slate-500">•</span>
          <span className="text-slate-400">휠 확대/축소</span>
        </div>

        {/* Floating Mini Directional Pad on Canvas */}
        <div className="absolute top-3 right-3 flex flex-col items-center bg-slate-900/85 backdrop-blur-md p-1 rounded-xl border border-slate-700/80 shadow-xl z-20">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              panBy(0, 100);
            }}
            className="p-1 rounded-md hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="위로 이동 (상단 보기)"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                panBy(100, 0);
              }}
              className="p-1 rounded-md hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="왼쪽으로 이동 (좌측 보기)"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setPan({ x: 0, y: 0 });
                panRef.current = { x: 0, y: 0 };
              }}
              className="p-1 rounded-md hover:bg-emerald-600 text-emerald-400 hover:text-white transition-colors cursor-pointer text-[10px] font-bold"
              title="중앙 정렬"
            >
              <LocateFixed className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                panBy(-100, 0);
              }}
              className="p-1 rounded-md hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="오른쪽으로 이동 (우측 보기)"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              panBy(0, -100);
            }}
            className="p-1 rounded-md hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="아래로 이동 (하단 보기)"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>

        {/* Zoom Tooltip Badge */}
        <div className="absolute bottom-3 right-3 flex items-center gap-1.5 z-10">
          {(pan.x !== 0 || pan.y !== 0) && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setPan({ x: 0, y: 0 });
                panRef.current = { x: 0, y: 0 };
              }}
              className="px-2 py-1 rounded-md bg-slate-900/90 hover:bg-emerald-600 text-[10px] font-bold text-emerald-400 hover:text-white border border-slate-700 transition-all cursor-pointer shadow-lg flex items-center gap-1"
              title="화면 중앙으로 정렬"
            >
              <LocateFixed className="w-3 h-3" />
              <span>위치 초기화</span>
            </button>
          )}

          <div className="px-2.5 py-1 rounded-md bg-slate-900/90 backdrop-blur-xs border border-slate-700/80 text-[11px] font-mono text-slate-300 flex items-center gap-1.5 shadow-lg">
            <span>🔍</span>
            <span className="text-emerald-400 font-bold">{Math.round(zoom * 100)}%</span>
          </div>
        </div>

        {/* Floating Prev / Next Navigation Arrows */}
        {pages.length > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handlePrevPage();
              }}
              disabled={selectedPageIndex === 0 && attachments.findIndex(a => a.id === selectedAttachmentId) === 0}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 p-2 rounded-full bg-slate-900/85 hover:bg-emerald-600 text-white shadow-xl backdrop-blur-xs disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer z-10 border border-slate-700"
              title="이전 페이지"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleNextPage();
              }}
              disabled={selectedPageIndex === pages.length - 1 && attachments.findIndex(a => a.id === selectedAttachmentId) === attachments.length - 1}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-2 rounded-full bg-slate-900/85 hover:bg-emerald-600 text-white shadow-xl backdrop-blur-xs disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer z-10 border border-slate-700"
              title="다음 페이지"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}
      </div>

      {/* Bottom Thumbnail Strip if multiple pages/attachments */}
      {(pages.length > 1 || attachments.length > 1) && (
        <div className="px-2.5 py-1.5 bg-slate-950 border-t border-slate-800 flex items-center gap-1.5 overflow-x-auto shrink-0 scrollbar-none">
          <span className="text-[10px] font-black text-slate-500 uppercase shrink-0">
            페이지:
          </span>
          {pages.map((p, idx) => {
            const isSelected = idx === selectedPageIndex;
            return (
              <button
                key={p.pageNumber || idx}
                type="button"
                onClick={() => setSelectedPageIndex(idx)}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  isSelected
                    ? "bg-emerald-600 text-white ring-1 ring-emerald-400/50 shadow-xs"
                    : "bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700"
                }`}
              >
                <span>{p.title || `P.${idx + 1}`}</span>
                {isSelected && (
                  <Eye className="w-2.5 h-2.5 text-emerald-200" />
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
