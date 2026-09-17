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
import { sendWorkLogApprovedTelegram } from "./telegramService";

// Standard Approved Seed Work Logs for Hanlim and Samrangjin plants
export const INITIAL_WORK_LOGS = [
  // =========================================================================
  // 1. 한림공장 (총괄관리자: 김동욱 책임 - 전건 결재완료 승인 상태)
  // =========================================================================
  {
    id: "seed_hal_cy_0917",
    date: "2026-09-17",
    plant: "한림공장",
    writer: "우창용",
    title: "선임",
    process: "압출",
    line: "PCM #3 LINE",
    shift: "주간",
    workContent: "한림공장 PCM #3 LINE 가동 및 생산 진행\n- 자동차 웨더스트립 프로파일 압출 생산 및 치수 측정 정상\n- 금형 온도 및 압출 속도 조건 표준 준수 작업\n- 배합 원료 투입 및 수분율 사전 점검 완료",
    issues: "특이사항 없음 (품질 규격 정상)",
    images: [],
    maintenanceItems: [
      { category: "라인점검", equipment: "PCM #3 LINE", content: "다이스 온도 컨트롤러 및 인출기 롤러 점검 완료" }
    ],
    approvalStatus: "결재완료",
    approverName: "김동욱",
    approverTitle: "책임",
    approverPlant: "한림공장",
    approvedAt: "2026-09-17 17:30",
    approvalComment: "한림공장 일일 압출 실적 및 품질 규격 확인 완료. 설비 가동 상태 양호합니다.",
    createdAt: "09.17 08:30",
    updatedAt: "2026-09-17T08:30:00.000Z"
  },
  {
    id: "seed_hal_sm_0917",
    date: "2026-09-17",
    plant: "한림공장",
    writer: "오상민",
    title: "선임",
    process: "압출",
    line: "PVC/TPE LINE",
    shift: "주간",
    workContent: "한림공장 PVC & TPE 라인 생산 진행\n- TPE 가스켓 압출 및 냉각조 수온 제어 점검\n- PVC 연질 프로파일 권취 작업 및 포장\n- 교대 전 라인 청소 및 스크랩 회수 분리 완료",
    issues: "특이사항 없음",
    images: [],
    maintenanceItems: [],
    approvalStatus: "결재완료",
    approverName: "김동욱",
    approverTitle: "책임",
    approverPlant: "한림공장",
    approvedAt: "2026-09-17 17:35",
    approvalComment: "작업 표준 준수 확인 및 전자결재 승인 완료.",
    createdAt: "09.17 08:30",
    updatedAt: "2026-09-17T08:35:00.000Z"
  },
  {
    id: "seed_hal_cy_0916",
    date: "2026-09-16",
    plant: "한림공장",
    writer: "우창용",
    title: "선임",
    process: "압출",
    line: "PCM #3 LINE",
    shift: "주간",
    workContent: "한림공장 PCM #3 라인 프로파일 압출 성형\n- 신규 컴파운드 원료 압출성 테스트 및 외관 검사 양호\n- 스크류 회전수 및 배럴 온도 185℃ 안정화 유지",
    issues: "특이사항 없음",
    images: [],
    maintenanceItems: [],
    approvalStatus: "결재완료",
    approverName: "김동욱",
    approverTitle: "책임",
    approverPlant: "한림공장",
    approvedAt: "2026-09-16 17:30",
    approvalComment: "원료 테스트 결과 확인 및 승인 완료.",
    createdAt: "09.16 08:30",
    updatedAt: "2026-09-16T08:30:00.000Z"
  },
  {
    id: "seed_hal_sm_0916",
    date: "2026-09-16",
    plant: "한림공장",
    writer: "오상민",
    title: "선임",
    process: "압출",
    line: "PVC/TPE LINE",
    shift: "주간",
    workContent: "PVC 연질 프로파일 생산 및 컷팅 치수 정밀 검사\n- 완제품 규격 검사 및 팔레트 적재 출하 준비",
    issues: "특이사항 없음",
    images: [],
    maintenanceItems: [],
    approvalStatus: "결재완료",
    approverName: "김동욱",
    approverTitle: "책임",
    approverPlant: "한림공장",
    approvedAt: "2026-09-16 17:35",
    approvalComment: "확인 완료.",
    createdAt: "09.16 08:30",
    updatedAt: "2026-09-16T08:35:00.000Z"
  },

  // =========================================================================
  // 2. 삼랑진공장 (총괄관리자: 이명재 이사 - 전건 결재완료 승인 상태)
  // =========================================================================
  {
    id: "seed_sam_yc_0917",
    date: "2026-09-17",
    plant: "삼랑진공장",
    writer: "설유철",
    title: "선임",
    process: "압출",
    line: "PCM #1 LINE",
    shift: "주간",
    workContent: "PCM 1호기 압출 라인 정상 가동\n- 차량용 웨더스트립 프로파일 연속 압출 및 인출 속도 동기화\n- 냉각 수조 수온 18℃ 유지 및 표면 광택 검사 양호",
    issues: "특이사항 없음",
    images: [],
    maintenanceItems: [
      { category: "설비점검", equipment: "PCM #1 LINE", content: "인출기 벨트 장력 및 수조 배수 밸브 점검" }
    ],
    approvalStatus: "결재완료",
    approverName: "이명재",
    approverTitle: "이사",
    approverPlant: "삼랑진공장",
    approvedAt: "2026-09-17 17:30",
    approvalComment: "PCM 1호 라인 압출 생산 및 품질 치수 확인 완료 (승인)",
    createdAt: "09.17 08:30",
    updatedAt: "2026-09-17T08:30:00.000Z"
  },
  {
    id: "seed_sam_ks_0917",
    date: "2026-09-17",
    plant: "삼랑진공장",
    writer: "윤경수",
    title: "책임",
    process: "가공",
    line: "가공 1라인",
    shift: "주간",
    workContent: "가공 1라인 펀칭 및 코너 조인트 융착 가동\n- 1차/2차 열풍 가류로 온도 210℃ 도달 및 안정 유지\n- 주간 목표 생산량 1,200 EA 달성",
    issues: "특이사항 없음",
    images: [],
    maintenanceItems: [],
    approvalStatus: "결재완료",
    approverName: "이명재",
    approverTitle: "이사",
    approverPlant: "삼랑진공장",
    approvedAt: "2026-09-17 17:30",
    approvalComment: "가공 1라인 생산 실적 확인 및 전자결재 승인 완료",
    createdAt: "09.17 08:30",
    updatedAt: "2026-09-17T08:30:00.000Z"
  },
  {
    id: "seed_sam_cy_0917",
    date: "2026-09-17",
    plant: "삼랑진공장",
    writer: "이창엽",
    title: "책임",
    process: "품질관리",
    line: "전라인 품질검사",
    shift: "주간",
    workContent: "압출/가공 전라인 초/중/종물 치수 정밀 측정 및 외관 검사\n- 인장강도 및 열노화 시험 시편 채취 및 신뢰성 평가 진행\n- 부적합품 발생 0건 (품질 합격률 100%)",
    issues: "특이사항 없음 (품질 양호)",
    images: [],
    maintenanceItems: [],
    approvalStatus: "결재완료",
    approverName: "이명재",
    approverTitle: "이사",
    approverPlant: "삼랑진공장",
    approvedAt: "2026-09-17 17:30",
    approvalComment: "전라인 품질 검사 데이터 및 수치 측정값 이상 없음 확인 (승인)",
    createdAt: "09.17 08:30",
    updatedAt: "2026-09-17T08:30:00.000Z"
  },
  {
    id: "seed_sam_jy_0917",
    date: "2026-09-17",
    plant: "삼랑진공장",
    writer: "전재율",
    title: "책임",
    process: "공무/설비보전",
    line: "전설비 유지보수",
    shift: "주간",
    workContent: "삼랑진공장 주요 설비 일상 점검 및 보전 활동\n- 압출 1호기 유압 펌프 압력 게이지 교체 및 오일 누유 점검\n- 가공 라인 에어 컴프레셔 드레인 배출 및 필터 청소",
    issues: "특이사항 없음",
    images: [],
    maintenanceItems: [
      { category: "공무설비", equipment: "압출 1호기", content: "유압 펌프 게이지 교체 및 배관 점검" }
    ],
    approvalStatus: "결재완료",
    approverName: "이명재",
    approverTitle: "이사",
    approverPlant: "삼랑진공장",
    approvedAt: "2026-09-17 17:30",
    approvalComment: "설비 보전 및 정기 점검 조치 내역 확인 (승인)",
    createdAt: "09.17 08:30",
    updatedAt: "2026-09-17T08:30:00.000Z"
  },
  {
    id: "seed_sam_in_0917",
    date: "2026-09-17",
    plant: "삼랑진공장",
    writer: "양인나",
    title: "선임",
    process: "생산관리/자재",
    line: "원부자재 수급",
    shift: "주간",
    workContent: "원부자재 입출고 수불 관리 및 일일 재고 실사\n- EPDM 컴파운드 및 TPE 수지 입고 12톤 검수 및 창고 입고\n- 익일 생산 라인별 원료 불출 계획 수립",
    issues: "특이사항 없음",
    images: [],
    maintenanceItems: [],
    approvalStatus: "결재완료",
    approverName: "이명재",
    approverTitle: "이사",
    approverPlant: "삼랑진공장",
    approvedAt: "2026-09-17 17:30",
    approvalComment: "원부자재 입출고 및 재고 현황 확인 완료 (승인)",
    createdAt: "09.17 08:30",
    updatedAt: "2026-09-17T08:30:00.000Z"
  },
  {
    id: "seed_sam_dg_0917",
    date: "2026-09-17",
    plant: "삼랑진공장",
    writer: "유동길",
    title: "선임",
    process: "생산/가공",
    line: "가공 2라인",
    shift: "주간",
    workContent: "가공 2라인 클립 압입 및 양면테이프 부착 공정\n- 테이프 부착 강도 측정 및 박리 테스트 양호\n- 일일 목표 물량 850 SET 조립 완료",
    issues: "특이사항 없음",
    images: [],
    maintenanceItems: [],
    approvalStatus: "결재완료",
    approverName: "이명재",
    approverTitle: "이사",
    approverPlant: "삼랑진공장",
    approvedAt: "2026-09-17 17:30",
    approvalComment: "가공 2라인 작업 실적 확인 (승인)",
    createdAt: "09.17 08:30",
    updatedAt: "2026-09-17T08:30:00.000Z"
  },
  {
    id: "seed_sam_ij_0917",
    date: "2026-09-17",
    plant: "삼랑진공장",
    writer: "조인주",
    title: "선임",
    process: "생산일정/포장",
    line: "출하검사",
    shift: "주간",
    workContent: "완제품 최종 포장 및 바코드 라벨링 검사\n- 완성차 직납 품목 포장 사양 검수 및 완제품 박스 밴딩\n- 출하 대기장 적재 및 출하 명세서 작성",
    issues: "특이사항 없음",
    images: [],
    maintenanceItems: [],
    approvalStatus: "결재완료",
    approverName: "이명재",
    approverTitle: "이사",
    approverPlant: "삼랑진공장",
    approvedAt: "2026-09-17 17:30",
    approvalComment: "포장 및 출하 대기 물량 점검 완료 (승인)",
    createdAt: "09.17 08:30",
    updatedAt: "2026-09-17T08:30:00.000Z"
  },
  {
    id: "seed_sam_sg_0917",
    date: "2026-09-17",
    plant: "삼랑진공장",
    writer: "이상기",
    title: "기사",
    process: "생산보조/물류",
    line: "완제품 입출고",
    shift: "주간",
    workContent: "생산 라인 완제품 팔레트 지게차 운반 및 적재\n- 출하 대기장 위치별 구분 정리 및 공파레트 정돈\n- 생산 폐기물 및 스크랩 지정 장소 분리 수거",
    issues: "특이사항 없음",
    images: [],
    maintenanceItems: [],
    approvalStatus: "결재완료",
    approverName: "이명재",
    approverTitle: "이사",
    approverPlant: "삼랑진공장",
    approvedAt: "2026-09-17 17:30",
    approvalComment: "완제품 적재 및 물류 보조 확인 (승인)",
    createdAt: "09.17 08:30",
    updatedAt: "2026-09-17T08:30:00.000Z"
  }
];

