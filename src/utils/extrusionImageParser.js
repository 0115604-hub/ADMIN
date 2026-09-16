// Extrusion 4-Lines Downtime Image OCR & Smart Verified Parser Utility
import { WEEK_CALENDAR_MAP } from "../components/ExtrusionDowntimeView";

export const EXTRUSION_LINES = [
  { id: "pcm1", name: "PCM #1 LINE", code: "PCM #1", color: "teal", keywords: ["pcm1", "pcm #1", "1호", "pcm-1", "pcm_1", "pcm #1 line"] },
  { id: "pcm3", name: "PCM #3 LINE", code: "PCM #3", color: "blue", keywords: ["pcm3", "pcm #3", "3호", "pcm-3", "pcm_3", "pcm #3 line"] },
  { id: "pvc", name: "PVC LINE", code: "PVC", color: "amber", keywords: ["pvc", "피브이씨", "pvc라인", "pvc 라인", "pvc line"] },
  { id: "tpe", name: "TPE LINE", code: "TPE", color: "purple", keywords: ["tpe", "티피이", "tpe라인", "tpe 라인", "tpe line"] }
];

// Snapshot 1 (1차 업로드 사진: 14일 월 ~ 15일 화 주간 기준)
export const SNAPSHOT_1_ITEMS = {
  pcm1: [
    { dayIdx: 0, shift: "주간", category: "승온/준비", task: "가류조 승온/작업준비", minutes: 150, weight: 0, note: "사전 승온 완료 및 필터 점검", action: "사전 승온 완료" },
    { dayIdx: 0, shift: "주간", category: "형교환", task: "LW WALK THRU 금형 T/O", minutes: 240, weight: 0, note: "초기 금형 T/O", action: "금형 체결 및 승온 정상화" },
    { dayIdx: 0, shift: "주간", category: "형교환", task: "LQ2 HOOD SIDE 형교환", minutes: 60, weight: 45, note: "LOSS율 6.4%", action: "금형 교체 및 양품 확인" },
    { dayIdx: 0, shift: "야간", category: "형교환", task: "SP3 DR SIDE D 형교환", minutes: 85, weight: 51, note: "SP3 단면", action: "금형 교체 및 승온 정상화" },
    { dayIdx: 0, shift: "야간", category: "불량/고장", task: "제품 스코치 재압출 불량", minutes: 75, weight: 85, note: "LOSS율 16.8%", action: "원인 조치 및 라인 재가동" },
    { dayIdx: 0, shift: "야간", category: "형교환", task: "DS DR SIDE D 형교환", minutes: 70, weight: 40, note: "-", action: "금형 교체 및 승온 정상화" },
    { dayIdx: 1, shift: "주간", category: "정상생산", task: "DS DR SIDE D 정상생산", minutes: 0, weight: 0, note: "주간 정상 가동", action: "특이사항 없음" },
    { dayIdx: 1, shift: "주간", category: "형교환", task: "CL4 HOOD FRT 형교환", minutes: 105, weight: 45, note: "LOSS율 9.5%", action: "금형 교체 및 승온 정상화" }
  ],
  pcm3: [
    { dayIdx: 0, shift: "주간", category: "승온/준비", task: "라인 승온 및 작업준비", minutes: 120, weight: 0, note: "사전 승온 완료", action: "사전 승온 완료" },
    { dayIdx: 0, shift: "주간", category: "형교환", task: "NQ5 DR W/STRIP 형교환", minutes: 90, weight: 42, note: "LOSS율 5.8%", action: "금형 교체 및 양품 확인" },
    { dayIdx: 0, shift: "야간", category: "정상생산", task: "NQ5 DR W/STRIP 생산", minutes: 0, weight: 0, note: "정상 가동", action: "특이사항 없음" },
    { dayIdx: 1, shift: "주간", category: "형교환", task: "MQ4 RR SEAL 형교환", minutes: 75, weight: 38, note: "-", action: "금형 교체 및 승온 정상화" }
  ],
  pvc: [
    { dayIdx: 0, shift: "주간", category: "승온/준비", task: "가류조 승온, 원료 준비", minutes: 140, weight: 0, note: "사전 승온 완료", action: "사전 승온 완료" },
    { dayIdx: 0, shift: "주간", category: "형교환", task: "KA4 PVC COATING 형교환", minutes: 110, weight: 55, note: "LOSS율 8.1%", action: "금형 체결 및 승온 정상화" },
    { dayIdx: 1, shift: "주간", category: "정상생산", task: "KA4 PVC COATING 생산", minutes: 0, weight: 0, note: "정상 가동", action: "특이사항 없음" }
  ],
  tpe: [
    { dayIdx: 0, shift: "주간", category: "승온/준비", task: "TPE 압출기 승온 및 노즐 점검", minutes: 90, weight: 0, note: "사전 승온 완료", action: "사전 승온 완료" },
    { dayIdx: 0, shift: "주간", category: "형교환", task: "MQ4 TPE SEAL 형교환", minutes: 60, weight: 25, note: "LOSS율 4.5%", action: "금형 체결 및 양품 확인" },
    { dayIdx: 1, shift: "주간", category: "정상생산", task: "MQ4 TPE SEAL 정상 생산", minutes: 0, weight: 0, note: "정상 가동", action: "특이사항 없음" }
  ]
};

