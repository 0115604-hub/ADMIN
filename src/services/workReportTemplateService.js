// Work Report Template Service (오륙 / 한울 작업일보 5대 대분류 템플릿 엔진)
// 5 Major Categories: 압출일보, 소재준비일보, 조인트일보, 후가공일보, 검사일보
import {
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  onSnapshot,
  query,
  orderBy
} from "firebase/firestore";
import { db } from "../firebase";
import { sanitizeForFirestore } from "../utils/firestoreUtils";

export const TEMPLATE_STORAGE_KEY = "oruk_work_report_templates_v1";
const COLLECTION_NAME = "work_report_templates";

// 5대 대분류 정의
export const REPORT_MAJOR_CATEGORIES = [
  {
    id: "EXTRUSION",
    name: "압출일보",
    icon: "🏭",
    desc: "1~4호기 압출 라인 • 형재 압출 • 권취/인취 • 압출 온도 및 중량 실측",
    badgeColor: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-300 dark:border-blue-800"
  },
  {
    id: "MATERIAL_PREP",
    name: "소재준비일보",
    icon: "✂️",
    desc: "정치절단 (A/B/C 단면) • 단컷팅 (LH/RH) • 칼날수명(5만개) 관리",
    badgeColor: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800"
  },
  {
    id: "JOINT",
    name: "조인트일보",
    icon: "⚙️",
    desc: "FRT, FIXED LH/RH, RR (4종) • 사출온도(4개 존) • 프레스 가류조건",
    badgeColor: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-300 dark:border-purple-800"
  },
  {
    id: "POST_PROCESSING",
    name: "후가공일보",
    icon: "🤖",
    desc: "본드로봇 도포 • 클립/브라켓 조립 • 부자재 LOT • 팁 교체 관리",
    badgeColor: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300 dark:border-amber-800"
  },
  {
    id: "INSPECTION",
    name: "검사일보",
    icon: "🔍",
    desc: "길이검사 (패드 5T) • 직각검사 • 최종검사 4열 매트릭스 • 3대 불량 집계",
    badgeColor: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800"
  }
];

