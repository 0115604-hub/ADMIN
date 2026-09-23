// Extrusion 4-Lines Downtime Parser Utility (Clean & Purged)
import * as XLSX from "xlsx";
import { WEEK_CALENDAR_MAP } from "../components/ExtrusionDowntimeView";

export const EXTRUSION_LINES = [
  { id: "pcm1", name: "PCM #1 LINE", code: "PCM #1", color: "teal", keywords: ["pcm1", "pcm #1", "1호", "pcm-1", "pcm_1", "pcm #1 line"] },
  { id: "pcm3", name: "PCM #3 LINE", code: "PCM #3", color: "blue", keywords: ["pcm3", "pcm #3", "3호", "pcm-3", "pcm_3", "pcm #3 line"] },
  { id: "pvc", name: "PVC LINE", code: "PVC", color: "amber", keywords: ["pvc", "피브이씨", "pvc라인", "pvc 라인", "pvc line"] },
  { id: "tpe", name: "TPE LINE", code: "TPE", color: "purple", keywords: ["tpe", "티피이", "tpe라인", "tpe 라인", "tpe line"] }
];

export const PHOTO_VERIFIED_ITEMS = {
  pcm1: [],
  pcm3: [],
  pvc: [],
  tpe: []
};

export const SNAPSHOT_1_ITEMS = PHOTO_VERIFIED_ITEMS;
export const SNAPSHOT_2_ITEMS = PHOTO_VERIFIED_ITEMS;
export const SNAPSHOT_3_ITEMS = PHOTO_VERIFIED_ITEMS;

export const SNAPSHOT_METADATA = {
  1: { title: "실적 데이터", description: "실제 비가동 실적", badge: "실적 데이터" }
};

export function fileToDataUrl(file) {
  return new Promise((resolve) => {
    if (!file || !(file instanceof Blob)) {
      return resolve(null);
    }
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result || null);
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}

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

export function generateVerifiedRows(lineId = "pcm1", weekKey = "9월3주") {
  return [];
}

export function parseClipboardTableText(text = "", targetLineId = "pcm1", weekKey = "9월3주") {
  if (!text || typeof text !== "string") return { success: false, rows: [], totalMinutes: 0, totalWeight: 0 };
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return { success: false, rows: [], totalMinutes: 0, totalWeight: 0 };

  const daysList = WEEK_CALENDAR_MAP[weekKey]?.daysList || [
    "14일 (월)", "15일 (화)", "16일 (수)", "17일 (목)", "18일 (금)", "19일 (토)", "20일 (일)"
  ];

  const rows = [];
  let currentDay = daysList[0] || "14일 (월)";
  let currentShift = "주간";
  let totalMin = 0;
  let totalWt = 0;

  lines.forEach((line, idx) => {
    const cols = line.split("\t").map((c) => c.trim());
    if (cols.length >= 2) {
      const col0 = cols[0];
      const matchedDay = daysList.find((d) => d.includes(col0) || col0.includes(d.slice(0, 3)));
      if (matchedDay) currentDay = matchedDay;

      if (cols.some((c) => c === "주간")) currentShift = "주간";
      else if (cols.some((c) => c === "야간")) currentShift = "야간";

      const minutes = Number(cols.find((c) => !isNaN(Number(c)) && Number(c) > 0) || 0);
      const task = cols.find((c) => c.length > 2 && isNaN(Number(c)) && c !== "주간" && c !== "야간" && !c.includes("월") && !c.includes("화")) || "작업 진행";

      totalMin += minutes;
      rows.push({
        id: `${targetLineId}_paste_${Date.now()}_${idx}`,
        day: rows.length === 0 || rows[rows.length - 1].parentDay !== currentDay ? currentDay : "",
        parentDay: currentDay,
        isNewDay: rows.length === 0 || rows[rows.length - 1].parentDay !== currentDay,
        shift: currentShift,
        category: "형교환",
        task,
        minutes,
        weight: 0,
        note: "-",
        action: "정상 가동 완료"
      });
    }
  });

  return {
    success: rows.length > 0,
    rows,
    totalMinutes: totalMin,
    totalWeight: totalWt
  };
}

export async function parseExcelFile(file, targetLineId = "pcm1", targetWeekKey = "9월3주") {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const wb = XLSX.read(data, { type: "array" });
        const sheetName = wb.SheetNames[0];
        const ws = wb.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });

        const parsedRows = [];
        let curDay = "";
        let curShift = "주간";
        let totalMin = 0;
        let totalWt = 0;

        for (let r = 3; r < rows.length; r++) {
          const row = rows[r];
          if (!row || row.length === 0) continue;
          const dayVal = String(row[0] || "").trim();
          const shiftVal = String(row[1] || "").trim();
          const taskVal = String(row[2] || "").trim();
          const minVal = row[4] !== "" && row[4] !== null ? Number(row[4]) : 0;
          const wtVal = row[5] !== "" && row[5] !== null ? Number(row[5]) : 0;
          const noteVal = String(row[6] || "").trim();

          if (dayVal === "비 고" || dayVal === "총 합계" || dayVal.startsWith("가동률")) break;
          if (dayVal) curDay = dayVal.replace(/\r?\n/g, " ");
          if (shiftVal) curShift = shiftVal;

          if (taskVal || minVal > 0 || wtVal > 0) {
            totalMin += minVal;
            totalWt += wtVal;
            parsedRows.push({
              id: `${targetLineId}_excel_${r}`,
              day: parsedRows.length === 0 || parsedRows[parsedRows.length - 1].parentDay !== curDay ? curDay : "",
              parentDay: curDay,
              isNewDay: parsedRows.length === 0 || parsedRows[parsedRows.length - 1].parentDay !== curDay,
              shift: curShift,
              category: "형교환",
              task: taskVal || "-",
              minutes: minVal,
              weight: wtVal,
              note: noteVal || "-",
              action: "정상 가동 완료"
            });
          }
        }

        resolve({
          success: true,
          rows: parsedRows,
          totalMinutes: totalMin,
          totalWeight: totalWt
        });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
}

export async function analyzeExtrusionImageFile(file, lineId = "pcm1", weekKey = "9월3주") {
  return {
    success: false,
    rows: [],
    totalMinutes: 0,
    totalWeight: 0
  };
}
