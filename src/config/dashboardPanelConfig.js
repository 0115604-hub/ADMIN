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
  ABNORMALITY_4M: "abnormality_4m",
  WORK_REPORT_TEMPLATES: "work_report_templates",
  TELEGRAM_LIVE_LOUNGE: "telegram_live_lounge"
};

// 기본 사내 일반 관리자 패널 목록 (5개사 뱃지/중대재해/비가동 중복 제거, 1~4단계 통합 이상발생 및 4M 관제 패널 기본 배치)
export const DEFAULT_INTERNAL_MANAGER_PANELS = [
  PANEL_KEYS.COMMON_SCHEDULE,
  PANEL_KEYS.CALENDAR_SCHEDULE,
  PANEL_KEYS.SALES_PURCHASE,
  PANEL_KEYS.QUALITY_SUMMARY,
  PANEL_KEYS.ABNORMALITY_4M,
  PANEL_KEYS.WORK_LOGS
];

// 관리자(ID 또는 이름)별 맞춤 패널 커스텀 설정표
export const MANAGER_PANEL_CONFIG = {
  // ⭐ [3단계 품질관리자: 이창엽 책임 / 이상기 기사]
  "sam_cy": [
    PANEL_KEYS.COMMON_SCHEDULE,
    PANEL_KEYS.CALENDAR_SCHEDULE,
    PANEL_KEYS.SALES_PURCHASE,
    PANEL_KEYS.QUALITY_SUMMARY,
    PANEL_KEYS.ABNORMALITY_4M,
    PANEL_KEYS.WORK_LOGS
  ],
  "이창엽": [
    PANEL_KEYS.COMMON_SCHEDULE,
    PANEL_KEYS.CALENDAR_SCHEDULE,
    PANEL_KEYS.SALES_PURCHASE,
    PANEL_KEYS.QUALITY_SUMMARY,
    PANEL_KEYS.ABNORMALITY_4M,
    PANEL_KEYS.WORK_LOGS
  ],
  "sam_sg": [
    PANEL_KEYS.COMMON_SCHEDULE,
    PANEL_KEYS.CALENDAR_SCHEDULE,
    PANEL_KEYS.SALES_PURCHASE,
    PANEL_KEYS.QUALITY_SUMMARY,
    PANEL_KEYS.ABNORMALITY_4M,
    PANEL_KEYS.WORK_LOGS
  ],
  "이상기": [
    PANEL_KEYS.COMMON_SCHEDULE,
    PANEL_KEYS.CALENDAR_SCHEDULE,
    PANEL_KEYS.SALES_PURCHASE,
    PANEL_KEYS.QUALITY_SUMMARY,
    PANEL_KEYS.ABNORMALITY_4M,
    PANEL_KEYS.WORK_LOGS
  ],

  // 👑 [4단계 삼랑진공장 총괄: 이명재 대표이사] 5개사 뱃지 삭제, 4M 및 전자결재 승인 대시보드
  "sam_mj": [
    PANEL_KEYS.COMMON_SCHEDULE,
    PANEL_KEYS.CALENDAR_SCHEDULE,
    PANEL_KEYS.SALES_PURCHASE,
    PANEL_KEYS.QUALITY_SUMMARY,
    PANEL_KEYS.ABNORMALITY_4M,
    PANEL_KEYS.WORK_LOGS
  ],
  "이명재": [
    PANEL_KEYS.COMMON_SCHEDULE,
    PANEL_KEYS.CALENDAR_SCHEDULE,
    PANEL_KEYS.SALES_PURCHASE,
    PANEL_KEYS.QUALITY_SUMMARY,
    PANEL_KEYS.ABNORMALITY_4M,
    PANEL_KEYS.WORK_LOGS
  ],

  // 👑 [4단계 한림공장 총괄: 김동욱 대표(전무)] 5개사 뱃지 삭제, 4M 및 전자결재 승인 대시보드
  "hal_dw": [
    PANEL_KEYS.COMMON_SCHEDULE,
    PANEL_KEYS.CALENDAR_SCHEDULE,
    PANEL_KEYS.SALES_PURCHASE,
    PANEL_KEYS.QUALITY_SUMMARY,
    PANEL_KEYS.ABNORMALITY_4M,
    PANEL_KEYS.WORK_LOGS
  ],
  "김동욱": [
    PANEL_KEYS.COMMON_SCHEDULE,
    PANEL_KEYS.CALENDAR_SCHEDULE,
    PANEL_KEYS.SALES_PURCHASE,
    PANEL_KEYS.QUALITY_SUMMARY,
    PANEL_KEYS.ABNORMALITY_4M,
    PANEL_KEYS.WORK_LOGS
  ],

  // 👑 [4단계 본사 경영진: 권태형 대표이사 / 최미영 전무]
  "admin_kwon": [
    PANEL_KEYS.COMMON_SCHEDULE,
    PANEL_KEYS.CALENDAR_SCHEDULE,
    PANEL_KEYS.SALES_PURCHASE,
    PANEL_KEYS.QUALITY_SUMMARY,
    PANEL_KEYS.ABNORMALITY_4M,
    PANEL_KEYS.WORK_LOGS
  ],
  "권태형": [
    PANEL_KEYS.COMMON_SCHEDULE,
    PANEL_KEYS.CALENDAR_SCHEDULE,
    PANEL_KEYS.SALES_PURCHASE,
    PANEL_KEYS.QUALITY_SUMMARY,
    PANEL_KEYS.ABNORMALITY_4M,
    PANEL_KEYS.WORK_LOGS
  ],
  "admin_choi": [
    PANEL_KEYS.COMMON_SCHEDULE,
    PANEL_KEYS.CALENDAR_SCHEDULE,
    PANEL_KEYS.SALES_PURCHASE,
    PANEL_KEYS.QUALITY_SUMMARY,
    PANEL_KEYS.ABNORMALITY_4M,
    PANEL_KEYS.WORK_LOGS
  ],
  "최미영": [
    PANEL_KEYS.COMMON_SCHEDULE,
    PANEL_KEYS.CALENDAR_SCHEDULE,
    PANEL_KEYS.SALES_PURCHASE,
    PANEL_KEYS.QUALITY_SUMMARY,
    PANEL_KEYS.ABNORMALITY_4M,
    PANEL_KEYS.WORK_LOGS
  ],

  // ⚙️ [2단계 공정관리자: 설유철 책임(압출동), 윤경수 책임(가공동), 오상민 선임(한림 가공)]
  "sam_yc": [
    PANEL_KEYS.COMMON_SCHEDULE,
    PANEL_KEYS.CALENDAR_SCHEDULE,
    PANEL_KEYS.SALES_PURCHASE,
    PANEL_KEYS.QUALITY_SUMMARY,
    PANEL_KEYS.ABNORMALITY_4M,
    PANEL_KEYS.WORK_LOGS
  ],
  "설유철": [
    PANEL_KEYS.COMMON_SCHEDULE,
    PANEL_KEYS.CALENDAR_SCHEDULE,
    PANEL_KEYS.SALES_PURCHASE,
    PANEL_KEYS.QUALITY_SUMMARY,
    PANEL_KEYS.ABNORMALITY_4M,
    PANEL_KEYS.WORK_LOGS
  ],
  "sam_ks": [
    PANEL_KEYS.COMMON_SCHEDULE,
    PANEL_KEYS.CALENDAR_SCHEDULE,
    PANEL_KEYS.SALES_PURCHASE,
    PANEL_KEYS.QUALITY_SUMMARY,
    PANEL_KEYS.ABNORMALITY_4M,
    PANEL_KEYS.WORK_LOGS
  ],
  "윤경수": [
    PANEL_KEYS.COMMON_SCHEDULE,
    PANEL_KEYS.CALENDAR_SCHEDULE,
    PANEL_KEYS.SALES_PURCHASE,
    PANEL_KEYS.QUALITY_SUMMARY,
    PANEL_KEYS.ABNORMALITY_4M,
    PANEL_KEYS.WORK_LOGS
  ],
  "sam_in": [
    PANEL_KEYS.COMMON_SCHEDULE,
    PANEL_KEYS.CALENDAR_SCHEDULE,
    PANEL_KEYS.SALES_PURCHASE,
    PANEL_KEYS.QUALITY_SUMMARY,
    PANEL_KEYS.ABNORMALITY_4M,
    PANEL_KEYS.WORK_LOGS
  ],
  "양인나": [
    PANEL_KEYS.COMMON_SCHEDULE,
    PANEL_KEYS.CALENDAR_SCHEDULE,
    PANEL_KEYS.SALES_PURCHASE,
    PANEL_KEYS.QUALITY_SUMMARY,
    PANEL_KEYS.ABNORMALITY_4M,
    PANEL_KEYS.WORK_LOGS
  ],
  "sam_dg": [
    PANEL_KEYS.COMMON_SCHEDULE,
    PANEL_KEYS.CALENDAR_SCHEDULE,
    PANEL_KEYS.SALES_PURCHASE,
    PANEL_KEYS.QUALITY_SUMMARY,
    PANEL_KEYS.ABNORMALITY_4M,
    PANEL_KEYS.WORK_LOGS
  ],
  "유동길": [
    PANEL_KEYS.COMMON_SCHEDULE,
    PANEL_KEYS.CALENDAR_SCHEDULE,
    PANEL_KEYS.SALES_PURCHASE,
    PANEL_KEYS.QUALITY_SUMMARY,
    PANEL_KEYS.ABNORMALITY_4M,
    PANEL_KEYS.WORK_LOGS
  ],
  "hal_sm": [
    PANEL_KEYS.COMMON_SCHEDULE,
    PANEL_KEYS.CALENDAR_SCHEDULE,
    PANEL_KEYS.SALES_PURCHASE,
    PANEL_KEYS.QUALITY_SUMMARY,
    PANEL_KEYS.ABNORMALITY_4M,
    PANEL_KEYS.WORK_LOGS
  ],
  "오상민": [
    PANEL_KEYS.COMMON_SCHEDULE,
    PANEL_KEYS.CALENDAR_SCHEDULE,
    PANEL_KEYS.SALES_PURCHASE,
    PANEL_KEYS.QUALITY_SUMMARY,
    PANEL_KEYS.ABNORMALITY_4M,
    PANEL_KEYS.WORK_LOGS
  ],
  "sam_jy": [
    PANEL_KEYS.COMMON_SCHEDULE,
    PANEL_KEYS.CALENDAR_SCHEDULE,
    PANEL_KEYS.SALES_PURCHASE,
    PANEL_KEYS.QUALITY_SUMMARY,
    PANEL_KEYS.ABNORMALITY_4M,
    PANEL_KEYS.WORK_LOGS
  ],
  "전재율": [
    PANEL_KEYS.COMMON_SCHEDULE,
    PANEL_KEYS.CALENDAR_SCHEDULE,
    PANEL_KEYS.SALES_PURCHASE,
    PANEL_KEYS.QUALITY_SUMMARY,
    PANEL_KEYS.ABNORMALITY_4M,
    PANEL_KEYS.WORK_LOGS
  ],

  // 🛡️ [한림공장 TEST 관리자]
  "hal_test": [
    PANEL_KEYS.COMMON_SCHEDULE,
    PANEL_KEYS.CALENDAR_SCHEDULE,
    PANEL_KEYS.TELEGRAM_LIVE_LOUNGE,
    PANEL_KEYS.WORK_REPORT_TEMPLATES
  ],
  "TEST": [
    PANEL_KEYS.COMMON_SCHEDULE,
    PANEL_KEYS.CALENDAR_SCHEDULE,
    PANEL_KEYS.TELEGRAM_LIVE_LOUNGE,
    PANEL_KEYS.WORK_REPORT_TEMPLATES
  ]
};

