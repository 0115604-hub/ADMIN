/**
 * 🎨 panelThemeConfig.js
 * 관리자 대시보드 패널의 제목 및 디자인 테마 설정 프리셋
 */

export const DEFAULT_PANEL_SETTING = {
  customTitle: "", // 커스텀 전체 제목 (비어있으면 기본 label 사용)
  customTopTitle: "", // 복합 패널의 상단 타이틀 (예: 이창엽의 4M 정식대장)
  customBottomTitle: "", // 복합 패널의 하단 타이틀 (예: 전사 4M 취합대장)
  customBadge: "", // 커스텀 뱃지 명칭 (예: '🌟 개인', '전사 통합', '품질' 등)
  hideBadge: false, // 뱃지 완전 삭제 여부
  hideSubtitle: true, // 제목 하단 주석/부연설명 숨김 여부 (기본: 깔끔하게 숨김)
  theme: "indigo", // 디자인 테마 키: indigo, ocean, emerald, slate, amber, light
  borderRadius: "rounded-2xl", // rounded-2xl | rounded-3xl | rounded-xl
  borderStyle: "border-2", // border-2 | border | border-4
  fontSize: "sm" // sm (표준 text-sm) | base (크게 text-base) | xs (작게 text-xs)
};

export const PANEL_THEMES = {
  indigo: {
    id: "indigo",
    label: "인디고 딥 (표준 프리미엄)",
    desc: "고대비 다크 네이비와 인디고 액센트의 표준 프리미엄 스타일",
    headerBg: "bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white",
    cardBg: "bg-white dark:bg-slate-900",
    borderClass: "border-indigo-500/30",
    accentBadge: "bg-indigo-600 text-white shadow-xs border border-indigo-400/40",
    accentText: "text-indigo-400 dark:text-indigo-300",
    iconGradient: "from-indigo-600 via-purple-600 to-rose-600",
    tableThead: "bg-slate-100/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300",
    colorHex: "#6366f1"
  },
  ocean: {
    id: "ocean",
    label: "오션 네이비 (청명한 블루)",
    desc: "청명한 스카이블루와 네이비가 어우러진 현대적인 엔지니어링 테마",
    headerBg: "bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 text-white",
    cardBg: "bg-white dark:bg-slate-900",
    borderClass: "border-sky-500/40",
    accentBadge: "bg-sky-600 text-white shadow-xs border border-sky-400/40",
    accentText: "text-sky-400 dark:text-sky-300",
    iconGradient: "from-sky-500 via-blue-600 to-indigo-600",
    tableThead: "bg-slate-100/90 dark:bg-sky-950/70 text-slate-700 dark:text-sky-200",
    colorHex: "#0ea5e9"
  },
  emerald: {
    id: "emerald",
    label: "에메랄드 포레스트 (안전 그린)",
    desc: "안전제일과 높은 신뢰도를 상징하는 차분한 그린 테마",
    headerBg: "bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white",
    cardBg: "bg-white dark:bg-slate-900",
    borderClass: "border-emerald-500/40",
    accentBadge: "bg-emerald-600 text-white shadow-xs border border-emerald-400/40",
    accentText: "text-emerald-400 dark:text-emerald-300",
    iconGradient: "from-emerald-500 via-teal-600 to-cyan-600",
    tableThead: "bg-slate-100/90 dark:bg-emerald-950/70 text-slate-700 dark:text-emerald-200",
    colorHex: "#10b981"
  },
  slate: {
    id: "slate",
    label: "모던 슬레이트 (다크 모노톤)",
    desc: "군더더기 없는 미니멀 다크 모노톤 테마",
    headerBg: "bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-white",
    cardBg: "bg-white dark:bg-slate-900",
    borderClass: "border-slate-700",
    accentBadge: "bg-slate-700 text-white shadow-xs border border-slate-600",
    accentText: "text-slate-300",
    iconGradient: "from-slate-600 to-slate-800",
    tableThead: "bg-slate-100/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300",
    colorHex: "#64748b"
  },
  amber: {
    id: "amber",
    label: "웜 앰버 (활력 오렌지)",
    desc: "시인성이 높은 따뜻한 앰버 골드 테마",
    headerBg: "bg-gradient-to-r from-slate-900 via-amber-950 to-slate-900 text-white",
    cardBg: "bg-white dark:bg-slate-900",
    borderClass: "border-amber-500/40",
    accentBadge: "bg-amber-600 text-white shadow-xs border border-amber-400/40",
    accentText: "text-amber-400 dark:text-amber-300",
    iconGradient: "from-amber-500 via-orange-600 to-rose-600",
    tableThead: "bg-slate-100/90 dark:bg-amber-950/70 text-slate-700 dark:text-amber-200",
    colorHex: "#f59e0b"
  },
  light: {
    id: "light",
    label: "클린 화이트 (라이트 모드)",
    desc: "밝고 명확한 오피스 라이트 스타일",
    headerBg: "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700",
    cardBg: "bg-white dark:bg-slate-900",
    borderClass: "border-slate-300 dark:border-slate-700",
    accentBadge: "bg-indigo-600 text-white shadow-xs",
    accentText: "text-indigo-600 dark:text-indigo-300",
    iconGradient: "from-indigo-500 to-blue-600",
    tableThead: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200",
    colorHex: "#e2e8f0"
  }
};

export const BORDER_RADIUS_OPTIONS = [
  { id: "rounded-2xl", label: "표준 곡선 (rounded-2xl)", desc: "가장 균형 잡힌 기본 곡률" },
  { id: "rounded-3xl", label: "부드러운 곡선 (rounded-3xl)", desc: "크고 부드러운 라운딩" },
  { id: "rounded-xl", label: "모던 슬림 (rounded-xl)", desc: "각진 모던 스타일" }
];

export const BORDER_STYLE_OPTIONS = [
  { id: "border-2", label: "강조 테두리 (2px)", desc: "또렷한 테두리 (권장)" },
  { id: "border", label: "슬림 테두리 (1px)", desc: "은은하고 얇은 테두리" },
  { id: "border-4", label: "굵은 테두리 (4px)", desc: "강한 시각적 구획" }
];

export const FONT_SIZE_OPTIONS = [
  { id: "sm", label: "표준 크기 (14px)", titleClass: "text-sm sm:text-base", desc: "권장 표준 폰트" },
  { id: "base", label: "시인성 강화 (16px)", titleClass: "text-base sm:text-lg", desc: "크고 명확한 폰트" },
  { id: "xs", label: "고밀도 소형 (12px)", titleClass: "text-xs sm:text-sm", desc: "공간 절약형 폰트" }
];
