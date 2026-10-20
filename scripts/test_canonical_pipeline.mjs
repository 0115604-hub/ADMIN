import { db } from "../src/firebase.js";
import { collection, getDocs } from "firebase/firestore";

function getCore4MId(idOrItem) {
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
}

function getNormalizedTitleKey(item) {
  if (!item) return "";
  const title = String(item.title || item.defectType || item.content || "")
    .replace(/^\[(한울 부적합|유성 부적합|부적합경보|TPM 이상)\]\s*/i, "")
    .replace(/\s+/g, "")
    .toLowerCase();
  const date = String(item.date || item.targetDate || item.startDate || "").slice(0, 10);
  return `${title}___${date}`;
}

async function testPipeline() {
  const fourMSnap = await getDocs(collection(db, "four_m_change_points"));
  const fourMLedgerRecords = fourMSnap.docs.map(d => ({ id: d.id, ...d.data() }));

  const urgSnap = await getDocs(collection(db, "urgent_issues"));
  const urgentIssues = urgSnap.docs.map(d => ({ id: d.id, ...d.data() }));

  const extSnap = await getDocs(collection(db, "extrusion_quality_issues"));
  const extrusionQualityAlerts = extSnap.docs.map(d => ({ id: d.id, ...d.data() }));

  const hanulSnap = await getDocs(collection(db, "hanul_quality_issues"));
  const hanulQualityIssues = hanulSnap.docs.map(d => ({ id: d.id, ...d.data() }));

  const allRawItems = [];

  urgentIssues.forEach(it => {
    if (it.isDeleted) return;
    const cat = String(it.category || "");
    if (cat === "오픈이슈" || cat.includes("회의") || cat.includes("공지")) return;
    allRawItems.push({ ...it, id: `urg_${it.id}`, sourceType: "QUALITY_ALERT", origin: "부적합경보" });
  });

  extrusionQualityAlerts.forEach(it => {
    allRawItems.push({ ...it, id: `ext_q_${it.id}`, sourceType: "QUALITY_ALERT", origin: "부적합경보" });
  });

  hanulQualityIssues.forEach(it => {
    allRawItems.push({ ...it, id: `hanul_q_${it.id}`, sourceType: "QUALITY_ALERT", origin: "부적합경보" });
  });

  fourMLedgerRecords.forEach(it => {
    const cat = String(it.category || "");
    if (cat === "오픈이슈" || cat.includes("회의") || cat.includes("공지")) return;
    allRawItems.push({ ...it, isOfficialLedger: true });
  });

  console.log("Total raw items before pipeline:", allRawItems.length);

  // Apply new Canonical Pipeline
  const canonicalMap = new Map();

  allRawItems.forEach(item => {
    const coreId = getCore4MId(item);
    const titleKey = getNormalizedTitleKey(item);

    // Find existing by coreId or titleKey
    let matchedKey = null;
    if (coreId && coreId.length >= 8 && canonicalMap.has(`core_${coreId}`)) {
      matchedKey = `core_${coreId}`;
    } else if (titleKey && canonicalMap.has(`title_${titleKey}`)) {
      matchedKey = canonicalMap.get(`title_${titleKey}`);
    }

    const isResolved = Boolean(
      item.isResolved ||
      item.status === "RESOLVED" ||
      item.status === "CLOSED" ||
      (item.actionResult && String(item.actionResult).trim().length > 0)
    );

    const normalizedItem = {
      ...item,
      isResolved,
      actionResult: item.actionResult || (isResolved ? "조치 완료" : "")
    };

    if (matchedKey) {
      const existing = canonicalMap.get(matchedKey);
      const merged = {
        ...existing,
        ...normalizedItem,
        isResolved: existing.isResolved || normalizedItem.isResolved,
        actionResult: normalizedItem.actionResult?.trim() ? normalizedItem.actionResult : existing.actionResult
      };
      canonicalMap.set(matchedKey, merged);
    } else {
      const newKey = coreId && coreId.length >= 8 ? `core_${coreId}` : `title_${titleKey || Math.random()}`;
      canonicalMap.set(newKey, normalizedItem);
      if (titleKey) {
        canonicalMap.set(`title_${titleKey}`, newKey);
      }
    }
  });

  // Collect unique items (filter out title index pointers)
  const uniqueItems = Array.from(canonicalMap.values()).filter(v => typeof v === "object" && v !== null);

  console.log("Total unique items after Canonical Pipeline:", uniqueItems.length);

  // Check if any title still has duplicates
  const testMap = {};
  uniqueItems.forEach(it => {
    const cleanTitle = (it.title || "").replace(/^\[.*?\]\s*/, "").trim();
    if (!testMap[cleanTitle]) testMap[cleanTitle] = [];
    testMap[cleanTitle].push(it);
  });

  let duplicateCount = 0;
  Object.keys(testMap).forEach(t => {
    if (testMap[t].length > 1) {
      duplicateCount++;
      console.log(`❌ Duplicate found for: "${t}" (${testMap[t].length} entries)`);
    }
  });

  if (duplicateCount === 0) {
    console.log("🎉 SUCCESS! ZERO duplicates found! All items cleanly unified!");
  }

  // Print sample items to verify status
  console.log("\nSample unified items:");
  uniqueItems.slice(0, 5).forEach(it => {
    console.log(`• ${it.title} | status: ${it.isResolved ? '조치완료' : '진행중'} | actionResult: ${it.actionResult?.slice(0, 30)}`);
  });
}

testPipeline().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