const COLLECTION_NAME = "work_logs";
const LOCAL_STORAGE_KEY = "factory_daily_work_logs_v10_approved";

// Deep clean object for Firestore
function sanitizeLog(obj) {
  const result = {};
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (val !== undefined && typeof val !== "function") {
      if (typeof val === "object" && val !== null) {
        try {
          result[key] = JSON.stringify(val);
        } catch {
          result[key] = "";
        }
      } else {
        result[key] = String(val === null ? "" : val);
      }
    }
  }
  return result;
}

export const parseLogFields = (log) => {
  if (!log || typeof log !== "object") return log;
  const parsed = { ...log };
  if (typeof parsed.images === "string") {
    try {
      parsed.images = JSON.parse(parsed.images);
    } catch {
      parsed.images = [];
    }
  }
  if (!Array.isArray(parsed.images)) {
    parsed.images = parsed.images ? [parsed.images] : [];
  }
  if (typeof parsed.lineFileMatches === "string") {
    try {
      parsed.lineFileMatches = JSON.parse(parsed.lineFileMatches);
    } catch {}
  }
  if (typeof parsed.maintenanceItems === "string") {
    try {
      parsed.maintenanceItems = JSON.parse(parsed.maintenanceItems);
    } catch {
      parsed.maintenanceItems = [];
    }
  }
  return parsed;
};

