// Shared Work Log Service for Real-time Factory Operations

export const INITIAL_WORK_LOGS = [
  {
    id: 1,
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
    id: 2,
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
    id: 3,
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
    id: 4,
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
    id: 5,
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
    id: 6,
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
    id: 7,
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
    id: 8,
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
    id: 9,
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
  }
];

const LOCAL_STORAGE_KEY = "factory_daily_work_logs_v3_assigned";

// Get all logs
export const getWorkLogs = () => {
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

// Save a new log
export const saveWorkLog = (newLog) => {
  try {
    const current = getWorkLogs();
    const updated = [newLog, ...current];
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error("Save log error:", e);
    return [];
  }
};

// Delete log
export const deleteWorkLog = (id) => {
  try {
    const current = getWorkLogs();
    const filtered = current.filter((l) => l.id !== id);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filtered));
    return filtered;
  } catch (e) {
    console.error("Delete log error:", e);
    return [];
  }
};
