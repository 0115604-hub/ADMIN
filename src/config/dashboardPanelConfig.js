/**
 * 🌟 관리자별 대시보드 패널 레지스트리 및 커스텀 블록 파이프라인
 *
 * 관리자(Admin/Manager) 로그인 시 첫 화면(대시보드)에 노출할 패널 구성을 중앙에서 블록화하여 통합 관리합니다.
 */

import { getCustomLayoutForManager } from "../services/dashboardLayoutService";

export const PANEL_KEYS = {
  COMMON_SCHEDULE: "common_schedule", // 📌 사내 공통일정 바
  CALENDAR_SCHEDULE: "calendar_schedule", // 🌟 관리자 일정/연차 및 캘린더 센터
  QUALITY_DEFECT_ALERT_BAR: "quality_defect_alert_bar", // 🚨 부적합경보 등록 바
  ABNORMALITY_4M: "abnormality_4m", // 🛡️ 4M 변동점 & 이상통합 관제 패널
  QUALITY_SUMMARY: "quality_summary", // 🔬 중요ITEM 일일품질 요약
  SALES_PURCHASE: "sales_purchase", // 💰 매입매출현황 요약
  ATTENDANCE: "attendance", // 👥 근태현황 및 5개사 관리
  EXTRUSION_DOWNTIME: "extrusion_downtime", // 🏭 압출동 주간 비가동 요약
  MACHINING_WORK_REPORT: "machining_work_report", // ⚙️ 가공동 실시간 작업일보 (HR, JA, NX5a)
  SEOL_EXTRUSION_REPORT: "seol_extrusion_report", // 🏭 압출동 실시간 작업일보
  WORK_LOGS: "work_logs", // 📋 일일업무일지 현황
  TELEGRAM_LIVE_LOUNGE: "telegram_live_lounge", // ✈️ 텔레그램 실시간 소통 라운지
  WORK_REPORT_TEMPLATES: "work_report_templates", // 🧩 레고블록 작업일보 빌더
  SEVERE_DISASTER: "severe_disaster" // 🚨 중대재해 안전판
};

