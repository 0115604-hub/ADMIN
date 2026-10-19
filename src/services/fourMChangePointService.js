import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  onSnapshot
} from "firebase/firestore";
import { db } from "../firebase.js";

const COLLECTION_NAME = "four_m_change_points";
const LOCAL_STORAGE_KEY = "factory_four_m_change_points_v1";

// Helper: Read local storage
export const getLocalFourMChangePoints = () => {
  try {
    if (typeof localStorage !== "undefined") {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    }
  } catch (e) {
    console.error("Local storage read error for 4M change points:", e);
  }
  return [];
};

// Helper: Save local storage
export const saveLocalFourMChangePoints = (items) => {
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items || []));
    }
  } catch (e) {
    console.error("Local storage write error for 4M change points:", e);
  }
};

// Real-time Cloud Synchronization (Firestore authoritative stream)
export const subscribeFourMChangePoints = (onUpdate) => {
  try {
    const colRef = collection(db, COLLECTION_NAME);
    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        const remoteList = [];
        if (!snapshot.empty) {
          snapshot.forEach((d) => {
            remoteList.push({ id: d.id, ...d.data() });
          });
        }

        remoteList.sort((a, b) => {
          if (b.registeredAt !== a.registeredAt) return (b.registeredAt || "").localeCompare(a.registeredAt || "");
          return (b.date || "").localeCompare(a.date || "");
        });

        saveLocalFourMChangePoints(remoteList);
        if (onUpdate) onUpdate(remoteList);
      },
      (error) => {
        console.warn("Firestore four_m_change_points sync warning:", error);
        if (onUpdate) onUpdate(getLocalFourMChangePoints());
      }
    );
    return unsubscribe;
  } catch (e) {
    console.error("subscribeFourMChangePoints error:", e);
    if (onUpdate) onUpdate(getLocalFourMChangePoints());
    return () => {};
  }
};

/**
 * 🌟 4M 변동점 카테고리 판별 (Machine / Material / Method / Man)
 * - 가류조, 온조기, 압출기, 모터, 설비 등: Machine
 * - 코팅, 원료, 클립, 불량, 스크래치, 자재 등: Material
 * - 결근, 인원, 대체, 교대 등: Man
 * - 작업표준, 조건, 공정, 레시피 등: Method
 */
export const determineFourMCategory = (item) => {
  if (!item) return "Method";
  if (item.fourM && ["Machine", "Man", "Material", "Method"].includes(item.fourM)) {
    if (item.fourM !== "Method") return item.fourM;
  }

  const text = `${item.title || ""} ${item.content || ""} ${item.defectType || ""} ${item.details || ""} ${item.line || ""} ${item.origin || ""} ${item.category || ""}`.toLowerCase();

  // 1. Man (결근, 대체투입, 작업자 교체 등 인원 변동)
  if (
    text.includes("결근") ||
    text.includes("대체투입") ||
    text.includes("대체 투입") ||
    text.includes("인원교체") ||
    text.includes("작업자교체") ||
    text.includes("작업자 변경") ||
    text.includes("작업자변경") ||
    text.includes("신규 작업자") ||
    text.includes("신규작업자") ||
    text.includes("신규 투입") ||
    text.includes("신규투입") ||
    text.includes("작업 실수") ||
    text.includes("작업자 부주의") ||
    text.includes("미숙련") ||
    text.includes("휴가") ||
    (text.includes("인원") && (text.includes("부족") || text.includes("변동") || text.includes("대체")))
  ) {
    return "Man";
  }

  // 2. Machine (가류조, 온조기, 압출기, 모터, RPM, 설비, 머신 등)
  if (
    text.includes("가류조") ||
    text.includes("온조기") ||
    text.includes("압출기") ||
    text.includes("인취기") ||
    text.includes("머신기") ||
    text.includes("머신") ||
    text.includes("설비") ||
    text.includes("기계") ||
    text.includes("금형") ||
    text.includes("치구") ||
    text.includes("로봇") ||
    text.includes("모터") ||
    text.includes("rpm") ||
    text.includes("히터") ||
    text.includes("센서") ||
    text.includes("칠러") ||
    text.includes("수리") ||
    text.includes("tpm") ||
    text.includes("정비") ||
    text.includes("보전") ||
    text.includes("단선") ||
    text.includes("누유") ||
    text.includes("과열") ||
    text.includes("라인정지")
  ) {
    return "Machine";
  }

  // 3. Material (코팅, 클립, 원료, 배합, 고무, 원자재, 소재, 불량 등)
  if (
    text.includes("코팅") ||
    text.includes("클립") ||
    text.includes("원료") ||
    text.includes("배합") ||
    text.includes("원자재") ||
    text.includes("소재") ||
    text.includes("불량") ||
    text.includes("이물") ||
    text.includes("스크래치") ||
    text.includes("기포") ||
    text.includes("누락") ||
    text.includes("치수") ||
    text.includes("박리") ||
    text.includes("테이프") ||
    text.includes("본드") ||
    text.includes("철심") ||
    text.includes("고무") ||
    text.includes("도포") ||
    text.includes("단면") ||
    text.includes("탄화") ||
    text.includes("스코치") ||
    text.includes("nct") ||
    text.includes("선별")
  ) {
    return "Material";
  }

  // 4. Method
  return "Method";
};

