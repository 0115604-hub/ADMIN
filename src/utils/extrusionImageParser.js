import * as XLSX from "xlsx";
import { WEEK_CALENDAR_MAP } from "../data/extrusionCalendarData";

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

/**
 * Universal Excel Parser: Handles both modern Standard Flat Table and traditional Report formats
 */
export async function parseExcelFile(file, targetLineId = "pcm1", targetWeekKey = "9월3주") {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const wb = XLSX.read(data, { type: "array" });
        if (!wb.SheetNames || wb.SheetNames.length === 0) {
          throw new Error("엑셀 시트를 찾을 수 없습니다.");
        }

        // Try standard/master sheet first, else fallback to first sheet
        let targetSheetName = wb.SheetNames[0];
        const prefSheet = wb.SheetNames.find(s => s.includes('표준') || s.includes('관리') || s.includes('대장'));
        if (prefSheet) targetSheetName = prefSheet;

        const ws = wb.Sheets[targetSheetName];
        const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });

        // Robust header detection
        let headerRowIdx = -1;
        // Priority 1: Match Main Data Table Header (contains 'No' or '순번' + '품명' or '내용')
        for (let i = 0; i < Math.min(20, rows.length); i++) {
          const r = rows[i];
          if (r && r.some(c => String(c).trim() === 'No' || String(c).trim() === '순번') &&
                   r.some(c => String(c).includes('품명') || String(c).includes('내용'))) {
            headerRowIdx = i;
            break;
          }
        }

        // Priority 2: Match header with '품명' or '내용' and ('시간' or '비가동' or '요일')
        if (headerRowIdx === -1) {
          for (let i = 0; i < Math.min(20, rows.length); i++) {
            const r = rows[i];
            if (r && r.some(c => String(c).replace(/\s+/g, '').includes('품명') || String(c).replace(/\s+/g, '').includes('내용')) &&
                     r.some(c => String(c).includes('시간') || String(c).includes('비가동') || String(c).includes('요일'))) {
              headerRowIdx = i;
              break;
            }
          }
        }

        const parsedRows = [];
        let totalMin = 0;
        let totalWt = 0;

        if (headerRowIdx >= 0) {
          const header = rows[headerRowIdx].map(h => String(h).replace(/\s+/g, ''));
          const colIdxDate = header.findIndex(h => h.includes('일자') || h.includes('날짜'));
          const colIdxDay = header.findIndex(h => h.includes('요일'));
          const colIdxShift = header.findIndex(h => h.includes('근무조') || h.includes('주야'));
          const colIdxCat = header.findIndex(h => h.includes('구분'));
          const colIdxTask = header.findIndex(h => h.includes('품명') || h.includes('내용') || h.includes('작업내용'));
          const colIdxTime = header.findIndex(h => h.includes('시간') || h.includes('비가동'));
          const colIdxWt = header.findIndex(h => h.includes('중량') || h.includes('LOSS중량'));
          const colIdxPlan = header.findIndex(h => h.includes('계획정지'));
          const colIdxNote = header.findIndex(h => h.includes('비고') || h.includes('LOSS율'));
          const colIdxAction = header.findIndex(h => h.includes('조치'));

          let curDay = '';
          let curShift = '주간';

          for (let r = headerRowIdx + 1; r < rows.length; r++) {
            const row = rows[r];
            if (!row || row.length === 0) continue;

            const firstCol = String(row[0] || '').trim();
            const secondCol = String(row[1] || '').trim();
            if (firstCol.includes('합계') || firstCol === '비 고' || firstCol.startsWith('가동률') || secondCol.includes('합계') || secondCol === '비 고') break;
            if (firstCol === '신규') continue; // Skip interactive quick-add sample row

            const taskVal = colIdxTask >= 0 ? String(row[colIdxTask] || '').trim() : '';
            const timeVal = colIdxTime >= 0 && row[colIdxTime] !== '' && !isNaN(Number(row[colIdxTime])) ? Number(row[colIdxTime]) : 0;
            const wtVal = colIdxWt >= 0 && row[colIdxWt] !== '' && !isNaN(Number(row[colIdxWt])) ? Number(row[colIdxWt]) : 0;
            const dayVal = colIdxDay >= 0 && row[colIdxDay] ? String(row[colIdxDay]).trim() : (colIdxDate >= 0 && row[colIdxDate] ? String(row[colIdxDate]).trim() : '');
            const shiftVal = colIdxShift >= 0 && row[colIdxShift] ? String(row[colIdxShift]).trim() : '';
            const catVal = colIdxCat >= 0 && row[colIdxCat] ? String(row[colIdxCat]).trim() : '형교환';
            const noteVal = colIdxNote >= 0 && row[colIdxNote] ? String(row[colIdxNote]).trim() : '-';
            const actionVal = colIdxAction >= 0 && row[colIdxAction] ? String(row[colIdxAction]).trim() : '정상 가동 완료';

            if (dayVal) curDay = dayVal.replace(/\r?\n/g, ' ');
            if (shiftVal) curShift = shiftVal;

            if (taskVal && taskVal !== '-' && taskVal !== 'undefined') {
              totalMin += timeVal;
              totalWt += wtVal;
              parsedRows.push({
                id: `${targetLineId}_excel_${r}`,
                day: parsedRows.length === 0 || parsedRows[parsedRows.length - 1].parentDay !== curDay ? curDay : "",
                parentDay: curDay,
                isNewDay: parsedRows.length === 0 || parsedRows[parsedRows.length - 1].parentDay !== curDay,
                shift: curShift,
                category: catVal || '형교환',
                task: taskVal,
                minutes: timeVal,
                weight: wtVal,
                note: noteVal || "-",
                action: actionVal || "정상 가동 완료"
              });
            }
          }
        }

        resolve({
          success: parsedRows.length > 0,
          rows: parsedRows,
          totalMinutes: totalMin,
          totalWeight: totalWt,
          sheetName: targetSheetName
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
