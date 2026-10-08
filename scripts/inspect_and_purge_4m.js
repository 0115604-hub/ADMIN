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

async function inspectAndPurge4M() {
  console.log("=== Inspecting and Purging absence_4m_logs ===");
  const snap = await getDocs(collection(db, "absence_4m_logs"));
  console.log(`Found ${snap.size} docs in absence_4m_logs:`);
  for (const docSnap of snap.docs) {
    const data = docSnap.data();
    console.log(` - ID: ${docSnap.id}, date: ${data.date}, company: ${data.company}, absent: ${data.absentWorker?.name}, sub: ${data.substituteWorker?.name}`);
    await deleteDoc(doc(db, "absence_4m_logs", docSnap.id));
    console.log(`   Deleted doc ${docSnap.id}`);
  }
  console.log("=== Successfully purged all absence_4m_logs from Firestore! ===");
  process.exit(0);
}

inspectAndPurge4M().catch((err) => {
  console.error("4M Purge Error:", err);
  process.exit(1);
});
