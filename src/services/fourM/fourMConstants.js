/**
 * fourMConstants.js
 * Storage keys, manual override handlers, badge styles, company resolvers,
 * canonical ID normalization, and 4M record mergers.
 */

export const COLLECTION_NAME = "four_m_change_points";
export const LOCAL_STORAGE_KEY = "factory_four_m_change_points_v1";
export const OVERRIDES_STORAGE_KEY = "factory_four_m_overrides_v1";

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

// Helper: 4M Record Company Standardizer (소속사명 추출 헬퍼)
export const getFourMRecordCompany = (rec) => {
  if (!rec) return "오륙";
  const rawComp = rec.company || rec.contractor || rec.raw?.company || rec.raw?.contractor;
  if (rawComp) {
    const s = String(rawComp).trim();
    if (s.includes("유성")) return "유성";
    if (s.includes("조영")) return "조영";
    if (s.includes("한울")) return "한울";
    if (s.includes("부림")) return "부림텍";
    if (s.includes("오륙") || s.includes("설압출")) return "오륙";
  }
  const text = `${rec.title || ""} ${rec.content || ""} ${rec.line || ""} ${rec.plant || ""}`;
  const m = text.match(/\[(오륙|유성|조영|한울|부림텍|부림|설압출)\]/);
  if (m && m[1]) {
    return m[1] === "부림" ? "부림텍" : (m[1] === "설압출" ? "오륙" : m[1]);
  }
  const pm = text.match(/\((오륙|유성|조영|한울|부림텍|부림|설압출)\)/);
  if (pm && pm[1]) {
    return pm[1] === "부림" ? "부림텍" : (pm[1] === "설압출" ? "오륙" : pm[1]);
  }
  if (text.includes("유성")) return "유성";
  if (text.includes("조영")) return "조영";
  if (text.includes("한울")) return "한울";
  if (text.includes("부림")) return "부림텍";
  if (text.includes("오륙") || text.includes("설압출")) return "오륙";

  if (String(rec.plant || "").includes("한림")) return "한울";
  return "오륙";
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
    approvalStatus: incoming.approvalStatus !== undefined ? incoming.approvalStatus : (existing.approvalStatus || ""),
    approvalDocId: incoming.approvalDocId !== undefined ? incoming.approvalDocId : (existing.approvalDocId || ""),
    approvedBy: incoming.approvedBy !== undefined ? incoming.approvedBy : (existing.approvedBy || ""),
    approvedTitle: incoming.approvedTitle !== undefined ? incoming.approvedTitle : (existing.approvedTitle || ""),
    approvedAt: incoming.approvedAt !== undefined ? incoming.approvedAt : (existing.approvedAt || ""),
    approvalSignature: incoming.approvalSignature !== undefined ? incoming.approvalSignature : (existing.approvalSignature || ""),
    approvalComment: incoming.approvalComment !== undefined ? incoming.approvalComment : (existing.approvalComment || ""),
    targetApprover: incoming.targetApprover !== undefined ? incoming.targetApprover : (existing.targetApprover || ""),
    approvalRequestedAt: incoming.approvalRequestedAt !== undefined ? incoming.approvalRequestedAt : (existing.approvalRequestedAt || ""),
    rootCause: incoming.rootCause || existing.rootCause || "",
    whyAnalysis: incoming.whyAnalysis || existing.whyAnalysis || "",
    correctiveAction: incoming.correctiveAction || existing.correctiveAction || "",
    isSqNotice: incoming.isSqNotice !== undefined ? incoming.isSqNotice : existing.isSqNotice,
    beforePhotos: (Array.isArray(incoming.beforePhotos) && incoming.beforePhotos.length > 0) ? incoming.beforePhotos : (existing.beforePhotos || []),
    afterPhotos: (Array.isArray(incoming.afterPhotos) && incoming.afterPhotos.length > 0) ? incoming.afterPhotos : (existing.afterPhotos || [])
  };
};
