import React from "react";

/**
 * Official (주)오륙 Geometric Balanced Logo
 * Geometrically balanced 5-dot orbital corporate emblem:
 * - Perfectly balanced angles, radii, and proportions
 * - Harmonious blue gradient palette matching the official corporate identity
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
      <defs>
        {/* Harmonious Blue Gradients */}
        <linearGradient id="oryuk-dot1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#0ea5e9" />
        </linearGradient>
        <linearGradient id="oryuk-dot2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#60a5fa" />
          <stop offset="100%" stopColor="#2563eb" />
        </linearGradient>
        <linearGradient id="oryuk-dot3" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2563eb" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>
        <linearGradient id="oryuk-dot4" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1e40af" />
          <stop offset="100%" stopColor="#172554" />
        </linearGradient>
        <linearGradient id="oryuk-dot5" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1d4ed8" />
          <stop offset="100%" stopColor="#1e3a8a" />
        </linearGradient>
      </defs>

      {withBadge && (
        <circle
          cx="50"
          cy="50"
          r="48"
          fill={badgeBg}
          stroke="#e2e8f0"
          strokeWidth="1.5"
        />
      )}

      {/* 1. Top-Left: Tilted Oval (Bright Sky Blue) */}
      <ellipse
        cx="32.5"
        cy="24.5"
        rx="10.5"
        ry="13.5"
        transform="rotate(-28 32.5 24.5)"
        fill="url(#oryuk-dot1)"
      />

      {/* 2. Top-Right: Symmetrical Circle (Vibrant Blue) */}
      <circle
        cx="67.5"
        cy="24"
        r="13.5"
        fill="url(#oryuk-dot2)"
      />

      {/* 3. Right: Balanced Anchor Circle (Royal Blue) */}
      <circle
        cx="78.5"
        cy="54.5"
        r="14.5"
        fill="url(#oryuk-dot3)"
      />

      {/* 4. Bottom-Center: Prime Solid Base Circle (Deep Navy Blue) */}
      <circle
        cx="50"
        cy="77.5"
        r="16.5"
        fill="url(#oryuk-dot4)"
      />

      {/* 5. Left: Symmetrical Tilted Oval (Cobalt Navy Blue) */}
      <ellipse
        cx="21.5"
        cy="55"
        rx="11.5"
        ry="14.5"
        transform="rotate(12 21.5 55)"
        fill="url(#oryuk-dot5)"
      />
    </svg>
  );
};

export default OryukLogo;
