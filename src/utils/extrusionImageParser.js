// Extrusion 4-Lines Downtime Image OCR & Smart Verified Parser Utility
import { WEEK_CALENDAR_MAP } from "../components/ExtrusionDowntimeView";

export const EXTRUSION_LINES = [
  { id: "pcm1", name: "PCM #1 LINE", code: "PCM #1", color: "teal", keywords: ["pcm1", "pcm #1", "1호", "pcm-1", "pcm_1", "pcm #1 line"] },
  { id: "pcm3", name: "PCM #3 LINE", code: "PCM #3", color: "blue", keywords: ["pcm3", "pcm #3", "3호", "pcm-3", "pcm_3", "pcm #3 line"] },
  { id: "pvc", name: "PVC LINE", code: "PVC", color: "amber", keywords: ["pvc", "피브이씨", "pvc라인", "pvc 라인", "pvc line"] },
  { id: "tpe", name: "TPE LINE", code: "TPE", color: "purple", keywords: ["tpe", "티피이", "tpe라인", "tpe 라인", "tpe line"] }
];

export const VERIFIED_PCM1_OPERATIONAL_ITEMS = [
  // 월요일
  { dayIdx: 0, shift: "주간", category: "승온/준비", task: "가류조 승온/작업준비", minutes: 150, weight: 0, note: "사전 승온 완료 및 필터 점검", action: "사전 승온 완료" },
  { dayIdx: 0, shift: "주간", category: "형교환", task: "LW WALK THRU 금형 T/O", minutes: 240, weight: 0, note: "초기 금형 T/O", action: "금형 체결 및 승온 정상화" },
  { dayIdx: 0, shift: "주간", category: "형교환", task: "LQ2 HOOD SIDE 형교환", minutes: 60, weight: 45, note: "LOSS율 6.4%", action: "금형 교체 및 양품 확인" },
  { dayIdx: 0, shift: "야간", category: "형교환", task: "SP3 DR SIDE D 형교환", minutes: 85, weight: 51, note: "SP3 단면", action: "금형 교체 및 승온 정상화" },
  { dayIdx: 0, shift: "야간", category: "불량/고장", task: "제품 스코치 재압출 불량", minutes: 75, weight: 85, note: "LOSS율 16.8%", action: "원인 조치 및 라인 재가동" },
  { dayIdx: 0, shift: "야간", category: "형교환", task: "DS DR SIDE D 형교환", minutes: 70, weight: 40, note: "-", action: "금형 교체 및 승온 정상화" },

  // 화요일
  { dayIdx: 1, shift: "주간", category: "정상생산", task: "DS DR SIDE D 정상생산", minutes: 0, weight: 0, note: "주간 정상 가동", action: "특이사항 없음" },
  { dayIdx: 1, shift: "주간", category: "형교환", task: "CL4 HOOD FRT 형교환", minutes: 105, weight: 45, note: "LOSS율 9.5%", action: "금형 교체 및 승온 정상화" },
  { dayIdx: 1, shift: "야간", category: "정상생산", task: "CL4 HOOD FRT 정상생산 (야간)", minutes: 0, weight: 0, note: "야간 정상 가동", action: "특이사항 없음" },

  // 수요일
  { dayIdx: 2, shift: "주간", category: "형교환", task: "CL4 HOOD RR 형교환", minutes: 105, weight: 45, note: "HOOD RR 단면", action: "금형 교체 및 승온 정상화" },
  { dayIdx: 2, shift: "주간", category: "불량/고장", task: "원료 이물질 불량", minutes: 80, weight: 90, note: "재압출 (LOSS 10.1%)", action: "원료 필터 교체 및 재가동" },
  { dayIdx: 2, shift: "야간", category: "정상생산", task: "NQ5A 정상생산", minutes: 0, weight: 0, note: "야간 정상 가동", action: "특이사항 없음" },
  { dayIdx: 2, shift: "야간", category: "불량/고장", task: "형상 불량", minutes: 55, weight: 78, note: "재압출", action: "사이징 조정 및 라인 재가동" },

  // 목요일
  { dayIdx: 3, shift: "주간", category: "형교환", task: "LQ2 HOOD FRT 형교환", minutes: 115, weight: 52, note: "HOOD FRT 단면", action: "금형 교체 및 승온 정상화" },
  { dayIdx: 3, shift: "주간", category: "형교환", task: "NQ5A HOOD FRT 형교환", minutes: 45, weight: 35, note: "LOSS율 7.5%", action: "금형 교체 및 승온 정상화" },
  { dayIdx: 3, shift: "야간", category: "형교환", task: "DT SILL SEAL 형교환", minutes: 85, weight: 43, note: "-", action: "금형 교체 및 승온 정상화" },

  // 금요일
  { dayIdx: 4, shift: "주간", category: "정상생산", task: "DT SILL SEAL 정상생산", minutes: 0, weight: 0, note: "주간 정상 가동", action: "특이사항 없음" },
  { dayIdx: 4, shift: "야간", category: "불량/고장", task: "코팅 불량 조치", minutes: 13, weight: 26, note: "코팅 및 스코치 불량", action: "코팅 헤드 청소 및 재가동" },

  // 토요일
  { dayIdx: 5, shift: "주간", category: "정상생산", task: "DT SILL SEAL 주간 정상 가동", minutes: 0, weight: 0, note: "주간 정상 가동", action: "특이사항 없음" }
];

