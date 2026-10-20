/**
 * 🌟 관리자별 대시보드 패널 레지스트리 및 커스텀 레이아웃 파이프라인
 *
 * 관리자(Admin/Manager) 로그인 시 첫 화면(대시보드)에 노출할 패널 구성을 중앙에서 통합 관리합니다.
 * 패널 식별자 목록:
 *  - "common_schedule": 📌 사내 공통일정 패널
 *  - "calendar_schedule": 🌟 관리자 일정/연차 및 캘린더 센터
 *  - "severe_disaster": 🚨 중대재해공유판 한줄짜리 패널
 *  - "sales_purchase": 1. 매입매출현황 요약 패널
 *  - "attendance": 2. 근태현황 및 관리 패널 (전사 5개사 및 결재 카드)
 *  - "quality_summary": 3. 금형별 일일품질 요약 패널
 *  - "extrusion_downtime": 4. 압출동 주간 비가동내역 요약 패널
 *  - "work_logs": 5. 일일업무일지 현황 패널
 *  - "abnormality_4m": 🛡️ 통합 이상발생 및 4M 변동점 관제 패널
 */

export const PANEL_KEYS = {
  COMMON_SCHEDULE: "common_schedule",
  CALENDAR_SCHEDULE: "calendar_schedule",
  SEVERE_DISASTER: "severe_disaster",
  SALES_PURCHASE: "sales_purchase",
  ATTENDANCE: "attendance",
  QUALITY_SUMMARY: "quality_summary",
  EXTRUSION_DOWNTIME: "extrusion_downtime",
  WORK_LOGS: "work_logs",
  ABNORMALITY_4M: "abnormality_4m"
};

// 기본 사내 일반 관리자 패널 목록 (전체 기본 풀 세트)
export const DEFAULT_INTERNAL_MANAGER_PANELS = [
  PANEL_KEYS.COMMON_SCHEDULE,
  PANEL_KEYS.CALENDAR_SCHEDULE,
  PANEL_KEYS.SEVERE_DISASTER,
  PANEL_KEYS.SALES_PURCHASE,
  PANEL_KEYS.ATTENDANCE,
  PANEL_KEYS.QUALITY_SUMMARY,
  PANEL_KEYS.EXTRUSION_DOWNTIME,
  PANEL_KEYS.WORK_LOGS
];

// 관리자(ID 또는 이름)별 맞춤 패널 커스텀 설정표
export const MANAGER_PANEL_CONFIG = {
  // ⭐ [이창엽 책임 - 품질관리] 커스텀 레이아웃
  // 요청사항: 
  // 1. 중대재해 한줄짜리 패널 삭제
  // 2. 근태현황 및 관리 패널 삭제
  // 3. 압출동 주간 비가동내역 패널 삭제
  "sam_cy": [
    PANEL_KEYS.COMMON_SCHEDULE,
    PANEL_KEYS.CALENDAR_SCHEDULE,
    PANEL_KEYS.SALES_PURCHASE,
    PANEL_KEYS.QUALITY_SUMMARY,
    PANEL_KEYS.WORK_LOGS
  ],
  "이창엽": [
    PANEL_KEYS.COMMON_SCHEDULE,
    PANEL_KEYS.CALENDAR_SCHEDULE,
    PANEL_KEYS.SALES_PURCHASE,
    PANEL_KEYS.QUALITY_SUMMARY,
    PANEL_KEYS.WORK_LOGS
  ],

  // 🛡️ [한림공장 TEST 관리자]
  "hal_test": [
    PANEL_KEYS.ABNORMALITY_4M,
    PANEL_KEYS.COMMON_SCHEDULE,
    PANEL_KEYS.CALENDAR_SCHEDULE,
    PANEL_KEYS.SALES_PURCHASE,
    PANEL_KEYS.ATTENDANCE,
    PANEL_KEYS.QUALITY_SUMMARY,
    PANEL_KEYS.EXTRUSION_DOWNTIME,
    PANEL_KEYS.WORK_LOGS
  ],
  "TEST": [
    PANEL_KEYS.ABNORMALITY_4M,
    PANEL_KEYS.COMMON_SCHEDULE,
    PANEL_KEYS.CALENDAR_SCHEDULE,
    PANEL_KEYS.SALES_PURCHASE,
    PANEL_KEYS.ATTENDANCE,
    PANEL_KEYS.QUALITY_SUMMARY,
    PANEL_KEYS.EXTRUSION_DOWNTIME,
    PANEL_KEYS.WORK_LOGS
  ]
};

/**
 * 특정 사용자의 활성 대시보드 패널 목록 조회
 */
export const getPanelsForUser = (profile) => {
  if (!profile) return DEFAULT_INTERNAL_MANAGER_PANELS;
  const id = profile.id;
  const name = profile.name;

  // 1. LocalStorage 개별 커스텀 캐시가 있는 경우 우선 적용
  try {
    const customKey = `dashboard_panels_${id || name}`;
    const stored = localStorage.getItem(customKey);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}

  // 2. 중앙 레지스트리 설정 매핑
  if (id && MANAGER_PANEL_CONFIG[id]) {
    return MANAGER_PANEL_CONFIG[id];
  }
  if (name && MANAGER_PANEL_CONFIG[name]) {
    return MANAGER_PANEL_CONFIG[name];
  }

  // 3. 기본 사내 관리자 레이아웃
  return DEFAULT_INTERNAL_MANAGER_PANELS;
};

/**
 * 특정 패널이 해당 사용자 대시보드에 노출되어야 하는지 판별
 */
export const isPanelVisible = (panelKey, profile) => {
  const panels = getPanelsForUser(profile);
  return panels.includes(panelKey);
};
