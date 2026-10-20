import { db } from "../src/firebase.js";
import { doc, setDoc, deleteDoc } from "firebase/firestore";

async function cleanup() {
  console.log("🚀 Starting Firestore 4M & Quality Issues DB cleanup...");

  // 1. Update extrusion_quality_issues/ext_qual_1790902570783_pbzl1 to RESOLVED
  console.log("Updating extrusion_quality_issues/ext_qual_1790902570783_pbzl1...");
  await setDoc(
    doc(db, "extrusion_quality_issues", "ext_qual_1790902570783_pbzl1"),
    {
      status: "RESOLVED",
      isResolved: true,
      resolvedAt: "2026-10-20 10:00",
      resolutionNote: "타임 벨트 교체 수리",
      actionResult: "타임 벨트 교체 수리"
    },
    { merge: true }
  );
  console.log("  ✅ ext_qual_1790902570783_pbzl1 updated to RESOLVED");

  // 2. Update hanul_quality_issues/hanul_qual_1791958413663_cx4a to RESOLVED
  console.log("Updating hanul_quality_issues/hanul_qual_1791958413663_cx4a...");
  await setDoc(
    doc(db, "hanul_quality_issues", "hanul_qual_1791958413663_cx4a"),
    {
      status: "RESOLVED",
      isResolved: true,
      resolvedAt: "2026-10-20 10:00",
      resolutionNote: "지텍에서 전수선별이후 생산투입 (불량수량 5,500EA)",
      actionResult: "지텍에서 전수선별이후 생산투입 (불량수량 5,500EA)"
    },
    { merge: true }
  );
  console.log("  ✅ hanul_qual_1791958413663_cx4a updated to RESOLVED");

  // 3. Remove redundant duplicate clone documents from four_m_change_points
  const duplicateIds = [
    "ledger_issue_1789432502306",
    "ledger_issue_1790051849505",
    "ledger_issue_1790669717010",
    "ledger_issue_1791284063707",
    "ledger_issue_1791284282957",
    "ledger_issue_1791757670265"
  ];

  for (const id of duplicateIds) {
    console.log(`Deleting duplicate clone doc from four_m_change_points: ${id}...`);
    await deleteDoc(doc(db, "four_m_change_points", id));
  }
  console.log("  ✅ All redundant clone documents deleted from four_m_change_points!");
}

cleanup().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
