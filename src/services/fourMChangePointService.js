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
const OVERRIDES_STORAGE_KEY = "factory_four_m_overrides_v1";

// Helper: Read 4M manual overrides
export const getFourMOverrides = () => {
  try {
    if (typeof localStorage !== "undefined") {
      const raw = localStorage.getItem(OVERRIDES_STORAGE_KEY);
      if (raw) return JSON.parse(raw) || {};
    }
  } catch (e) {
    console.error("Local storage read error for 4M overrides:", e);
  }
  return {};
};

// Helper: Save 4M manual overrides
export const saveFourMOverrides = (map) => {
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(OVERRIDES_STORAGE_KEY, JSON.stringify(map || {}));
    }
  } catch (e) {
    console.error("Local storage write error for 4M overrides:", e);
  }
};

// Helper: 4M Badge Color
export const getFourMBadgeColor = (fourM) => {
  switch (fourM) {
    case "Machine":
      return "bg-indigo-100 text-indigo-900 border-indigo-300";
    case "Material":
      return "bg-rose-100 text-rose-900 border-rose-300";
    case "Man":
      return "bg-sky-100 text-sky-900 border-sky-300";
    case "Method":
    default:
      return "bg-amber-100 text-amber-900 border-amber-300";
  }
};


// ⭐ Core Canonical ID Extractor: Strips all legacy & source prefixes to obtain the unique event timestamp/hash
export const getCore4MId = (idOrItem) => {
  if (!idOrItem) return "";
  const rawId = typeof idOrItem === "object"
    ? String(idOrItem.id || idOrItem.originalId || idOrItem.rawId || idOrItem.raw?.id || "")
    : String(idOrItem);

  return rawId
    .trim()
    .replace(/^ledger_/, "")
    .replace(/^urg_/, "")
    .replace(/^ext_q_/, "")
    .replace(/^hanul_q_/, "")
    .replace(/^ys_q_/, "")
    .replace(/^mach_q_/, "")
    .replace(/^ext_qual_/, "")
    .replace(/^hanul_qual_/, "")
    .replace(/^ys_qual_/, "")
    .replace(/^mach_qual_/, "")
    .replace(/^issue_/, "")
    .trim();
};

// ⭐ Normalized Title & Date Key for cross-collection duplicate prevention
export const getNormalizedTitleKey = (item) => {
  if (!item) return "";
  const title = String(item.title || item.defectType || item.content || "")
    .replace(/^\[(한울 부적합|유성 부적합|부적합경보|TPM 이상)\]\s*/i, "")
    .replace(/\s+/g, "")
    .toLowerCase();
  const date = String(item.date || item.targetDate || item.startDate || "").slice(0, 10);
  return `${title}___${date}`;
};

// ⭐ Robust 4M Record Merger: Merges two representations of the same underlying event into a single canonical row
export const mergeUnified4MRecords = (existing, incoming) => {
  const isResolved = Boolean(
    existing.isResolved ||
    incoming.isResolved ||
    existing.status === "RESOLVED" ||
    incoming.status === "RESOLVED" ||
    existing.status === "CLOSED" ||
    incoming.status === "CLOSED" ||
    (existing.actionResult && String(existing.actionResult).trim().length > 0) ||
    (incoming.actionResult && String(incoming.actionResult).trim().length > 0)
  );

  const bestActionResult = (incoming.actionResult && String(incoming.actionResult).trim().length > 0)
    ? incoming.actionResult
    : (existing.actionResult || "");

  const bestActionAuthor = incoming.actionAuthor || existing.actionAuthor || (isResolved ? "관리자" : "");
  const bestActionAt = incoming.actionAt || existing.actionAt || "";

  const isManualFourM = Boolean(existing.isManualFourM || incoming.isManualFourM);
  const fourM = (incoming.isManualFourM && incoming.fourM)
    ? incoming.fourM
    : (existing.isManualFourM && existing.fourM)
    ? existing.fourM
    : incoming.fourM || existing.fourM;

  return {
    ...existing,
    ...incoming,
    id: existing.id || incoming.id,
    fourM,
    isManualFourM,
    badgeColor: incoming.badgeColor || existing.badgeColor,
    actionResult: bestActionResult,
    actionAuthor: bestActionAuthor,
    actionAt: bestActionAt,
    isResolved,
    validation: isResolved ? (incoming.validation || existing.validation || "초·중·종물 한도견본 대조 및 유효성 확인") : "유효성 검증 대기중",
    isRegisteredInLedger: Boolean(existing.isRegisteredInLedger || incoming.isRegisteredInLedger || incoming.isOfficialLedger || existing.isOfficialLedger),
    images: Array.from(new Set([...(existing.images || []), ...(incoming.images || [])])),
    actionImages: Array.from(new Set([...(existing.actionImages || []), ...(incoming.actionImages || [])])),
    replies: [...(existing.replies || []), ...(incoming.replies || [])].filter(
      (r, idx, arr) => arr.findIndex((other) => other.id === r.id || other.createdAt === r.createdAt) === idx
    )
  };
};

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
 * - 1순위: 관리자 수동 재분류 override 맵 및 명시적 4M 설정값
 * - 2순위: 키워드 기반 자동 판별
 *   - 가류조, 온조기, 압출기, 모터, 설비 등: Machine
 *   - 코팅, 원료, 클립, 불량, 스크래치, 자재 등: Material
 *   - 결근, 인원, 대체, 교대 등: Man
 *   - 작업표준, 조건, 공정, 레시피 등: Method
 */
