import { saveIncidentLog } from "./incidentLogService";
import { db } from "../firebase";
import { collection, addDoc } from "firebase/firestore";

// Helper to safely extract user profile from storage
export const getCurrentUserProfile = () => {
  if (typeof window === "undefined") return null;
  try {
    const sessionRaw = sessionStorage.getItem("admin_user_profile");
    if (sessionRaw) {
      const parsed = JSON.parse(sessionRaw);
      return parsed?.profile || parsed;
    }
    const localRaw = localStorage.getItem("admin_user_profile");
    if (localRaw) {
      const parsed = JSON.parse(localRaw);
      return parsed?.profile || parsed;
    }
  } catch (e) {
    console.warn("Failed to get current user profile:", e);
  }
  return null;
};

// Helper to safely get the current active tab
export const getCurrentActiveTab = () => {
  if (typeof window === "undefined") return "unknown";
  try {
    if (window.__ORYUK_ACTIVE_TAB__) return window.__ORYUK_ACTIVE_TAB__;
    const fromSession = sessionStorage.getItem("oryuk_current_active_tab");
    if (fromSession) return fromSession;
    const hash = window.location.hash.replace(/^#\/?/, "");
    if (hash) return hash;
  } catch (e) {}
  return "unknown";
};

// Helper to safely get the current selected month
export const getCurrentSelectedMonth = () => {
  if (typeof window === "undefined") return "";
  try {
    const saved = localStorage.getItem("admin_selected_month_v4");
    if (saved) return saved.replace(/["']/g, "").trim();
  } catch (e) {}
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
};

// Map error title or tab to Incident Category
export const mapToIncidentCategory = (title = "", tab = "") => {
  const text = `${title} ${tab}`.toLowerCase();
  if (text.includes("일일생산") || text.includes("worker_dashboard") || text.includes("work_log") || text.includes("작업일보")) {
    return "일일생산정보";
  }
  if (text.includes("전자결재") || text.includes("approval")) {
    return "전자결재";
  }
  if (text.includes("근태") || text.includes("overtime")) {
    return "근태관리";
  }
  if (text.includes("품질") || text.includes("quality")) {
    return "품질현황";
  }
  if (text.includes("압출") || text.includes("downtime") || text.includes("비가동")) {
    return "압출비가동";
  }
  if (text.includes("세금계산서") || text.includes("tax")) {
    return "세금계산서";
  }
  if (text.includes("매출") || text.includes("매입") || text.includes("sales")) {
    return "매출매입분석";
  }
  if (text.includes("로그인") || text.includes("auth") || text.includes("시스템")) {
    return "시스템/로그인";
  }
  return "일일생산정보";
};

/**
 * 📸 핵심 기능: 에러 발생 시 현재 화면 상태 스냅샷 (State Snapshot) 생성
 */
export const captureStateSnapshot = ({ title = "", error = null, errorInfo = null } = {}) => {
  const profile = getCurrentUserProfile();
  const activeTab = getCurrentActiveTab();
  const selectedMonth = getCurrentSelectedMonth();
  
  const isMobile = typeof navigator !== "undefined" ? /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) : false;
  const screenSize = typeof window !== "undefined" ? `${window.innerWidth}x${window.innerHeight}` : "-";
  const url = typeof window !== "undefined" ? window.location.href : "-";
  const extrusionSubtab = typeof localStorage !== "undefined" ? localStorage.getItem("factory_extrusion_active_subtab") || "-" : "-";
  
  const now = new Date();
  const kstTimeStr = now.toLocaleString("ko-KR", { timeZone: "Asia/Seoul", hour12: false });

  const snapshot = {
    user: {
      id: profile?.id || "anonymous",
      name: profile?.name || "미로그인",
      company: profile?.company || (profile?.id?.startsWith("admin") ? "오륙테크 (본사)" : "-"),
      plant: profile?.plant || "-",
      title: profile?.title || "-",
      role: profile?.role || "-",
      assignedProcess: profile?.assignedProcess || "-",
      isFieldWorker: Boolean(profile?.isFieldWorker)
    },
    view: {
      activeTab: activeTab,
      menuTitle: title || "전체 시스템",
      url: url,
      extrusionSubtab: extrusionSubtab
    },
    device: {
      isMobile: isMobile,
      screenSize: screenSize,
      deviceType: isMobile ? "모바일 (Mobile)" : "PC (Desktop)",
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : ""
    },
    appState: {
      selectedMonth: selectedMonth,
      timestamp: kstTimeStr,
      isoTimestamp: now.toISOString()
    },
    // 원클릭 파악을 위한 1줄 압축 JSON
    oneLineSummary: JSON.stringify({
      user: `${profile?.name || "미로그인"}(${profile?.id || "none"}) [${profile?.company || profile?.plant || "-"}]`,
      tab: activeTab || "worker_dashboard",
      menu: title || "전체 시스템",
      device: isMobile ? `Mobile (${screenSize})` : `PC (${screenSize})`,
      month: selectedMonth || "-",
      time: kstTimeStr
    })
  };

  return snapshot;
};

// 최근 중복 보고 방지 캐시 (60초 이내 동일 에러 재보고 차단)
const recentErrorReports = new Map();

/**
 * 🚨 에러 발생 시 시스템 오류 및 조치 관리에 자동으로 1건 등록
 */
export const autoReportRuntimeIncident = async ({ title = "", error = null, errorInfo = null }) => {
  try {
    const errorMsg = String(error?.message || error || "Unknown Error");
    const snapshot = captureStateSnapshot({ title, error, errorInfo });
    
    // 중복 체크 키: 사용자ID + 에러 메시지
    const cacheKey = `${snapshot.user.id}_${errorMsg.slice(0, 100)}`;
    const nowTs = Date.now();
    if (recentErrorReports.has(cacheKey)) {
      const lastTs = recentErrorReports.get(cacheKey);
      if (nowTs - lastTs < 60000) {
        // 60초 내 중복 에러는 자동 등록 건너뜀
        return null;
      }
    }
    recentErrorReports.set(cacheKey, nowTs);

    const category = mapToIncidentCategory(title, snapshot.view.activeTab);
    const plant = snapshot.user.plant || (snapshot.user.company ? `${snapshot.user.company}` : "전사");
    const reporter = snapshot.user.name ? `${snapshot.user.name} (${snapshot.user.id})` : "익명 사용자";

    const errorStack = String(error?.stack || "").slice(0, 1500);
    const compStack = String(errorInfo?.componentStack || "").slice(0, 1500);
    const fullSymptoms = `[오류 메시지]: ${errorMsg}\n\n[화면 상태 스냅샷]:\n${snapshot.oneLineSummary}\n\n[스택 정보]:\n${errorStack}\n\n[컴포넌트 트리]:\n${compStack}`.trim();

    const incidentPayload = {
      workDate: new Date().toISOString().slice(0, 10),
      category: category,
      severity: "P0", // 런타임 크래시는 P0 긴급 접수
      title: `[자동접수] ${title || snapshot.view.activeTab} 런타임 오류 (${errorMsg.slice(0, 50)})`,
      plant: plant,
      reporter: reporter,
      symptoms: fullSymptoms,
      rootCause: "",
      resolution: "",
      actionCommit: "",
      status: "RECEIVED",
      statusLabel: "🚨 접수됨",
      mondayChecked: false,
      resolver: "",
      stateSnapshot: snapshot,
      notes: `접속 디바이스: ${snapshot.device.deviceType} (${snapshot.device.screenSize}) | 조회월: ${snapshot.appState.selectedMonth}`
    };

    // 1. Save to local/cloud incident log service (ADMIN 오류 및 조치 관리)
    await saveIncidentLog(incidentPayload);

    // 2. Also log to Firestore system_runtime_errors collection for raw tracking
    if (db) {
      try {
        await addDoc(collection(db, "system_runtime_errors"), {
          ...incidentPayload,
          errorMsg: errorMsg,
          stateSnapshotOneLine: snapshot.oneLineSummary,
          timestamp: new Date().toISOString()
        });
      } catch (err) {
        console.warn("Firestore raw error push warning:", err);
      }
    }

    return incidentPayload;
  } catch (err) {
    console.warn("autoReportRuntimeIncident failed safely:", err);
    return null;
  }
};
