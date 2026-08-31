// Shared Work Log Service with Cloud Firestore Real-time Multi-Device Synchronization
import {
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  writeBatch
} from "firebase/firestore";
import { db } from "../firebase";

export const INITIAL_WORK_LOGS = [
  {
    id: "1",
    date: "2026-08-28",
    plant: "삼랑진공장",
    writer: "이명재",
    title: "이사",
    process: "총괄관리",
    shift: "주간",
    line: "공장 총괄 관리",
    workContent: "삼랑진공장 9BQC 및 DT 라인 총괄 점검, 8월 출하 일정 및 생산 수율(99.2%) 점검 완료",
    issues: "압출 2호기 정기 보수 점검 일정 협의 완료",
    status: "완료",
    createdAt: "2026-08-28 08:30"
  },
  {
    id: "2",
    date: "2026-08-28",
    plant: "삼랑진공장",
    writer: "설유철",
    title: "책임",
    process: "압출동 관리",
    shift: "주간",
    line: "압출 1~2호기",
    workContent: "압출동 EPDM/TPE 원료 공급 압력 점검 및 압출 1호기 금형 예열 점검 (생산량 4,200M 달성)",
    issues: "압출 냉각 수온 정상 유지, 온도 편차 없음",
    status: "완료",
    createdAt: "2026-08-28 09:10"
  },
  {
    id: "3",
    date: "2026-08-28",
    plant: "삼랑진공장",
    writer: "윤경수",
    title: "책임",
    process: "가공동 관리",
    shift: "주간",
    line: "가공 1라인",
    workContent: "가공동 9BQC 웨더스트립 절단 및 피팅 가공 라인 생산량 점검 (2,400개 가공 완료)",
    issues: "2호 절단기 칼날 마모 점검 후 교체 완료",
    status: "완료",
    createdAt: "2026-08-28 09:20"
  },
  {
    id: "4",
    date: "2026-08-28",
    plant: "삼랑진공장",
    writer: "이창엽",
    title: "책임",
    process: "품질관리",
    shift: "주간",
    line: "품질 검사실",
    workContent: "9BQC 전용 부품 품질 전수 검사 및 치수 측정 완료 (불량률 0.08% 양호)",
    issues: "특이사항 없음 (고객사 검사 기준 적합)",
    status: "완료",
    createdAt: "2026-08-28 08:45"
  },
  {
    id: "5",
    date: "2026-08-28",
    plant: "삼랑진공장",
    writer: "양인나",
    title: "선임",
    process: "가공동 관리",
    shift: "주간",
    line: "가공 2라인 (포장/조립)",
    workContent: "가공동 조립 및 포장 라인 공정 점검, DT 수출품 포장 1,800개 검사 완료",
    issues: "원자재/부자재 라벨 부착 상태 전수 양호",
    status: "완료",
    createdAt: "2026-08-28 08:40"
  },
  {
    id: "6",
    date: "2026-08-28",
    plant: "삼랑진공장",
    writer: "조인주",
    title: "선임",
    process: "경리업무",
    shift: "주간",
    line: "경리 / 전산실",
    workContent: "8월 매입매출 전표 마감 및 홈택스 매입전자세금계산서 전산 분류 정리 완료",
    issues: "특이사항 없음 (정상 마감)",
    status: "완료",
    createdAt: "2026-08-28 08:35"
  },
  {
    id: "7",
    date: "2026-08-28",
    plant: "한림공장",
    writer: "김동욱",
    title: "책임",
    process: "총괄관리",
    shift: "주간",
    line: "한림공장 총괄",
    workContent: "한림공장 EPDM 사출 및 가공동 공정 총괄 점검 (3,200개 출하 검사 완료)",
    issues: "금형 온도 145도 정상 유지, 품질 이상 없음",
    status: "완료",
    createdAt: "2026-08-28 08:50"
  },
  {
    id: "8",
    date: "2026-08-28",
    plant: "한림공장",
    writer: "우창용",
    title: "선임",
    process: "가공동 관리",
    shift: "주간",
    line: "가공 1라인",
    workContent: "가공동 코너 몰딩 사출품 후가공 및 다듬질 작업 완료 (목표 1,500개 달성)",
    issues: "사출 버(Burr) 제거 지그 교체 완료",
    status: "완료",
    createdAt: "2026-08-28 08:55"
  },
  {
    id: "9",
    date: "2026-08-28",
    plant: "한림공장",
    writer: "오상민",
    title: "선임",
    process: "가공동 관리",
    shift: "주간",
    line: "가공 2라인",
    workContent: "가공동 완제품 조립 및 박스 포장 라인 가동 (1,200BOX 적재 완료)",
    issues: "지게차 일일 안전점검 완료",
    status: "완료",
    createdAt: "2026-08-28 09:05"
  },
  {
    id: "10",
    date: "2026-08-29",
    plant: "삼랑진공장",
    writer: "이상기",
    title: "사원",
    process: "품질관리",
    shift: "주간",
    line: "품질 검사실",
    workContent: "JA/HR G-RUN 외관 불량 및 수포 검사 진행, 치수 균일도 전수 검사 완료",
    issues: "특이사항 없음",
    status: "완료",
    createdAt: "2026-08-29 09:00"
  }
];

