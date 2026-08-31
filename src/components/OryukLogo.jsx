import React from "react";

/**
 * Official (주)오륙 Company Vector Logo
 * Exact geometric match from official badge photograph:
 * - 5 dynamic orbiting dots with distinct blue gradations
 */
export const OryukLogo = ({
  className = "w-8 h-8",
  withBadge = false,
  badgeBg = "#ffffff"
}) => {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {withBadge && (
        <circle cx="50" cy="50" r="49" fill={badgeBg} stroke="#e2e8f0" strokeWidth="1.5" />
      )}
      {/* 1. Top-Left: Tilted Oval (Bright Cyan/Sky Blue) */}
      <ellipse
        cx="32"
        cy="24"
        rx="10.5"
        ry="13.5"
        transform="rotate(-30 32 24)"
        fill="#38bdf8"
      />
      {/* 2. Top-Right: Circle (Vibrant Blue) */}
      <circle cx="68" cy="23" r="14" fill="#3b82f6" />
      {/* 3. Right: Circle (Royal Blue) */}
      <circle cx="80" cy="55" r="15" fill="#1d4ed8" />
      {/* 4. Bottom-Center: Large Circle (Deep Navy Blue) */}
      <circle cx="50" cy="78" r="16.5" fill="#1e3a8a" />
      {/* 5. Left: Tilted Oval (Deep Cobalt/Navy) */}
      <ellipse
        cx="20"
        cy="57"
        rx="12"
        ry="15"
        transform="rotate(10 20 57)"
        fill="#1e40af"
      />
    </svg>
  );
};

export default OryukLogo;