// 초기 표준 템플릿 마스터 데이터 (5대 대분류 기본 탑재)
export const DEFAULT_WORK_REPORT_TEMPLATES = [
  // 1. 소재준비일보: 9BQC 정치절단 (방금 올려주신 705-02 REV.4 실물 양식)
  {
    id: "tpl_mat_prep_9bqc_cutting",
    categoryId: "MATERIAL_PREP",
    categoryName: "소재준비일보",
    title: "소재 준비 작업 일보 (G/RUN)",
    subTitle: "▣ 공정명 : 정치 절단",
    formNo: "705-02(REV.4)",
    companyName: "(주)오륙",
    carModel: "9BQC",
    partName: "G/RUN",
    processName: "정치 절단",
    subProcess: "정치절단",
    divisionType: "SECTION_ABC", // SECTION_ABC, LH_RH, 4_COLUMNS, SINGLE
    blocks: {
      timeAndQty: true,
      specAndLot: true,
      machineCondition: false,
      defectMatrix: true,
      maintenance: true
    },
    specs: [
      { id: "sp_1", section: "A단면", name: "A단면", frtSpec: "881 ± 3mm", frtTarget: 881, frtTol: 3, rrSpec: "488 ± 3mm(가절단)", rrTarget: 488, rrTol: 3 },
      { id: "sp_2", section: "B단면", name: "B단면", frtSpec: "608 ± 5mm", frtTarget: 608, frtTol: 5, rrSpec: "658 ± 5mm", rrTarget: 658, rrTol: 5 },
      { id: "sp_3", section: "C단면", name: "C단면", frtSpec: "582 ± 5mm", frtTarget: 582, frtTol: 5, rrSpec: "-", rrTarget: null, rrTol: null }
    ],
    defectCategories: [
      {
        name: "압출소재 불량",
        items: ["스코치", "외면 흠", "오염", "길이 미달", "와이어 노출"]
      },
      {
        name: "공정간 불량",
        items: ["길이", "단컷팅", "기타"]
      }
    ],
    maintenanceConfig: {
      hasBladeChange: true,
      hasTroubleAction: true,
      bladeWarningLimit: 50000
    },
    updatedAt: "2026-10-16T15:30:00.000Z"
  },

  // 2. 소재준비일보: 9BQC 단컷팅
  {
    id: "tpl_mat_prep_9bqc_dan_cutting",
    categoryId: "MATERIAL_PREP",
    categoryName: "소재준비일보",
    title: "소재 준비 작업 일보 (단컷팅)",
    subTitle: "▣ 공정명 : 단컷팅 가공",
    formNo: "705-02(REV.4)",
    companyName: "(주)오륙",
    carModel: "9BQC",
    partName: "G/RUN",
    processName: "단컷팅",
    subProcess: "단컷팅",
    divisionType: "LH_RH",
    blocks: {
      timeAndQty: true,
      specAndLot: true,
      machineCondition: false,
      defectMatrix: true,
      maintenance: true
    },
    specs: [
      { id: "sp_d1", section: "FRT LH", name: "FRT LH - A", frtSpec: "83 ± 2mm", frtTarget: 83, frtTol: 2, rrSpec: "-", rrTarget: null, rrTol: null },
      { id: "sp_d2", section: "FRT RH", name: "FRT RH - A", frtSpec: "83 ± 2mm", frtTarget: 83, frtTol: 2, rrSpec: "-", rrTarget: null, rrTol: null },
      { id: "sp_d3", section: "RR LH", name: "RR LH - A", frtSpec: "68 ± 2mm", frtTarget: 68, frtTol: 2, rrSpec: "-", rrTarget: null, rrTol: null },
      { id: "sp_d4", section: "RR RH", name: "RR RH - B", frtSpec: "67 ± 2mm", frtTarget: 67, frtTol: 2, rrSpec: "-", rrTarget: null, rrTol: null }
    ],
    defectCategories: [
      {
        name: "압출소재 불량",
        items: ["스코치", "외면 흠", "오염", "길이 미달"]
      },
      {
        name: "단컷팅 가공 불량",
        items: ["단컷팅 치수불량", "단면 찍힘", "절단 Burr", "기타"]
      }
    ],
    maintenanceConfig: {
      hasBladeChange: true,
      hasTroubleAction: true,
      bladeWarningLimit: 50000
    },
    updatedAt: "2026-10-16T15:30:00.000Z"
  },

  // 3. 압출일보: 9BQC 형재 압출
  {
    id: "tpl_extrusion_9bqc",
    categoryId: "EXTRUSION",
    categoryName: "압출일보",
    title: "압출 성형 작업 일보",
    subTitle: "▣ 공정명 : 고무/수지 형재 압출",
    formNo: "701-01(REV.3)",
    companyName: "(주)오륙",
    carModel: "9BQC",
    partName: "G/RUN Body Extrusion",
    processName: "압출",
    subProcess: "본압출",
    divisionType: "LINE_NUMBER",
    blocks: {
      timeAndQty: true,
      specAndLot: true,
      machineCondition: true,
      defectMatrix: true,
      maintenance: true
    },
    specs: [
      { id: "sp_ex1", section: "외경/전폭", name: "형재 전폭 치수", frtSpec: "32.5 ± 0.5mm", frtTarget: 32.5, frtTol: 0.5 },
      { id: "sp_ex2", section: "중량", name: "단위중량 (1m)", frtSpec: "280 ± 10g", frtTarget: 280, frtTol: 10 },
      { id: "sp_ex3", section: "비중", name: "고무 비중", frtSpec: "1.25 ± 0.05", frtTarget: 1.25, frtTol: 0.05 }
    ],
    conditionsConfig: {
      temps: ["C1 실린더 (80℃)", "C2 실린더 (90℃)", "헤드 (100℃)", "다이스 (110℃)"],
      speedRpm: "35 RPM",
      takeUpSpeed: "12 m/min"
    },
    defectCategories: [
      {
        name: "압출 성형 불량",
        items: ["스코치(탄화)", "기포", "표면 거침", "줄무늬", "이물질 투입", "치수 변동", "중량 미달"]
      }
    ],
    maintenanceConfig: {
      hasBladeChange: false,
      hasTroubleAction: true
    },
    updatedAt: "2026-10-16T15:30:00.000Z"
  },

  // 4. 조인트일보: 9BQC 조인트 (사출 성형)
  {
    id: "tpl_joint_9bqc_frt",
    categoryId: "JOINT",
    categoryName: "조인트일보",
    title: "조인트 사출 성형 작업 일보",
    subTitle: "▣ 공정명 : G/RUN FRT 사출",
    formNo: "703-01(REV.2)",
    companyName: "(주)한울",
    carModel: "9BQC",
    partName: "G/RUN FRT (2/3호기)",
    processName: "조인트",
    subProcess: "FRT",
    divisionType: "LH_RH",
    blocks: {
      timeAndQty: true,
      specAndLot: true,
      machineCondition: true,
      defectMatrix: true,
      maintenance: true
    },
    specs: [
      { id: "sp_j1", section: "직각부", name: "직각부 밀착/치수", frtSpec: "외관양호/밀착", frtTarget: null, frtTol: null },
      { id: "sp_j2", section: "둔각부", name: "둔각부 밀착/치수", frtSpec: "외관양호/밀착", frtTarget: null, frtTol: null },
      { id: "sp_j3", section: "바리(Burr)", name: "Burr 발생 유무", frtSpec: "없음(합격)", frtTarget: null, frtTol: null }
    ],
    conditionsConfig: {
      nozzleTemp: "220℃",
      cyl1Temp: "215℃",
      cyl2Temp: "210℃",
      cyl3Temp: "205℃",
      materialName: "SJ-4004B"
    },
    defectCategories: [
      {
        name: "사출 성형 불량",
        items: ["미성형", "가스/기포", "바리(Burr)", "수축/들뜸", "꼬임", "경계선 단차", "원재료 오염"]
      }
    ],
    maintenanceConfig: {
      hasBladeChange: false,
      hasTroubleAction: true
    },
    updatedAt: "2026-10-16T15:30:00.000Z"
  },

  // 5. 후가공일보: 9BQC 본드로봇 & 조립
  {
    id: "tpl_post_9bqc_bond",
    categoryId: "POST_PROCESSING",
    categoryName: "후가공일보",
    title: "후가공 및 본드로봇 도포 작업 일보",
    subTitle: "▣ 공정명 : 본딩 및 부자재 조립",
    formNo: "704-01(REV.2)",
    companyName: "(주)한울",
    carModel: "9BQC",
    partName: "G/RUN 본드로봇 & 조립",
    processName: "후가공",
    subProcess: "본드로봇",
    divisionType: "LH_RH",
    blocks: {
      timeAndQty: true,
      specAndLot: true,
      machineCondition: true,
      defectMatrix: true,
      maintenance: true
    },
    specs: [
      { id: "sp_p1", section: "본드폭", name: "본드 도포 폭", frtSpec: "5 ± 1mm", frtTarget: 5, frtTol: 1 },
      { id: "sp_p2", section: "부착성", name: "도포 균일도/부착성", frtSpec: "끊김 없음(합격)", frtTarget: null, frtTol: null }
    ],
    conditionsConfig: {
      preheatTemp: "40℃",
      dryingTemp: "80℃",
      bondName: "PRI"
    },
    defectCategories: [
      {
        name: "후가공 및 도포 불량",
        items: ["도포 누락", "폭 불량", "접착력 미달", "클립 오체결", "패드 부착 불량", "외관 스크래치"]
      }
    ],
    maintenanceConfig: {
      hasBladeChange: false,
      hasTroubleAction: true
    },
    updatedAt: "2026-10-16T15:30:00.000Z"
  },

  // 6. 검사일보: 9BQC 최종검사 (길이/직각/최종)
  {
    id: "tpl_insp_9bqc_final",
    categoryId: "INSPECTION",
    categoryName: "검사일보",
    title: "완제품 검사 일보 (최종검사)",
    subTitle: "▣ 공정명 : 최종 외관 및 치수 전수검사",
    formNo: "706-01(REV.3)",
    companyName: "(주)한울",
    carModel: "9BQC",
    partName: "G/RUN RR (PRIVACY/TINTED)",
    processName: "검사",
    subProcess: "최종검사",
    divisionType: "4_COLUMNS",
    blocks: {
      timeAndQty: true,
      specAndLot: true,
      machineCondition: false,
      defectMatrix: true,
      maintenance: true
    },
    specs: [
      { id: "sp_in1", section: "A치수", name: "RR LH A 치수", frtSpec: "482 ± 3mm", frtTarget: 482, frtTol: 3 },
      { id: "sp_in2", section: "B치수", name: "RR LH B 치수", frtSpec: "658 ± 5mm", frtTarget: 658, frtTol: 5 },
      { id: "sp_in3", section: "D치수", name: "RR LH D 치수", frtSpec: "418 ± 4mm", frtTarget: 418, frtTol: 4 },
      { id: "sp_in4", section: "스폰지패드", name: "패드 5T 부착 규격", frtSpec: "5T*5W*60L", frtTarget: null, frtTol: null }
    ],
    defectCategories: [
      {
        name: "1. 압출소재 불량",
        items: ["스코치", "외면흠", "오염", "와이어 노출"]
      },
      {
        name: "2. 조인트 불량",
        items: ["미성형", "바리(Burr)", "수축/들뜸", "꼬임"]
      },
      {
        name: "3. 후가공 불량",
        items: ["패드 미부착", "D/V 불량", "단컷팅 불량", "스크래치"]
      }
    ],
    maintenanceConfig: {
      hasBladeChange: false,
      hasTroubleAction: true
    },
    updatedAt: "2026-10-16T15:30:00.000Z"
  }
];