// 패널 설정 캐시 버전 관리 (설정 갱신 시 브라우저 로컬스토리지 자동 리프레시)
export const PANEL_CONFIG_VERSION = "20261026_v9";

/**
 * 특정 사용자의 활성 대시보드 패널 목록 조회
 */
export const getPanelsForUser = (profile) => {
  if (!profile) return DEFAULT_INTERNAL_MANAGER_PANELS;
  const id = profile.id;
  const name = profile.name;

  // 캐시 버전 검증: 구버전 캐시 무효화 및 신규 레이아웃 강제 동기화
  try {
    const cachedVer = localStorage.getItem("dashboard_panels_version");
    if (cachedVer !== PANEL_CONFIG_VERSION) {
      localStorage.setItem("dashboard_panels_version", PANEL_CONFIG_VERSION);
      // Remove all custom dashboard panel cached keys
      Object.keys(localStorage).forEach((k) => {
        if (k.startsWith("dashboard_panels_")) {
          localStorage.removeItem(k);
        }
      });
    }
  } catch (e) {}

  // 1. 관리자(ID 또는 이름)별 맞춤 패널 커스텀 설정표 우선 매핑
  if (id && MANAGER_PANEL_CONFIG[id]) {
    return MANAGER_PANEL_CONFIG[id];
  }
  if (name && MANAGER_PANEL_CONFIG[name]) {
    return MANAGER_PANEL_CONFIG[name];
  }

  // 2. LocalStorage 개별 커스텀 캐시가 있는 경우 적용
  try {
    const customKey = `dashboard_panels_${id || name}`;
    const stored = localStorage.getItem(customKey);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}

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
