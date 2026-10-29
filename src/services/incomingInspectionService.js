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
const STORAGE_KEY = "oryuk_incoming_inspections_v2";

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

// 🌟 초기 샘플 데이터 (입고대장 + 수입검사 통합 데모)
const INITIAL_INSPECTIONS = [
  {
    id: "mat_rec_01",
    date: new Date().toISOString().slice(0, 10),
    time: "09:30",
    receivingDate: new Date().toISOString().slice(0, 10),
    receivingTime: "09:30",
    category: "RAW_MATERIAL",
    itemType: "FMB",
    itemName: "EPDM FMB-BLACK-70A",
    supplier: "한국합성(주)",
    lotNo: "261028-F01",
    deliveryNoteNo: "TR-261028-01",
    storageLocation: "삼랑진 원재료창고",
    quantity: "1,500 kg (60포)",
    quantityNum: 1500,
    quantityUnit: "kg",
    plant: "삼랑진공장",
    receivedBy: "유동길",
    inspector: "이창엽",
    receivingStatus: "PASSED", // 정상입고
    overallResult: "PASS",
    remarks: "M/Sheet 성적서 전 항목 스펙 합격. 경도 66Hs 및 비중 1.148 정상 입고 완료.",
    inspectionChecks: [
      { id: "chk_msheet", name: "M/Sheet(원재료 성적서) 대조", type: "JUDGMENT", spec: "성적서 전 항목 스펙 일치", measured: "전항목 일치", result: "PASS", note: "COA 첨부완료" },
      { id: "chk_hardness", name: "경도 (Hardness)", type: "NUMERIC", unit: "Hs (Shore A)", spec: "65 ± 5", specMin: 60, specMax: 70, measured: "66", result: "PASS", note: "양호" },
      { id: "chk_gravity", name: "비중 (Specific Gravity)", type: "NUMERIC", unit: "g/cm³", spec: "1.15 ± 0.03", specMin: 1.12, specMax: 1.18, measured: "1.148", result: "PASS", note: "양호" },
      { id: "chk_mooney", name: "무늬점도 (Mooney ML1+4@100℃)", type: "NUMERIC", unit: "MU", spec: "50 ± 5", specMin: 45, specMax: 55, measured: "51.2", result: "PASS", note: "양호" },
      { id: "chk_moisture", name: "수분율 (Moisture Content)", type: "NUMERIC", unit: "%", spec: "≤ 0.50", specMin: 0, specMax: 0.50, measured: "0.22", result: "PASS", note: "기준치 이내" },
      { id: "chk_foreign", name: "이물 / 기포 검사", type: "JUDGMENT", spec: "외관 및 단면 이물, 기포 결함 없을 것", measured: "양호", result: "PASS", note: "이물 무" }
    ],
    mSheetPhotos: [],
    defectPhotos: [],
    deliverySlipPhotos: [],
    syncedTo4M: false,
    fourMLedgerId: null,
    syncedTo4MAt: null,
    createdAt: new Date().toISOString()
  },
  {
    id: "mat_rec_02",
    date: new Date().toISOString().slice(0, 10),
    time: "11:15",
    receivingDate: new Date().toISOString().slice(0, 10),
    receivingTime: "11:15",
    category: "SUB_MATERIAL",
    itemType: "CLIP",
    itemName: "도어 고정 클립 (CLIP-DR-104)",
    supplier: "태영정밀",
    lotNo: "TY261028-09",
    deliveryNoteNo: "TY-261028-09",
    storageLocation: "삼랑진 격리보관장 (부적합품)",
    quantity: "20,000 EA",
    quantityNum: 20000,
    quantityUnit: "EA",
    plant: "삼랑진공장",
    receivedBy: "유동길",
    inspector: "이창엽",
    receivingStatus: "REJECTED", // 불합격반품
    overallResult: "REJECT",
    remarks: "체결부 버(Burr) 돌출 및 결합력 기준 미달 (실측 42N / 스펙 50N 이상). 전량 반품 요청 및 4M 대장 자동등록.",
    inspectionChecks: [
      { id: "chk_qty", name: "수량 대조", type: "JUDGMENT", spec: "거래명세서 및 송장 수량 100% 일치", measured: "20,000 EA 일치", result: "PASS", note: "정상" },
      { id: "chk_appearance", name: "외관 검사 (버, 미성형)", type: "JUDGMENT", spec: "버, 미성형 없을 것", measured: "체결부 버(Burr) 0.5mm 돌출 다수", result: "FAIL", note: "버 발생" },
      { id: "chk_force", name: "결합력 (인발력)", type: "NUMERIC", unit: "N", spec: "≥ 50.0", specMin: 50.0, specMax: null, measured: "42.3", result: "FAIL", note: "규격 미달" },
      { id: "chk_dimension", name: "주요 치수 (캘리퍼스)", type: "NUMERIC", unit: "mm", spec: "12.5 ± 0.2", specMin: 12.3, specMax: 12.7, measured: "12.45", result: "PASS", note: "정상" },
      { id: "chk_expiry", name: "유효기간 / 제조일자", type: "JUDGMENT", spec: "유효기간 잔여 확인", measured: "제조 2026-10", result: "PASS", note: "양호" }
    ],
    mSheetPhotos: [],
    defectPhotos: [],
    deliverySlipPhotos: [],
    syncedTo4M: true,
    fourMLedgerId: "ledger_mat_rec_02",
    syncedTo4MAt: new Date().toISOString(),
    createdAt: new Date().toISOString()
  },
  {
    id: "mat_rec_03",
    date: new Date().toISOString().slice(0, 10),
    time: "14:20",
    receivingDate: new Date().toISOString().slice(0, 10),
    receivingTime: "14:20",
    category: "RAW_MATERIAL",
    itemType: "WIRE_INSERT",
    itemName: "심재 철심 Wire Insert (W-0.45T)",
    supplier: "대성스틸",
    lotNo: "DS261029-W01",
    deliveryNoteNo: "DS-261029-01",
    storageLocation: "삼랑진 압출 원자재랙",
    quantity: "5,000 m (10 Coils)",
    quantityNum: 5000,
    quantityUnit: "m",
    plant: "삼랑진공장",
    receivedBy: "설유철",
    inspector: "",
    receivingStatus: "PENDING", // 검사대기
    overallResult: "PENDING",
    remarks: "물류 입고 확인 완료. 거래명세표 수량 일치. 품질팀 수입검사 실시 대기 상태.",
    inspectionChecks: [],
    mSheetPhotos: [],
    defectPhotos: [],
    deliverySlipPhotos: [],
    syncedTo4M: false,
    fourMLedgerId: null,
    syncedTo4MAt: null,
    createdAt: new Date().toISOString()
  }
];

