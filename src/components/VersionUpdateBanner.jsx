import React, { useState, useEffect, useRef } from "react";
import { RefreshCw, Sparkles, Pause, Play } from "lucide-react";
import { doc, onSnapshot, setDoc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

// Local build version injected by Vite
const LOCAL_BUILD_TIMESTAMP = typeof __BUILD_TIMESTAMP__ !== "undefined" ? Number(__BUILD_TIMESTAMP__) : 0;
const LOCAL_APP_VERSION = typeof __APP_VERSION__ !== "undefined" ? __APP_VERSION__ : "1.0.0";

/**
 * Broadcast current app build version to Firestore system_config
 * (Executed seamlessly by admins/operators upon loading)
 */
export const syncAppVersionToFirestore = async (userProfile = null) => {
  try {
    if (!db || !LOCAL_BUILD_TIMESTAMP) return;
    const versionDocRef = doc(db, "system_config", "app_version");
    const snap = await getDoc(versionDocRef);
    
    const remoteTimestamp = snap.exists() ? (snap.data().timestamp || 0) : 0;
    
    // Only update if current bundle is newer than what's stored in Firestore
    if (LOCAL_BUILD_TIMESTAMP > remoteTimestamp) {
      await setDoc(versionDocRef, {
        version: LOCAL_APP_VERSION,
        timestamp: LOCAL_BUILD_TIMESTAMP,
        updatedAt: new Date().toISOString(),
        updatedBy: userProfile?.name || userProfile?.email || "System Deployer",
        notice: "시스템 최신 빌드가 배포되었습니다."
      }, { merge: true });
      console.log("🚀 [Auto-Update] Synced latest build version to Firestore:", LOCAL_APP_VERSION);
    }
  } catch (err) {
    console.warn("Could not sync app version to Firestore:", err);
  }
};

export const VersionUpdateBanner = () => {
  const [hasUpdate, setHasUpdate] = useState(false);
  const [remoteVersion, setRemoteVersion] = useState(null);
  const [countdown, setCountdown] = useState(3);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef(null);

  // Trigger cache-busting reload
  const handleReload = () => {
    try {
      if ("caches" in window) {
        caches.keys().then((names) => {
          names.forEach((name) => caches.delete(name));
        });
      }
    } catch (e) {
      console.error(e);
    }
    const url = new URL(window.location.href);
    url.searchParams.set("_v", Date.now().toString());
    window.location.href = url.toString();
  };

  // 1. Dual-channel Update Detection (Firestore onSnapshot + HTTP Polling)
  useEffect(() => {
    // Channel A: Firestore Real-time Listener
    let unsubscribe = () => {};
    try {
      const versionDocRef = doc(db, "system_config", "app_version");
      unsubscribe = onSnapshot(versionDocRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          const remoteTs = Number(data.timestamp || 0);
          if (LOCAL_BUILD_TIMESTAMP > 0 && remoteTs > LOCAL_BUILD_TIMESTAMP + 2000) {
            setRemoteVersion(data.version || "최신버전");
            setHasUpdate(true);
          }
        }
      }, (err) => {
        console.warn("Firestore version snapshot error:", err);
      });
    } catch (err) {
      console.warn("Firestore version subscription setup error:", err);
    }

    // Channel B: Static version.json fetch check
    const checkStaticVersion = async () => {
      try {
        const res = await fetch(`./version.json?_t=${Date.now()}`, {
          cache: "no-store",
          headers: { "Pragma": "no-cache", "Cache-Control": "no-cache" }
        });
        if (res.ok) {
          const data = await res.json();
          const remoteTs = Number(data.timestamp || 0);
          if (LOCAL_BUILD_TIMESTAMP > 0 && remoteTs > LOCAL_BUILD_TIMESTAMP + 2000) {
            setRemoteVersion(data.version || "최신버전");
            setHasUpdate(true);
          }
        }
      } catch (err) {}
    };

    const initTimer = setTimeout(checkStaticVersion, 3000);
    const intervalTimer = setInterval(checkStaticVersion, 30000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkStaticVersion();
      }
    };
    window.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", checkStaticVersion);

    return () => {
      unsubscribe();
      clearTimeout(initTimer);
      clearInterval(intervalTimer);
      window.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", checkStaticVersion);
    };
  }, []);

  // 2. 3-Second Countdown Handler
  useEffect(() => {
    if (!hasUpdate) return;

    if (isPaused) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleReload();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [hasUpdate, isPaused]);

  if (!hasUpdate) return null;

  return (
    <aside
      aria-label="시스템 업데이트 알림"
      className="fixed top-0 left-0 right-0 z-[9999] bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white shadow-2xl border-b-2 border-amber-400 backdrop-blur-md animate-fadeIn"
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex flex-col sm:flex-row items-center justify-between gap-2.5">
        {/* Left: Info */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative flex-shrink-0">
              <span className="w-3 h-3 bg-amber-400 rounded-full inline-block animate-ping absolute -top-0.5 -right-0.5" />
              <div className="p-1.5 bg-blue-600 rounded-lg shadow-sm border border-blue-400/40">
                <Sparkles className="w-4 h-4 text-amber-300 animate-spin" style={{ animationDuration: '4s' }} />
              </div>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs sm:text-sm font-black text-white tracking-wide">
                  새로운 시스템 업데이트가 배포되었습니다!
                </span>
                {remoteVersion && (
                  <span className="text-[10px] font-mono bg-blue-950/80 text-blue-200 px-1.5 py-0.5 rounded border border-blue-500/40 hidden md:inline">
                    v{remoteVersion}
                  </span>
                )}
              </div>
              <p className="text-[11px] sm:text-xs text-blue-200 mt-0.5">
                {isPaused ? (
                  <span className="text-amber-300 font-bold flex items-center gap-1">
                    <Pause className="w-3 h-3 inline" /> 자동 갱신 일시정지됨 (작업 완료 후 [지금 적용]을 눌러주세요)
                  </span>
                ) : (
                  <span>
                    <strong className="text-amber-300 font-extrabold text-sm mx-1">{countdown}초</strong> 후 최신 화면으로 자동 갱신됩니다.
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-shrink-0">
          {/* Pause / Resume Button */}
          <button
            type="button"
            onClick={() => setIsPaused(!isPaused)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 border cursor-pointer ${
              isPaused
                ? "bg-amber-500/20 text-amber-300 border-amber-400/50 hover:bg-amber-500/30"
                : "bg-white/10 text-slate-200 border-white/20 hover:bg-white/20"
            }`}
            title={isPaused ? "자동 갱신 다시 시작" : "작업 중일 때 새로고침 일시정지"}
          >
            {isPaused ? (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>재개</span>
              </>
            ) : (
              <>
                <Pause className="w-3.5 h-3.5" />
                <span>작업 중 (일시정지)</span>
              </>
            )}
          </button>

          {/* Immediate Reload Button */}
          <button
            type="button"
            onClick={handleReload}
            className="px-3.5 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shadow-lg shadow-amber-400/20 transition-all transform hover:scale-105 active:scale-95 flex items-center gap-1.5 cursor-pointer border border-amber-300"
          >
            <RefreshCw className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '3s' }} />
            <span>지금 적용 {isPaused ? "" : `(${countdown}s)`}</span>
          </button>
        </div>
      </div>

      {/* Progress countdown bar */}
      {!isPaused && (
        <div className="w-full bg-blue-950 h-1 overflow-hidden">
          <div
            className="bg-gradient-to-r from-amber-400 to-amber-300 h-full transition-all duration-1000 ease-linear"
            style={{ width: `${(countdown / 3) * 100}%` }}
          />
        </div>
      )}
    </aside>
  );
};
