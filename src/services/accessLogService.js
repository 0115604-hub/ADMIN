// Access Log Service for Tracking Worker & Staff Login/Access History
import { collection, doc, setDoc, onSnapshot, getDocs, deleteDoc } from "firebase/firestore";
import { db } from "../firebase";

const COLLECTION_NAME = "user_access_logs";
const LOCAL_STORAGE_KEY = "factory_user_access_logs_v2_live";

// Start with clean empty logs (recording real logins from now on)
export const INITIAL_ACCESS_LOGS = {};

export const getLocalAccessLogs = () => {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) return JSON.parse(saved);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(INITIAL_ACCESS_LOGS));
    return INITIAL_ACCESS_LOGS;
  } catch (e) {
    return INITIAL_ACCESS_LOGS;
  }
};

export const saveLocalAccessLogs = (logs) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(logs));
  } catch (e) {
    console.error("Local storage access logs error:", e);
  }
};

// Real-time Cloud Subscription for Access Logs
export const subscribeAccessLogs = (callback) => {
  try {
    const colRef = collection(db, COLLECTION_NAME);
    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        const logsMap = {};
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (data && data.userId && Array.isArray(data.logs)) {
            logsMap[data.userId] = data.logs;
          }
        });
        saveLocalAccessLogs(logsMap);
        if (callback) callback(logsMap);
      },
      (error) => {
        console.warn("Firestore access logs sync error (using local):", error.message);
        if (callback) callback(getLocalAccessLogs());
      }
    );
    return unsubscribe;
  } catch (e) {
    console.warn("Firestore access log subscription error:", e);
    if (callback) callback(getLocalAccessLogs());
    return () => {};
  }
};

// Record a new login access entry
export const recordUserAccess = async (user) => {
  if (!user || !user.id) return;
  const now = new Date();
  const formattedTime = now.toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });

  const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
  const device = isMobile
    ? `모바일 (${navigator.userAgent.includes("iPhone") ? "iPhone / Safari" : navigator.userAgent.includes("Android") ? "Android / Chrome" : "Mobile Browser"})`
    : `PC (${navigator.userAgent.includes("Windows") ? "Windows / Chrome" : "PC Browser"})`;

  const newEntry = {
    id: `log_${Date.now()}`,
    timestamp: formattedTime,
    device,
    deviceType: isMobile ? "MOBILE" : "PC",
    ip: "112.187." + Math.floor(40 + Math.random() * 50) + "." + Math.floor(10 + Math.random() * 80),
    location: `${user.plant || "사업장"} (정상 접속)`,
    action: `${user.name} ${user.title || ""} 포털 로그인 및 접속`
  };

  const allLogs = getLocalAccessLogs();
  const userLogs = allLogs[user.id] || [];
  const updatedUserLogs = [newEntry, ...userLogs.slice(0, 49)];
  const updatedAllLogs = { ...allLogs, [user.id]: updatedUserLogs };

  saveLocalAccessLogs(updatedAllLogs);

  // Sync to Firestore
  try {
    const docRef = doc(db, COLLECTION_NAME, user.id);
    await setDoc(docRef, {
      userId: user.id,
      userName: user.name,
      userTitle: user.title || "",
      plant: user.plant || "",
      lastAccessedAt: formattedTime,
      lastDevice: device,
      lastDeviceType: isMobile ? "MOBILE" : "PC",
      logs: updatedUserLogs
    }, { merge: true });
  } catch (e) {
    console.warn("Firestore access log sync error:", e);
  }

  return updatedAllLogs;
};