// 로컬 스토리지 데이터 가져오기
export const getLocalWorkReportTemplates = () => {
  try {
    const raw = localStorage.getItem(TEMPLATE_STORAGE_KEY);
    if (!raw) return DEFAULT_WORK_REPORT_TEMPLATES;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_WORK_REPORT_TEMPLATES;
  } catch (e) {
    console.warn("getLocalWorkReportTemplates fallback:", e);
    return DEFAULT_WORK_REPORT_TEMPLATES;
  }
};

// 로컬 스토리지 저장
export const saveLocalWorkReportTemplates = (templates) => {
  try {
    localStorage.setItem(TEMPLATE_STORAGE_KEY, JSON.stringify(templates));
  } catch (e) {
    console.error("saveLocalWorkReportTemplates error:", e);
  }
};

// Firestore 실시간 구독 (없으면 기본값 동기화)
export const subscribeWorkReportTemplates = (callback) => {
  let isInitial = true;
  try {
    const q = query(collection(db, COLLECTION_NAME));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const list = snapshot.docs.map((docSnap) => ({
            id: docSnap.id,
            ...docSnap.data()
          }));
          saveLocalWorkReportTemplates(list);
          callback(list);
        } else if (isInitial) {
          // 컬렉션이 비어있으면 초기 템플릿 마이그레이션 저장
          const defaults = getLocalWorkReportTemplates();
          callback(defaults);
          // 백그라운드에서 기본 템플릿 Firestore 업로드
          Promise.all(
            defaults.map((t) => setDoc(doc(db, COLLECTION_NAME, t.id), sanitizeForFirestore(t)))
          ).catch((err) => console.warn("Init templates upload error:", err));
        }
        isInitial = false;
      },
      (error) => {
        console.warn("subscribeWorkReportTemplates offline fallback:", error);
        callback(getLocalWorkReportTemplates());
      }
    );
    return unsubscribe;
  } catch (e) {
    console.warn("subscribeWorkReportTemplates error:", e);
    callback(getLocalWorkReportTemplates());
    return () => {};
  }
};

