import { db } from "../firebase";
import { collection, doc, setDoc, getDocs, onSnapshot } from "firebase/firestore";
import * as XLSX from "xlsx";
import { SQ_LEVEL_UP_METADATA, SQ_LEVEL_UP_ITEMS } from "../data/sqLevelUpMasterData";

const COLLECTION_NAME = "sq_level_up_items";
const LOCAL_STORAGE_KEY = "oryuk_sq_level_up_items_v1";

export const SQ_MANAGERS = [
  "권태형",
  "최미영",
  "이명재",
  "이창엽",
  "설유철",
  "윤경수",
  "전재율",
  "조인주",
  "양인나",
  "유동길",
  "공영국",
  "이상기",
  "김동욱",
  "오상민",
  "정현규"
];

export const getCleanOwnerName = (owner) => {
  if (!owner || owner === "-" || owner === "미지정") return "-";
  const trimmed = String(owner).trim();
  const name = trimmed.split(/[\s(/]/)[0];
  return name || "-";
};

// 1. Get Initial / Local Items
export const getLocalSqLevelUpItems = () => {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn("Failed to read local SQ items:", e);
  }
  return SQ_LEVEL_UP_ITEMS;
};

// 2. Save Local Storage
export const saveLocalSqLevelUpItems = (items) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("oryuk_sq_items_updated", { detail: { items } }));
    }
  } catch (e) {
    console.error("Failed to save local SQ items:", e);
  }
};

// 3. Real-time Cloud Subscription
export const subscribeSqLevelUpItems = (callback) => {
  try {
    const colRef = collection(db, COLLECTION_NAME);
    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        if (!snapshot.empty) {
          const remoteMap = new Map();
          snapshot.forEach((d) => {
            remoteMap.set(Number(d.id) || d.id, d.data());
          });
          const merged = SQ_LEVEL_UP_ITEMS.map((base) => {
            const remote = remoteMap.get(base.seq);
            return remote ? { ...base, ...remote } : base;
          });
          saveLocalSqLevelUpItems(merged);
          if (callback) callback(merged);
        } else {
          const local = getLocalSqLevelUpItems();
          if (callback) callback(local);
        }
      },
      (err) => {
        console.warn("Firestore SQ items sync warning, using local:", err);
        const local = getLocalSqLevelUpItems();
        if (callback) callback(local);
      }
    );
    return unsubscribe;
  } catch (e) {
    console.warn("Firestore subscription failed, fallback to local:", e);
    const local = getLocalSqLevelUpItems();
    if (callback) callback(local);
    return () => {};
  }
};

// 4. Update Single Item
export const updateSqLevelUpItem = async (seq, updates) => {
  const current = getLocalSqLevelUpItems();
  const idx = current.findIndex((i) => i.seq === Number(seq));
  if (idx < 0) return false;

  const updatedItem = {
    ...current[idx],
    ...updates,
    updatedAt: new Date().toISOString()
  };

  const nextList = [...current];
  nextList[idx] = updatedItem;
  saveLocalSqLevelUpItems(nextList);

  try {
    const docRef = doc(db, COLLECTION_NAME, String(seq));
    await setDoc(docRef, updatedItem, { merge: true });
  } catch (e) {
    console.warn("Firestore updateSqLevelUpItem failed, preserved locally:", e);
  }
  return true;
};

// 5. Batch Update / Re-register All SQ Changes to Cloud & Local
export const batchUpdateSqLevelUpItems = async (items) => {
  if (!Array.isArray(items) || items.length === 0) return false;
  saveLocalSqLevelUpItems(items);

  try {
    const timestamp = new Date().toISOString();
    const writePromises = items.map((item) => {
      const docRef = doc(db, COLLECTION_NAME, String(item.seq));
      return setDoc(docRef, { ...item, updatedAt: timestamp }, { merge: true });
    });
    await Promise.allSettled(writePromises);
    return true;
  } catch (e) {
    console.warn("Firestore batchUpdateSqLevelUpItems error:", e);
    return false;
  }
};

// 5. Calculate Live KPIs
export const calculateSqKPIs = (items) => {
  const total = items.length;
  let open = 0;
  let closed = 0;
  let na = 0;

  let sOpen = 0;
  let sTotal = 0;
  let aOpen = 0;
  let aTotal = 0;
  let bOpen = 0;
  let bTotal = 0;

  let appDirect = 0;
  let appAssisted = 0;
  let physical = 0;

  const deptCounts = {};

  items.forEach((item) => {
    const isClosed = item.status === "CLOSE" || item.status === "조치완료";
    const isNa = item.status === "해당없음";
    const isOpen = !isClosed && !isNa;

    if (isClosed) closed++;
    else if (isNa) na++;
    else open++;

    if (item.priority === "S등급") {
      sTotal++;
      if (isOpen) sOpen++;
    } else if (item.priority === "A등급") {
      aTotal++;
      if (isOpen) aOpen++;
    } else if (item.priority === "B등급") {
      bTotal++;
      if (isOpen) bOpen++;
    }

    if (isOpen) {
      const dept = item.mainDept || "기타";
      deptCounts[dept] = (deptCounts[dept] || 0) + 1;

      if (item.appSolutionType === "App-Direct") appDirect++;
      else if (item.appSolutionType === "App-Assisted") appAssisted++;
      else physical++;
    }
  });

  const completionRate = total > 0 ? ((closed / (total - na)) * 100).toFixed(1) : "0.0";
  const appSolvableRate = open > 0 ? (((appDirect + appAssisted) / open) * 100).toFixed(1) : "0.0";

  // Calculate D-Day to target date
  const target = new Date("2026-10-31T23:59:59");
  const today = new Date();
  const diffTime = target.getTime() - today.getTime();
  const dDay = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return {
    metadata: SQ_LEVEL_UP_METADATA,
    total,
    open,
    closed,
    na,
    completionRate,
    dDay: dDay > 0 ? `D-${dDay}` : "D-Day",
    dDayNumber: dDay,
    sOpen,
    sTotal,
    aOpen,
    aTotal,
    bOpen,
    bTotal,
    appDirect,
    appAssisted,
    physical,
    appSolvableRate,
    deptCounts
  };
};

// 6. Export to Excel
export const exportSqToExcel = (items) => {
  const rows = [
    ["(주)오륙 SQ 레벨업 추진 대장 (실시간 조치 현황)"],
    [`출력일시: ${new Date().toLocaleString("ko-KR")} | 목표일: ${SQ_LEVEL_UP_METADATA.targetDate}`],
    [],
    [
      "순번",
      "관리번호",
      "대분류",
      "중분류",
      "우선순위",
      "세부항목",
      "현 상태 및 문제점",
      "구체적 개선 조치 대책",
      "주관부서",
      "담당자",
      "완료기한",
      "진행상태",
      "앱 해결 모듈",
      "해결방식",
      "최종수정일"
    ]
  ];

  items.forEach((it) => {
    rows.push([
      it.seq,
      it.code,
      it.majorCategory,
      it.midCategory,
      it.priority,
      it.subItem,
      it.problem,
      it.actionPlan,
      it.mainDept,
      getCleanOwnerName(it.mainOwner),
      it.targetDate || "-",
      it.status,
      it.appModule,
      it.appSolutionType,
      it.updatedAt ? it.updatedAt.slice(0, 10) : ""
    ]);
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, "SQ_레벨업_추진대장");

  const filename = `주_오륙_SQ레벨업_추진대장_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, filename);
  return filename;
};