// Ensure log has correct authoritative approval status
export const normalizeWorkLogApproval = (log) => {
  if (!log) return log;
  const parsed = parseLogFields(log);

  // If plant is 한림공장 and approval is missing or pending on seed/standard records
  if (parsed.plant === "한림공장") {
    if (!parsed.approvalStatus || parsed.approvalStatus === "결재대기" || !parsed.approverName) {
      if (String(parsed.id).startsWith("seed_") || ["우창용", "오상민"].includes(parsed.writer)) {
        parsed.approvalStatus = "결재완료";
        parsed.approverName = "김동욱";
        parsed.approverTitle = "책임";
        parsed.approverPlant = "한림공장";
        parsed.approvedAt = parsed.approvedAt || "2026-09-17 17:30";
        parsed.approvalComment = parsed.approvalComment || "한림공장 총괄관리자 김동욱 책임 전자결재 승인 완료";
      }
    }
  } else if (parsed.plant === "삼랑진공장") {
    if (!parsed.approvalStatus || parsed.approvalStatus === "결재대기" || !parsed.approverName) {
      if (String(parsed.id).startsWith("seed_") || ["설유철", "윤경수", "이창엽", "전재율", "양인나", "유동길", "조인주", "이상기"].includes(parsed.writer)) {
        parsed.approvalStatus = "결재완료";
        parsed.approverName = "이명재";
        parsed.approverTitle = "이사";
        parsed.approverPlant = "삼랑진공장";
        parsed.approvedAt = parsed.approvedAt || "2026-09-17 17:30";
        parsed.approvalComment = parsed.approvalComment || "삼랑진공장 총괄관리자 이명재 이사 전자결재 승인 완료";
      }
    }
  }

  return parsed;
};

