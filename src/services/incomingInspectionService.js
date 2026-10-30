import { db } from "../firebase.js";
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy
} from "firebase/firestore";
import { registerToFourMLedger } from "./fourMChangePointService.js";

const COLLECTION_NAME = "incoming_inspections";
const STORAGE_KEY = "oryuk_incoming_inspections_v3";

// 📦 입고 상태 정의 (SQ 인증 및 물류·품질 연계)
export const RECEIVING_STATUS = {
  PENDING: {
    id: "PENDING",
    label: "검사대기",
    badge: "bg-amber-950 text-amber-300 border-amber-600",
    desc: "물류 입고 완료, 품질 수입검사 대기 중"
  },
  PASSED: {
    id: "PASSED",
    label: "정상입고",
    badge: "bg-emerald-950 text-emerald-300 border-emerald-600",
    desc: "수입검사 합격 판정 및 정상 입고 승인"
  },
  REJECTED: {
    id: "REJECTED",
    label: "불합격반품",
    badge: "bg-rose-950 text-rose-300 border-rose-600",
    desc: "수입검사 불합격, 격리 보관 및 4M 공식대장 등록"
  },
  CONDITIONAL: {
    id: "CONDITIONAL",
    label: "조건부특채",
    badge: "bg-orange-950 text-orange-300 border-orange-600",
    desc: "조건부 승인(선별/특채) 및 4M 대장 이관"
  }
};

// 🏭 보관 창고 및 위치 프리셋
export const STORAGE_LOCATIONS = [
  "삼랑진 원재료창고",
  "삼랑진 배합실 (FMB/CMB)",
  "삼랑진 가공동 부자재랙",
  "삼랑진 압출 원자재랙",
  "삼랑진 격리보관장 (부적합품)",
  "한림공장 원부자재창고",
  "한림공장 가공부자재실",
  "본사 자재실"
];

// 📏 수량 단위 프리셋
export const QUANTITY_UNITS = [
  "kg",
  "EA",
  "m",
  "roll",
  "Can",
  "Drum",
  "Box",
  "포 (Bag)"
];

// 📦 수입검사 2대 대분류 및 규격 템플릿
export const INSPECTION_CATEGORIES = {
  RAW_MATERIAL: {
    id: "RAW_MATERIAL",
    name: "고무/압출 원소재",
    badge: "원소재",
    color: "from-blue-600 to-indigo-700",
    bgLight: "bg-blue-50 text-blue-700 border-blue-200",
    desc: "M/Sheet(성적서) 규격 대조 + 주요 물성 실측값 샘플링",
    items: [
      { id: "FMB", name: "FMB (Final Master Batch)" },
      { id: "CMB", name: "CMB (Carbon Master Batch)" },
      { id: "TPE_PVC", name: "TPE / PVC 펠릿" },
      { id: "WIRE_INSERT", name: "심재 철심 (Wire Insert)" }
    ],
    defaultChecks: [
      {
        id: "chk_msheet",
        name: "M/Sheet(원재료 성적서) 대조",
        type: "JUDGMENT",
        spec: "성적서 전 항목 스펙 일치 및 보증치 확인",
        measured: "",
        result: "PASS",
        note: ""
      },
      {
        id: "chk_hardness",
        name: "경도 (Hardness)",
        type: "NUMERIC",
        unit: "Hs (Shore A)",
        spec: "65 ± 5",
        specMin: 60,
        specMax: 70,
        measured: "",
        result: "PASS",
        note: ""
      },
      {
        id: "chk_gravity",
        name: "비중 (Specific Gravity)",
        type: "NUMERIC",
        unit: "g/cm³",
        spec: "1.15 ± 0.03",
        specMin: 1.12,
        specMax: 1.18,
        measured: "",
        result: "PASS",
        note: ""
      },
      {
        id: "chk_mooney",
        name: "무늬점도 (Mooney ML1+4@100℃)",
        type: "NUMERIC",
        unit: "MU",
        spec: "50 ± 5",
        specMin: 45,
        specMax: 55,
        measured: "",
        result: "PASS",
        note: ""
      },
      {
        id: "chk_moisture",
        name: "수분율 (Moisture Content)",
        type: "NUMERIC",
        unit: "%",
        spec: "≤ 0.50",
        specMin: 0,
        specMax: 0.50,
        measured: "",
        result: "PASS",
        note: ""
      },
      {
        id: "chk_foreign",
        name: "이물 / 기포 검사",
        type: "JUDGMENT",
        spec: "외관 및 단면 이물, 기포 결함 없을 것",
        measured: "",
        result: "PASS",
        note: ""
      }
    ]
  },
  SUB_MATERIAL: {
    id: "SUB_MATERIAL",
    name: "조립/체결 부자재",
    badge: "부자재",
    color: "from-emerald-600 to-teal-700",
    bgLight: "bg-emerald-50 text-emerald-700 border-emerald-200",
    desc: "수량 대조 + 외관/치수 샘플링 검사",
    items: [
      { id: "CLIP", name: "클립 (Clip)" },
      { id: "BRACKET", name: "브라켓 (Bracket)" },
      { id: "TAPE", name: "양면테이프 (Double-sided Tape)" },
      { id: "PRIMER_BOND", name: "프라이머 / 본드 (Primer / Adhesive)" }
    ],
    defaultChecks: [
      {
        id: "chk_qty",
        name: "수량 대조",
        type: "JUDGMENT",
        spec: "거래명세서 및 송장 수량 100% 일치",
        measured: "",
        result: "PASS",
        note: ""
      },
      {
        id: "chk_appearance",
        name: "외관 검사 (버, 미성형)",
        type: "JUDGMENT",
        spec: "버(Burr), 미성형, 균열, 표면 스크래치 없을 것",
        measured: "",
        result: "PASS",
        note: ""
      },
      {
        id: "chk_force",
        name: "결합력 (인발력)",
        type: "NUMERIC",
        unit: "N",
        spec: "≥ 50.0",
        specMin: 50.0,
        specMax: null,
        measured: "",
        result: "PASS",
        note: ""
      },
      {
        id: "chk_dimension",
        name: "주요 치수 (캘리퍼스)",
        type: "NUMERIC",
        unit: "mm",
        spec: "12.5 ± 0.2",
        specMin: 12.3,
        specMax: 12.7,
        measured: "",
        result: "PASS",
        note: ""
      },
      {
        id: "chk_expiry",
        name: "유효기간 / 제조일자",
        type: "JUDGMENT",
        spec: "제조일로부터 유효기간 6개월 이상 잔여",
        measured: "",
        result: "PASS",
        note: ""
      }
    ]
  }
};

