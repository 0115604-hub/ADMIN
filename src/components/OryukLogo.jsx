import React from "react";

/**
 * Official (주)오륙 Company Vector Logo
 * Features the signature 5-dot orbital corporate mark in official blue.
 */
export const OryukLogo = ({ className = "w-8 h-8", dotColor = "#2563eb", showText = false, textColor = "text-slate-900 dark:text-white" }) => {
  return (
    <div className="inline-flex items-center gap-2.5">
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
      >
        {/* Top-Center Dot */}
        <circle cx="58" cy="22" r="10.5" fill="#2563eb" />
        {/* Top-Right Dot */}
        <circle cx="82" cy="46" r="11" fill="#1d4ed8" />
        {/* Bottom-Center / Right Dot */}
        <circle cx="55" cy="78" r="13" fill="#1e40af" />
        {/* Left-Center Dot */}
        <circle cx="21" cy="56" r="10" fill="#3b82f6" />
        {/* Top-Left Dot */}
        <circle cx="34" cy="28" r="8" fill="#60a5fa" />
      </svg>
      {showText && (
        <span className={`font-black tracking-tight text-base sm:text-lg ${textColor}`}>
          (주)오륙
        </span>
      )}
    </div>
  );
};

export default OryukLogo;