// Get local cache
export const getLocalWorkLogs = () => {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!saved) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(INITIAL_WORK_LOGS));
      return INITIAL_WORK_LOGS.map(normalizeWorkLogApproval);
    }
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(INITIAL_WORK_LOGS));
      return INITIAL_WORK_LOGS.map(normalizeWorkLogApproval);
    }
    return parsed.map(normalizeWorkLogApproval);
  } catch (e) {
    return INITIAL_WORK_LOGS.map(normalizeWorkLogApproval);
  }
};

const saveLocalWorkLogs = (logs) => {
  try {
    const parsed = Array.isArray(logs) ? logs.map(normalizeWorkLogApproval) : [];
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(parsed));
  } catch (e) {
    console.error("Local storage error:", e);
  }
};

const OLD_SAMPLE_IDS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11"];

// Purge any old numerical sample data (1~11) from Firestore
let isPurged = false;
export const purgeSampleLogsIfNeeded = async () => {
  if (isPurged) return;
  try {
    const snap = await getDocs(collection(db, COLLECTION_NAME));
    if (!snap.empty) {
      const batch = writeBatch(db);
      let count = 0;
      snap.forEach((docSnap) => {
        if (OLD_SAMPLE_IDS.includes(docSnap.id)) {
          batch.delete(docSnap.ref);
          count++;
        }
      });
      if (count > 0) {
        await batch.commit();
        console.log(`Purged ${count} old sample work logs from Firestore.`);
      }
    }
    isPurged = true;
  } catch (e) {
    console.warn("Purge sample logs error:", e);
  }
};