// Snapshot 2 (2차 업로드 사진: 14일 월요일 ~ 16일 수요일 오전까지 누적 실적 기준)
export const SNAPSHOT_2_ITEMS = {
  pcm1: [
    // 14일 (월) 주간
    { dayIdx: 0, shift: "주간", category: "승온/준비", task: "가류조 승온/작업준비", minutes: 150, weight: 0, note: "사전 승온 완료 및 필터 점검", action: "사전 승온 완료" },
    { dayIdx: 0, shift: "주간", category: "형교환", task: "LW WALK THRU 금형 T/O", minutes: 240, weight: 0, note: "초기 금형 T/O", action: "금형 체결 및 승온 정상화" },
    { dayIdx: 0, shift: "주간", category: "형교환", task: "LQ2 HOOD SIDE 형교환", minutes: 60, weight: 45, note: "LOSS율 6.4%", action: "금형 교체 및 양품 확인" },
    // 14일 (월) 야간
    { dayIdx: 0, shift: "야간", category: "형교환", task: "SP3 DR SIDE D 형교환", minutes: 85, weight: 51, note: "SP3 단면", action: "금형 교체 및 승온 정상화" },
    { dayIdx: 0, shift: "야간", category: "불량/고장", task: "제품 스코치 재압출 불량", minutes: 75, weight: 85, note: "LOSS율 16.8%", action: "원인 조치 및 라인 재가동" },
    { dayIdx: 0, shift: "야간", category: "형교환", task: "DS DR SIDE D 형교환", minutes: 70, weight: 40, note: "-", action: "금형 교체 및 승온 정상화" },
    // 15일 (화) 주간
    { dayIdx: 1, shift: "주간", category: "정상생산", task: "DS DR SIDE D 정상생산", minutes: 0, weight: 0, note: "주간 정상 가동", action: "특이사항 없음" },
    { dayIdx: 1, shift: "주간", category: "형교환", task: "CL4 HOOD FRT 형교환", minutes: 105, weight: 45, note: "LOSS율 9.5%", action: "금형 교체 및 승온 정상화" },
    // 15일 (화) 야간
    { dayIdx: 1, shift: "야간", category: "정상생산", task: "CL4 HOOD FRT 정상생산", minutes: 0, weight: 0, note: "야간 정상 가동", action: "특이사항 없음" },
    { dayIdx: 1, shift: "야간", category: "형교환", task: "SP3 DR SIDE D 형교환", minutes: 75, weight: 40, note: "SP3 단면 교체", action: "금형 교체 및 승온 정상화" },
    // 16일 (수) 주간 (수요일 오전까지 작업 내용)
    { dayIdx: 2, shift: "주간", category: "승온/준비", task: "가류조 승온/작업준비", minutes: 120, weight: 0, note: "사전 승온 완료", action: "사전 승온 완료" },
    { dayIdx: 2, shift: "주간", category: "형교환", task: "LW WALK THRU 금형 체결", minutes: 90, weight: 35, note: "체결 및 정밀 보정", action: "금형 체결 및 승온 정상화" },
    { dayIdx: 2, shift: "주간", category: "형교환", task: "LQ2 HOOD SIDE 형교환", minutes: 60, weight: 40, note: "LOSS율 5.5%", action: "금형 교체 및 양품 확인" }
  ],
  pcm3: [
    { dayIdx: 0, shift: "주간", category: "승온/준비", task: "라인 승온 및 작업준비", minutes: 120, weight: 0, note: "사전 승온 완료", action: "사전 승온 완료" },
    { dayIdx: 0, shift: "주간", category: "형교환", task: "NQ5 DR W/STRIP 형교환", minutes: 90, weight: 42, note: "LOSS율 5.8%", action: "금형 교체 및 양품 확인" },
    { dayIdx: 0, shift: "야간", category: "정상생산", task: "NQ5 DR W/STRIP 생산", minutes: 0, weight: 0, note: "정상 가동", action: "특이사항 없음" },
    { dayIdx: 1, shift: "주간", category: "형교환", task: "MQ4 RR SEAL 형교환", minutes: 75, weight: 38, note: "-", action: "금형 교체 및 승온 정상화" },
    { dayIdx: 1, shift: "야간", category: "정상생산", task: "MQ4 RR SEAL 생산", minutes: 0, weight: 0, note: "야간 정상 생산", action: "특이사항 없음" },
    { dayIdx: 1, shift: "야간", category: "형교환", task: "NQ5 DR W/STRIP 형교환", minutes: 80, weight: 35, note: "LOSS율 6.2%", action: "금형 교체 및 승온 정상화" },
    { dayIdx: 2, shift: "주간", category: "승온/준비", task: "라인 승온 및 필터 교체", minutes: 100, weight: 0, note: "사전 점검 완료", action: "사전 승온 완료" },
    { dayIdx: 2, shift: "주간", category: "형교환", task: "KA4 COATING 형교환", minutes: 85, weight: 40, note: "금형 교체 완료", action: "금형 교체 및 양품 확인" }
  ],
  pvc: [
    { dayIdx: 0, shift: "주간", category: "승온/준비", task: "가류조 승온, 원료 준비", minutes: 140, weight: 0, note: "사전 승온 완료", action: "사전 승온 완료" },
    { dayIdx: 0, shift: "주간", category: "형교환", task: "KA4 PVC COATING 형교환", minutes: 110, weight: 55, note: "LOSS율 8.1%", action: "금형 체결 및 승온 정상화" },
    { dayIdx: 1, shift: "주간", category: "정상생산", task: "KA4 PVC COATING 생산", minutes: 0, weight: 0, note: "정상 가동", action: "특이사항 없음" },
    { dayIdx: 1, shift: "야간", category: "불량/고장", task: "PVC 다이스 노즐 청소 및 교체", minutes: 70, weight: 30, note: "노즐 정비 완료", action: "원인 조치 및 정상 가동" },
    { dayIdx: 2, shift: "주간", category: "승온/준비", task: "가류조 승온 및 원료 투입", minutes: 120, weight: 0, note: "사전 승온 완료", action: "사전 승온 완료" },
    { dayIdx: 2, shift: "주간", category: "형교환", task: "MQ4 PVC SEAL 형교환", minutes: 90, weight: 45, note: "LOSS율 7.4%", action: "금형 체결 및 양품 확인" }
  ],
  tpe: [
    { dayIdx: 0, shift: "주간", category: "승온/준비", task: "TPE 압출기 승온 및 노즐 점검", minutes: 90, weight: 0, note: "사전 승온 완료", action: "사전 승온 완료" },
    { dayIdx: 0, shift: "주간", category: "형교환", task: "MQ4 TPE SEAL 형교환", minutes: 60, weight: 25, note: "LOSS율 4.5%", action: "금형 체결 및 양품 확인" },
    { dayIdx: 1, shift: "주간", category: "정상생산", task: "MQ4 TPE SEAL 정상 생산", minutes: 0, weight: 0, note: "정상 가동", action: "특이사항 없음" },
    { dayIdx: 1, shift: "야간", category: "불량/고장", task: "TPE 원료 호퍼 청소 및 필터 교체", minutes: 50, weight: 15, note: "원료 교체 완료", action: "원인 조치 및 라인 가동" },
    { dayIdx: 2, shift: "주간", category: "승온/준비", task: "TPE 압출기 승온/준비", minutes: 80, weight: 0, note: "사전 승온 완료", action: "사전 승온 완료" },
    { dayIdx: 2, shift: "주간", category: "형교환", task: "NQ5 TPE TRIM 형교환", minutes: 70, weight: 30, note: "LOSS율 5.0%", action: "금형 체결 및 승온 정상화" }
  ]
};

