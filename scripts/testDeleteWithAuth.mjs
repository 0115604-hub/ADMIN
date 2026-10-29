import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { getAuth, signInAnonymously } from "firebase/auth";

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
const auth = getAuth(app);
const db = getFirestore(app);

async function testDelete() {
  try {
    const cred = await signInAnonymously(auth);
    console.log("Signed in anonymously as:", cred.user.uid);
  } catch (err) {
    console.log("Auth warning (might not be required):", err.message);
  }

  try {
    console.log("Attempting deleteDoc on insp_demo_01...");
    await deleteDoc(doc(db, "incoming_inspections", "insp_demo_01"));
    console.log("Delete call finished for insp_demo_01");
  } catch (err) {
    console.error("Delete call FAILED:", err);
  }

  const snap = await getDocs(collection(db, "incoming_inspections"));
  console.log("Total docs now:", snap.size);
  snap.forEach(d => console.log("Remaining doc ID:", d.id));
  process.exit(0);
}

testDelete();
