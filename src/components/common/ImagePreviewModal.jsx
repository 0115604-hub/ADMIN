import React, { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { Download, X, ZoomIn, ZoomOut, RotateCw, LocateFixed, Move, ChevronLeft, ChevronRight } from "lucide-react";
import { useModalHistory } from "../../utils/modalHistory";

export const ImagePreviewModal = ({ previewImage, imageList, initialIndex = 0, onClose }) => {
  const images = useMemo(() => {
    if (Array.isArray(imageList) && imageList.length > 0) return imageList;
    if (previewImage && Array.isArray(previewImage.list) && previewImage.list.length > 0) return previewImage.list;
    if (Array.isArray(previewImage) && previewImage.length > 0) return previewImage;
    if (previewImage) return [previewImage];
    return [];
  }, [imageList, previewImage]);

  const [currentIndex, setCurrentIndex] = useState(() => {
    if (typeof initialIndex === "number" && initialIndex >= 0) return initialIndex;
    if (previewImage && typeof previewImage.index === "number") return previewImage.index;
    return 0;
  });

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const touchStartRef = useRef({ x: 0, y: 0, time: 0 });
  const viewportRef = useRef(null);

  // Register with browser history for Back button
  useModalHistory(Boolean(previewImage), onClose, "imagePreviewModal");

  // Sync index when previewImage changes
  useEffect(() => {
    if (typeof initialIndex === "number" && initialIndex >= 0) {
      setCurrentIndex(initialIndex);
    } else if (previewImage && typeof previewImage.index === "number") {
      setCurrentIndex(previewImage.index);
    }
  }, [previewImage, initialIndex]);

  // Reset zoom & pan when image changes
  useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setRotation(0);
  }, [currentIndex, previewImage]);

  const hasMultiple = images.length > 1;
  const currentItem = images[currentIndex] || images[0] || null;
  const imageUrl = typeof currentItem === "string" ? currentItem : (currentItem?.url || currentItem?.dataUrl);
  const imageName = typeof currentItem === "string"
    ? `사진 (${currentIndex + 1}/${images.length})`
    : (currentItem?.name || `사진 (${currentIndex + 1}/${images.length})`);

  const handlePrev = (e) => {
    if (e) e.stopPropagation();
    if (!hasMultiple) return;
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setRotation(0);
  };

  const handleNext = (e) => {
    if (e) e.stopPropagation();
    if (!hasMultiple) return;
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setRotation(0);
  };

  // Keyboard Navigation (Left / Right arrow keys)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!previewImage) return;
      if (e.key === "ArrowLeft") {
        handlePrev();
      } else if (e.key === "ArrowRight") {
        handleNext();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [previewImage, hasMultiple, images.length]);

  // Touch Swipe for Mobile (when not zoomed in)
  const handleTouchStart = (e) => {
    if (e.touches && e.touches.length === 1 && zoom <= 1.05) {
      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        time: Date.now()
      };
    }
  };

  const handleTouchEnd = (e) => {
    if (e.changedTouches && e.changedTouches.length === 1 && zoom <= 1.05 && hasMultiple) {
      const deltaX = e.changedTouches[0].clientX - touchStartRef.current.x;
      const deltaY = e.changedTouches[0].clientY - touchStartRef.current.y;
      const duration = Date.now() - touchStartRef.current.time;
      if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY) * 1.5 && duration < 500) {
        if (deltaX < 0) {
          handleNext();
        } else {
          handlePrev();
        }
      }
    }
  };

  // Wheel Zoom
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const handleWheel = (e) => {
      e.preventDefault();
      e.stopPropagation();

      const delta = e.deltaY;
      const factor = delta < 0 ? 1.15 : 0.87;

      setZoom((prevZoom) => {
        const nextZoom = Math.min(Math.max(Number((prevZoom * factor).toFixed(2)), 0.35), 6.0);
        if (nextZoom === prevZoom) return prevZoom;

        const rect = viewport.getBoundingClientRect();
        const mouseX = e.clientX - rect.left - rect.width / 2;
        const mouseY = e.clientY - rect.top - rect.height / 2;

        setPan((prevPan) => {
          if (nextZoom <= 1.05 && prevZoom <= 1.05) return { x: 0, y: 0 };
          const scaleChange = nextZoom / prevZoom;
          const newPanX = mouseX - (mouseX - prevPan.x) * scaleChange;
          const newPanY = mouseY - (mouseY - prevPan.y) * scaleChange;
          return { x: Math.round(newPanX), y: Math.round(newPanY) };
        });

        return nextZoom;
      });
    };

    viewport.addEventListener("wheel", handleWheel, { passive: false });
    return () => viewport.removeEventListener("wheel", handleWheel);
  }, []);

  const handlePointerDown = (e) => {
    if (e.button !== undefined && e.button !== 0) return;
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      panX: pan.x,
      panY: pan.y
    };
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (err) {}
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setPan({
      x: dragStartRef.current.panX + dx,
      y: dragStartRef.current.panY + dy
    });
  };

  const handlePointerUp = (e) => {
    setIsDragging(false);
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch (err) {}
  };

  const handleDoubleClick = (e) => {
    if (zoom > 1.1) {
      setZoom(1);
      setPan({ x: 0, y: 0 });
    } else {
      setZoom(2.0);
    }
  };

  if (!previewImage || typeof document === "undefined" || !imageUrl) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[120] bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center p-0 sm:p-4 md:p-6 animate-fadeIn cursor-pointer select-none overflow-hidden"
      onClick={onClose}
    >
      <div
        className="relative w-full h-full sm:h-[90vh] md:h-[92vh] sm:max-w-5xl md:max-w-6xl xl:max-w-7xl flex flex-col items-center bg-slate-900 sm:rounded-3xl overflow-hidden shadow-2xl border-0 sm:border border-slate-800 cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="w-full flex items-center justify-between p-2.5 sm:p-3.5 px-3.5 sm:px-6 bg-slate-950/95 border-b border-slate-800 text-white text-xs shrink-0 z-10">
          <div className="flex items-center gap-2 min-w-0">
            {hasMultiple && (
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-mono font-black text-xs border border-emerald-500/40 shrink-0">
                {currentIndex + 1} / {images.length}
              </span>
            )}
            <span className="font-bold truncate max-w-[150px] sm:max-w-md text-emerald-400 text-xs sm:text-sm">
              {imageName}
            </span>
          </div>

          <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap justify-end">
            {/* Zoom Controls */}
            <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700">
              <button
                type="button"
                onClick={() => setZoom((prev) => Math.max(Number((prev - 0.25).toFixed(2)), 0.35))}
                className="p-1 sm:p-1.5 rounded text-slate-300 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
                title="축소"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setZoom(1);
                  setPan({ x: 0, y: 0 });
                  setRotation(0);
                }}
                className="px-1.5 text-[10px] sm:text-xs font-mono font-black text-emerald-400 hover:text-emerald-300 cursor-pointer"
                title="100% 리셋"
              >
                {Math.round(zoom * 100)}%
              </button>
              <button
                type="button"
                onClick={() => setZoom((prev) => Math.min(Number((prev + 0.25).toFixed(2)), 6.0))}
                className="p-1 sm:p-1.5 rounded text-slate-300 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
                title="확대"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Re-center */}
            <button
              type="button"
              onClick={() => setPan({ x: 0, y: 0 })}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
              title="화면 중앙으로 위치 초기화"
            >
              <LocateFixed className="w-3.5 h-3.5" />
            </button>

            {/* Rotate */}
            <button
              type="button"
              onClick={() => setRotation((prev) => (prev + 90) % 360)}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
              title="90도 회전"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>

            {/* Download */}
            <a
              href={imageUrl}
              download={imageName ? `${imageName}.jpg` : "사진_다운로드.jpg"}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-emerald-700 text-slate-200 hover:text-white transition-colors flex items-center gap-1 text-[11px] border border-slate-700"
              title="사진 다운로드"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">저장</span>
            </a>

            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 sm:px-2.5 rounded-lg bg-rose-600/80 hover:bg-rose-600 text-white transition-colors cursor-pointer ml-1 font-bold text-xs flex items-center gap-1"
              title="닫기"
            >
              <X className="w-4 h-4" />
              <span className="hidden sm:inline">닫기</span>
            </button>
          </div>
        </div>

        {/* Image display canvas with 2D Drag Pan & Multi-Photo Flip Controls */}
        <div
          ref={viewportRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onDoubleClick={handleDoubleClick}
          className={`flex-1 w-full h-full relative overflow-hidden bg-slate-950 flex items-center justify-center p-1 sm:p-4 select-none touch-none ${
            isDragging ? "cursor-grabbing" : "cursor-grab"
          }`}
        >
          {/* Left Arrow Navigation Button */}
          {hasMultiple && (
            <button
              type="button"
              onClick={handlePrev}
              className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 sm:w-13 sm:h-13 rounded-full bg-black/60 hover:bg-black/85 text-white flex items-center justify-center backdrop-blur-md border border-white/20 shadow-2xl transition-all active:scale-90 hover:scale-105 cursor-pointer"
              title="이전 사진 보기 (키보드 ←)"
            >
              <ChevronLeft className="w-6 h-6 sm:w-8 sm:h-8" />
            </button>
          )}

          {/* Right Arrow Navigation Button */}
          {hasMultiple && (
            <button
              type="button"
              onClick={handleNext}
              className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 sm:w-13 sm:h-13 rounded-full bg-black/60 hover:bg-black/85 text-white flex items-center justify-center backdrop-blur-md border border-white/20 shadow-2xl transition-all active:scale-90 hover:scale-105 cursor-pointer"
              title="다음 사진 보기 (키보드 →)"
            >
              <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8" />
            </button>
          )}

          {/* Image */}
          <div
            className="w-full h-full flex items-center justify-center overflow-hidden"
            style={{
              transform: `translate3d(${pan.x}px, ${pan.y}px, 0px) scale(${zoom}) rotate(${rotation}deg)`,
              transformOrigin: "center center",
              transition: isDragging ? "none" : "transform 90ms cubic-bezier(0.2, 0, 0, 1)",
              willChange: "transform"
            }}
          >
            <img
              key={imageUrl}
              src={imageUrl}
              alt={imageName}
              className="block max-h-[84vh] sm:max-h-[80vh] md:max-h-[82vh] max-w-full w-auto h-auto object-contain sm:rounded-2xl shadow-2xl pointer-events-none select-none animate-fadeIn"
              draggable={false}
            />
          </div>

          {/* Bottom Dot Indicators when multiple */}
          {hasMultiple && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/75 backdrop-blur-md border border-white/15 shadow-xl">
              {images.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentIndex(idx);
                  }}
                  className={`h-2 rounded-full transition-all cursor-pointer ${
                    idx === currentIndex ? "w-6 bg-emerald-400" : "w-2 bg-white/40 hover:bg-white/70"
                  }`}
                  title={`${idx + 1}번째 사진 보기`}
                />
              ))}
            </div>
          )}

          {/* Guide Helper (Desktop / Mobile) */}
          <div className="hidden sm:flex absolute bottom-3 left-3 z-20 px-2.5 py-1 rounded-md bg-slate-900/85 backdrop-blur-xs border border-slate-700/80 text-[10px] sm:text-[11px] text-slate-300 pointer-events-none items-center gap-2 shadow-lg">
            <span className="flex items-center gap-1 text-slate-300">
              <Move className="w-3 h-3 text-emerald-400" />
              <span>드래그 이동</span>
            </span>
            <span className="text-slate-500">•</span>
            <span>{hasMultiple ? "좌우 화살표/스와이프 사진 넘기기" : "더블탭/휠 확대"}</span>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