// 로컬스토리지 로드
export const getLocalIncomingInspections = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // v1 데이터 마이그레이션 확인
      const oldRaw = localStorage.getItem("oryuk_incoming_inspections_v1");
      if (oldRaw) {
        try {
          const parsedOld = JSON.parse(oldRaw);
          if (Array.isArray(parsedOld) && parsedOld.length > 0) {
            const migrated = parsedOld.map((it) => ({
              ...it,
              receivingStatus: it.overallResult === "PASS" ? "PASSED" : it.overallResult === "REJECT" ? "REJECTED" : "CONDITIONAL",
              deliveryNoteNo: it.deliveryNoteNo || `TR-${it.date?.replace(/-/g, "") || "01"}`,
              storageLocation: it.storageLocation || (it.category === "RAW_MATERIAL" ? "삼랑진 원재료창고" : "삼랑진 가공동 부자재랙"),
              receivedBy: it.receivedBy || it.inspector || "유동길"
            }));
            localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
            return migrated;
          }
        } catch (e) {}
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_INSPECTIONS));
      return INITIAL_INSPECTIONS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : INITIAL_INSPECTIONS;
  } catch (err) {
    console.error("[IncomingInspectionService] LocalStorage load error:", err);
    return INITIAL_INSPECTIONS;
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
        if (!snapshot.empty) {
          const list = [];
          snapshot.forEach((docSnap) => {
            list.push({ id: docSnap.id, ...docSnap.data() });
          });
          setLocalIncomingInspections(list);
          onUpdate(list);
        } else {
          // Firestore 비어있을 시 로컬 데이터 업로드
          localData.forEach((item) => {
            setDoc(doc(db, COLLECTION_NAME, item.id), item).catch(() => {});
          });
        }
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