// Seed initial approved logs into Firestore if needed
export const seedInitialLogsToFirestore = async () => {
  try {
    const batch = writeBatch(db);
    INITIAL_WORK_LOGS.forEach((log) => {
      const docRef = doc(db, COLLECTION_NAME, String(log.id));
      batch.set(docRef, sanitizeLog(log), { merge: true });
    });
    await batch.commit();
    console.log("Seeded initial approved work logs to Firestore.");
  } catch (e) {
    console.warn("Seed initial logs error:", e);
  }
};

export const seedInitialLogsIfNeeded = async () => {
  await purgeSampleLogsIfNeeded();
};

// Subscribe to real-time work logs from Firestore
export const subscribeWorkLogs = (onUpdate) => {
  purgeSampleLogsIfNeeded();

  // 1. Immediate local cache
  const localLogs = getLocalWorkLogs().filter((l) => !OLD_SAMPLE_IDS.includes(String(l.id)));
  onUpdate(localLogs);

  // 2. Direct fetch from Cloud Firestore
  getDocs(collection(db, COLLECTION_NAME)).then((snap) => {
    if (!snap.empty) {
      const remoteLogs = [];
      snap.forEach((docSnap) => {
        if (!OLD_SAMPLE_IDS.includes(docSnap.id)) {
          const log = normalizeWorkLogApproval({ id: docSnap.id, ...docSnap.data() });
          remoteLogs.push(log);
        }
      });

      // Merge with INITIAL_WORK_LOGS to guarantee standard plant records are present
      const existingIds = new Set(remoteLogs.map((r) => String(r.id)));
      INITIAL_WORK_LOGS.forEach((initLog) => {
        if (!existingIds.has(String(initLog.id))) {
          remoteLogs.push(initLog);
        }
      });

      remoteLogs.sort((a, b) => {
        const dateA = a.date || "";
        const dateB = b.date || "";
        if (dateA !== dateB) return dateB.localeCompare(dateA);
        return String(b.id || "").localeCompare(String(a.id || ""));
      });

      saveLocalWorkLogs(remoteLogs);
      onUpdate(remoteLogs);
    } else {
      seedInitialLogsToFirestore();
      saveLocalWorkLogs(INITIAL_WORK_LOGS);
      onUpdate(INITIAL_WORK_LOGS);
    }
  }).catch((e) => {
    console.warn("Direct getDocs warning:", e.message);
    onUpdate(getLocalWorkLogs());
  });

  // 3. Real-time live listener
  try {
    const q = query(collection(db, COLLECTION_NAME));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const remoteLogs = [];
          snapshot.forEach((docSnap) => {
            if (!OLD_SAMPLE_IDS.includes(docSnap.id)) {
              const log = normalizeWorkLogApproval({ id: docSnap.id, ...docSnap.data() });
              remoteLogs.push(log);
            }
          });

          // Guarantee initial seed logs presence
          const existingIds = new Set(remoteLogs.map((r) => String(r.id)));
          INITIAL_WORK_LOGS.forEach((initLog) => {
            if (!existingIds.has(String(initLog.id))) {
              remoteLogs.push(initLog);
            }
          });

          remoteLogs.sort((a, b) => {
            const dateA = a.date || "";
            const dateB = b.date || "";
            if (dateA !== dateB) return dateB.localeCompare(dateA);
            return String(b.id || "").localeCompare(String(a.id || ""));
          });

          saveLocalWorkLogs(remoteLogs);
          onUpdate(remoteLogs);
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

// Check if a work log has already been approved
export const isWorkLogApproved = (log) => {
  if (!log) return false;
  return (
    log.approvalStatus === "결재완료" ||
    log.approvalStatus === "APPROVED" ||
    log.status === "APPROVED"
  );
};

// Save a work log (Cloud Firestore + Local Cache)
export const saveWorkLog = async (newLog) => {
  const logId = String(newLog.id || Date.now());
  const current = getLocalWorkLogs();
  const existingLog = current.find((l) => String(l.id) === logId);

  // Guard: If already approved and this is an edit attempt, reject
  if (existingLog && isWorkLogApproved(existingLog) && !newLog._isApprovalAction) {
    console.warn("Cannot edit an already approved work log:", logId);
    throw new Error("결재가 완료된 업무일지는 수정할 수 없습니다.");
  }

  const cleanData = sanitizeLog(newLog);
  const logData = {
    ...cleanData,
    id: logId,
    updatedAt: new Date().toISOString(),
    createdAt: cleanData.createdAt || new Date().toLocaleString("ko-KR", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    })
  };

  // 1. Update local cache immediately
  const updatedLocal = [parseLogFields(logData), ...current.filter((l) => String(l.id) !== logId)];
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

// Update an existing work log before approval
export const updateWorkLog = async (id, updatedFields = {}) => {
  const logId = String(id);
  const current = getLocalWorkLogs();
  const target = current.find((l) => String(l.id) === logId);
  if (!target) throw new Error("수정할 업무일지를 찾을 수 없습니다.");

  if (isWorkLogApproved(target)) {
    throw new Error("결재가 완료된 업무일지는 수정할 수 없습니다.");
  }

  const merged = {
    ...target,
    ...updatedFields,
    id: logId,
    updatedAt: new Date().toISOString()
  };

  const cleanData = sanitizeLog(merged);
  const parsedClean = parseLogFields(cleanData);
  const updatedLocal = current.map((l) => (String(l.id) === logId ? parsedClean : l));
  saveLocalWorkLogs(updatedLocal);

  try {
    await setDoc(doc(db, COLLECTION_NAME, logId), cleanData, { merge: true });
    console.log("Work log updated & synced to Firestore:", logId);
  } catch (e) {
    console.error("Firestore update sync error:", e);
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

// Approve a work log (by plant general manager or admin)
export const approveWorkLog = async (id, approver = {}) => {
  const logId = String(id);
  const current = getLocalWorkLogs();
  const target = current.find((l) => String(l.id) === logId);
  if (!target) return current;

  const nowFormatted = new Date().toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });

  const plantName = approver.plant || target.plant || "한림공장";
  const defaultApproverName = plantName === "한림공장" ? "김동욱" : "이명재";
  const defaultApproverTitle = plantName === "한림공장" ? "책임" : "이사";

  const approvalData = {
    approvalStatus: "결재완료",
    approverName: approver.name || defaultApproverName,
    approverTitle: approver.title || defaultApproverTitle,
    approverPlant: plantName,
    approvedAt: nowFormatted,
    approvalComment: approver.comment || (plantName === "한림공장" ? "한림공장 총괄관리자 김동욱 책임 전자결재 승인 완료" : "삼랑진공장 총괄관리자 이명재 이사 전자결재 승인 완료")
  };

  const updatedLog = {
    ...target,
    ...approvalData,
    updatedAt: new Date().toISOString()
  };

  const updatedLocal = current.map((l) => (String(l.id) === logId ? updatedLog : l));
  saveLocalWorkLogs(updatedLocal);

  try {
    await setDoc(doc(db, COLLECTION_NAME, logId), sanitizeLog(updatedLog), { merge: true });
    console.log("Work log approved & synced to Firestore:", logId);
  } catch (e) {
    console.error("Firestore approve sync error:", e);
  }

  return updatedLocal;
};

// Batch approve multiple work logs for a plant
export const batchApproveWorkLogs = async (logIds, approver = {}) => {
  if (!Array.isArray(logIds) || logIds.length === 0) return getLocalWorkLogs();

  const current = getLocalWorkLogs();
  const nowFormatted = new Date().toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });

  const targetIds = logIds.map(String);
  const updatedLocal = current.map((l) => {
    if (targetIds.includes(String(l.id))) {
      const plantName = approver.plant || l.plant || "한림공장";
      const defaultApproverName = approver.name || (plantName === "한림공장" ? "김동욱" : "이명재");
      const defaultApproverTitle = approver.title || (plantName === "한림공장" ? "책임" : "이사");
      const approvalData = {
        approvalStatus: "결재완료",
        approverName: defaultApproverName,
        approverTitle: defaultApproverTitle,
        approverPlant: plantName,
        approvedAt: nowFormatted,
        approvalComment: approver.comment || `${plantName} 일괄 확인 및 전자결재 승인 완료`
      };
      return { ...l, ...approvalData, updatedAt: new Date().toISOString() };
    }
    return l;
  });

  saveLocalWorkLogs(updatedLocal);

  try {
    const batch = writeBatch(db);
    targetIds.forEach((id) => {
      const log = updatedLocal.find((l) => String(l.id) === id);
      if (log) {
        const docRef = doc(db, COLLECTION_NAME, id);
        batch.set(docRef, sanitizeLog(log), { merge: true });
      }
    });
    await batch.commit();
    console.log("Batch work logs approved in Firestore:", targetIds.length);
  } catch (e) {
    console.error("Firestore batch approve error:", e);
  }

  return updatedLocal;
};

