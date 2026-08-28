// Shared Work Log Service for Real-time Factory Operations

export const INITIAL_WORK_LOGS = [
  {
    id: 1,
    date: "2026-08-28",
    plant: "삼랑진공장",
    writer: "이명재",
    title: "이사",
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
    shift: "주간",
    line: "가공 2라인",
    workContent: "DT 수출용 웨더스트립 절단 및 피팅 가공 (1,800개 완료)",
    issues: "2호 절단기 칼날 마모 점검 후 교체 완료",
    status: "완료",
    createdAt: "2026-08-28 09:10"
  },
  {
    id: 3,
    date: "2026-08-28",
    plant: "삼랑진공장",
    writer: "윤경수",
    title: "책임",
    shift: "주간",
    line: "PCM 압출 라인",
    workContent: "PCM 압출 라인 가동 및 금형 예열 점검 (생산량 4,200M 달성)",
    issues: "압출 냉각 수온 정상 유지, 온도 편차 없음",
    status: "완료",
    createdAt: "2026-08-28 09:20"
  },
  {
    id: 4,
    date: "2026-08-28",
    plant: "삼랑진공장",
    writer: "이창엽",
    title: "책임",
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
    shift: "주간",
    line: "자재 관리 라인",
    workContent: "원자재 TPE/EPDM 입고 검사 및 부자재 재고 파악 (화승알앤에이 입고분)",
    issues: "원자재 시험 성적서 전산 등록 완료",
    status: "완료",
    createdAt: "2026-08-28 08:40"
  },
  {
    id: 6,
    date: "2026-08-28",
    plant: "삼랑진공장",
    writer: "조인주",
    title: "선임",
    shift: "주간",
    line: "9BQC 압출 1호기",
    workContent: "9BQC FRT LH/RH 압출 생산 (목표 2,400개 / 실적 2,450개 달성)",
    issues: "원료 TPE 공급압력 안정적 유지",
    status: "완료",
    createdAt: "2026-08-28 08:35"
  },
  {
    id: 7,
    date: "2026-08-28",
    plant: "한림공장",
    writer: "김동욱",
    title: "책임",
    shift: "주간",
    line: "EPDM 사출 라인",
    workContent: "NX4 코너 몰딩 사출 성형 (3,200개 출하 검사 완료)",
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
    shift: "주간",
    line: "사출 1호기",
    workContent: "한림 1호 사출기 가동 및 원료 건조 상태 점검 (생산 2,100개)",
    issues: "냉각기 필터 청소 완료",
    status: "완료",
    createdAt: "2026-08-28 09:05"
  },
  {
    id: 9,
    date: "2026-08-28",
    plant: "한림공장",
    writer: "오상민",
    title: "선임",
    shift: "주간",
    line: "출하 포장 라인",
    workContent: "출하 포장 및 완제품 박스 라벨링 검수 완료 (납품 차량 상차)",
    issues: "특이사항 없음 (오전 배송 완료)",
    status: "완료",
    createdAt: "2026-08-28 09:15"
  }
];

const STORAGE_KEY = "plant_daily_worklogs";

export const getWorkLogs = () => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error("Error reading work logs:", e);
    }
  }
  return INITIAL_WORK_LOGS;
};

export const saveWorkLog = (newLog) => {
  const currentLogs = getWorkLogs();
  const updated = [newLog, ...currentLogs];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
};

export const deleteWorkLog = (id) => {
  const currentLogs = getWorkLogs();
  const updated = currentLogs.filter((l) => l.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
};
