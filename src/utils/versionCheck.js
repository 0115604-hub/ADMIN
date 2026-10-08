/**
 * Version & Cache Sync Engine
 * Ensures users instantly run the latest code-split bundles and invalidates stale browser caches.
 */

let isChecking = false;

export async function checkAppVersion(onUpdateAvailable) {
  if (isChecking) return;
  isChecking = true;

  try {
    const res = await fetch(`./version.json?_t=${Date.now()}`, {
      cache: "no-store",
      headers: { "Pragma": "no-cache", "Cache-Control": "no-cache" }
    });
    if (!res.ok) return;

    const data = await res.json();
    const serverTimestamp = Number(data.timestamp || 0);
    const clientTimestamp = typeof __BUILD_TIMESTAMP__ !== "undefined" ? Number(__BUILD_TIMESTAMP__) : 0;

    if (serverTimestamp > 0 && clientTimestamp > 0 && serverTimestamp > clientTimestamp) {
      console.log(`[VersionSync] New update detected! Server: ${serverTimestamp}, Client: ${clientTimestamp}`);
      
      // Clear cache storage if supported
      if ("caches" in window) {
        try {
          const keys = await caches.keys();
          await Promise.all(keys.map((k) => caches.delete(k)));
        } catch (e) {}
      }

      if (onUpdateAvailable) {
        onUpdateAvailable(data);
      }
    }
  } catch (err) {
    // Network offline or error - silently ignore
  } finally {
    isChecking = false;
  }
}

export function initVersionWatcher(onUpdateAvailable) {
  // Check on initial startup
  setTimeout(() => checkAppVersion(onUpdateAvailable), 1500);

  // Check when user returns to app / tab
  const handleVisibility = () => {
    if (document.visibilityState === "visible") {
      checkAppVersion(onUpdateAvailable);
    }
  };
  document.addEventListener("visibilitychange", handleVisibility);

  // Check periodically every 5 minutes
  const interval = setInterval(() => checkAppVersion(onUpdateAvailable), 5 * 60 * 1000);

  return () => {
    document.removeEventListener("visibilitychange", handleVisibility);
    clearInterval(interval);
  };
}

export function forceHardReload() {
  if ("caches" in window) {
    caches.keys().then((keys) => {
      Promise.all(keys.map((k) => caches.delete(k))).finally(() => {
        window.location.reload(true);
      });
    });
  } else {
    window.location.reload(true);
  }
}
