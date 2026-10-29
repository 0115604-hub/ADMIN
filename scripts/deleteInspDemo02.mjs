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

async function deleteInspDemo02() {
  console.log("Deleting insp_demo_02...");
  await deleteDoc(doc(db, "incoming_inspections", "insp_demo_02"));
  console.log("insp_demo_02 delete finished.");

  const snap = await getDocs(collection(db, "incoming_inspections"));
  console.log("Total docs in incoming_inspections now:", snap.size);
  snap.forEach(d => console.log("Remaining doc ID:", d.id));
  process.exit(0);
}

deleteInspDemo02().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