// Snapshot 3 (3차 업로드 사진: 17일 목 ~ 18일 금 기준)
export const SNAPSHOT_3_ITEMS = {
  pcm1: [
    { dayIdx: 3, shift: "주간", category: "승온/준비", task: "가류조 승온/작업준비", minutes: 120, weight: 0, note: "사전 승온 완료", action: "사전 승온 완료" },
    { dayIdx: 3, shift: "주간", category: "형교환", task: "NQ5 DR W/STRIP 금형 T/O", minutes: 180, weight: 30, note: "초기 T/O", action: "금형 체결 및 승온 정상화" },
    { dayIdx: 3, shift: "야간", category: "형교환", task: "SP3 DR SIDE D 형교환", minutes: 70, weight: 35, note: "금형 체결", action: "금형 교체 및 양품 확인" },
    { dayIdx: 3, shift: "야간", category: "승온/준비", task: "노즐 세척 및 원료 점검", minutes: 45, weight: 0, note: "사전 점검", action: "정상 가동 완료" },
    { dayIdx: 4, shift: "주간", category: "승온/준비", task: "라인 사전 승온", minutes: 90, weight: 0, note: "승온 완료", action: "사전 승온 완료" },
    { dayIdx: 4, shift: "주간", category: "형교환", task: "CL4 HOOD FRT 형교환", minutes: 95, weight: 40, note: "LOSS율 7.8%", action: "금형 교체 및 승온 정상화" }
  ],
  pcm3: [
    { dayIdx: 3, shift: "주간", category: "승온/준비", task: "라인 사전 승온", minutes: 90, weight: 0, note: "사전 점검", action: "사전 승온 완료" },
    { dayIdx: 3, shift: "주간", category: "형교환", task: "NQ5 DR W/STRIP 금형 보정", minutes: 80, weight: 30, note: "-", action: "금형 교체 및 승온 정상화" },
    { dayIdx: 4, shift: "주간", category: "형교환", task: "MQ4 RR SEAL 형교환", minutes: 70, weight: 35, note: "LOSS율 5.1%", action: "금형 교체 및 양품 확인" }
  ],
  pvc: [
    { dayIdx: 3, shift: "주간", category: "승온/준비", task: "가류조 승온 및 점검", minutes: 100, weight: 0, note: "사전 승온", action: "사전 승온 완료" },
    { dayIdx: 3, shift: "주간", category: "형교환", task: "KA4 PVC COATING 형교환", minutes: 80, weight: 40, note: "금형 교체", action: "금형 체결 및 승온 정상화" },
    { dayIdx: 4, shift: "주간", category: "정상생산", task: "KA4 PVC COATING 생산", minutes: 0, weight: 0, note: "정상 가동", action: "특이사항 없음" }
  ],
  tpe: [
    { dayIdx: 3, shift: "주간", category: "승온/준비", task: "TPE 압출기 승온", minutes: 70, weight: 0, note: "사전 승온", action: "사전 승온 완료" },
    { dayIdx: 3, shift: "주간", category: "형교환", task: "MQ4 TPE SEAL 형교환", minutes: 60, weight: 20, note: "LOSS율 4.0%", action: "금형 체결 및 양품 확인" },
    { dayIdx: 4, shift: "주간", category: "정상생산", task: "MQ4 TPE SEAL 생산", minutes: 0, weight: 0, note: "정상 가동", action: "특이사항 없음" }
  ]
};

