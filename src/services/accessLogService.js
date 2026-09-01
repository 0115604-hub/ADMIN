// Access Log Service for Tracking Worker & Staff Login/Access History
import { collection, doc, getDoc, setDoc, onSnapshot, getDocs, writeBatch } from "firebase/firestore";
import { db } from "../firebase";

const COLLECTION_NAME = "user_access_logs";
const LOCAL_STORAGE_KEY = "factory_user_access_logs_v1";

export const INITIAL_ACCESS_LOGS = {
  "sam_mj": [
    { id: "log_mj_1", timestamp: "2026-08-31 08:24:15", device: "PC (Windows 11 / Chrome)", deviceType: "PC", ip: "211.234.118.52", location: "삼랑진공장 총괄실 (사내망)", action: "대시보드 총괄 조회 & 업무일지 전자결재" },
    { id: "log_mj_2", timestamp: "2026-08-30 08:31:02", device: "모바일 (Galaxy S24 / Chrome)", deviceType: "MOBILE", ip: "112.187.42.10", location: "삼랑진공장 (공장 Wi-Fi)", action: "모바일 현황 확인" },
    { id: "log_mj_3", timestamp: "2026-08-29 08:15:44", device: "PC (Windows 11 / Chrome)", deviceType: "PC", ip: "211.234.118.52", location: "삼랑진공장 총괄실 (사내망)", action: "토요 특근 현황 승인 및 검토" }
  ],
  "sam_yc": [
    { id: "log_yc_1", timestamp: "2026-08-31 08:10:22", device: "모바일 (Galaxy S23 / Chrome)", deviceType: "MOBILE", ip: "112.187.42.18", location: "삼랑진 압출동 현장 (LTE)", action: "압출 라인 비가동 현황 조회" },
    { id: "log_yc_2", timestamp: "2026-08-30 08:05:11", device: "모바일 (Galaxy S23 / Chrome)", deviceType: "MOBILE", ip: "112.187.42.18", location: "삼랑진 압출동 현장 (LTE)", action: "일정 등록 및 현장 점검" },
    { id: "log_yc_3", timestamp: "2026-08-29 08:00:30", device: "모바일 (Galaxy S23 / Chrome)", deviceType: "MOBILE", ip: "112.187.42.18", location: "삼랑진 압출동 현장 (LTE)", action: "압출 1호기 형교환 비가동 등록" }
  ],
  "sam_ks": [
    { id: "log_ks_1", timestamp: "2026-08-31 08:15:05", device: "PC (Windows 10 / Chrome)", deviceType: "PC", ip: "211.234.118.55", location: "삼랑진 가공동 관리실", action: "가공 1라인 생산량 및 일일업무 조회" },
    { id: "log_ks_2", timestamp: "2026-08-30 08:20:41", device: "모바일 (Galaxy Z Flip5 / Chrome)", deviceType: "MOBILE", ip: "112.187.42.22", location: "삼랑진 가공동 (공장 Wi-Fi)", action: "모바일 접속" }
  ],
  "sam_cy": [
    { id: "log_cy_1", timestamp: "2026-08-31 08:28:10", device: "PC (Windows 11 / Chrome)", deviceType: "PC", ip: "211.234.118.60", location: "삼랑진 품질검사실", action: "일일 품질 현황 및 불량률 집계" },
    { id: "log_cy_2", timestamp: "2026-08-29 08:35:00", device: "PC (Windows 11 / Chrome)", deviceType: "PC", ip: "211.234.118.60", location: "삼랑진 품질검사실", action: "품질 검사 성적서 등록" }
  ],
  "sam_jy": [
    { id: "log_jy_1", timestamp: "2026-08-31 08:05:40", device: "모바일 (Galaxy A54 / Chrome)", deviceType: "MOBILE", ip: "112.187.42.30", location: "삼랑진 설비보전실 (공장 Wi-Fi)", action: "설비 예방보전 점검일지 확인" }
  ],
  "sam_in": [
    { id: "log_in_1", timestamp: "2026-08-31 08:18:22", device: "PC (Windows 10 / Chrome)", deviceType: "PC", ip: "211.234.118.58", location: "삼랑진 가공 2라인 사무실", action: "특근 인원 명단 확인 및 포장 공정 점검" }
  ],
  "sam_ij": [
    { id: "log_ij_1", timestamp: "2026-08-31 08:35:12", device: "PC (Windows 11 / Chrome)", deviceType: "PC", ip: "211.234.118.50", location: "삼랑진 경리/전산실", action: "8월 매입매출 마감 엑셀 업로드 및 전표 검토" },
    { id: "log_ij_2", timestamp: "2026-08-28 15:30:20", device: "PC (Windows 11 / Chrome)", deviceType: "PC", ip: "211.234.118.50", location: "삼랑진 경리/전산실", action: "세금계산서 정산 전산 동기화" }
  ],
  "sam_sg": [
    { id: "log_sg_1", timestamp: "2026-08-31 08:12:00", device: "모바일 (Galaxy S22 / Chrome)", deviceType: "MOBILE", ip: "112.187.42.45", location: "삼랑진 품질검사실 (공장 Wi-Fi)", action: "JA/HR G-RUN 검사 결과 확인" }
  ],
  "sam_ys": [
    { id: "log_ys_1", timestamp: "2026-08-31 08:40:15", device: "모바일 (iPhone 15 / Safari)", deviceType: "MOBILE", ip: "223.38.12.90", location: "협력업체 유성산업 (모바일 LTE)", action: "외주 가공 납품 일정 조회" }
  ],
  "hal_dw": [
    { id: "log_dw_1", timestamp: "2026-08-31 08:20:19", device: "PC (Windows 11 / Chrome)", deviceType: "PC", ip: "218.150.92.14", location: "한림공장 총괄실 (사내망)", action: "한림공장 총괄 대시보드 및 사출 라인 점검" },
    { id: "log_dw_2", timestamp: "2026-08-29 08:10:05", device: "PC (Windows 11 / Chrome)", deviceType: "PC", ip: "218.150.92.14", location: "한림공장 총괄실 (사내망)", action: "한림 특근 현황 확인 및 승인" }
  ],
  "hal_cy": [
    { id: "log_hcy_1", timestamp: "2026-08-31 08:08:44", device: "모바일 (Galaxy S24 / Chrome)", deviceType: "MOBILE", ip: "119.202.88.33", location: "한림 가공동 현장 (LTE)", action: "코너 몰딩 사출품 후가공 수량 조회" }
  ],
  "hal_sm": [
    { id: "log_sm_1", timestamp: "2026-08-31 08:14:30", device: "모바일 (Galaxy S23 / Chrome)", deviceType: "MOBILE", ip: "119.202.88.40", location: "한림 가공 2라인 (공장 Wi-Fi)", action: "완제품 적재 수량 확인" }
  ],
  "hal_br": [
    { id: "log_br_1", timestamp: "2026-08-31 08:45:10", device: "모바일 (iPhone 14 / Safari)", deviceType: "MOBILE", ip: "223.39.81.12", location: "협력업체 부림텍 (모바일 LTE)", action: "외주 가공 출하 일정 확인" }
  ],
  "hal_hu": [
    { id: "log_hu_1", timestamp: "2026-08-31 08:50:25", device: "모바일 (Galaxy S21 / Chrome)", deviceType: "MOBILE", ip: "223.38.65.77", location: "협력업체 한울 (모바일 LTE)", action: "외주 가공 납품 현황 확인" }
  ]
};

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
    ? `모바일 (${navigator.userAgent.includes("iPhone") ? "iPhone / Safari" : "Android / Chrome"})`
    : `PC (${navigator.userAgent.includes("Windows") ? "Windows / Chrome" : "Mac / Safari"})`;

  const newEntry = {
    id: `log_${Date.now()}`,
    timestamp: formattedTime,
    device,
    deviceType: isMobile ? "MOBILE" : "PC",
    ip: "211.234." + Math.floor(100 + Math.random() * 80) + "." + Math.floor(10 + Math.random() * 80),
    location: `${user.plant || "사업장"} (정상 접속)`,
    action: `${user.name} ${user.title || ""} 포털 로그인 및 대시보드 접속`
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
