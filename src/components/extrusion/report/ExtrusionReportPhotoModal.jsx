import React from "react";
import { X } from "lucide-react";

/**
 * ExtrusionReportPhotoModal
 * Full-screen modal to preview enlarged photos with backdrop blur and close button.
 */
const ExtrusionReportPhotoModal = ({
  photoUrl,
  onClose,
}) => {
  if (!photoUrl) return null;

  return (
    <div
      className="fixed inset-0 z-70 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative max-w-3xl max-h-[90vh] bg-slate-900 rounded-3xl overflow-hidden shadow-2xl p-2 border border-slate-700"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-black/60 hover:bg-black/90 text-white z-10 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
        <img
          src={photoUrl}
          alt="확대 사진"
          className="w-full h-auto max-h-[82vh] object-contain rounded-2xl"
        />
      </div>
    </div>
  );
};

export default ExtrusionReportPhotoModal;
