import {
  collection,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  getDocs,
  onSnapshot,
  runTransaction
} from "firebase/firestore";
import { db } from "../firebase.js";

import { DEFAULT_OFFICIAL_4M_RECORDS } from "../data/defaultOfficial4MRecords";
import {
  COLLECTION_NAME,
  LOCAL_STORAGE_KEY,
  OVERRIDES_STORAGE_KEY,
  getFourMOverrides,
  saveFourMOverrides,
  getFourMBadgeColor,
  getFourMRecordCompany,
  getCore4MId,
  getNormalizedTitleKey,
  mergeUnified4MRecords
} from "./fourM/fourMConstants";
import { determineFourMCategory } from "./fourM/fourMCategoryClassifier";

// Re-export modular constants, predicates, and standardizer utilities
export {
  DEFAULT_OFFICIAL_4M_RECORDS,
  COLLECTION_NAME,
  LOCAL_STORAGE_KEY,
  OVERRIDES_STORAGE_KEY,
  getFourMOverrides,
  saveFourMOverrides,
  getFourMBadgeColor,
  getFourMRecordCompany,
  getCore4MId,
  getNormalizedTitleKey,
  mergeUnified4MRecords,
  determineFourMCategory
};

// Helper: Read local storage (공식 대장 등재분 영구 보존 및 누락 복구 보장)
export const getLocalFourMChangePoints = () => {
  try {
    let localList = [];
    if (typeof localStorage !== "undefined") {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) localList = parsed;
      }
    }
    const map = new Map();
    DEFAULT_OFFICIAL_4M_RECORDS.forEach((r) => {
      if (r && r.id) map.set(r.id, r);
    });
    localList.forEach((r) => {
      if (r && r.id) {
        // 생산관리자가 이관한 미공식 건은 공식대장 로컬 캐시에 남지 않도록 필터링
        if (r.isOfficialLedger === false || (r.sourceType === "WORK_REPORT_NC" && !r.isOfficialLedger)) return;
        const existing = map.get(r.id);
        map.set(r.id, existing ? { ...existing, ...r } : r);
      }
    });
    return Array.from(map.values()).sort((a, b) => {
      if (b.registeredAt !== a.registeredAt) return (b.registeredAt || "").localeCompare(a.registeredAt || "");
      return (b.date || "").localeCompare(a.date || "");
    });
  } catch (e) {
    console.error("Local storage read error for 4M change points:", e);
    return DEFAULT_OFFICIAL_4M_RECORDS;
  }
};

// Firestore 동기화 보완 헬퍼 (공식 대장 기본 레코드 영구 보장 - 기존 결재 상태 보존 및 자동 덮어쓰기 금지)
export const syncDefaultFourMRecordsToFirestore = async () => {
  if (!db) return;
  try {
    for (const item of DEFAULT_OFFICIAL_4M_RECORDS) {
      const docRef = doc(db, COLLECTION_NAME, item.id);
      const snap = await getDoc(docRef);
      if (!snap.exists()) {
        await setDoc(docRef, { ...item, approvalDocId: "", approvalStatus: "" });
      }
    }
  } catch (e) {
    console.warn("syncDefaultFourMRecordsToFirestore error:", e);
  }
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
      // Trigger background sync for official records
      syncDefaultFourMRecordsToFirestore().catch(() => {});

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

          // Merge with DEFAULT_OFFICIAL_4M_RECORDS to guarantee all official records are permanently preserved
          const map = new Map();
          DEFAULT_OFFICIAL_4M_RECORDS.forEach((r) => {
            if (r && r.id) map.set(r.id, r);
          });
          remoteList.forEach((r) => {
            if (r && r.id) {
              // 생산관리자가 이관한 미공식 건은 공식대장 캐시에 남지 않도록 필터링
              if (r.isOfficialLedger === false || (r.sourceType === "WORK_REPORT_NC" && !r.isOfficialLedger)) return;
              const existing = map.get(r.id);
              map.set(r.id, existing ? { ...existing, ...r } : r);
            }
          });

          // Single sort for all subscribers
          const mergedList = Array.from(map.values()).sort((a, b) => {
            if (b.registeredAt !== a.registeredAt) return (b.registeredAt || "").localeCompare(a.registeredAt || "");
            return (b.date || "").localeCompare(a.date || "");
          });

          fourMCache = mergedList;
          saveLocalFourMChangePoints(mergedList);

          // Dispatch to all subscribers
          fourMSubscribers.forEach((cb) => {
            try {
              cb(mergedList);
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

  // 🔒 4M 공식대장 등록권한은 오직 이창엽에게만 있음 (생산관리자의 직접 등록 차단)
  const isLeeChangYeop =
    registeredBy === "이창엽" ||
    record.registeredBy === "이창엽" ||
    record.classifiedBy === "이창엽" ||
    record.qualityReviewer === "이창엽" ||
    registeredBy === "권태형" ||
    record.registeredBy === "권태형";

  if (!isLeeChangYeop) {
    console.warn("[4M 공식대장 등록권한 차단] 생산관리자는 4M 공식대장에 직접 등록할 권한이 없습니다. (이창엽 품질책임자 전용):", registeredBy, record);
    return getLocalFourMChangePoints();
  }

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
    // 🔒 발생일자 및 최초등록일시 불변 락 (기존 등록건은 원천 불변)
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
    isQualityClassified: record.isQualityClassified !== undefined ? Boolean(record.isQualityClassified) : (existing?.isQualityClassified !== undefined ? existing.isQualityClassified : true),
    isOfficialLedger: record.isOfficialLedger !== undefined ? Boolean(record.isOfficialLedger) : (existing?.isOfficialLedger !== undefined ? existing.isOfficialLedger : true),
    // 👑 4단계 전자결재 및 경영진 승인 동기화 필드
    approvalStatus: record.approvalStatus !== undefined ? record.approvalStatus : (existing?.approvalStatus || ""),
    approvalDocId: record.approvalDocId !== undefined ? record.approvalDocId : (existing?.approvalDocId || ""),
    approvedBy: record.approvedBy !== undefined ? record.approvedBy : (existing?.approvedBy || ""),
    approvedTitle: record.approvedTitle !== undefined ? record.approvedTitle : (existing?.approvedTitle || ""),
    approvedAt: record.approvedAt !== undefined ? record.approvedAt : (existing?.approvedAt || ""),
    approvalSignature: record.approvalSignature !== undefined ? record.approvalSignature : (existing?.approvalSignature || ""),
    approvalComment: record.approvalComment !== undefined ? record.approvalComment : (existing?.approvalComment || ""),
    targetApprover: record.targetApprover !== undefined ? record.targetApprover : (existing?.targetApprover || ""),
    approvalRequestedAt: record.approvalRequestedAt !== undefined ? record.approvalRequestedAt : (existing?.approvalRequestedAt || ""),
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

  // 1. Firestore 원자적 트랜잭션 (runTransaction) 적용으로 동시 수정 경합(Race Condition) 방어
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