// 🌟 전체 패널 블록 메타데이터 목록 (TEST 뱃지 스튜디오에서 사용)
export const ALL_DASHBOARD_BLOCKS = [
  {
    key: PANEL_KEYS.COMMON_SCHEDULE,
    label: "사내 공통일정",
    category: "공통",
    badge: "📌 공통",
    icon: "Calendar",
    description: "전사 공통 일정 및 공지사항 한줄 배너",
    color: "from-blue-600 to-indigo-600"
  },
  {
    key: PANEL_KEYS.CALENDAR_SCHEDULE,
    label: "관리자 캘린더 센터",
    category: "공통",
    badge: "🌟 개인",
    icon: "Clock",
    description: "개인 일정, 연차 신청 및 주간 캘린더",
    color: "from-amber-600 to-orange-600"
  },
  {
    key: PANEL_KEYS.QUALITY_DEFECT_ALERT_BAR,
    label: "부적합경보 등록 바",
    category: "품질/안전",
    badge: "🚨 긴급",
    icon: "ShieldAlert",
    description: "오륙/조영/압출 부적합경보 및 긴급 알림 등록",
    color: "from-rose-600 to-red-600"
  },
  {
    key: PANEL_KEYS.ABNORMALITY_4M,
    label: "4M 변동점 & 이상통합 관제",
    category: "품질/4M",
    badge: "🛡️ 4M",
    icon: "ShieldCheck",
    description: "4M 변동점 상신/승인 및 CAPA 이상발생 현황",
    color: "from-indigo-600 to-purple-600"
  },
  {
    key: PANEL_KEYS.QUALITY_SUMMARY,
    label: "중요ITEM 일일품질 요약",
    category: "품질",
    badge: "🔬 품질",
    icon: "Sparkles",
    description: "금형별·차종별 실시간 불량률 및 일일 품질 현황",
    color: "from-emerald-600 to-teal-600"
  },
  {
    key: PANEL_KEYS.SALES_PURCHASE,
    label: "매입매출현황 요약",
    category: "경영/매출",
    badge: "💰 경영",
    icon: "TrendingUp",
    description: "당월 목표 대비 매출·매입 실적 및 비율",
    color: "from-cyan-600 to-blue-600"
  },
  {
    key: PANEL_KEYS.ATTENDANCE,
    label: "근태현황 및 5개사 관리",
    category: "인사/근태",
    badge: "👥 근태",
    icon: "Users",
    description: "전사 5개 협력사 출근율 및 특근/근태 결재",
    color: "from-purple-600 to-pink-600"
  },
  {
    key: PANEL_KEYS.EXTRUSION_DOWNTIME,
    label: "압출동 주간 비가동 요약",
    category: "압출/생산",
    badge: "🏭 압출",
    icon: "AlertTriangle",
    description: "압출 라인별 주간 비가동 시간 및 원인 집계",
    color: "from-teal-600 to-cyan-600"
  },
  {
    key: PANEL_KEYS.MACHINING_WORK_REPORT,
    label: "가공동 실시간 작업일보",
    category: "가공/생산",
    badge: "⚙️ 가공",
    icon: "Layers",
    description: "HR, JA, NX5a 가공 생산현황 및 실시간 일보",
    color: "from-emerald-700 to-teal-700"
  },
  {
    key: PANEL_KEYS.SEOL_EXTRUSION_REPORT,
    label: "압출동 실시간 작업일보",
    category: "압출/생산",
    badge: "🏭 압출",
    icon: "Cpu",
    description: "압출 1~5호기 실시간 작업일보 및 호기별 가동",
    color: "from-cyan-700 to-blue-700"
  },
  {
    key: PANEL_KEYS.WORK_LOGS,
    label: "일일업무일지 현황",
    category: "관리/일지",
    badge: "📋 일지",
    icon: "FileText",
    description: "공장별 일일업무일지 작성·조회 및 결재",
    color: "from-slate-700 to-slate-900"
  },
  {
    key: PANEL_KEYS.TELEGRAM_LIVE_LOUNGE,
    label: "텔레그램 실시간 소통 라운지",
    category: "소통",
    badge: "✈️ 알림",
    icon: "Send",
    description: "현장과 관리자 간 실시간 텔레그램 피드",
    color: "from-sky-500 to-blue-600"
  },
  {
    key: PANEL_KEYS.WORK_REPORT_TEMPLATES,
    label: "레고블록 작업일보 빌더",
    category: "도구",
    badge: "🧩 빌더",
    icon: "Blocks",
    description: "모듈형 일보 양식 제작 및 양식 관리 바로가기",
    color: "from-amber-600 to-orange-600"
  },
  {
    key: PANEL_KEYS.SEVERE_DISASTER,
    label: "중대재해 안전판",
    category: "안전",
    badge: "🚨 안전",
    icon: "ShieldAlert",
    description: "중대재해 안전수칙 및 무재해 일수 안내",
    color: "from-rose-500 to-orange-600"
  }
];

// 🌟 TEST 뱃지 스튜디오에서 선택 가능한 관리자 목록
export const STUDIO_MANAGERS = [
  { id: "sam_cy", name: "이창엽", title: "책임", plant: "삼랑진공장", process: "품질관리", icon: "🔬" },
  { id: "sam_yc", name: "설유철", title: "책임", plant: "삼랑진공장", process: "압출동 총괄", icon: "🏭" },
  { id: "sam_ks", name: "윤경수", title: "책임", plant: "삼랑진공장", process: "가공동 총괄", icon: "⚙️" },
  { id: "sam_in", name: "양인나", title: "선임", plant: "삼랑진공장", process: "가공동 관리", icon: "📋" },
  { id: "sam_dg", name: "유동길", title: "선임", plant: "삼랑진공장", process: "가공동 관리", icon: "📋" },
  { id: "sam_jy", name: "전재율", title: "책임", plant: "삼랑진공장", process: "설비보전", icon: "🔧" },
  { id: "sam_sg", name: "이상기", title: "기사", plant: "삼랑진공장", process: "품질관리", icon: "🔬" },
  { id: "sam_ij", name: "조인주", title: "선임", plant: "삼랑진공장", process: "오륙 근태관리", icon: "👥" },
  { id: "sam_mj", name: "이명재", title: "이사", plant: "삼랑진공장", process: "총괄관리", icon: "👑" },
  { id: "hal_dw", name: "김동욱", title: "책임", plant: "한림공장", process: "한림 총괄", icon: "👑" },
  { id: "hal_sm", name: "오상민", title: "선임", plant: "한림공장", process: "한림 가공관리", icon: "⚙️" },
  { id: "admin_kwon", name: "권태형", title: "대표이사", plant: "본사", process: "대표이사", icon: "👑" },
  { id: "admin_choi", name: "최미영", title: "전무", plant: "본사", process: "전무이사", icon: "👑" },
  { id: "hal_test", name: "TEST", title: "선임", plant: "한림공장", process: "TEST 관제", icon: "🛡️" }
];

