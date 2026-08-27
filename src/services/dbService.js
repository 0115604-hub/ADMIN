import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
  writeBatch
} from "firebase/firestore";
import { db } from "../firebase";
import combinedDataset from "../data/combined202607.json";

const COLLECTION_NAME = "transactions";
const LOCAL_STORAGE_KEY = "admin_pnl_transactions_full_v2";

export const INITIAL_SAMPLE_DATA = combinedDataset || [];

// Helper: Get local fallback data
const getLocalData = () => {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!data) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(INITIAL_SAMPLE_DATA));
      return INITIAL_SAMPLE_DATA;
    }
    return JSON.parse(data);
  } catch (e) {
    return INITIAL_SAMPLE_DATA;
  }
};

const saveLocalData = (data) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error("Local storage save error:", e);
  }
};

// Fetch all transactions
export const fetchTransactions = async () => {
  try {
    const q = query(collection(db, COLLECTION_NAME), orderBy("date", "desc"));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      const local = getLocalData();
      return { data: local, source: "company_ledger", count: local.length };
    }

    const items = [];
    querySnapshot.forEach((docSnap) => {
      items.push({ id: docSnap.id, ...docSnap.data() });
    });
    
    saveLocalData(items);
    return { data: items, source: "firestore", count: items.length };
  } catch (error) {
    console.warn("Firestore fetch error, using local dataset:", error.message);
    const local = getLocalData();
    return { data: local, source: "local_offline", error: error.message, count: local.length };
  }
};

// Add new transaction
export const addTransaction = async (transactionData) => {
  const payload = {
    ...transactionData,
    amount: Number(transactionData.amount) || 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...payload,
      serverTimestamp: serverTimestamp()
    });
    const newItem = { id: docRef.id, ...payload };
    
    const current = getLocalData();
    saveLocalData([newItem, ...current]);
    
    return newItem;
  } catch (error) {
    console.warn("Firestore add error, writing to local:", error.message);
    const newItem = { id: "local_" + Date.now(), ...payload };
    const current = getLocalData();
    saveLocalData([newItem, ...current]);
    return newItem;
  }
};

// Update transaction
export const updateTransaction = async (id, updatedData) => {
  const payload = {
    ...updatedData,
    amount: Number(updatedData.amount) || 0,
    updatedAt: new Date().toISOString()
  };

  try {
    if (!id.startsWith("local_")) {
      const docRef = doc(db, COLLECTION_NAME, id);
      await updateDoc(docRef, payload);
    }
  } catch (error) {
    console.warn("Firestore update error:", error.message);
  }

  const current = getLocalData();
  const updated = current.map((item) => (item.id === id ? { ...item, ...payload } : item));
  saveLocalData(updated);
  return { id, ...payload };
};

// Delete transaction
export const deleteTransaction = async (id) => {
  try {
    if (!id.startsWith("local_")) {
      const docRef = doc(db, COLLECTION_NAME, id);
      await deleteDoc(docRef);
    }
  } catch (error) {
    console.warn("Firestore delete error:", error.message);
  }

  const current = getLocalData();
  const filtered = current.filter((item) => item.id !== id);
  saveLocalData(filtered);
  return true;
};

// Clear All Data
export const clearAllTransactions = async () => {
  localStorage.removeItem(LOCAL_STORAGE_KEY);
  return true;
};
