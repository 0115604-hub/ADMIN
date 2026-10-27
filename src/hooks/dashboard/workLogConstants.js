// ============================================================================
// 📋 업무일보 대시보드 공통 상수 및 설정 (Work Log Constants & Maps)
// ============================================================================

export const DEFECT_TYPE_GROUPS = [
  {
    category: "제품부적합",
    label: "📦 제품부적합",
    items: [
      { value: "[제품부적합] 치수", name: "치수" },
      { value: "[제품부적합] 외관", name: "외관" },
      { value: "[제품부적합] 조립", name: "조립" },
      { value: "[제품부적합] 누락/혼입", name: "누락/혼입" }
    ]
  },
  {
    category: "공정부적합",
    label: "⚙️ 공정부적합",
    items: [
      { value: "[공정부적합] 작업조건미준수", name: "작업조건미준수" },
      { value: "[공정부적합] 검사누락", name: "검사누락" },
      { value: "[공정부적합] 설비조건이상", name: "설비조건이상" },
      { value: "[공정부적합] 금형이상", name: "금형이상" },
      { value: "[공정부적합] 치공구이상", name: "치공구이상" }
    ]
  }
];

export const JAEYUL_EQUIPMENT_CATEGORIES = [
  "압출기",
  "사출기",
  "컴프레셔",
  "코팅설비",
  "치공구",
  "기타"
];

export const JAEYUL_EQUIPMENT_OPTIONS = [
  "PCM 1호",
  "PCM 3호",
  "TPE 1호",
  "PVC",
  "300TON",
  "45TON",
  "25TON",
  "압출동 컴프레셔",
  "AB동 컴프레셔",
  "C동 컴프레셔",
  "코팅(8턴)",
  "코팅(서랍)",
  "내용직접입력"
];

export const JAEYUL_CATEGORY_EQUIPMENT_MAP = {
  "압출기": ["PCM 1호", "PCM 3호", "TPE 1호", "PVC", "내용직접입력"],
  "사출기": ["300TON", "45TON", "25TON", "내용직접입력"],
  "컴프레셔": ["압출동 컴프레셔", "AB동 컴프레셔", "C동 컴프레셔", "내용직접입력"],
  "코팅설비": ["코팅(8턴)", "코팅(서랍)", "내용직접입력"],
  "치공구": ["내용직접입력"],
  "기타": ["내용직접입력"]
};

export const LOGS_PER_PAGE = 12;