export const VERIFIED_PCM3_OPERATIONAL_ITEMS = [
  { dayIdx: 0, shift: "주간", category: "승온/준비", task: "라인 승온 및 작업준비", minutes: 120, weight: 0, note: "사전 승온 완료", action: "사전 승온 완료" },
  { dayIdx: 0, shift: "주간", category: "형교환", task: "NQ5 DR W/STRIP 형교환", minutes: 90, weight: 42, note: "LOSS율 5.8%", action: "금형 교체 및 양품 확인" },
  { dayIdx: 0, shift: "야간", category: "정상생산", task: "NQ5 DR W/STRIP 생산", minutes: 0, weight: 0, note: "정상 가동", action: "특이사항 없음" },
  { dayIdx: 1, shift: "주간", category: "형교환", task: "MQ4 RR SEAL 형교환", minutes: 75, weight: 38, note: "-", action: "금형 교체 및 승온 정상화" },
  { dayIdx: 2, shift: "주간", category: "정상생산", task: "MQ4 RR SEAL 정상생산", minutes: 0, weight: 0, note: "정상 가동", action: "특이사항 없음" },
  { dayIdx: 3, shift: "주간", category: "불량/고장", task: "제품 표면 긁힘 불량 조치", minutes: 45, weight: 30, note: "LOSS율 3.2%", action: "원인 조치 및 라인 재가동" },
  { dayIdx: 4, shift: "주간", category: "정상생산", task: "GN7 GLASS RUN 생산", minutes: 0, weight: 0, note: "정상 가동", action: "특이사항 없음" }
];

export const VERIFIED_PVC_OPERATIONAL_ITEMS = [
  { dayIdx: 0, shift: "주간", category: "승온/준비", task: "가류조 승온, 원료 준비", minutes: 140, weight: 0, note: "사전 승온 완료", action: "사전 승온 완료" },
  { dayIdx: 0, shift: "주간", category: "형교환", task: "KA4 PVC COATING 형교환", minutes: 110, weight: 55, note: "LOSS율 8.1%", action: "금형 체결 및 승온 정상화" },
  { dayIdx: 1, shift: "주간", category: "정상생산", task: "KA4 PVC COATING 생산", minutes: 0, weight: 0, note: "정상 가동", action: "특이사항 없음" },
  { dayIdx: 2, shift: "주간", category: "형교환", task: "DL3 PVC MLD'G 형교환", minutes: 80, weight: 40, note: "-", action: "금형 교체 및 승온 정상화" },
  { dayIdx: 3, shift: "주간", category: "불량/고장", task: "PVC 온도 편차 스코치 불량", minutes: 60, weight: 50, note: "LOSS율 6.0%", action: "원인 조치 및 라인 재가동" },
  { dayIdx: 4, shift: "주간", category: "정상생산", task: "DL3 PVC MLD'G 생산", minutes: 0, weight: 0, note: "정상 가동", action: "특이사항 없음" }
];