// Register (Copy) a Record into Official 4M Change Point Ledger
export const registerToFourMLedger = async (record, registeredBy = "관리자") => {
  if (!record) return null;

  const now = new Date();
  const nowStr = now.toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).replace(/\. /g, "-").replace(/\./g, "");

  const originalId = String(record.id || "").trim();
  const rawId = String(record.raw?.id || record.id || "").trim();
  const ledgerId = originalId.startsWith("ledger_") ? originalId : `ledger_${originalId || Date.now()}`;

  // Sanitize record to avoid undefined keys or complex non-serializable objects (such as circular refs in raw)
  const ledgerItem = {
    id: ledgerId,
    originalId: originalId,
    rawId: rawId,
    fourM: record.fourM || "Machine",
    origin: record.origin || "변동점",
    sourceType: record.sourceType || "",
    badgeColor: record.badgeColor || "",
    plant: record.plant || "삼랑진공장",
    line: record.line || "",
    writer: record.writer || "",
    title: record.title || "",
    date: record.date || nowStr.slice(0, 10),
    time: record.time || "",
    content: record.content || "",
    actionResult: record.actionResult || "",
    actionAuthor: record.actionAuthor || "",
    actionAt: record.actionAt || "",
    images: Array.isArray(record.images) ? record.images : [],
    actionImages: Array.isArray(record.actionImages) ? record.actionImages : [],
    replies: Array.isArray(record.replies) ? record.replies : [],
    isResolved: Boolean(record.isResolved),
    severity: record.severity || "NORMAL",
    downtimeMinutes: Number(record.downtimeMinutes) || 0,
    scrapKg: Number(record.scrapKg) || 0,
    registeredAt: nowStr,
    registeredBy: registeredBy || "관리자",
    isOfficialLedger: true
  };

  // Strip any undefined keys
  Object.keys(ledgerItem).forEach((k) => {
    if (ledgerItem[k] === undefined) delete ledgerItem[k];
  });

  const current = getLocalFourMChangePoints();
  const existingIdx = current.findIndex(
    (it) =>
      it.id === ledgerId ||
      it.originalId === originalId ||
      (rawId && (it.rawId === rawId || it.originalId === rawId)) ||
      it.id === originalId
  );
  let updated;
  if (existingIdx >= 0) {
    updated = [...current];
    updated[existingIdx] = ledgerItem;
  } else {
    updated = [ledgerItem, ...current];
  }

  saveLocalFourMChangePoints(updated);

  try {
    await setDoc(doc(db, COLLECTION_NAME, ledgerId), ledgerItem);
  } catch (e) {
    console.warn("Firestore save four_m_change_point fallback to local:", e);
  }

  return ledgerItem;
};

// Unregister (Delete) from Official 4M Change Point Ledger
export const unregisterFromFourMLedger = async (ledgerOrOriginalId) => {
  const targetId = typeof ledgerOrOriginalId === "object"
    ? String(ledgerOrOriginalId?.id || ledgerOrOriginalId?.originalId || ledgerOrOriginalId?.raw?.id || "").trim()
    : String(ledgerOrOriginalId || "").trim();

  if (!targetId) return getLocalFourMChangePoints();

  const current = getLocalFourMChangePoints();

  // Find all matched records
  const matched = current.filter(
    (it) =>
      it.id === targetId ||
      it.originalId === targetId ||
      it.rawId === targetId ||
      it.id === `ledger_${targetId}` ||
      `ledger_${it.originalId}` === targetId ||
      (it.originalId && targetId.includes(it.originalId)) ||
      (it.id && targetId.includes(it.id))
  );

  const matchedDocIds = new Set(matched.map((m) => m.id));
  if (targetId.startsWith("ledger_")) {
    matchedDocIds.add(targetId);
  } else {
    matchedDocIds.add(`ledger_${targetId}`);
  }
  matchedDocIds.add(targetId);

  const updated = current.filter(
    (it) =>
      !matchedDocIds.has(it.id) &&
      it.originalId !== targetId &&
      it.rawId !== targetId &&
      !matched.some((m) => m.id === it.id)
  );

  saveLocalFourMChangePoints(updated);

  // Delete matching documents from Firestore
  for (const docId of matchedDocIds) {
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, docId));
    } catch (e) {
      console.warn("Firestore delete four_m_change_point error:", docId, e);
    }
  }

  return updated;
};

