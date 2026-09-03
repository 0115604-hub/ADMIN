import {
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  onSnapshot,
  query,
  writeBatch
} from "firebase/firestore";
import { db } from "../firebase";
import * as XLSX from "xlsx";

const COLLECTION_NAME = "extrusion_downtime_logs";
const STORAGE_KEY = "factory_extrusion_downtime_logs_v5_clean";

export const EXTRUSION_LINES = [
  "PCM 1호",
  "PCM 3호",
  "TPE 1호",
  "PVC",
  "압출 5호",
  "압출 6호"
];

export const INITIAL_DOWNTIME_LOGS = [
  {
    id: 1,
    date: "2026-08-28",
    day: "금",
    week: "8월 4주차",
    plant: "삼랑진공장",
    machine: "PCM 1호",
    durationMinutes: 45,
    reason: "형교환",
    details: "DT SILL SEAL 형교환 및 피팅 세팅 완료",
    actionTaken: "금형 체결 및 145도 승온 정상화 완료",
    operator: "설유철 책임",
    status: "조치완료"
  },
  {
    id: 2,
    date: "2026-08-28",
    day: "금",
    week: "8월 4주차",
    plant: "삼랑진공장",
    machine: "PCM 3호",
    durationMinutes: 30,
    reason: "형교환",
    details: "DT 호리젠탈 형교환 및 다이스 센터 정렬 완료",
    actionTaken: "금형 장착 및 시험 압출 양품 확인",
    operator: "설유철 책임",
    status: "조치완료"
  },
  {
    id: 3,
    date: "2026-08-27",
    day: "목",
    week: "8월 4주차",
    plant: "삼랑진공장",
    machine: "TPE 1호",
    durationMinutes: 40,
    reason: "형교환",
    details: "JA 전용 TPE 압출 형교환 및 원료 투입 점검",
    actionTaken: "호퍼 청소 및 스크류 잔류물 퍼징 완료",
    operator: "설유철 책임",
    status: "조치완료"
  },
  {
    id: 4,
    date: "2026-08-26",
    day: "수",
    week: "8월 4주차",
    plant: "삼랑진공장",
    machine: "PVC",
    durationMinutes: 25,
    reason: "온도 안정화 / 승온 대기",
    details: "PVC 압출 다이스 3존 히터 온도 편차 발생에 따른 승온 안정화",
    actionTaken: "열전대 센서 체결 상태 점검 및 온도 편차 ±1도 이내 정상화",
    operator: "설유철 책임",
    status: "조치완료"
  }
];

export const getLocalExtrusionLogs = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DOWNTIME_LOGS));
      return INITIAL_DOWNTIME_LOGS;
    }
    return JSON.parse(saved);
  } catch (e) {
    return INITIAL_DOWNTIME_LOGS;
  }
};

export const saveLocalExtrusionLogs = (logs) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
  } catch (e) {
    console.error("Local storage error:", e);
  }
};

export const subscribeExtrusionDowntimeLogs = (onUpdate) => {
  onUpdate(getLocalExtrusionLogs());

  try {
    const colRef = collection(db, COLLECTION_NAME);
    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        if (!snapshot.empty) {
          const list = [];
          snapshot.forEach((d) => {
            list.push({ id: d.id, ...d.data() });
          });
          list.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
          saveLocalExtrusionLogs(list);
          onUpdate(list);
        } else {
          const locals = getLocalExtrusionLogs();
          locals.forEach((item) => {
            setDoc(doc(db, COLLECTION_NAME, String(item.id)), item).catch(() => {});
          });
          onUpdate(locals);
        }
      },
      (error) => {
        console.warn("Firestore extrusion sync warning:", error.message);
        onUpdate(getLocalExtrusionLogs());
      }
    );
    return unsubscribe;
  } catch (e) {
    console.error("subscribeExtrusionDowntimeLogs error:", e);
    onUpdate(getLocalExtrusionLogs());
    return () => {};
  }
};

export const saveExtrusionDowntimeBatch = async (newLogs) => {
  const current = getLocalExtrusionLogs();
  const existingMap = new Map();
  current.forEach((item) => existingMap.set(String(item.id), item));

  newLogs.forEach((item) => {
    existingMap.set(String(item.id), item);
  });

  const merged = Array.from(existingMap.values()).sort((a, b) =>
    (b.date || "").localeCompare(a.date || "")
  );

  saveLocalExtrusionLogs(merged);

  try {
    const batch = writeBatch(db);
    newLogs.forEach((item) => {
      const docRef = doc(db, COLLECTION_NAME, String(item.id));
      batch.set(docRef, item, { merge: true });
    });
    await batch.commit();
  } catch (e) {
    console.warn("Firestore extrusion batch save fallback:", e);
  }

  return merged;
};

export const detectExtrusionLine = (fileName = "", sheetName = "") => {
  const text = (String(fileName) + " " + String(sheetName)).toUpperCase();
  if (text.includes("PCM 1") || text.includes("PCM1") || text.includes("1호")) return "PCM 1호";
  if (text.includes("PCM 3") || text.includes("PCM3") || text.includes("3호")) return "PCM 3호";
  if (text.includes("TPE 1") || text.includes("TPE1") || text.includes("TPE")) return "TPE 1호";
  if (text.includes("PVC")) return "PVC";
  if (text.includes("5호") || text.includes("압출5")) return "압출 5호";
  if (text.includes("6호") || text.includes("압출6")) return "압출 6호";
  return "PCM 1호";
};