// 🌟 초기 기본 데이터 (더미 데이터 삭제: 빈 배열로 초기화)
const INITIAL_INSPECTIONS = [];

// 로컬스토리지 로드
export const getLocalIncomingInspections = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
      return [];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      // 기존 더미 데이터("mat_rec_01", "mat_rec_02", "mat_rec_03") 필터링 및 제거
      const cleaned = parsed.filter(
        (it) => it.id !== "mat_rec_01" && it.id !== "mat_rec_02" && it.id !== "mat_rec_03"
      );
      if (cleaned.length !== parsed.length) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
      }
      return cleaned;
    }
    return [];
  } catch (err) {
    console.error("[IncomingInspectionService] LocalStorage load error:", err);
    return [];
  }
};

// 로컬스토리지 저장
const setLocalIncomingInspections = (list) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (err) {
    console.error("[IncomingInspectionService] LocalStorage save error:", err);
  }
};

// 4M 대장 자동 이관 함수 (불합격/조건부합격 시 실행)
export const syncInspectionToFourMLedger = async (record, registeredBy = "이창엽") => {
  if (!record) return null;

  const failedChecks = (record.inspectionChecks || []).filter(
    (c) => c.result === "FAIL"
  );
  const defectSummary = failedChecks.length > 0
    ? failedChecks.map((c) => `${c.name}(실측: ${c.measured || '미달'}/스펙: ${c.spec})`).join(", ")
    : "수입검사 불합격 판정";

  const fourMRecordId = record.fourMLedgerId || `ledger_insp_${record.id}`;
  const nowStr = new Date().toISOString();

  // 4M 공식대장 포맷 매핑
  const fourMData = {
    id: fourMRecordId,
    originalId: record.id,
    rawId: record.id,
    fourM: "Material",
    origin: "수입검사",
    sourceType: "INCOMING_INSPECTION",
    badgeColor: "rose",
    plant: record.plant || "삼랑진공장",
    line: record.category === "RAW_MATERIAL" ? "압출동 (원자재 입고)" : "가공동 (부자재 입고)",
    writer: record.inspector || registeredBy || "이창엽",
    title: `[원부자재 입고불량] ${record.itemName} (${record.supplier}, LOT: ${record.lotNo})`,
    date: record.date || nowStr.slice(0, 10),
    time: record.time || "09:00",
    content: `[원부자재 입고검사 부적합 통보]\n• 품목분류: ${record.category === "RAW_MATERIAL" ? "고무/압출 원소재" : "조립/체결 부자재"}\n• 품목/규격: ${record.itemName} (${record.itemType || "-"})\n• 입고 LOT: ${record.lotNo} / 송장번호: ${record.deliveryNoteNo || "미기재"}\n• 공급사: ${record.supplier}\n• 입고수량: ${record.quantity || (record.quantityNum ? `${record.quantityNum} ${record.quantityUnit}` : "-")}\n• 보관위치: ${record.storageLocation || "격리구역"}\n• 부적합 항목: ${defectSummary}\n• 검사원 소견: ${record.remarks || "규격 미달 전량 격리 및 반품/선별 요망"}`,
    actionResult: "원자재 식별표 부적합 붉은색 라벨 부착 및 격리창고 보관. 공급사 품질부서 통보.",
    actionAuthor: record.inspector || registeredBy || "이창엽",
    actionAt: nowStr,
    isResolved: false,
    severity: "CRITICAL",
    registeredBy: registeredBy || "이창엽",
    classifiedBy: registeredBy || "이창엽",
    isQualityClassified: true,
    isOfficialLedger: true,
    images: [
      ...(record.mSheetPhotos || []).map((p) => p.dataUrl || p),
      ...(record.defectPhotos || []).map((p) => p.dataUrl || p),
      ...(record.deliverySlipPhotos || []).map((p) => p.dataUrl || p)
    ].filter(Boolean)
  };

  try {
    await registerToFourMLedger(fourMData, registeredBy);
    console.log("[IncomingInspectionService] Successfully registered to 4M ledger:", fourMRecordId);
    return fourMRecordId;
  } catch (err) {
    console.error("[IncomingInspectionService] Failed to sync to 4M ledger:", err);
    return fourMRecordId;
  }
};

