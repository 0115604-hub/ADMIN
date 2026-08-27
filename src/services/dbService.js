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

const COLLECTION_NAME = "transactions";
const LOCAL_STORAGE_KEY = "admin_pnl_transactions_fallback";

// Sample initial seed data
export const INITIAL_SAMPLE_DATA = [
  {
    type: "revenue",
    category: "제품 판매",
    title: "B2B 엔터프라이즈 솔루션 라이선스 공급",
    amount: 14500000,
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    client: "(주)테크솔루션",
    paymentMethod: "계좌이체",
    status: "완료",
    memo: "연간 라이선스 결제 건 (계약번호 #2026-0812)"
  },
  {
    type: "revenue",
    category: "구독 서비스",
    title: "SaaS 프리미엄 월간 플랜 정기결제",
    amount: 4800000,
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    client: "개인/기업 정기구독 120건",
    paymentMethod: "PG 카드결제",
    status: "완료",
    memo: "8월 정기 결제분"
  },
  {
    type: "revenue",
    category: "컨설팅",
    title: "AI 전환 및 아키텍처 컨설팅 1차 대금",
    amount: 7200000,
    date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    client: "미래소프트",
    paymentMethod: "계좌이체",
    status: "완료",
    memo: "착수금 입금 완료"
  },
  {
    type: "expense",
    category: "인건비",
    title: "개발팀 & 운영팀 8월 급여 지급",
    amount: 9800000,
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    client: "임직원 급여",
    paymentMethod: "계좌이체",
    status: "완료",
    memo: "원천징수세 포함"
  },
  {
    type: "expense",
    category: "서버/인프라",
    title: "AWS & Firebase 클라우드 인프라 비용",
    amount: 1650000,
    date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    client: "Amazon Web Services / Google",
    paymentMethod: "법인카드",
    status: "완료",
    memo: "EC2, Cloud Firestore, Storage 사용료"
  },
  {
    type: "expense",
    category: "마케팅/광고",
    title: "Google Ads & 메타 광고 집행비",
    amount: 2400000,
    date: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    client: "Google Ads / Meta",
    paymentMethod: "법인카드",
    status: "완료",
    memo: "Q3 신규 고객 유치 캠페인"
  },
  {
    type: "expense",
    category: "사무실/운영비",
    title: "사무실 임대료 및 관리비",
    amount: 1800000,
    date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    client: "강남 공유오피스",
    paymentMethod: "계좌이체",
    status: "완료",
    memo: "8월분 임대료"
  },
  {
    type: "revenue",
    category: "유지보수",
    title: "시스템 유지보수 정기 SLA 비용",
    amount: 3200000,
    date: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    client: "(주)글로벌네트웍스",
    paymentMethod: "계좌이체",
    status: "완료",
    memo: "Q3 유지보수료"
  },
  {
    type: "expense",
    category: "소프트웨어 구독",
    title: "GitHub, Slack, Figma, Notion 구독료",
    amount: 650000,
    date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    client: "협업툴 서비스사",
    paymentMethod: "법인카드",
    status: "완료",
    memo: "전사 라이선스"
  }
];

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
      // If Firestore collection is empty, check localStorage
      const local = getLocalData();
      return { data: local, source: "local_cache", count: local.length };
    }

    const items = [];
    querySnapshot.forEach((docSnap) => {
      items.push({ id: docSnap.id, ...docSnap.data() });
    });
    
    // Also backup to local
    saveLocalData(items);
    return { data: items, source: "firestore", count: items.length };
  } catch (error) {
    console.warn("Firestore fetch error, using local fallback:", error.message);
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
    
    // Update local cache
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

  // Update local
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

  // Remove from local
  const current = getLocalData();
  const filtered = current.filter((item) => item.id !== id);
  saveLocalData(filtered);
  return true;
};

// Seed Initial Sample Data to Firestore
export const seedSampleData = async () => {
  const results = [];
  for (const item of INITIAL_SAMPLE_DATA) {
    const res = await addTransaction(item);
    results.push(res);
  }
  return results;
};