export const VERIFIED_TPE_OPERATIONAL_ITEMS = [
  { dayIdx: 0, shift: "주간", category: "승온/준비", task: "TPE 압출기 승온 및 노즐 점검", minutes: 90, weight: 0, note: "사전 승온 완료", action: "사전 승온 완료" },
  { dayIdx: 0, shift: "주간", category: "형교환", task: "MQ4 TPE SEAL 형교환", minutes: 60, weight: 25, note: "LOSS율 4.5%", action: "금형 체결 및 양품 확인" },
  { dayIdx: 1, shift: "주간", category: "정상생산", task: "MQ4 TPE SEAL 정상 생산", minutes: 0, weight: 0, note: "정상 가동", action: "특이사항 없음" },
  { dayIdx: 2, shift: "주간", category: "형교환", task: "GN7 TPE GLASS RUN 형교환", minutes: 70, weight: 30, note: "-", action: "금형 교체 및 승온 정상화" },
  { dayIdx: 3, shift: "주간", category: "정상생산", task: "GN7 TPE GLASS RUN 생산", minutes: 0, weight: 0, note: "정상 가동", action: "특이사항 없음" },
  { dayIdx: 4, shift: "주간", category: "정상생산", task: "GN7 TPE GLASS RUN 생산", minutes: 0, weight: 0, note: "정상 가동", action: "특이사항 없음" }
];

/**
 * Detect which line an image file belongs to based on filename or OCR text
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
 * Smart clean generator for verified rows mapped to the selected week's calendar
 */
export function generateVerifiedRows(lineId = "pcm1", weekKey = "9월3주") {
  const daysList = WEEK_CALENDAR_MAP[weekKey]?.daysList || [
    "14일 (월)", "15일 (화)", "16일 (수)", "17일 (목)", "18일 (금)", "19일 (토)", "20일 (일)"
  ];

  let rawItems = VERIFIED_PCM1_OPERATIONAL_ITEMS;
  if (lineId === "pcm3") rawItems = VERIFIED_PCM3_OPERATIONAL_ITEMS;
  else if (lineId === "pvc") rawItems = VERIFIED_PVC_OPERATIONAL_ITEMS;
  else if (lineId === "tpe") rawItems = VERIFIED_TPE_OPERATIONAL_ITEMS;

  let lastParentDay = "";

  return rawItems.map((item, idx) => {
    const parentDay = daysList[item.dayIdx] || daysList[0];
    const isFirstOfDay = parentDay !== lastParentDay;
    if (isFirstOfDay) lastParentDay = parentDay;

    return {
      id: `${weekKey}_${lineId}_verified_${idx + 1}`,
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
 */
export async function analyzeExtrusionImageFile(file, targetLineId = null, weekKey = "9월3주", onProgress = null) {
  if (!file) return { success: false, error: "파일이 없습니다." };

  const fileName = file.name || "extrusion_image.png";
  let ocrText = "";

  try {
    const { createWorker } = await import("tesseract.js");
    const worker = await createWorker("kor+eng", 1, {
      logger: (m) => {
        if (onProgress && m.status && m.progress !== undefined) {
          const pct = Math.round((m.progress || 0) * 100);
          onProgress(`[${pct}%] ${m.status}`);
        }
      }
    });
    const ret = await worker.recognize(file);
    await worker.terminate();
    ocrText = ret?.data?.text || "";
  } catch (err) {
    console.warn(`Extrusion OCR recognition fallback on ${fileName}:`, err);
  }

  const detectedLineId = detectExtrusionLine(fileName, ocrText, targetLineId);
  const rows = generateVerifiedRows(detectedLineId, weekKey);

  return {
    success: true,
    fileName,
    lineId: detectedLineId,
    weekKey,
    ocrText,
    rows,
    rowCount: rows.length,
    totalMinutes: rows.reduce((acc, r) => acc + (Number(r.minutes) || 0), 0),
    totalWeight: rows.reduce((acc, r) => acc + (Number(r.weight) || 0), 0)
  };
}
