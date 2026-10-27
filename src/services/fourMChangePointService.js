import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  onSnapshot,
  runTransaction
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

  const preferredSourceType =
    existing.sourceType === "QUALITY_ALERT" || incoming.sourceType === "QUALITY_ALERT"
      ? "QUALITY_ALERT"
      : (existing.sourceType || incoming.sourceType);
  const preferredRaw =
    existing.sourceType === "QUALITY_ALERT" && existing.raw
      ? existing.raw
      : incoming.sourceType === "QUALITY_ALERT" && incoming.raw
      ? incoming.raw
      : (existing.raw || incoming.raw);
  const preferredOrigin =
    existing.sourceType === "QUALITY_ALERT" && existing.origin
      ? existing.origin
      : incoming.sourceType === "QUALITY_ALERT" && incoming.origin
      ? incoming.origin
      : (existing.origin || incoming.origin);

  return {
    ...existing,
    ...incoming,
    id: existing.id || incoming.id,
    sourceType: preferredSourceType,
    origin: preferredOrigin,
    raw: preferredRaw,
    ledgerRaw: incoming.isOfficialLedger ? incoming.raw : (existing.isOfficialLedger ? existing.raw : undefined),
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
    ),
    // 👑 경영진 결재 및 CAPA 필드 불변 보존
    approvalStatus: incoming.approvalStatus || existing.approvalStatus || "",
    approvalDocId: incoming.approvalDocId || existing.approvalDocId || "",
    approvedBy: incoming.approvedBy || existing.approvedBy || "",
    approvedTitle: incoming.approvedTitle || existing.approvedTitle || "",
    approvedAt: incoming.approvedAt || existing.approvedAt || "",
    approvalSignature: incoming.approvalSignature || existing.approvalSignature || "",
    approvalComment: incoming.approvalComment || existing.approvalComment || "",
    targetApprover: incoming.targetApprover || existing.targetApprover || "",
    approvalRequestedAt: incoming.approvalRequestedAt || existing.approvalRequestedAt || "",
    rootCause: incoming.rootCause || existing.rootCause || "",
    whyAnalysis: incoming.whyAnalysis || existing.whyAnalysis || "",
    correctiveAction: incoming.correctiveAction || existing.correctiveAction || "",
    isSqNotice: incoming.isSqNotice !== undefined ? incoming.isSqNotice : existing.isSqNotice,
    beforePhotos: (Array.isArray(incoming.beforePhotos) && incoming.beforePhotos.length > 0) ? incoming.beforePhotos : (existing.beforePhotos || []),
    afterPhotos: (Array.isArray(incoming.afterPhotos) && incoming.afterPhotos.length > 0) ? incoming.afterPhotos : (existing.afterPhotos || [])
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

// Helper: Save local storage and immediately push to all subscribers
export const saveLocalFourMChangePoints = (items) => {
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items || []));
    }
    fourMCache = items;
    fourMSubscribers.forEach((cb) => {
      try {
        cb(items);
      } catch (err) {}
    });
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("oryuk_four_m_updated", { detail: items }));
    }
  } catch (e) {
    console.error("Local storage write error for 4M change points:", e);
  }
};

// ⚡ Singleton Multiplexed Real-time Listener (Single-Flight Pattern)
let activeFourMUnsub = null;
let fourMCache = null;
const fourMSubscribers = new Set();
let fourMCleanupTimer = null;

