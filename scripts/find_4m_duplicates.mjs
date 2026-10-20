import { db } from "../src/firebase.js";
import { collection, getDocs } from "firebase/firestore";

async function simulateUnified() {
  const fourMSnap = await getDocs(collection(db, "four_m_change_points"));
  const fourMLedgerRecords = fourMSnap.docs.map(d => ({ id: d.id, ...d.data() }));

  const urgSnap = await getDocs(collection(db, "urgent_issues"));
  const urgentIssues = urgSnap.docs.map(d => ({ id: d.id, ...d.data() }));

  const extSnap = await getDocs(collection(db, "extrusion_quality_issues"));
  const extrusionQualityAlerts = extSnap.docs.map(d => ({ id: d.id, ...d.data() }));

  const hanulSnap = await getDocs(collection(db, "hanul_quality_issues"));
  const hanulQualityIssues = hanulSnap.docs.map(d => ({ id: d.id, ...d.data() }));

  console.log("fourMLedgerRecords:", fourMLedgerRecords.length);
  console.log("urgentIssues:", urgentIssues.length);
  console.log("extrusionQualityAlerts:", extrusionQualityAlerts.length);
  console.log("hanulQualityIssues:", hanulQualityIssues.length);

  // Group by title to see duplicates
  const allItems = [];

  urgentIssues.forEach(it => {
    if (it.isDeleted) return;
    const cat = String(it.category || "");
    if (cat === "오픈이슈" || cat.includes("회의") || cat.includes("공지")) return;
    allItems.push({
      source: "urgent_issues",
      id: it.id,
      title: it.title,
      isResolved: Boolean(it.isResolved || (it.actionResult && it.actionResult.trim())),
      status: it.status
    });
  });

  extrusionQualityAlerts.forEach(it => {
    allItems.push({
      source: "extrusion_quality_issues",
      id: it.id,
      title: it.title || it.defectType,
      isResolved: it.status === "RESOLVED" || (it.status !== "ACTIVE" && Boolean(it.actionResult && it.actionResult.trim())),
      status: it.status
    });
  });

  hanulQualityIssues.forEach(it => {
    allItems.push({
      source: "hanul_quality_issues",
      id: it.id,
      title: it.title || it.defectType,
      isResolved: it.status === "RESOLVED" || (it.status !== "ACTIVE" && Boolean(it.actionResult && it.actionResult.trim())),
      status: it.status
    });
  });

  fourMLedgerRecords.forEach(it => {
    const cat = String(it.category || "");
    if (cat === "오픈이슈" || cat.includes("회의") || cat.includes("공지")) return;
    allItems.push({
      source: "four_m_change_points",
      id: it.id,
      originalId: it.originalId,
      rawId: it.rawId,
      title: it.title,
      isResolved: Boolean(it.isResolved),
      status: it.status
    });
  });

  // Find duplicates by title
  const titleMap = {};
  allItems.forEach(it => {
    const cleanTitle = (it.title || "").replace(/^\[(한울 부적합|유성 부적합|부적합경보)\]\s*/, "").trim();
    if (!titleMap[cleanTitle]) titleMap[cleanTitle] = [];
    titleMap[cleanTitle].push(it);
  });

  console.log("\n=== Duplicate Titles ===");
  Object.keys(titleMap).forEach(t => {
    if (titleMap[t].length > 1) {
      console.log(`\n📌 Title: "${t}" (${titleMap[t].length} entries):`);
      titleMap[t].forEach(it => {
        console.log(`   Source: ${it.source} | ID: ${it.id} | isResolved: ${it.isResolved} (${it.isResolved ? '조치완료' : '진행중'}) | status: ${it.status}`);
      });
    }
  });
}

simulateUnified().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