// Purge all MAN / Absence change points from Official Ledger (Firestore & LocalStorage)
export const purgeManFourMChangePoints = async () => {
  const current = getLocalFourMChangePoints();
  const remaining = current.filter(
    (it) =>
      it.fourM?.toUpperCase() !== "MAN" &&
      !String(it.sourceType || "").includes("MAN_ABSENCE") &&
      !String(it.id || "").includes("man_") &&
      !String(it.originalId || "").includes("man_")
  );
  saveLocalFourMChangePoints(remaining);

  if (db) {
    try {
      const snap = await getDocs(collection(db, COLLECTION_NAME));
      for (const d of snap.docs) {
        const data = d.data();
        const isMan =
          data.fourM?.toUpperCase() === "MAN" ||
          String(data.sourceType || "").includes("MAN_ABSENCE") ||
          String(d.id).includes("man_") ||
          String(data.originalId || "").includes("man_") ||
          String(data.id || "").includes("man_");
        if (isMan) {
          await deleteDoc(doc(db, COLLECTION_NAME, d.id));
        }
      }
    } catch (e) {
      console.warn("Firestore purgeManFourMChangePoints error:", e);
    }
  }

  return remaining;
};

// Purge ALL change points from Official Ledger
export const purgeAllFourMChangePoints = async () => {
  saveLocalFourMChangePoints([]);
  if (db) {
    try {
      const snap = await getDocs(collection(db, COLLECTION_NAME));
      for (const d of snap.docs) {
        await deleteDoc(doc(db, COLLECTION_NAME, d.id));
      }
    } catch (e) {
      console.warn("Firestore purgeAllFourMChangePoints error:", e);
    }
  }
  return [];
};

/**
 * 🌟 부적합경보/품질이슈를 공식 4M 변동점 관리대장에 자동 동기화 (단일 항목)
 */
export const syncQualityAlertToFourMLedger = async (alertItem, originName = "부적합경보") => {
  if (!alertItem) return null;
  const isHardDelete = Boolean(
    alertItem.hardDelete === true ||
    alertItem.isHardDeleted === true
  );
  const id = String(alertItem.id || alertItem._docId || alertItem.customId || "").trim();
  const rawId = String(alertItem.rawId || alertItem.id || "").trim();

  // 오직 영구삭제(hard delete)인 경우에만 4M 관리대장에서 영구 제외
  if (isHardDelete) {
    await unregisterFromFourMLedger(id);
    if (rawId && rawId !== id) await unregisterFromFourMLedger(rawId);
    return null;
  }

  const isDel = Boolean(
    alertItem.isDeleted === true ||
    alertItem.isDeleted === "true" ||
    alertItem.deleted === true ||
    alertItem.status === "DELETED"
  );

  const title = alertItem.title || alertItem.defectType || alertItem.content || "(부적합경보)";
  const fourM = determineFourMCategory(alertItem);
  const isResolved = Boolean(
    alertItem.isResolved ||
    alertItem.status === "RESOLVED" ||
    alertItem.status === "CLOSED" ||
    alertItem.status === "DONE" ||
    isDel || // 첫화면에서 관리자가 조치완료 후 종결/삭제한 건은 4M 대장에 '조치완료'로 영구 보존
    (alertItem.actionResult && String(alertItem.actionResult).trim().length > 0)
  );

  const ledgerRecord = {
    id: id.startsWith("ledger_") ? id : `ledger_${id}`,
    originalId: id,
    rawId: rawId,
    fourM: fourM,
    origin: originName,
    sourceType: "QUALITY_ALERT",
    badgeColor:
      fourM === "Machine"
        ? "bg-indigo-100 text-indigo-900 border-indigo-300"
        : fourM === "Material"
        ? "bg-rose-100 text-rose-900 border-rose-300"
        : fourM === "Man"
        ? "bg-sky-100 text-sky-900 border-sky-300"
        : "bg-amber-100 text-amber-900 border-amber-300",
    plant: alertItem.plant || (String(alertItem.line || "").includes("한림") || String(alertItem.line || "").includes("한울") ? "한림공장" : "삼랑진공장"),
    line: alertItem.line || alertItem.lineName || alertItem.project || (fourM === "Machine" ? "압출설비라인" : "가공/품질라인"),
    writer: alertItem.author ? `${alertItem.author} ${alertItem.authorTitle || ""}`.trim() : "품질관리자",
    title: title,
    date: alertItem.date || alertItem.targetDate || alertItem.startDate || (alertItem.createdAt ? String(alertItem.createdAt).slice(0, 10) : new Date().toISOString().slice(0, 10)),
    time: alertItem.time || "",
    content: alertItem.content || alertItem.details || alertItem.description || alertItem.defectType || "",
    actionResult: alertItem.actionResult || alertItem.actionNotes || alertItem.resolutionNote || (isResolved ? "조치 및 선별 완료" : ""),
    actionAuthor: alertItem.actionAuthor || alertItem.author || (isResolved ? "관리자" : ""),
    actionAt: alertItem.actionAt || alertItem.resolvedAt || alertItem.updatedAt || "",
    images: Array.isArray(alertItem.causeImages) ? alertItem.causeImages : (Array.isArray(alertItem.images) ? alertItem.images : []),
    actionImages: Array.isArray(alertItem.actionImages) ? alertItem.actionImages : [],
    replies: Array.isArray(alertItem.replies) ? alertItem.replies : [],
    isResolved: isResolved,
    validation: isResolved ? "부적합 조치 및 유효성 확인 완료" : "유효성 검증 대기중",
    severity: alertItem.severity || "HIGH",
    downtimeMinutes: Number(alertItem.downtimeMinutes) || 0,
    scrapKg: Number(alertItem.scrapKg) || 0,
    isOfficialLedger: true
  };

  return await registerToFourMLedger(ledgerRecord, alertItem.author || "품질관리자");
};

