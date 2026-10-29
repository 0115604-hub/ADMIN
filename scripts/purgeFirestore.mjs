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

async function purge() {
  const snap = await getDocs(collection(db, "incoming_inspections"));
  console.log("=== FIRESTORE COUNT BEFORE:", snap.size);
  snap.forEach(d => console.log("DOC:", d.id, d.data().itemName));
  
  for (const d of snap.docs) {
    console.log("-> Deleting", d.id);
    await deleteDoc(doc(db, "incoming_inspections", d.id));
  }
  
  const snap2 = await getDocs(collection(db, "incoming_inspections"));
  console.log("=== FIRESTORE COUNT AFTER:", snap2.size);
  process.exit(0);
}

purge().catch(e => {
  console.error(e);
  process.exit(1);
});
