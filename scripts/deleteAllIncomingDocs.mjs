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

async function deleteAll() {
  console.log("Fetching all docs in incoming_inspections...");
  const snap = await getDocs(collection(db, "incoming_inspections"));
  console.log("Count before delete:", snap.size);
  
  for (const d of snap.docs) {
    console.log("Deleting document:", d.id);
    await deleteDoc(doc(db, "incoming_inspections", d.id));
  }
  
  console.log("Waiting 2 seconds to verify...");
  await new Promise(r => setTimeout(r, 2000));
  
  const verifySnap = await getDocs(collection(db, "incoming_inspections"));
  console.log("Count after delete:", verifySnap.size);
  verifySnap.forEach(d => console.log("Remaining doc:", d.id));
  process.exit(0);
}

deleteAll().catch(err => {
  console.error("Delete error:", err);
  process.exit(1);
});
