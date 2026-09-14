import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Download, X, ZoomIn, ZoomOut, RotateCw, LocateFixed, Move } from "lucide-react";

export const ImagePreviewModal = ({ previewImage, onClose }) => {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const viewportRef = useRef(null);

  // Reset zoom & pan when image changes
  useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setRotation(0);
  }, [previewImage]);

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

  if (!previewImage || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-3 sm:p-6 animate-fadeIn cursor-pointer select-none"
      onClick={onClose}
    >
      <div
        className="relative max-w-5xl max-h-[92vh] w-full h-[85vh] flex flex-col items-center bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-800 cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="w-full flex items-center justify-between p-3 px-5 bg-slate-950/90 border-b border-slate-800 text-white text-xs shrink-0 z-10">
          <span className="font-bold truncate max-w-[200px] sm:max-w-md text-emerald-400">
            {previewImage.name || "첨부 사진 확인"}
          </span>

          <div className="flex items-center gap-1.5">
            {/* Zoom Controls */}
            <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700">
              <button
                type="button"
                onClick={() => setZoom((prev) => Math.max(Number((prev - 0.25).toFixed(2)), 0.35))}
                className="p-1 rounded text-slate-300 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
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
                className="px-1.5 text-[10px] font-mono font-black text-emerald-400 hover:text-emerald-300 cursor-pointer"
                title="100% 리셋"
              >
                {Math.round(zoom * 100)}%
              </button>
              <button
                type="button"
                onClick={() => setZoom((prev) => Math.min(Number((prev + 0.25).toFixed(2)), 6.0))}
                className="p-1 rounded text-slate-300 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
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
              href={previewImage.url}
              download={previewImage.name || "사진_다운로드.jpg"}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-emerald-700 text-slate-200 hover:text-white transition-colors flex items-center gap-1 text-[11px] border border-slate-700"
              title="사진 다운로드"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">다운로드</span>
            </a>

            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-600 text-slate-200 hover:text-white transition-colors cursor-pointer ml-1"
              title="닫기"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Image display canvas with 2D Drag Pan */}
        <div
          ref={viewportRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onDoubleClick={handleDoubleClick}
          className={`flex-1 w-full relative overflow-hidden bg-slate-950 flex items-center justify-center p-3 select-none touch-none ${
            isDragging ? "cursor-grabbing" : "cursor-grab"
          }`}
        >
          <div
            className="flex items-center justify-center shadow-2xl rounded-xl overflow-hidden bg-black/40"
            style={{
              transform: `translate3d(${pan.x}px, ${pan.y}px, 0px) scale(${zoom}) rotate(${rotation}deg)`,
              transformOrigin: "center center",
              transition: isDragging ? "none" : "transform 90ms cubic-bezier(0.2, 0, 0, 1)",
              maxWidth: "92%",
              maxHeight: "92%",
              willChange: "transform"
            }}
          >
            <img
              src={previewImage.url}
              alt={previewImage.name || "미리보기"}
              className="block max-h-[72vh] max-w-full object-contain rounded-xl shadow-lg pointer-events-none select-none"
              draggable={false}
            />
          </div>

          {/* Guide Helper */}
          <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-md bg-slate-900/85 backdrop-blur-xs border border-slate-700/80 text-[11px] text-slate-300 pointer-events-none flex items-center gap-2 shadow-lg">
            <span className="flex items-center gap-1 text-slate-300">
              <Move className="w-3 h-3 text-emerald-400" />
              <span>화면 클릭 후 드래그로 상하좌우 이동</span>
            </span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-400">마우스 휠 확대/축소</span>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

