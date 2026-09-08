import React, { useState, useEffect } from "react";
import { RefreshCw, Sparkles, X } from "lucide-react";
import { doc, onSnapshot, setDoc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

// Local build version injected by Vite
const LOCAL_BUILD_TIMESTAMP = typeof __BUILD_TIMESTAMP__ !== "undefined" ? Number(__BUILD_TIMESTAMP__) : 0;
const LOCAL_APP_VERSION = typeof __APP_VERSION__ !== "undefined" ? __APP_VERSION__ : "1.0.0";

/**
 * Broadcast current app build version to Firestore system_config
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
    }
  } catch (err) {
    console.warn("Could not sync app version to Firestore:", err);
  }
};

export const VersionUpdateBanner = () => {
  const [hasUpdate, setHasUpdate] = useState(false);
  const [remoteVersion, setRemoteVersion] = useState(null);
  const [isDismissed, setIsDismissed] = useState(false);

  // Trigger cache-busting reload
  const handleReload = () => {
    try {
      if (remoteVersion) {
        sessionStorage.setItem(`update_applied_${remoteVersion}`, "true");
      }
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

  const handleDismiss = () => {
    setIsDismissed(true);
    if (remoteVersion) {
      sessionStorage.setItem(`update_dismissed_${remoteVersion}`, "true");
    }
  };

  // Dual-channel Update Detection (Firestore onSnapshot + HTTP Polling)
  useEffect(() => {
    let unsubscribe = () => {};
    try {
      const versionDocRef = doc(db, "system_config", "app_version");
      unsubscribe = onSnapshot(versionDocRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          const rVersion = data.version;
          const rTimestamp = Number(data.timestamp || 0);

          // Only trigger if remote version is strictly different from local version AND timestamp is newer
          if (
            rVersion &&
            rVersion !== LOCAL_APP_VERSION &&
            rTimestamp > LOCAL_BUILD_TIMESTAMP + 10000 &&
            !sessionStorage.getItem(`update_dismissed_${rVersion}`) &&
            !sessionStorage.getItem(`update_applied_${rVersion}`)
          ) {
            setRemoteVersion(rVersion);
            setHasUpdate(true);
          } else {
            setHasUpdate(false);
          }
        }
      }, (err) => {
        console.warn("Firestore version snapshot error:", err);
      });
    } catch (err) {
      console.warn("Firestore version subscription setup error:", err);
    }

    // Static version.json fetch check
    const checkStaticVersion = async () => {
      try {
        const res = await fetch(`./version.json?_t=${Date.now()}`, {
          cache: "no-store",
          headers: { "Pragma": "no-cache", "Cache-Control": "no-cache" }
        });
        if (res.ok) {
          const data = await res.json();
          const rVersion = data.version;
          const rTimestamp = Number(data.timestamp || 0);

          if (
            rVersion &&
            rVersion !== LOCAL_APP_VERSION &&
            rTimestamp > LOCAL_BUILD_TIMESTAMP + 10000 &&
            !sessionStorage.getItem(`update_dismissed_${rVersion}`) &&
            !sessionStorage.getItem(`update_applied_${rVersion}`)
          ) {
            setRemoteVersion(rVersion);
            setHasUpdate(true);
          }
        }
      } catch (err) {}
    };

    const initTimer = setTimeout(checkStaticVersion, 5000);
    const intervalTimer = setInterval(checkStaticVersion, 60000);

    return () => {
      unsubscribe();
      clearTimeout(initTimer);
      clearInterval(intervalTimer);
    };
  }, []);

  if (!hasUpdate || isDismissed) return null;

  return (
    <aside
      aria-label="시스템 업데이트 알림"
      className="fixed top-0 left-0 right-0 z-[9999] bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white shadow-2xl border-b-2 border-amber-400 backdrop-blur-md animate-fadeIn"
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2 flex flex-col sm:flex-row items-center justify-between gap-2">
        {/* Left: Info */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative flex-shrink-0">
            <span className="w-2.5 h-2.5 bg-amber-400 rounded-full inline-block animate-ping absolute -top-0.5 -right-0.5" />
            <div className="p-1 bg-blue-600 rounded-lg shadow-sm border border-blue-400/40">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            </div>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs sm:text-sm font-black text-white tracking-wide">
                새로운 시스템 업데이트가 배포되었습니다.
              </span>
              {remoteVersion && (
                <span className="text-[10px] font-mono bg-blue-950/80 text-blue-200 px-1.5 py-0.5 rounded border border-blue-500/40 hidden md:inline">
                  v{remoteVersion}
                </span>
              )}
            </div>
            <p className="text-[11px] text-blue-200">
              최신 화면과 기능을 적용하시려면 [지금 새로고침] 버튼을 눌러주세요.
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-shrink-0">
          {/* Immediate Reload Button */}
          <button
            type="button"
            onClick={handleReload}
            className="px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shadow-md transition-all transform hover:scale-105 active:scale-95 flex items-center gap-1.5 cursor-pointer border border-amber-300"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>지금 새로고침</span>
          </button>

          {/* Dismiss Button */}
          <button
            type="button"
            onClick={handleDismiss}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
            title="알림 닫기"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