// 기본 사내 일반 관리자 패널 목록
export const DEFAULT_INTERNAL_MANAGER_PANELS = [
  PANEL_KEYS.COMMON_SCHEDULE,
  PANEL_KEYS.CALENDAR_SCHEDULE,
  PANEL_KEYS.SALES_PURCHASE,
  PANEL_KEYS.QUALITY_SUMMARY,
  PANEL_KEYS.WORK_LOGS
];

// 관리자(ID 또는 이름)별 맞춤 패널 기본 설정표 (초기 공장 기본값: 각 관리자별 전담 공정/업무 패널을 최상단에 우선 배치)
export const MANAGER_PANEL_CONFIG = {
  // ⭐ [품질총괄: 이창엽 책임 - 부적합경보 & 4M 변동점 & 일일품질]
  "sam_cy": [
    PANEL_KEYS.QUALITY_DEFECT_ALERT_BAR,
    PANEL_KEYS.ABNORMALITY_4M,
    PANEL_KEYS.QUALITY_SUMMARY,
    PANEL_KEYS.COMMON_SCHEDULE,
    PANEL_KEYS.CALENDAR_SCHEDULE,
    PANEL_KEYS.WORK_LOGS
  ],
  "이창엽": [
    PANEL_KEYS.QUALITY_DEFECT_ALERT_BAR,
    PANEL_KEYS.ABNORMALITY_4M,
    PANEL_KEYS.QUALITY_SUMMARY,
    PANEL_KEYS.COMMON_SCHEDULE,
    PANEL_KEYS.CALENDAR_SCHEDULE,
    PANEL_KEYS.WORK_LOGS
  ],

  // ⚙️ [압출총괄: 설유철 책임 - 압출 부적합경보 & 실시간 압출작업일보 & 주간 비가동내역]
  "sam_yc": [
    PANEL_KEYS.QUALITY_DEFECT_ALERT_BAR,
    PANEL_KEYS.SEOL_EXTRUSION_REPORT,
    PANEL_KEYS.EXTRUSION_DOWNTIME,
    PANEL_KEYS.COMMON_SCHEDULE,
    PANEL_KEYS.CALENDAR_SCHEDULE,
    PANEL_KEYS.WORK_LOGS
  ],
  "설유철": [
    PANEL_KEYS.QUALITY_DEFECT_ALERT_BAR,
    PANEL_KEYS.SEOL_EXTRUSION_REPORT,
    PANEL_KEYS.EXTRUSION_DOWNTIME,
    PANEL_KEYS.COMMON_SCHEDULE,
    PANEL_KEYS.CALENDAR_SCHEDULE,
    PANEL_KEYS.WORK_LOGS
  ],

  // ⚙️ [가공총괄: 윤경수 책임 - 가공 부적합경보 & 실시간 가공작업일보(HR/JA/NX5a) & 일일품질]
  "sam_ks": [
    PANEL_KEYS.QUALITY_DEFECT_ALERT_BAR,
    PANEL_KEYS.MACHINING_WORK_REPORT,
    PANEL_KEYS.QUALITY_SUMMARY,
    PANEL_KEYS.COMMON_SCHEDULE,
    PANEL_KEYS.CALENDAR_SCHEDULE,
    PANEL_KEYS.WORK_LOGS
  ],
  "윤경수": [
    PANEL_KEYS.QUALITY_DEFECT_ALERT_BAR,
    PANEL_KEYS.MACHINING_WORK_REPORT,
    PANEL_KEYS.QUALITY_SUMMARY,
    PANEL_KEYS.COMMON_SCHEDULE,
    PANEL_KEYS.CALENDAR_SCHEDULE,
    PANEL_KEYS.WORK_LOGS
  ],

  // ⚙️ [가공담당: 양인나 선임 - 가공 부적합경보 & 실시간 가공작업일보]
  "sam_in": [
    PANEL_KEYS.QUALITY_DEFECT_ALERT_BAR,
    PANEL_KEYS.MACHINING_WORK_REPORT,
    PANEL_KEYS.COMMON_SCHEDULE,
    PANEL_KEYS.CALENDAR_SCHEDULE,
    PANEL_KEYS.WORK_LOGS
  ],
  "양인나": [
    PANEL_KEYS.QUALITY_DEFECT_ALERT_BAR,
    PANEL_KEYS.MACHINING_WORK_REPORT,
    PANEL_KEYS.COMMON_SCHEDULE,
    PANEL_KEYS.CALENDAR_SCHEDULE,
    PANEL_KEYS.WORK_LOGS
  ],

  // ⚙️ [가공담당: 유동길 선임 - 실시간 가공작업일보]
  "sam_dg": [
    PANEL_KEYS.MACHINING_WORK_REPORT,
    PANEL_KEYS.COMMON_SCHEDULE,
    PANEL_KEYS.CALENDAR_SCHEDULE,
    PANEL_KEYS.WORK_LOGS
  ],
  "유동길": [
    PANEL_KEYS.MACHINING_WORK_REPORT,
    PANEL_KEYS.COMMON_SCHEDULE,
    PANEL_KEYS.CALENDAR_SCHEDULE,
    PANEL_KEYS.WORK_LOGS
  ],

  // 🔧 [설비보전: 전재율 책임 - 압출동 주간 비가동내역 & 설비보전]
  "sam_jy": [
    PANEL_KEYS.EXTRUSION_DOWNTIME,
    PANEL_KEYS.COMMON_SCHEDULE,
    PANEL_KEYS.CALENDAR_SCHEDULE,
    PANEL_KEYS.WORK_LOGS
  ],
  "전재율": [
    PANEL_KEYS.EXTRUSION_DOWNTIME,
    PANEL_KEYS.COMMON_SCHEDULE,
    PANEL_KEYS.CALENDAR_SCHEDULE,
    PANEL_KEYS.WORK_LOGS
  ],

  // 🔬 [품질기사: 이상기 기사 - 일일품질 요약 & 4M 변동점 대장]
  "sam_sg": [
    PANEL_KEYS.QUALITY_SUMMARY,
    PANEL_KEYS.ABNORMALITY_4M,
    PANEL_KEYS.COMMON_SCHEDULE,
    PANEL_KEYS.CALENDAR_SCHEDULE,
    PANEL_KEYS.WORK_LOGS
  ],
  "이상기": [
    PANEL_KEYS.QUALITY_SUMMARY,
    PANEL_KEYS.ABNORMALITY_4M,
    PANEL_KEYS.COMMON_SCHEDULE,
    PANEL_KEYS.CALENDAR_SCHEDULE,
    PANEL_KEYS.WORK_LOGS
  ],

  // 👥 [근태담당: 조인주 선임 - 근태현황 및 5개사 관리 & 연차/일정]
  "sam_ij": [
    PANEL_KEYS.ATTENDANCE,
    PANEL_KEYS.CALENDAR_SCHEDULE,
    PANEL_KEYS.COMMON_SCHEDULE,
    PANEL_KEYS.WORK_LOGS
  ],
  "조인주": [
    PANEL_KEYS.ATTENDANCE,
    PANEL_KEYS.CALENDAR_SCHEDULE,
    PANEL_KEYS.COMMON_SCHEDULE,
    PANEL_KEYS.WORK_LOGS
  ],

  // 👑 [삼랑진공장 총괄: 이명재 이사 - 매출매입분석 & 근태현황 & 일일품질 & 업무일지 결재]
  "sam_mj": [
    PANEL_KEYS.SALES_PURCHASE,
    PANEL_KEYS.ATTENDANCE,
    PANEL_KEYS.QUALITY_SUMMARY,
    PANEL_KEYS.WORK_LOGS,
    PANEL_KEYS.COMMON_SCHEDULE,
    PANEL_KEYS.CALENDAR_SCHEDULE
  ],
  "이명재": [
    PANEL_KEYS.SALES_PURCHASE,
    PANEL_KEYS.ATTENDANCE,
    PANEL_KEYS.QUALITY_SUMMARY,
    PANEL_KEYS.WORK_LOGS,
    PANEL_KEYS.COMMON_SCHEDULE,
    PANEL_KEYS.CALENDAR_SCHEDULE
  ],

  // 👑 [한림공장 총괄: 김동욱 책임 - 조영 부적합경보 & 한림 근태 & 일일품질 & 업무일지 결재]
  "hal_dw": [
    PANEL_KEYS.QUALITY_DEFECT_ALERT_BAR,
    PANEL_KEYS.ATTENDANCE,
    PANEL_KEYS.QUALITY_SUMMARY,
    PANEL_KEYS.WORK_LOGS,
    PANEL_KEYS.COMMON_SCHEDULE,
    PANEL_KEYS.CALENDAR_SCHEDULE
  ],
  "김동욱": [
    PANEL_KEYS.QUALITY_DEFECT_ALERT_BAR,
    PANEL_KEYS.ATTENDANCE,
    PANEL_KEYS.QUALITY_SUMMARY,
    PANEL_KEYS.WORK_LOGS,
    PANEL_KEYS.COMMON_SCHEDULE,
    PANEL_KEYS.CALENDAR_SCHEDULE
  ],

  // ⚙️ [한림 가공담당: 오상민 선임 - 조영 부적합경보 & 일일품질 요약]
  "hal_sm": [
    PANEL_KEYS.QUALITY_DEFECT_ALERT_BAR,
    PANEL_KEYS.QUALITY_SUMMARY,
    PANEL_KEYS.COMMON_SCHEDULE,
    PANEL_KEYS.CALENDAR_SCHEDULE,
    PANEL_KEYS.WORK_LOGS
  ],
  "오상민": [
    PANEL_KEYS.QUALITY_DEFECT_ALERT_BAR,
    PANEL_KEYS.QUALITY_SUMMARY,
    PANEL_KEYS.COMMON_SCHEDULE,
    PANEL_KEYS.CALENDAR_SCHEDULE,
    PANEL_KEYS.WORK_LOGS
  ],

  // 👑 [본사 경영진: 권태형 대표이사 - 매출매입 & 근태 & 품질 & 결재]
  "admin_kwon": [
    PANEL_KEYS.SALES_PURCHASE,
    PANEL_KEYS.ATTENDANCE,
    PANEL_KEYS.QUALITY_SUMMARY,
    PANEL_KEYS.WORK_LOGS,
    PANEL_KEYS.COMMON_SCHEDULE,
    PANEL_KEYS.CALENDAR_SCHEDULE
  ],
  "권태형": [
    PANEL_KEYS.SALES_PURCHASE,
    PANEL_KEYS.ATTENDANCE,
    PANEL_KEYS.QUALITY_SUMMARY,
    PANEL_KEYS.WORK_LOGS,
    PANEL_KEYS.COMMON_SCHEDULE,
    PANEL_KEYS.CALENDAR_SCHEDULE
  ],

  // 👑 [본사 경영진: 최미영 전무 - 매출매입 & 근태 & 품질 & 결재]
  "admin_choi": [
    PANEL_KEYS.SALES_PURCHASE,
    PANEL_KEYS.ATTENDANCE,
    PANEL_KEYS.QUALITY_SUMMARY,
    PANEL_KEYS.WORK_LOGS,
    PANEL_KEYS.COMMON_SCHEDULE,
    PANEL_KEYS.CALENDAR_SCHEDULE
  ],
  "최미영": [
    PANEL_KEYS.SALES_PURCHASE,
    PANEL_KEYS.ATTENDANCE,
    PANEL_KEYS.QUALITY_SUMMARY,
    PANEL_KEYS.WORK_LOGS,
    PANEL_KEYS.COMMON_SCHEDULE,
    PANEL_KEYS.CALENDAR_SCHEDULE
  ],

  // 🛡️ [한림공장 TEST 관리자 - 공통일정 & 캘린더 & 텔레그램 & 양식빌더]
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

// 패널 설정 캐시 버전
export const PANEL_CONFIG_VERSION = "20261029_v16_purge_incoming";

/**
 * 특정 사용자의 활성 대시보드 패널 목록 조회
 * (1순위: TEST 뱃지에서 저장된 Firestore/로컬 커스텀 레이아웃 -> 2순위: 시스템 기본 설정표)
 */
export const getPanelsForUser = (profile) => {
  if (!profile) return DEFAULT_INTERNAL_MANAGER_PANELS;
  const id = profile.id;
  const name = profile.name;

  // 1. 저장된 커스텀 레이아웃 우선 확인 (Firestore 및 로컬스토리지 동기화 값)
  if (id) {
    const customById = getCustomLayoutForManager(id);
    if (customById && Array.isArray(customById) && customById.length > 0) {
      return customById.filter((key) => key !== "incoming_inspection");
    }
  }
  if (name) {
    const customByName = getCustomLayoutForManager(name);
    if (customByName && Array.isArray(customByName) && customByName.length > 0) {
      return customByName.filter((key) => key !== "incoming_inspection");
    }
  }

  // 2. 관리자(ID 또는 이름)별 맞춤 패널 초기 설정표 매핑
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