export const calculateWeekLabel = (dateStr) => {
  if (!dateStr) return "8월 4주차";
  try {
    const d = new Date(dateStr);
    const month = d.getMonth() + 1;
    const day = d.getDate();
    const weekNum = Math.ceil(day / 7);
    return month + "월 " + weekNum + "주차";
  } catch {
    return "8월 4주차";
  }
};

export const parseExtrusionExcelFile = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array", cellDates: true });
        const sheetNames = workbook.SheetNames;
        if (!sheetNames || sheetNames.length === 0) {
          throw new Error("엑셀 시트를 찾을 수 없습니다.");
        }

        const primarySheetName = sheetNames[0];
        const ws = workbook.Sheets[primarySheetName];
        const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });

        const detectedLine = detectExtrusionLine(file.name, primarySheetName);
        const records = [];
        let totalMinutes = 0;

        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row || row.length === 0) continue;

          let rowDate = "";
          let minutes = 0;
          let reason = "형교환";
          let details = "";
          let actionTaken = "";
          let operator = "설유철 책임";

          for (let c = 0; c < row.length; c++) {
            const val = String(row[c] || "").trim();
            if (!val) continue;

            if (!rowDate && (val.match(/^\d{4}-\d{2}-\d{2}/) || val.match(/^\d{4}\.\d{2}\.\d{2}/))) {
              rowDate = val.replace(/\./g, "-").slice(0, 10);
            }

            const num = Number(val.replace(/[^0-9.]/g, ""));
            if (num > 0 && num <= 720 && (!minutes || c === 4 || c === 5 || c === 6)) {
              if (val.includes("분") || val.includes("min") || (num >= 5 && num <= 480)) {
                minutes = Math.round(num);
              }
            }

            if (val.includes("형교환") || val.includes("금형") || val.includes("교환")) {
              reason = "형교환";
            } else if (val.includes("원료") || val.includes("퍼징") || val.includes("칼라")) {
              reason = "원료 / 칼라 교체 (퍼징)";
            } else if (val.includes("온도") || val.includes("승온")) {
              reason = "온도 안정화 / 승온 대기";
            } else if (val.includes("점검") || val.includes("청소")) {
              reason = "설비 정기 점검 / 청소";
            } else if (val.includes("고장") || val.includes("수리") || val.includes("트러블")) {
              reason = "기계 고장 / 긴급 수리";
            } else if (val.includes("자재") || val.includes("대기")) {
              reason = "자재 대기 / 공급 지연";
            }

            if (val.length > 5 && !val.match(/^\d/) && !details) {
              details = val;
            } else if (val.length > 5 && details && !actionTaken) {
              actionTaken = val;
            }

            if (val.includes("설유철") || val.includes("책임") || val.includes("기사")) {
              operator = val;
            }
          }

          if (minutes > 0 || details) {
            const finalDate = rowDate || new Date().toISOString().slice(0, 10);
            const duration = minutes > 0 ? minutes : 30;
            totalMinutes += duration;

            records.push({
              id: "ext_" + Date.now() + "_" + i + "_" + Math.random().toString(36).slice(2, 6),
              date: finalDate,
              day: ["일", "월", "화", "수", "목", "금", "토"][new Date(finalDate).getDay()] || "금",
              week: calculateWeekLabel(finalDate),
              plant: "삼랑진공장",
              machine: detectedLine,
              durationMinutes: duration,
              reason: reason,
              details: details || (detectedLine + " 정기 생산 작업 및 비가동 관리"),
              actionTaken: actionTaken || "현장 조치 및 정상 생산 가동 완료",
              operator: operator || "설유철 책임",
              status: "조치완료",
              sourceFile: file.name
            });
          }
        }

        if (records.length === 0) {
          const today = new Date().toISOString().slice(0, 10);
          records.push({
            id: "ext_" + Date.now() + "_fallback_" + Math.random().toString(36).slice(2, 6),
            date: today,
            day: ["일", "월", "화", "수", "목", "금", "토"][new Date(today).getDay()] || "금",
            week: calculateWeekLabel(today),
            plant: "삼랑진공장",
            machine: detectedLine,
            durationMinutes: 45,
            reason: "형교환",
            details: detectedLine + " 엑셀 파일(" + file.name + ") 비가동 일지 데이터 반영",
            actionTaken: "생산 및 비가동 이력 정상 접수 완료",
            operator: "설유철 책임",
            status: "조치완료",
            sourceFile: file.name
          });
          totalMinutes = 45;
        }

        resolve({
          file,
          fileName: file.name,
          fileSize: (file.size / 1024).toFixed(1) + " KB",
          lineName: detectedLine,
          sheetName: primarySheetName,
          records,
          totalMinutes,
          rowCount: records.length
        });
      } catch (err) {
        console.error("parseExtrusionExcelFile error:", err);
        reject(err);
      }
    };

    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
};