/**
 * 🌟 전 공정 부적합경보 전체를 4M 변동점 관리대장에 일괄 동기화
 */
export const autoSyncAllQualityIssuesToFourMLedger = async (qualityLists = {}) => {
  const {
    extrusionIssues = [],
    yuseongIssues = [],
    hanulIssues = [],
    machiningIssues = [],
    urgentIssues = []
  } = qualityLists;

  const allAlerts = [];

  // 1. Extrusion
  (extrusionIssues || []).forEach((item) => {
    if (!item || item.id === "ext_qual_demo_1" || item.id === "ext_qual_demo_2") return;
    allAlerts.push({ ...item, origin: "부적합경보", line: item.line || "압출라인", plant: item.plant || "삼랑진공장" });
  });

  // 2. Yuseong
  (yuseongIssues || []).forEach((item) => {
    if (!item) return;
    allAlerts.push({ ...item, origin: "부적합경보", line: item.project || item.line || "외주가공(유성)", plant: item.plant || "삼랑진공장" });
  });

  // 3. Hanul
  (hanulIssues || []).forEach((item) => {
    if (!item) return;
    allAlerts.push({ ...item, origin: "부적합경보", line: item.line || "외주가공(한울)", plant: item.plant || "한림공장" });
  });

  // 4. Machining
  (machiningIssues || []).forEach((item) => {
    if (!item) return;
    allAlerts.push({ ...item, origin: "부적합경보", line: item.line || "가공라인", plant: item.plant || "삼랑진공장" });
  });

  // 5. Urgent issues (첫화면 품질경보, 부적합, 결함/이상 오픈이슈 전체)
  (urgentIssues || []).forEach((item) => {
    if (!item) return;
    const cat = String(item.category || "").trim();
    const title = String(item.title || "").toLowerCase();
    const content = String(item.content || "").toLowerCase();
    const isQuality =
      cat.includes("품질") ||
      cat.includes("부적합") ||
      cat.includes("오픈이슈") ||
      cat.includes("open_issue") ||
      item.type === "QUALITY_ALERT" ||
      title.includes("가류조") ||
      title.includes("코팅") ||
      title.includes("클립") ||
      title.includes("불량") ||
      title.includes("이상") ||
      title.includes("설변") ||
      content.includes("가류조") ||
      content.includes("코팅") ||
      content.includes("클립");

    if (isQuality) {
      allAlerts.push({ ...item, origin: "부적합경보" });
    }
  });

  // Synchronize each alert
  for (const alert of allAlerts) {
    try {
      await syncQualityAlertToFourMLedger(alert, alert.origin || "부적합경보");
    } catch (e) {
      console.warn("Auto sync quality alert to 4M ledger failed for item:", alert.id, e);
    }
  }
};