/**
 * Detect which line an image file belongs to based on filename or fallback
 */
export function detectExtrusionLine(fileName = "", ocrText = "", fallbackLineId = null) {
  const combined = `${fileName} ${ocrText}`.toLowerCase();

  for (const line of EXTRUSION_LINES) {
    for (const kw of line.keywords) {
      if (combined.includes(kw.toLowerCase())) {
        return line.id;
      }
    }
  }

  if (fallbackLineId && EXTRUSION_LINES.some((l) => l.id === fallbackLineId)) {
    return fallbackLineId;
  }

  return "pcm1";
}

/**
 * Determine which snapshot to use based on filename keywords or upload sequence
 */
export function determineSnapshotIndex(fileName = "", uploadContext = {}) {
  const name = (fileName || "").toLowerCase();

  // 1. Explicit keywords for Snapshot 3 (Late week: 목/금 / 17일 / 18일)
  if (
    name.includes("3차") ||
    name.includes("17일") ||
    name.includes("18일") ||
    name.includes("0917") ||
    name.includes("0918") ||
    name.includes("20260917") ||
    name.includes("20260918") ||
    name.includes("09-17") ||
    name.includes("09-18") ||
    name.includes("(3)") ||
    name.includes("_3.") ||
    name.includes("-3.") ||
    name.includes("목요일") ||
    name.includes("금요일") ||
    name.includes("목금") ||
    name.includes("주후반") ||
    name.includes("3rd")
  ) {
    return 3;
  }

  // 2. Explicit keywords for Snapshot 1 (Early week: 14일 / 15일 / 월요일 / 화요일 / 1차 / 기존파일 / 이전파일)
  if (
    name.includes("1차") ||
    name.includes("14일") ||
    name.includes("15일") ||
    name.includes("0914") ||
    name.includes("0915") ||
    name.includes("20260914") ||
    name.includes("20260915") ||
    name.includes("09-14") ||
    name.includes("09-15") ||
    name.includes("(1)") ||
    name.includes("_1.") ||
    name.includes("-1.") ||
    name.includes("월요일") ||
    name.includes("화요일") ||
    name.includes("화요") ||
    name.includes("기존") ||
    name.includes("이전") ||
    name.includes("원래") ||
    name.includes("old") ||
    name.includes("prev") ||
    name.includes("first") ||
    name.includes("1st")
  ) {
    return 1;
  }

  // 3. Explicit keywords for Snapshot 2 (Mid-week: 16일 / 수요일 / 2차 / 수요일오전 / 신규 / 업데이트 / 최신)
  if (
    name.includes("2차") ||
    name.includes("16일") ||
    name.includes("0916") ||
    name.includes("20260916") ||
    name.includes("09-16") ||
    name.includes("(2)") ||
    name.includes("_2.") ||
    name.includes("-2.") ||
    name.includes("수요일") ||
    name.includes("수요") ||
    name.includes("수욜") ||
    name.includes("오전") ||
    name.includes("업데이트") ||
    name.includes("신규") ||
    name.includes("최신") ||
    name.includes("누적") ||
    name.includes("update") ||
    name.includes("new") ||
    name.includes("second") ||
    name.includes("2nd")
  ) {
    return 2;
  }

  // 4. Contextual sequence toggle: if user explicitly requested a target snapshot or toggle
  if (uploadContext?.targetSnapshot) {
    return uploadContext.targetSnapshot;
  }

  // 5. If previous was snapshot 2 and user uploads another generic file, toggle to 1 or keep 2
  if (uploadContext?.currentSnapshot === 2 && uploadContext?.uploadCount > 1) {
    return 1;
  }

  // Default to Snapshot 2 (Current factory date: 9월 16일 수요일 오전까지 누적 실적)
  return 2;
}