export const determineFourMCategory = (item) => {
  if (!item) return "Method";

  // 1. 관리자 수동 재분류(Override) 맵 확인
  const overrides = getFourMOverrides();
  const possibleIds = [
    item.id,
    item.originalId,
    item.rawId,
    item.raw?.id,
    item._docId,
    item.customId
  ].filter(Boolean);

  for (const rawKey of possibleIds) {
    const sId = String(rawKey).trim();
    if (overrides[sId] && ["Machine", "Man", "Material", "Method"].includes(overrides[sId])) {
      return overrides[sId];
    }
    const cleanId = sId
      .replace(/^ledger_/, "")
      .replace(/^urg_/, "")
      .replace(/^ext_q_/, "")
      .replace(/^hanul_q_/, "")
      .replace(/^ys_q_/, "")
      .replace(/^mach_q_/, "");
    if (cleanId && overrides[cleanId] && ["Machine", "Man", "Material", "Method"].includes(overrides[cleanId])) {
      return overrides[cleanId];
    }
  }

  // 2. 항목 객체에 명시된 수동 4M 설정 확인
  if (item.manualFourM && ["Machine", "Man", "Material", "Method"].includes(item.manualFourM)) {
    return item.manualFourM;
  }
  if (item.isManualFourM && item.fourM && ["Machine", "Man", "Material", "Method"].includes(item.fourM)) {
    return item.fourM;
  }
  if (item.isOfficialLedger && item.fourM && ["Machine", "Man", "Material", "Method"].includes(item.fourM)) {
    return item.fourM;
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

/**
 * 🌟 4M 변동점 카테고리 수동 변경 및 영구 동기화
 * - Machine / Material / Man / Method
 * - 로컬 override 맵, four_m_change_points(Firestore/Local), urgent_issues 동시 반영
 */
export const updateFourMClassification = async (itemOrId, newFourM, modifierName = "관리자") => {
  if (!newFourM || !["Machine", "Man", "Material", "Method"].includes(newFourM)) {
    console.warn("Invalid 4M category:", newFourM);
    return null;
  }

  const isObj = typeof itemOrId === "object" && itemOrId !== null;
  const targetId = isObj
    ? String(itemOrId.id || itemOrId.originalId || itemOrId.rawId || itemOrId.raw?.id || "").trim()
    : String(itemOrId || "").trim();

  if (!targetId) return null;

  const rawId = isObj ? String(itemOrId.rawId || itemOrId.raw?.id || "").trim() : "";
  const origId = isObj ? String(itemOrId.originalId || "").trim() : "";
  const cleanId = targetId
    .replace(/^ledger_/, "")
    .replace(/^urg_/, "")
    .replace(/^ext_q_/, "")
    .replace(/^hanul_q_/, "")
    .replace(/^ys_q_/, "")
    .replace(/^mach_q_/, "");

  // 1. 4M Overrides 맵에 영구 저장 (로컬 캐시 및 즉시 반영)
  const overrides = getFourMOverrides();
  const allKeyVariants = [
    targetId,
    `ledger_${targetId}`,
    origId,
    origId ? `ledger_${origId}` : "",
    rawId,
    rawId ? `ledger_${rawId}` : "",
    cleanId,
    cleanId ? `ledger_${cleanId}` : "",
    cleanId ? `urg_${cleanId}` : ""
  ].filter(Boolean);

  allKeyVariants.forEach((k) => {
    overrides[k] = newFourM;
  });
  saveFourMOverrides(overrides);

  // 2. 공식 대장(four_m_change_points) 로컬 스토리지 및 Firestore 업데이트
  const current = getLocalFourMChangePoints();
  const now = new Date();
  const nowStr = now.toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).replace(/\. /g, "-").replace(/\./g, "");

  const badgeColor = getFourMBadgeColor(newFourM);

  let matchFound = false;
  const updatedList = current.map((item) => {
    const iId = String(item.id || "");
    const iOrig = String(item.originalId || "");
    const iRaw = String(item.rawId || "");
    const isMatch =
      allKeyVariants.includes(iId) ||
      allKeyVariants.includes(iOrig) ||
      allKeyVariants.includes(iRaw) ||
      (cleanId && (iId.includes(cleanId) || iOrig.includes(cleanId) || iRaw.includes(cleanId)));

    if (isMatch) {
      matchFound = true;
      return {
        ...item,
        fourM: newFourM,
        badgeColor,
        isManualFourM: true,
        modifiedAt: nowStr,
        modifiedBy: modifierName || "관리자"
      };
    }
    return item;
  });

  // 대장에 미등록된 항목이더라도 4M을 수정하면 공식 대장에 등록
  if (!matchFound && isObj) {
    const sanitizedObj = {
      ...itemOrId,
      fourM: newFourM,
      badgeColor,
      isManualFourM: true,
      modifiedAt: nowStr,
      modifiedBy: modifierName || "관리자"
    };
    await registerToFourMLedger(sanitizedObj, modifierName);
  } else {
    saveLocalFourMChangePoints(updatedList);
  }

  // 3. Firestore four_m_change_points 컬렉션 문서 업데이트
  if (db) {
    const docIdsToUpdate = new Set();
    if (targetId.startsWith("ledger_")) docIdsToUpdate.add(targetId);
    else {
      docIdsToUpdate.add(targetId);
      docIdsToUpdate.add(`ledger_${targetId}`);
    }
    if (cleanId) docIdsToUpdate.add(`ledger_${cleanId}`);

    for (const dId of docIdsToUpdate) {
      try {
        await setDoc(
          doc(db, COLLECTION_NAME, dId),
          {
            fourM: newFourM,
            badgeColor,
            isManualFourM: true,
            modifiedAt: nowStr,
            modifiedBy: modifierName || "관리자"
          },
          { merge: true }
        );
      } catch (e) {
        console.warn("Firestore update four_m_change_point error:", dId, e);
      }
    }

    // 4. 원본 컬렉션(urgent_issues 등)이 존재할 경우 해당 문서도 동기화
    try {
      const urgentDocId = (isObj && isObj.raw?.id) || cleanId;
      if (urgentDocId) {
        await setDoc(
          doc(db, "urgent_issues", urgentDocId),
          {
            fourM: newFourM,
            isManualFourM: true,
            modifiedAt: nowStr
          },
          { merge: true }
        );
      }
    } catch (e) {
      // safe fallback
    }
  }

  // 5. 전역 윈도우 이벤트 발행
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("fourM_override_updated", {
        detail: { id: targetId, newFourM }
      })
    );
  }

  return getLocalFourMChangePoints();
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

  const current = getLocalFourMChangePoints();
  const existingIdx = current.findIndex(
    (it) =>
      it.id === ledgerId ||
      it.originalId === originalId ||
      (rawId && (it.rawId === rawId || it.originalId === rawId)) ||
      it.id === originalId
  );
  const existing = existingIdx >= 0 ? current[existingIdx] : null;

  // Sanitize record to avoid undefined keys or complex non-serializable objects (such as circular refs in raw)
  const ledgerItem = {
    id: ledgerId,
    originalId: originalId,
    rawId: rawId,
    fourM: record.fourM || existing?.fourM || "Machine",
    origin: record.origin || existing?.origin || "변동점",
    sourceType: record.sourceType || existing?.sourceType || "",
    badgeColor: record.badgeColor || existing?.badgeColor || "",
    plant: record.plant || existing?.plant || "삼랑진공장",
    line: record.line || existing?.line || "",
    writer: record.writer || existing?.writer || "",
    title: record.title || existing?.title || "",
    date: record.date || existing?.date || nowStr.slice(0, 10),
    time: record.time || existing?.time || "",
    content: record.content !== undefined ? record.content : (existing?.content || ""),
    actionResult: record.actionResult || existing?.actionResult || "",
    actionAuthor: record.actionAuthor || existing?.actionAuthor || "",
    actionAt: record.actionAt || existing?.actionAt || "",
    images: Array.isArray(record.images) ? record.images : (existing?.images || []),
    actionImages: Array.isArray(record.actionImages) ? record.actionImages : (existing?.actionImages || []),
    replies: Array.isArray(record.replies) ? record.replies : (existing?.replies || []),
    isResolved: Boolean(record.isResolved !== undefined ? record.isResolved : existing?.isResolved),
    severity: record.severity || existing?.severity || "NORMAL",
    downtimeMinutes: Number(record.downtimeMinutes !== undefined ? record.downtimeMinutes : existing?.downtimeMinutes) || 0,
    scrapKg: Number(record.scrapKg !== undefined ? record.scrapKg : existing?.scrapKg) || 0,
    registeredAt: existing?.registeredAt || nowStr,
    registeredBy: registeredBy || existing?.registeredBy || "관리자",
    isOfficialLedger: true
  };

  // Strip any undefined keys
  Object.keys(ledgerItem).forEach((k) => {
    if (ledgerItem[k] === undefined) delete ledgerItem[k];
  });

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

  // 🔒 오픈이슈, 회의일정, 공지사항은 4M 변동점 대장 등록 원천 배제
  const cat = String(alertItem.category || "").trim();
  if (
    cat === "오픈이슈" ||
    cat === "open_issue" ||
    cat.includes("오픈이슈") ||
    cat === "회의일정" ||
    cat.includes("회의") ||
    cat === "공지사항" ||
    cat === "사내공지" ||
    cat === "공유사항"
  ) {
    return null;
  }

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
  const coreId = getCore4MId(alertItem);
  const normKey = getNormalizedTitleKey(alertItem);
  const current = getLocalFourMChangePoints();
  const existingInLedger = current.find((it) => {
    const itCore = getCore4MId(it);
    const itNorm = getNormalizedTitleKey(it);
    return (coreId && itCore && coreId === itCore) || (normKey && itNorm && normKey === itNorm);
  });
  const fourM = (existingInLedger?.isManualFourM && existingInLedger.fourM)
    ? existingInLedger.fourM
    : determineFourMCategory(alertItem);
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
    date: alertItem.date || alertItem.targetDate || alertItem.startDate || existingInLedger?.date || (alertItem.createdAt ? String(alertItem.createdAt).slice(0, 10) : new Date().toISOString().slice(0, 10)),
    time: alertItem.time || existingInLedger?.time || "",
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

  // 5. Urgent issues (오직 관리자 품질경보/부적합경보만 엄선 - 오픈이슈/회의/공지 완전 배제)
  (urgentIssues || []).forEach((item) => {
    if (!item) return;
    const cat = String(item.category || "").trim();
    if (
      cat === "오픈이슈" ||
      cat === "open_issue" ||
      cat.includes("오픈이슈") ||
      cat === "회의일정" ||
      cat.includes("회의") ||
      cat === "공지사항" ||
      cat === "사내공지" ||
      cat === "공유사항"
    ) {
      return;
    }

    const title = String(item.title || "").toLowerCase();
    const content = String(item.content || "").toLowerCase();
    const isQuality =
      cat.includes("품질") ||
      cat.includes("부적합") ||
      item.type === "QUALITY_ALERT" ||
      title.includes("가류조") ||
      title.includes("코팅") ||
      title.includes("클립") ||
      title.includes("불량") ||
      title.includes("이상") ||
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