// 실시간 구독 (Firestore + LocalStorage)
export const subscribeIncomingInspections = (onUpdate) => {
  // 1. 로컬 초기값 즉시 콜백
  const localData = getLocalIncomingInspections();
  onUpdate(localData);

  if (!db) {
    return () => {};
  }

  try {
    const colRef = collection(db, COLLECTION_NAME);
    const q = query(colRef, orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() });
        });
        // 더미 데이터 강제 필터링
        const filteredList = list.filter(
          (it) => it.id !== "mat_rec_01" && it.id !== "mat_rec_02" && it.id !== "mat_rec_03" &&
                  it.id !== "insp_demo_01" && it.id !== "insp_demo_02" &&
                  it.lotNo !== "261028-F01" && it.lotNo !== "TY261028-09"
        );
        setLocalIncomingInspections(filteredList);
        onUpdate(filteredList);
      },
      (err) => {
        console.warn("[IncomingInspectionService] Firestore subscription warning:", err);
      }
    );
    return unsubscribe;
  } catch (err) {
    console.warn("[IncomingInspectionService] Firebase unavailable, using local:", err);
    return () => {};
  }
};

// 원부자재 입고 및 검사 저장 (부적합 시 4M 실시간 대장 자동 연동)
export const saveIncomingInspection = async (record, registeredBy = "이창엽") => {
  if (!record) return null;

  const isRejectOrConditional =
    record.receivingStatus === "REJECTED" ||
    record.receivingStatus === "CONDITIONAL" ||
    record.overallResult === "REJECT" ||
    record.overallResult === "CONDITIONAL";

  let updatedRecord = {
    ...record,
    updatedAt: new Date().toISOString()
  };

  // 불합격/조건부 판정 시 4M 대장 자동 동기화
  if (isRejectOrConditional) {
    try {
      const fourMId = await syncInspectionToFourMLedger(updatedRecord, registeredBy);
      updatedRecord.syncedTo4M = true;
      updatedRecord.fourMLedgerId = fourMId;
      updatedRecord.syncedTo4MAt = new Date().toISOString();
    } catch (err) {
      console.error("[IncomingInspectionService] Error syncing to 4M:", err);
    }
  }

  // 로컬 업데이트
  const currentList = getLocalIncomingInspections();
  const idx = currentList.findIndex((item) => item.id === updatedRecord.id);
  let nextList;
  if (idx >= 0) {
    nextList = [...currentList];
    nextList[idx] = updatedRecord;
  } else {
    nextList = [updatedRecord, ...currentList];
  }
  setLocalIncomingInspections(nextList);

  // Firestore 동기화
  if (db && updatedRecord.id) {
    try {
      await setDoc(doc(db, COLLECTION_NAME, updatedRecord.id), updatedRecord, {
        merge: true
      });
    } catch (err) {
      console.warn("[IncomingInspectionService] Firestore save warning:", err);
    }
  }

  return updatedRecord;
};

