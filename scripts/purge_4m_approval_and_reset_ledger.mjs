import { db } from "../src/firebase.js";
import { collection, getDocs, deleteDoc, doc, updateDoc } from "firebase/firestore";

function isFourMDoc(id, data = {}) {
  if (!id) return false;
  if (String(id).startsWith("appr_4m_")) return true;
  if (data.type === "FOUR_M_CHANGE_POINT" || data.type === "CHANGE_POINT" || data.docType === "FOUR_M_CHANGE_POINT") return true;
  if (data.category === "4M변동점" || data.typeName?.includes("4M") || data.typeName?.includes("변동점")) return true;
  if (data.title && (data.title.includes("4M") || data.title.includes("변동점"))) return true;
  return false;
}

async function run() {
  console.log("=== [1] Deleting 4M documents from approval_documents ===");
  const apprSnap = await getDocs(collection(db, "approval_documents"));
  let apprDeletedCount = 0;
  for (const docSnap of apprSnap.docs) {
    const data = docSnap.data();
    if (isFourMDoc(docSnap.id, data)) {
      console.log(`Deleting approval_documents: ${docSnap.id} | ${data.title?.slice(0, 50)}`);
      await deleteDoc(doc(db, "approval_documents", docSnap.id));
      apprDeletedCount++;
    }
  }
  console.log(`-> Total deleted from approval_documents: ${apprDeletedCount}`);

  console.log("\n=== [2] Deleting 4M documents from deleted_approval_documents ===");
  const delSnap = await getDocs(collection(db, "deleted_approval_documents"));
  let delDeletedCount = 0;
  for (const docSnap of delSnap.docs) {
    const data = docSnap.data();
    if (isFourMDoc(docSnap.id, data)) {
      console.log(`Deleting deleted_approval_documents: ${docSnap.id}`);
      await deleteDoc(doc(db, "deleted_approval_documents", docSnap.id));
      delDeletedCount++;
    }
  }
  console.log(`-> Total deleted from deleted_approval_documents: ${delDeletedCount}`);

  console.log("\n=== [3] Resetting approval fields in four_m_change_points ===");
  const fourMSnap = await getDocs(collection(db, "four_m_change_points"));
  let fourMResetCount = 0;
  for (const docSnap of fourMSnap.docs) {
    console.log(`Resetting approval fields for 4M doc: ${docSnap.id}`);
    await updateDoc(doc(db, "four_m_change_points", docSnap.id), {
      approvalDocId: "",
      approvalStatus: "",
      approvedBy: "",
      approvedTitle: "",
      approvedAt: "",
      approvalSignature: "",
      approvalComment: "",
      targetApprover: "",
      approvalRequestedAt: ""
    });
    fourMResetCount++;
  }
  console.log(`-> Total reset in four_m_change_points: ${fourMResetCount}`);

  console.log("\n=== [4] Verification ===");
  const verifyApprSnap = await getDocs(collection(db, "approval_documents"));
  const remaining4M = verifyApprSnap.docs.filter(d => isFourMDoc(d.id, d.data()));
  console.log(`Remaining 4M docs in approval_documents: ${remaining4M.length}`);
  console.log(`Total remaining docs in approval_documents: ${verifyApprSnap.size}`);

  const verifyFourMSnap = await getDocs(collection(db, "four_m_change_points"));
  console.log(`Total documents in four_m_change_points: ${verifyFourMSnap.size}`);
  let pendingCount = 0;
  verifyFourMSnap.docs.forEach(d => {
    const data = d.data();
    if (data.approvalDocId || data.approvalStatus) {
      pendingCount++;
      console.log(`Warning: ${d.id} still has approvalDocId=${data.approvalDocId}, status=${data.approvalStatus}`);
    }
  });
  console.log(`Unsubmitted 4M items ready for Lee Chang-yeop: ${verifyFourMSnap.size - pendingCount} / ${verifyFourMSnap.size}`);

  process.exit(0);
}

run().catch((err) => {
  console.error("Purge error:", err);
  process.exit(1);
});
