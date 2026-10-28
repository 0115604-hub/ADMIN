import React from "react";
import oryukLogoImg from "../assets/oryuk_logo.png";

/**
 * Official (주)오륙 Corporate Emblem Logo
 * Updated to official corporate emblem image.
 */
export const OryukLogo = ({
  className = "w-8 h-8",
  alt = "(주)오륙 로고"
}) => {
  return (
    <img
      src={oryukLogoImg}
      alt={alt}
      className={`rounded-full object-cover select-none shrink-0 inline-block ${className}`}
      loading="eager"
      decoding="async"
    />
  );
};

export default OryukLogo;