// 원부자재 입고 대량 등록 (매입내역 일괄 등록 - 상태: 검사대기 PENDING)
export const saveBatchIncomingInspections = async (records = [], registeredBy = "유동길") => {
  if (!Array.isArray(records) || records.length === 0) return [];

  const currentList = getLocalIncomingInspections();
  const newRecords = records.map((record, index) => {
    const todayShort = new Date().toISOString().slice(2, 10).replace(/-/g, "");
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const id = record.id || `INSP-${Date.now()}-${index}-${randomSuffix}`;
    return {
      id,
      date: record.date || new Date().toISOString().slice(0, 10),
      time: record.time || new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false }),
      receivingDate: record.receivingDate || new Date().toISOString().slice(0, 10),
      receivingTime: record.receivingTime || new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false }),
      plant: record.plant || "삼랑진공장",
      deliveryNoteNo: record.deliveryNoteNo || `TR-${todayShort}-${String(index + 1).padStart(2, "0")}`,
      supplier: record.supplier || "",
      category: record.category || "RAW_MATERIAL",
      itemType: record.itemType || (record.category === "RAW_MATERIAL" ? "FMB" : "부자재"),
      itemName: record.itemName || "",
      lotNo: record.lotNo || `LOT-${todayShort}-${String(index + 1).padStart(2, "0")}`,
      quantityNum: record.quantityNum !== undefined ? record.quantityNum : "",
      quantityUnit: record.quantityUnit || (record.category === "RAW_MATERIAL" ? "kg" : "EA"),
      quantity: record.quantity || (record.quantityNum ? `${Number(record.quantityNum).toLocaleString()} ${record.quantityUnit || "EA"}` : "-"),
      storageLocation: record.storageLocation || (record.category === "RAW_MATERIAL" ? "삼랑진 원재료창고" : "삼랑진 가공동 부자재랙"),
      receivedBy: record.receivedBy || registeredBy,
      inspector: record.inspector || "이창엽",
      overallResult: "PENDING",
      receivingStatus: "PENDING",
      remarks: record.remarks || "조인주 매입내역 연동 일괄입고 (검사대기)",
      inspectionChecks: record.inspectionChecks || JSON.parse(JSON.stringify(INSPECTION_CATEGORIES[record.category || "RAW_MATERIAL"].defaultChecks)),
      mSheetPhotos: [],
      defectPhotos: [],
      deliverySlipPhotos: [],
      syncedTo4M: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  });

  const nextList = [...newRecords, ...currentList];
  setLocalIncomingInspections(nextList);

  if (db) {
    try {
      await Promise.all(
        newRecords.map((item) =>
          setDoc(doc(db, COLLECTION_NAME, item.id), item, { merge: true }).catch((err) =>
            console.warn(`[IncomingInspectionService] batch firestore error for ${item.id}:`, err)
          )
        )
      );
    } catch (err) {
      console.warn("[IncomingInspectionService] batch Firestore save error:", err);
    }
  }

  return newRecords;
};

// 수입검사 삭제
export const deleteIncomingInspection = async (id) => {
  if (!id) return;
  const currentList = getLocalIncomingInspections();
  const nextList = currentList.filter((item) => item.id !== id);
  setLocalIncomingInspections(nextList);

  if (db) {
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, id));
    } catch (err) {
      console.warn("[IncomingInspectionService] Firestore delete warning:", err);
    }
  }
};

// 🌟 [관리자 영구 설정] 수입검사 대상 업체(15개사 중 선택) 영구 보존 키 & API
export const INSPECTION_TARGET_SUPPLIERS_KEY = "oryuk_incoming_inspection_target_suppliers_v1";

// 15개사 기본 추천 리스트
export const DEFAULT_RAW_SUPPLIERS = [
  "(주)화승소재",
  "화승코프레이션",
  "㈜위스컴",
  "해동무역",
  "(주)경기금속",
  "우진금속",
  "㈜ 재 영",
  "부미",
  "세진SL",
  "삼오테크",
  "대하"
];

export const DEFAULT_SUB_SUPPLIERS = [
  "건화플라테크",
  "거승플라테크",
  "우봉",
  "삼도산업",
  "유한산업",
  "㈜KCC글라스",
  "성창테크",
  "태영지관"
];

export const getTargetSuppliersConfig = () => {
  try {
    if (typeof localStorage !== "undefined") {
      const raw = localStorage.getItem(INSPECTION_TARGET_SUPPLIERS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") return parsed;
      }
    }
  } catch (e) {}
  // 기본값: 원자재 주요 5개사, 부자재 주요 3개사 활성화
  return {
    rawMaterials: ["(주)화승소재", "화승코프레이션", "㈜위스컴", "해동무역", "(주)경기금속"],
    subMaterials: ["건화플라테크", "우봉", "삼도산업"]
  };
};

export const saveTargetSuppliersConfig = async (config) => {
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(INSPECTION_TARGET_SUPPLIERS_KEY, JSON.stringify(config));
      window.dispatchEvent(new CustomEvent("oryuk_incoming_suppliers_config_updated", { detail: config }));
    }
    if (db) {
      await setDoc(doc(db, "app_settings", INSPECTION_TARGET_SUPPLIERS_KEY), config, { merge: true }).catch(() => {});
    }
  } catch (e) {
    console.error("Failed to save target suppliers config:", e);
  }
};
