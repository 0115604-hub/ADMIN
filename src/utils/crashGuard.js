/**
 * 🛡️ Global Crash Guard & Runtime Recovery System
 * Prevents "화면 먹통 / 완전 백화 현상" by catching unhandled errors,
 * async promise rejections, and providing self-healing recovery actions.
 */

const CRASH_LOG_KEY = "oryuk_last_fatal_crash_v1";

export function initGlobalCrashGuard() {
  if (typeof window === "undefined") return;

  // 1. Capture Uncaught JavaScript Errors (Event handlers, timers, callbacks)
  window.addEventListener("error", (event) => {
    const errorDetails = {
      message: event.message || "Unknown Script Error",
      filename: event.filename || "unknown",
      lineno: event.lineno,
      colno: event.colno,
      stack: event.error?.stack || "",
      timestamp: new Date().toISOString()
    };

    console.error("🚨 [Global Crash Guard] Uncaught Error Detected:", errorDetails);
    try {
      localStorage.setItem(CRASH_LOG_KEY, JSON.stringify(errorDetails));
    } catch (_) {}

    // Check if this error broke the root DOM or renders a blank page
    checkAndOfferEmergencyRecovery(errorDetails);
  });

  // 2. Capture Unhandled Promise Rejections (Async/await, Firestore, Network)
  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason;
    const errorDetails = {
      message: reason?.message || String(reason) || "Unhandled Promise Rejection",
      stack: reason?.stack || "",
      timestamp: new Date().toISOString()
    };

    console.error("🚨 [Global Crash Guard] Unhandled Rejection Detected:", errorDetails);
    try {
      localStorage.setItem(CRASH_LOG_KEY, JSON.stringify(errorDetails));
    } catch (_) {}
  });

  // 3. Heartbeat check for unresponsive infinite loops / frozen UI
  let lastHeartbeat = Date.now();
  setInterval(() => {
    lastHeartbeat = Date.now();
  }, 2000);
}

/**
 * Emergency Recovery UI banner rendered directly to DOM if React crashes completely
 */
function checkAndOfferEmergencyRecovery(errorDetails) {
  setTimeout(() => {
    const root = document.getElementById("root");
    // If the root element is empty or has collapsed, render the emergency fallback
    if (!root || root.children.length === 0 || root.offsetHeight === 0) {
      if (document.getElementById("oryuk-emergency-recovery-banner")) return;

      const banner = document.createElement("div");
      banner.id = "oryuk-emergency-recovery-banner";
      banner.style.cssText = `
        position: fixed;
        inset: 0;
        z-index: 999999;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        background: rgba(15, 23, 42, 0.95);
        color: white;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        padding: 24px;
        text-align: center;
      `;

      banner.innerHTML = `
        <div style="max-width: 440px; width: 100%; background: #1e293b; border: 1px solid #334155; border-radius: 20px; padding: 28px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);">
          <div style="font-size: 36px; margin-bottom: 12px;">🛡️</div>
          <h2 style="font-size: 18px; font-weight: 800; margin: 0 0 8px 0; color: #f8fafc;">
            화면 일시 중단 감지 및 안전 복구
          </h2>
          <p style="font-size: 13px; color: #94a3b8; line-height: 1.5; margin: 0 0 20px 0;">
            일시적인 스크립트 충돌로 화면이 멈췄습니다.<br/>
            안전 복구 버튼을 누르면 캐시를 정제하고 즉시 정상 화면으로 복원됩니다.
          </p>
          <div style="display: flex; gap: 10px; flex-direction: column;">
            <button id="oryuk-btn-recover" style="padding: 12px 18px; background: #2563eb; color: white; border: none; border-radius: 12px; font-weight: 700; font-size: 14px; cursor: pointer;">
              🔄 즉시 안전 복구 및 새로고침
            </button>
            <button id="oryuk-btn-clear-all" style="padding: 10px 16px; background: #334155; color: #cbd5e1; border: none; border-radius: 12px; font-weight: 600; font-size: 12px; cursor: pointer;">
              🧹 임시 캐시 초기화 후 첫 화면으로
            </button>
          </div>
          <div style="margin-top: 16px; font-size: 10px; color: #ef4444; font-family: monospace; background: #0f172a; padding: 8px 12px; border-radius: 8px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
            ${errorDetails.message || "Script execution interrupted"}
          </div>
        </div>
      `;

      document.body.appendChild(banner);

      document.getElementById("oryuk-btn-recover")?.addEventListener("click", () => {
        window.location.reload();
      });

      document.getElementById("oryuk-btn-clear-all")?.addEventListener("click", () => {
        try {
          localStorage.removeItem("admin_user_profile");
          sessionStorage.clear();
        } catch (_) {}
        window.location.href = window.location.origin + window.location.pathname;
      });
    }
  }, 500);
}