// 템플릿 저장 (신규 또는 수정)
export const saveWorkReportTemplate = async (template) => {
  const tplId = template.id || `tpl_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
  const now = new Date().toISOString();
  const payload = {
    ...template,
    id: tplId,
    updatedAt: now
  };

  // 1. 로컬 즉시 저장
  const currentList = getLocalWorkReportTemplates();
  const existingIdx = currentList.findIndex((t) => t.id === tplId);
  let updatedList;
  if (existingIdx >= 0) {
    updatedList = currentList.map((t) => (t.id === tplId ? payload : t));
  } else {
    updatedList = [payload, ...currentList];
  }
  saveLocalWorkReportTemplates(updatedList);

  // 2. Firestore 비동기 저장
  try {
    await setDoc(doc(db, COLLECTION_NAME, tplId), sanitizeForFirestore(payload));
  } catch (e) {
    console.warn("Firestore save template offline:", e);
  }

  return payload;
};

// 템플릿 삭제
export const deleteWorkReportTemplate = async (templateId) => {
  const currentList = getLocalWorkReportTemplates();
  const updatedList = currentList.filter((t) => t.id !== templateId);
  saveLocalWorkReportTemplates(updatedList);

  try {
    await deleteDoc(doc(db, COLLECTION_NAME, templateId));
  } catch (e) {
    console.warn("Firestore delete template offline:", e);
  }
};

// 템플릿 1초 복제 (Clone)
export const cloneWorkReportTemplate = async (sourceTemplateId, newCarModel = "") => {
  const currentList = getLocalWorkReportTemplates();
  const source = currentList.find((t) => t.id === sourceTemplateId);
  if (!source) throw new Error("원본 템플릿을 찾을 수 없습니다.");

  const clonedId = `tpl_${Date.now()}_clone`;
  const effectiveCar = newCarModel.trim() || `${source.carModel}_복사본`;
  const clonedPayload = {
    ...source,
    id: clonedId,
    carModel: effectiveCar,
    title: `${source.title} (${effectiveCar})`,
    updatedAt: new Date().toISOString()
  };

  return await saveWorkReportTemplate(clonedPayload);
};
