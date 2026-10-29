import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, deleteDoc, doc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCiHEInVCW1x2xnyw3eOW5oEubaCiwzZOg",
  authDomain: "profit-and-loss-7d09b.firebaseapp.com",
  projectId: "profit-and-loss-7d09b",
  storageBucket: "profit-and-loss-7d09b.firebasestorage.app",
  messagingSenderId: "751528745146",
  appId: "1:751528745146:web:c9bc019f965942b3eaca83",
  measurementId: "G-2XSENS7QCB"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function cleanFirestoreDummy() {
  console.log("Checking Firestore incoming_inspections for dummy items...");
  const colRef = collection(db, "incoming_inspections");
  const snap = await getDocs(colRef);
  console.log("Total docs in incoming_inspections:", snap.size);
  let deleted = 0;
  for (const docSnap of snap.docs) {
    const id = docSnap.id;
    const data = docSnap.data();
    console.log("Found doc:", id, data.itemName, data.date);
    if (id === "mat_rec_01" || id === "mat_rec_02" || id === "mat_rec_03" || data.lotNo === "261028-F01" || data.lotNo === "TY261028-09") {
      console.log("Deleting dummy doc from Firestore:", id);
      await deleteDoc(doc(db, "incoming_inspections", id));
      deleted++;
    }
  }
  console.log(`Deleted ${deleted} dummy documents from Firestore!`);
  process.exit(0);
}

cleanFirestoreDummy().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