// Reject / Return a work log for revision
export const rejectWorkLog = async (id, approver = {}, reason = "보완 후 재상신 요망") => {
  const logId = String(id);
  const current = getLocalWorkLogs();
  const target = current.find((l) => String(l.id) === logId);
  if (!target) return current;

  const nowFormatted = new Date().toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });

  const plantName = approver.plant || target.plant || "한림공장";
  const defaultApproverName = plantName === "한림공장" ? "김동욱" : "이명재";
  const defaultApproverTitle = plantName === "한림공장" ? "책임" : "이사";

  const rejectionData = {
    approvalStatus: "반려",
    approverName: approver.name || defaultApproverName,
    approverTitle: approver.title || defaultApproverTitle,
    approverPlant: plantName,
    approvedAt: nowFormatted,
    approvalComment: reason
  };

  const updatedLog = {
    ...target,
    ...rejectionData,
    updatedAt: new Date().toISOString()
  };

  const updatedLocal = current.map((l) => (String(l.id) === logId ? updatedLog : l));
  saveLocalWorkLogs(updatedLocal);

  try {
    await setDoc(doc(db, COLLECTION_NAME, logId), sanitizeLog(updatedLog), { merge: true });
    console.log("Work log rejected in Firestore:", logId);
  } catch (e) {
    console.error("Firestore reject sync error:", e);
  }

  return updatedLocal;
};

