import { db } from "../firebase";
import { collection, doc, setDoc, onSnapshot } from "firebase/firestore";

const INSPECTION_COLLECTION = "sq_digital_inspections";
const TPM_COLLECTION = "sq_tpm_inspections";

const LOCAL_INSPECTION_KEY = "oryuk_digital_inspections_v1";
const LOCAL_TPM_KEY = "oryuk_tpm_inspections_v1";

// Default Master Reference Limits for Common Parts (e.g. JA PE G/RUN)
export const INSPECTION_SPEC_DEFAULTS = {
  "JA PE G/RUN": {
    dimension: { name: "단면 치수 (폭/높이)", unit: "mm", target: 18.5, tolPlus: 0.5, tolMinus: 0.5 },
    coatingThickness: { name: "코팅 도포 두께", unit: "μm", target: 25.0, tolPlus: 5.0, tolMinus: 5.0 },
    cutLength: { name: "절단 길이", unit: "mm", target: 850.0, tolPlus: 2.0, tolMinus: 2.0 },
    jointWeight: { name: "조인트 성형 중량", unit: "g", target: 4.8, tolPlus: 0.3, tolMinus: 0.3 }
  },
  "기타 일반 압출": {
    dimension: { name: "단면 치수", unit: "mm", target: 20.0, tolPlus: 1.0, tolMinus: 1.0 },
    coatingThickness: { name: "코팅 두께", unit: "μm", target: 20.0, tolPlus: 5.0, tolMinus: 5.0 },
    cutLength: { name: "절단 길이", unit: "mm", target: 1000.0, tolPlus: 5.0, tolMinus: 5.0 },
    jointWeight: { name: "성형 중량", unit: "g", target: 5.0, tolPlus: 0.5, tolMinus: 0.5 }
  }
};

// 1. Get Local Inspections
export const getLocalInspections = () => {
  try {
    const raw = localStorage.getItem(LOCAL_INSPECTION_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
};

// 2. Save Digital Inspection
export const saveDigitalInspection = async (inspectionData) => {
  const current = getLocalInspections();
  const id = inspectionData.id || `insp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  const record = {
    ...inspectionData,
    id,
    createdAt: inspectionData.createdAt || now,
    updatedAt: now
  };

  const nextList = [record, ...current.filter((i) => i.id !== id)];
  localStorage.setItem(LOCAL_INSPECTION_KEY, JSON.stringify(nextList));

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("oryuk_inspection_saved", { detail: { record } }));
  }

  try {
    const docRef = doc(db, INSPECTION_COLLECTION, id);
    await setDoc(docRef, record, { merge: true });
  } catch (e) {
    console.warn("Firestore saveDigitalInspection fallback to local:", e);
  }

  return record;
};

// 3. Get Local TPM
export const getLocalTpmInspections = () => {
  try {
    const raw = localStorage.getItem(LOCAL_TPM_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
};

// 4. Save TPM Inspection
export const saveTpmInspection = async (tpmData) => {
  const current = getLocalTpmInspections();
  const id = tpmData.id || `tpm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  const record = {
    ...tpmData,
    id,
    createdAt: tpmData.createdAt || now,
    updatedAt: now
  };

  const nextList = [record, ...current.filter((i) => i.id !== id)];
  localStorage.setItem(LOCAL_TPM_KEY, JSON.stringify(nextList));

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("oryuk_tpm_saved", { detail: { record } }));
  }

  try {
    const docRef = doc(db, TPM_COLLECTION, id);
    await setDoc(docRef, record, { merge: true });
  } catch (e) {
    console.warn("Firestore saveTpmInspection fallback to local:", e);
  }

  return record;
};

// 5. Real-time subscriptions
export const subscribeDigitalInspections = (callback) => {
  try {
    const colRef = collection(db, INSPECTION_COLLECTION);
    return onSnapshot(
      colRef,
      (snapshot) => {
        const list = [];
        snapshot.forEach((d) => list.push({ id: d.id, ...d.data() }));
        list.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
        localStorage.setItem(LOCAL_INSPECTION_KEY, JSON.stringify(list));
        if (callback) callback(list);
      },
      () => {
        if (callback) callback(getLocalInspections());
      }
    );
  } catch (e) {
    if (callback) callback(getLocalInspections());
    return () => {};
  }
};