const COLLECTION_NAME = "work_logs";
const LOCAL_STORAGE_KEY = "factory_daily_work_logs_v4_firestore";

// Get local cache
export const getLocalWorkLogs = () => {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!saved) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(INITIAL_WORK_LOGS));
      return INITIAL_WORK_LOGS;
    }
    return JSON.parse(saved);
  } catch (e) {
    return INITIAL_WORK_LOGS;
  }
};

const saveLocalWorkLogs = (logs) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(logs));
  } catch (e) {
    console.error("Local storage error:", e);
  }
};

// Initial sync / Seed Firestore if empty
let isSeeded = false;
export const seedInitialLogsIfNeeded = async () => {
  if (isSeeded) return;
  try {
    const snap = await getDocs(collection(db, COLLECTION_NAME));
    if (snap.empty) {
      console.log("Seeding initial work logs to Firestore cloud database...");
      const batch = writeBatch(db);
      INITIAL_WORK_LOGS.forEach((log) => {
        const docRef = doc(db, COLLECTION_NAME, String(log.id));
        batch.set(docRef, { ...log, updatedAt: new Date().toISOString() });
      });
      await batch.commit();
      console.log("Initial work logs successfully seeded to Firestore!");
    }
    isSeeded = true;
  } catch (e) {
    console.warn("Firestore seed check warning (working offline):", e.message);
  }
};

// Subscribe to real-time work logs from Firestore
export const subscribeWorkLogs = (onUpdate) => {
  // Give immediate local cache
  const localLogs = getLocalWorkLogs();
  onUpdate(localLogs);

  try {
    seedInitialLogsIfNeeded();

    const q = query(collection(db, COLLECTION_NAME));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const remoteLogs = [];
          snapshot.forEach((docSnap) => {
            remoteLogs.push({ id: docSnap.id, ...docSnap.data() });
          });

          // Sort by id / createdAt descending
          remoteLogs.sort((a, b) => {
            const dateA = a.date || "";
            const dateB = b.date || "";
            if (dateA !== dateB) return dateB.localeCompare(dateA);
            return String(b.id || "").localeCompare(String(a.id || ""));
          });

          saveLocalWorkLogs(remoteLogs);
          onUpdate(remoteLogs);
        } else {
          // If empty in remote, seed and return local
          seedInitialLogsIfNeeded();
          onUpdate(localLogs);
        }
      },
      (error) => {
        console.warn("Real-time Firestore listener error, using local data:", error.message);
        onUpdate(getLocalWorkLogs());
      }
    );

    return unsubscribe;
  } catch (e) {
    console.warn("Subscribe error:", e);
    return () => {};
  }
};

// Synchronous getter (returns local cache for initial state)
export const getWorkLogs = () => {
  return getLocalWorkLogs();
};

// Save a work log (Cloud Firestore + Local Cache)
export const saveWorkLog = async (newLog) => {
  const logId = String(newLog.id || Date.now());
  const logData = {
    ...newLog,
    id: logId,
    updatedAt: new Date().toISOString(),
    createdAt: newLog.createdAt || new Date().toLocaleString("ko-KR", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    })
  };

  // 1. Update local cache immediately
  const current = getLocalWorkLogs();
  const updatedLocal = [logData, ...current.filter((l) => String(l.id) !== logId)];
  saveLocalWorkLogs(updatedLocal);

  // 2. Sync to Firestore cloud
  try {
    await setDoc(doc(db, COLLECTION_NAME, logId), logData);
    console.log("Work log successfully synced to Firestore cloud:", logId);
  } catch (e) {
    console.error("Firestore cloud sync error:", e);
  }

  return updatedLocal;
};

// Delete a work log (Cloud Firestore + Local Cache)
export const deleteWorkLog = async (id) => {
  const logId = String(id);

  // 1. Update local cache immediately
  const current = getLocalWorkLogs();
  const filteredLocal = current.filter((l) => String(l.id) !== logId);
  saveLocalWorkLogs(filteredLocal);

  // 2. Delete from Firestore cloud
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, logId));
    console.log("Work log deleted from Firestore cloud:", logId);
  } catch (e) {
    console.error("Firestore cloud delete error:", e);
  }

  return filteredLocal;
};