// Real-time Cloud Synchronization (Firestore authoritative stream, Multi-Subscriber Shared)
export const subscribeFourMChangePoints = (onUpdate) => {
  if (typeof onUpdate !== "function") return () => {};

  fourMSubscribers.add(onUpdate);

  // Immediately serve cached data (zero-latency initial render)
  if (fourMCache) {
    onUpdate(fourMCache);
  } else {
    fourMCache = getLocalFourMChangePoints();
    onUpdate(fourMCache);
  }

  // Cancel any pending teardown timer
  if (fourMCleanupTimer) {
    clearTimeout(fourMCleanupTimer);
    fourMCleanupTimer = null;
  }

  // Open single Firestore stream if not already active
  if (!activeFourMUnsub && db) {
    try {
      const colRef = collection(db, COLLECTION_NAME);
      activeFourMUnsub = onSnapshot(
        colRef,
        (snapshot) => {
          const remoteList = [];
          if (!snapshot.empty) {
            snapshot.forEach((d) => {
              remoteList.push({ id: d.id, ...d.data() });
            });
          }

          // Single sort for all subscribers
          remoteList.sort((a, b) => {
            if (b.registeredAt !== a.registeredAt) return (b.registeredAt || "").localeCompare(a.registeredAt || "");
            return (b.date || "").localeCompare(a.date || "");
          });

          fourMCache = remoteList;
          saveLocalFourMChangePoints(remoteList);

          // Dispatch to all subscribers
          fourMSubscribers.forEach((cb) => {
            try {
              cb(remoteList);
            } catch (err) {
              console.error("4M subscriber callback error:", err);
            }
          });
        },
        (error) => {
          console.warn("Firestore four_m_change_points sync warning:", error);
          const fallback = getLocalFourMChangePoints();
          fourMSubscribers.forEach((cb) => cb(fallback));
        }
      );
    } catch (e) {
      console.error("subscribeFourMChangePoints error:", e);
    }
  }

  // Return unsubscribe for this specific subscriber
  return () => {
    fourMSubscribers.delete(onUpdate);
    // Debounced teardown after 5 seconds of zero subscribers
    if (fourMSubscribers.size === 0 && activeFourMUnsub) {
      fourMCleanupTimer = setTimeout(() => {
        if (fourMSubscribers.size === 0 && activeFourMUnsub) {
          activeFourMUnsub();
          activeFourMUnsub = null;
        }
      }, 5000);
    }
  };
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
    // 🔒 [P2-5 & P2-6] 발생일자 및 최초등록일시 불변 락 (기존 등록건은 원천 불변)
    date: existing?.date ? existing.date : (record.date || nowStr.slice(0, 10)),
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
    registeredAt: existing?.registeredAt ? existing.registeredAt : (record.registeredAt || nowStr),
    registeredBy: registeredBy || existing?.registeredBy || "이창엽",
    classifiedBy: registeredBy || existing?.classifiedBy || "이창엽",
    isQualityClassified: true,
    isOfficialLedger: true,
    // 👑 4단계 전자결재 및 경영진 승인 동기화 필드
    approvalStatus: record.approvalStatus || existing?.approvalStatus || "",
    approvalDocId: record.approvalDocId || existing?.approvalDocId || "",
    approvedBy: record.approvedBy || existing?.approvedBy || "",
    approvedTitle: record.approvedTitle || existing?.approvedTitle || "",
    approvedAt: record.approvedAt || existing?.approvedAt || "",
    approvalSignature: record.approvalSignature || existing?.approvalSignature || "",
    approvalComment: record.approvalComment || existing?.approvalComment || "",
    targetApprover: record.targetApprover || existing?.targetApprover || "",
    approvalRequestedAt: record.approvalRequestedAt || existing?.approvalRequestedAt || "",
    // 🔍 3단계 5-Why 원인분석 및 CAPA 대책 필드
    rootCause: record.rootCause || existing?.rootCause || "",
    whyAnalysis: record.whyAnalysis || existing?.whyAnalysis || "",
    correctiveAction: record.correctiveAction || existing?.correctiveAction || "",
    isSqNotice: Boolean(record.isSqNotice !== undefined ? record.isSqNotice : existing?.isSqNotice),
    beforePhotos: Array.isArray(record.beforePhotos) ? record.beforePhotos : (existing?.beforePhotos || []),
    afterPhotos: Array.isArray(record.afterPhotos) ? record.afterPhotos : (existing?.afterPhotos || []),
    targetDate: record.targetDate || existing?.targetDate || ""
  };

  // Strip any undefined keys
  Object.keys(ledgerItem).forEach((k) => {
    if (ledgerItem[k] === undefined) delete ledgerItem[k];
  });

  // 1. [P2-6] Firestore 원자적 트랜잭션 (runTransaction) 적용으로 동시 수정 경합(Race Condition) 방어
  if (db) {
    try {
      const docRef = doc(db, COLLECTION_NAME, ledgerId);
      const committedItem = await runTransaction(db, async (transaction) => {
        const snap = await transaction.get(docRef);
        const remoteData = snap.exists() ? snap.data() : null;

        // 원격 문서가 이미 존재하면 클라우드 발생일자 및 등록일시 절대 불변 보존
        const enforcedDate = remoteData?.date || ledgerItem.date;
        const enforcedRegisteredAt = remoteData?.registeredAt || ledgerItem.registeredAt;

        const merged = {
          ...remoteData,
          ...ledgerItem,
          date: enforcedDate,
          registeredAt: enforcedRegisteredAt,
          updatedAt: nowStr
        };

        Object.keys(merged).forEach((k) => {
          if (merged[k] === undefined) delete merged[k];
        });

        transaction.set(docRef, merged, { merge: true });
        return merged;
      });

      // 로컬 스토리지 캐시 동기화
      const nextLocal = existingIdx >= 0
        ? current.map((it, idx) => (idx === existingIdx ? committedItem : it))
        : [committedItem, ...current];
      saveLocalFourMChangePoints(nextLocal);
      return committedItem;
    } catch (e) {
      console.warn("Firestore runTransaction 4M ledger fallback:", e);
    }
  }

  // 오프라인 폴백
  let updated;
  if (existingIdx >= 0) {
    updated = [...current];
    updated[existingIdx] = ledgerItem;
  } else {
    updated = [ledgerItem, ...current];
  }

  saveLocalFourMChangePoints(updated);

  try {
    await setDoc(doc(db, COLLECTION_NAME, ledgerId), ledgerItem, { merge: true });
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
 * 🌟 [품질 단일 원천 원칙] 부적합경보/품질이슈의 공식 4M 대장 자동 동기화 중단
 * (모든 변동점은 하단 통합 취합 패널로만 모이며, 이창엽 품질관리자가 직접 분류/등록한 건만 공식 대장에 등재됨)
 */
export const syncQualityAlertToFourMLedger = async (alertItem, originName = "부적합경보") => {
  return null;
};

/**
 * 🌟 [품질 단일 원천 원칙] 전 공정 부적합경보의 공식 4M 대장 일괄 자동 동기화 중단
 */
export const autoSyncAllQualityIssuesToFourMLedger = async (qualityLists = {}) => {
  return [];
};