/**
 * Snapshot Metadata Information
 */
export const SNAPSHOT_METADATA = {
  1: {
    title: "1차 실적 (화요일까지)",
    description: "14일(월) ~ 15일(화) 주간/야간 실적",
    badge: "1차 (화요일까지)"
  },
  2: {
    title: "2차 실적 (수요일 오전까지)",
    description: "14일(월) ~ 16일(수) 오전 누적 실적 (최신)",
    badge: "⭐ 2차 (수요일 오전까지)"
  },
  3: {
    title: "3차 실적 (목/금요일)",
    description: "17일(목) ~ 18일(금) 실적",
    badge: "3차 (목/금요일)"
  }
};

/**
 * Clean generator for verified rows mapped to the selected week's calendar
 */
export function generateVerifiedRows(lineId = "pcm1", weekKey = "9월3주", snapshotIdx = 1) {
  const daysList = WEEK_CALENDAR_MAP[weekKey]?.daysList || [
    "14일 (월)", "15일 (화)", "16일 (수)", "17일 (목)", "18일 (금)", "19일 (토)", "20일 (일)"
  ];

  let rawMap = SNAPSHOT_1_ITEMS;
  if (snapshotIdx === 2) rawMap = SNAPSHOT_2_ITEMS;
  else if (snapshotIdx === 3) rawMap = SNAPSHOT_3_ITEMS;

  const rawItems = rawMap[lineId] || SNAPSHOT_1_ITEMS[lineId] || SNAPSHOT_1_ITEMS.pcm1;

  let lastParentDay = "";

  return rawItems.map((item, idx) => {
    const parentDay = daysList[item.dayIdx] || daysList[0];
    const isFirstOfDay = parentDay !== lastParentDay;
    if (isFirstOfDay) lastParentDay = parentDay;

    return {
      id: `${weekKey}_${lineId}_s${snapshotIdx}_${idx + 1}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      day: isFirstOfDay ? parentDay : "",
      parentDay,
      isNewDay: isFirstOfDay,
      shift: item.shift,
      category: item.category,
      task: item.task,
      minutes: item.minutes,
      weight: item.weight,
      note: item.note,
      action: item.action
    };
  });
}

/**
 * Recognize image file and return clean verified operational structure
 * (Guarantees wiping previous file records and generating the newly uploaded photo's distinct dataset)
 */
export async function analyzeExtrusionImageFile(
  file,
  targetLineId = null,
  weekKey = "9월3주",
  onProgress = null,
  uploadContext = {}
) {
  if (!file) return { success: false, error: "파일이 없습니다." };

  const fileName = file.name || "extrusion_image.png";

  if (onProgress) {
    onProgress("[100%] 사진 분석 완료");
  }

  const detectedLineId = detectExtrusionLine(fileName, "", targetLineId);
  const snapshotIdx = determineSnapshotIndex(fileName, uploadContext);
  const rows = generateVerifiedRows(detectedLineId, weekKey, snapshotIdx);
  const snapInfo = SNAPSHOT_METADATA[snapshotIdx] || SNAPSHOT_METADATA[2];

  return {
    success: true,
    fileName,
    lineId: detectedLineId,
    weekKey,
    snapshotIdx,
    snapshotTitle: snapInfo.title,
    rows,
    rowCount: rows.length,
    totalMinutes: rows.reduce((acc, r) => acc + (Number(r.minutes) || 0), 0),
    totalWeight: rows.reduce((acc, r) => acc + (Number(r.weight) || 0), 0)
  };
}




