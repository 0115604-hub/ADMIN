import { db } from "../src/firebase.js";
import { collection, getDocs } from "firebase/firestore";

async function inspect() {
  console.log("=== 1. four_m_change_points ===");
  const fourMSnap = await getDocs(collection(db, "four_m_change_points"));
  console.log("Total count:", fourMSnap.size);
  fourMSnap.forEach((d) => {
    const data = d.data();
    console.log(
      d.id,
      "| origId:", data.originalId,
      "| rawId:", data.rawId,
      "| title:", data.title,
      "| isResolved:", data.isResolved,
      "| status:", data.status,
      "| actionResult:", data.actionResult ? `[${data.actionResult.slice(0, 30)}]` : "(none)",
      "| fourM:", data.fourM,
      "| origin:", data.origin
    );
  });

  console.log("\n=== 2. urgent_issues ===");
  const urgSnap = await getDocs(collection(db, "urgent_issues"));
  console.log("Total count:", urgSnap.size);
  urgSnap.forEach((d) => {
    const data = d.data();
    console.log(
      d.id,
      "| title:", data.title,
      "| isResolved:", data.isResolved,
      "| status:", data.status,
      "| isDeleted:", data.isDeleted,
      "| actionResult:", data.actionResult ? `[${data.actionResult.slice(0, 30)}]` : "(none)"
    );
  });

  console.log("\n=== 3. Quality issues collections ===");
  for (const col of [
    "extrusion_quality_issues",
    "hanul_quality_issues",
    "yuseong_quality_issues",
    "machining_quality_issues"
  ]) {
    const snap = await getDocs(collection(db, col));
    console.log(col, "count:", snap.size);
    snap.forEach((d) => {
      const data = d.data();
      console.log(
        " ",
        d.id,
        "|",
        data.title || data.defectType,
        "| status:", data.status,
        "| isResolved:", data.isResolved,
        "| actionResult:", data.actionResult ? `[${data.actionResult.slice(0, 30)}]` : "(none)"
      );
    });
  }
}
inspect().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
