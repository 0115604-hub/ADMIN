import fs from "fs";

console.log("🚀 Starting 4M Change Point Architectural Pipeline Replacement...");

// 1. Update src/services/fourMChangePointService.js
{
  const filePath = "src/services/fourMChangePointService.js";
  let content = fs.readFileSync(filePath, "utf8").replace(/\r\n/g, "\n");

  // Add getCore4MId, getNormalizedTitleKey, mergeUnified4MRecords
  const helpersCode = `
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
    .replace(/^\\[(한울 부적합|유성 부적합|부적합경보|TPM 이상)\\]\\s*/i, "")
    .replace(/\\s+/g, "")
    .toLowerCase();
  const date = String(item.date || item.targetDate || item.startDate || "").slice(0, 10);
  return \`\${title}___\${date}\`;
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
`;

  if (!content.includes("export const getCore4MId =")) {
    content = content.replace(
      `// Helper: Read local storage`,
      `${helpersCode}\n// Helper: Read local storage`
    );
  }

  // Update syncQualityAlertToFourMLedger to prevent creating clone duplicate documents
  const targetSyncSearch = `  const current = getLocalFourMChangePoints();
  const existingInLedger = current.find(
    (it) => it.id === id || it.originalId === id || it.rawId === rawId || it.id === \`ledger_\${id}\`
  );`;

  const replacementSyncSearch = `  const coreId = getCore4MId(alertItem);
  const normKey = getNormalizedTitleKey(alertItem);
  const current = getLocalFourMChangePoints();
  const existingInLedger = current.find((it) => {
    const itCore = getCore4MId(it);
    const itNorm = getNormalizedTitleKey(it);
    return (coreId && itCore && coreId === itCore) || (normKey && itNorm && normKey === itNorm);
  });`;

  if (content.includes(targetSyncSearch)) {
    content = content.replace(targetSyncSearch, replacementSyncSearch);
  }

  fs.writeFileSync(filePath, content, "utf8");
  console.log("  ✅ src/services/fourMChangePointService.js updated with Canonical ID & merger!");
}

console.log("Step 1 complete.");
