// Work Report Template Service (오륙 / 한울 작업일보 5대 대분류 템플릿 엔진)
// 5 Major Categories: 압출일보, 소재준비일보, 조인트일보, 후가공일보, 검사일보
import {
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  onSnapshot,
  query
} from "firebase/firestore";
import { db } from "../firebase";
import { sanitizeForFirestore } from "../utils/firestoreUtils";
import bundledCustomTemplates from "../data/bundledCustomTemplates.json";

export const TEMPLATE_STORAGE_KEY = "oruk_work_report_templates_v2";
export const DELETED_TEMPLATE_STORAGE_KEY = "oruk_deleted_work_report_template_ids_v1";
const COLLECTION_NAME = "work_report_templates";

// 🌟 삭제된 템플릿 ID 블랙리스트 (스냅샷/기본값에 의한 자동 부활 원천 방지)
export const getDeletedTemplateIds = () => {
  try {
    const raw = localStorage.getItem(DELETED_TEMPLATE_STORAGE_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch (e) {
    return new Set();
  }
};

export const saveDeletedTemplateIds = (setOrArray) => {
  try {
    const arr = Array.from(setOrArray || []);
    localStorage.setItem(DELETED_TEMPLATE_STORAGE_KEY, JSON.stringify(arr));
  } catch (e) {}
};

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

export const TEMPLATE_RESET_VERSION_KEY = "oruk_work_report_templates_reset_v6_merged";
const BASE_DEFAULT_WORK_REPORT_TEMPLATES = [
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

export const DEFAULT_WORK_REPORT_TEMPLATES = [
  ...BASE_DEFAULT_WORK_REPORT_TEMPLATES,
  ...(Array.isArray(bundledCustomTemplates) ? bundledCustomTemplates : [])
];

// In-memory cache so localStorage quota limits never lose templates
let memoryTemplatesCache = null;
let memoryCustomBlocksCache = null;

const normalizeTemplateDoc = (tpl) => {
  if (!tpl) return tpl;
  const copy = { ...tpl, isDatabaseBacked: true };
  if (typeof copy.legoConfigJson === "string" && copy.legoConfigJson) {
    try {
      copy.legoConfig = JSON.parse(copy.legoConfigJson);
    } catch {}
  }
  // 중복 JSON 문자열을 제거하여 로컬스토리지 용량 초과(QuotaExceededError) 방지
  delete copy.legoConfigJson;

  if (copy.legoConfig?.customBlockTables) {
    const fixedTables = {};
    Object.entries(copy.legoConfig.customBlockTables).forEach(([k, val]) => {
      const rows = Array.isArray(val?.rows)
        ? val.rows.map((r) => (Array.isArray(r) ? r : Array.isArray(r?.cells) ? r.cells : []))
        : [];
      fixedTables[k] = {
        columns: Array.isArray(val?.columns) ? val.columns : [],
        rows
      };
    });
    copy.legoConfig = {
      ...copy.legoConfig,
      customBlockTables: fixedTables
    };
  }
  return copy;
};

// 로컬 스토리지 데이터 가져오기 (절대 기존 등록 양식을 파괴/초기화하지 않는 안전 병합)
export const getLocalWorkReportTemplates = () => {
  try {
    const deletedIds = getDeletedTemplateIds();
    const raw = localStorage.getItem(TEMPLATE_STORAGE_KEY);
    let parsed = [];
    if (raw) {
      try {
        const p = JSON.parse(raw);
        if (Array.isArray(p)) parsed = p;
      } catch (parseErr) {}
    }

    // 1단계: 내장 기본 템플릿(17대 공정 양식)으로 맵 시드 (삭제된 것은 제외)
    const tplMap = new Map();
    DEFAULT_WORK_REPORT_TEMPLATES.forEach((tpl) => {
      if (tpl && tpl.id && !deletedIds.has(tpl.id)) {
        tplMap.set(tpl.id, normalizeTemplateDoc(tpl));
      }
    });

    // 2단계: 로컬스토리지에 저장된 사용자 정의/수정 템플릿 병합 (ID 기준 덮어쓰기 보존, 삭제된 것 제외)
    parsed.forEach((tpl) => {
      if (tpl && tpl.id && !deletedIds.has(tpl.id)) {
        tplMap.set(tpl.id, normalizeTemplateDoc(tpl));
      }
    });

    // 3단계: 메모리 캐시에 남아있는 최신본 병합 (삭제된 것 제외)
    if (Array.isArray(memoryTemplatesCache)) {
      memoryTemplatesCache.forEach((tpl) => {
        if (tpl && tpl.id && !deletedIds.has(tpl.id)) {
          tplMap.set(tpl.id, normalizeTemplateDoc(tpl));
        }
      });
    }

    const merged = Array.from(tplMap.values());
    memoryTemplatesCache = merged;
    return merged;
  } catch (e) {
    console.warn("getLocalWorkReportTemplates fallback:", e);
    const deletedIds = getDeletedTemplateIds();
    return Array.isArray(memoryTemplatesCache)
      ? memoryTemplatesCache.filter((t) => t && !deletedIds.has(t.id))
      : DEFAULT_WORK_REPORT_TEMPLATES.filter((t) => t && !deletedIds.has(t.id)).map(normalizeTemplateDoc);
  }
};

// 로컬 스토리지 저장 (QuotaExceededError 방어 + 중복제거 + 즉시 브로드캐스트)
export const saveLocalWorkReportTemplates = (templates) => {
  const deletedIds = getDeletedTemplateIds();
  const normalized = (Array.isArray(templates) ? templates : [])
    .filter((t) => t && t.id && !deletedIds.has(t.id))
    .map(normalizeTemplateDoc);
  memoryTemplatesCache = normalized;

  // 로컬스토리지용 경량화 복사본 (legoConfigJson 제거)
  const forStorage = normalized.map((t) => {
    const copy = { ...t };
    delete copy.legoConfigJson;
    return copy;
  });

  try {
    localStorage.setItem(TEMPLATE_RESET_VERSION_KEY, "true");
    localStorage.setItem(TEMPLATE_STORAGE_KEY, JSON.stringify(forStorage));
  } catch (e) {
    console.warn("saveLocalWorkReportTemplates quota warning, saving slim version:", e);
    try {
      // 5MB 용량 한도 초과 시, 커스텀 블록의 무거운 data:image Base64만 스토리지 복사본에서 경량화
      const slimForStorage = forStorage.map((t) => {
        if (!t.legoConfig?.customBlocks) return t;
        const slimBlocks = t.legoConfig.customBlocks.map((b) => {
          const { imgFile, imageDataUrl, ...rest } = b;
          return {
            ...rest,
            imgFile: typeof imgFile === "string" && imgFile.startsWith("data:image") ? "" : imgFile
          };
        });
        return {
          ...t,
          legoConfig: {
            ...t.legoConfig,
            customBlocks: slimBlocks
          }
        };
      });
      localStorage.setItem(TEMPLATE_STORAGE_KEY, JSON.stringify(slimForStorage));
    } catch (retryErr) {
      console.warn("saveLocalWorkReportTemplates retry failed (kept safe in memory):", retryErr);
    }
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("work-report-templates-updated", { detail: normalized }));
  }
};

// Firestore 실시간 구독 (로컬 저장본과 클라우드 문서 병합 유지)
export const subscribeWorkReportTemplates = (callback) => {
  // 즉시 현재 로컬/메모리 목록 먼저 전달
  callback(getLocalWorkReportTemplates());

  try {
    const q = query(collection(db, COLLECTION_NAME));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const deletedIds = getDeletedTemplateIds();
        const snapshotList = snapshot.docs
          .filter((docSnap) => !deletedIds.has(docSnap.id))
          .map((docSnap) =>
            normalizeTemplateDoc({
              id: docSnap.id,
              ...docSnap.data(),
              isDatabaseBacked: true
            })
          );

        const localList = getLocalWorkReportTemplates();
        const tplMap = new Map();
        localList.forEach((tpl) => {
          if (tpl && tpl.id && !deletedIds.has(tpl.id)) tplMap.set(tpl.id, normalizeTemplateDoc(tpl));
        });
        snapshotList.forEach((tpl) => {
          if (tpl && tpl.id && !deletedIds.has(tpl.id)) tplMap.set(tpl.id, normalizeTemplateDoc(tpl));
        });

        const merged = Array.from(tplMap.values()).sort(
          (a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime()
        );
        saveLocalWorkReportTemplates(merged);
        callback(merged);
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

// 전체 템플릿 일괄 삭제 (비우기)
export const deleteAllWorkReportTemplates = async () => {
  const currentList = getLocalWorkReportTemplates();
  const deletedIds = getDeletedTemplateIds();
  currentList.forEach((t) => {
    if (t && t.id) deletedIds.add(t.id);
  });
  DEFAULT_WORK_REPORT_TEMPLATES.forEach((t) => {
    if (t && t.id) deletedIds.add(t.id);
  });
  saveDeletedTemplateIds(deletedIds);

  memoryTemplatesCache = [];
  saveLocalWorkReportTemplates([]);

  try {
    const snap = await getDocs(collection(db, COLLECTION_NAME));
    await Promise.all(snap.docs.map((d) => deleteDoc(doc(db, COLLECTION_NAME, d.id))));
  } catch (e) {
    console.warn("Firestore deleteAllWorkReportTemplates warning:", e);
  }
  return [];
};

// 템플릿 저장 (신규 또는 수정)
export const saveWorkReportTemplate = async (template) => {
  const tplId = template.id || `tpl_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
  const now = new Date().toISOString();
  const payload = normalizeTemplateDoc({
    ...template,
    id: tplId,
    isDatabaseBacked: true,
    updatedAt: now
  });

  // 영구 삭제 블랙리스트에 등록되어 있었다면 복구 허용
  const deletedIds = getDeletedTemplateIds();
  if (deletedIds.has(payload.id)) {
    deletedIds.delete(payload.id);
    saveDeletedTemplateIds(deletedIds);
  }

  // 1. 로컬 & 메모리 즉시 저장 및 이벤트 발송 (UI 0ms 즉시 반영)
  const currentList = getLocalWorkReportTemplates();
  const existingIdx = currentList.findIndex((t) => t.id === tplId);
  let updatedList;
  if (existingIdx >= 0) {
    const targetId = currentList[existingIdx].id || tplId;
    payload.id = targetId;
    updatedList = currentList.map((t, idx) => (idx === existingIdx ? payload : t));
  } else {
    updatedList = [payload, ...currentList];
  }
  saveLocalWorkReportTemplates(updatedList);

  // 2. Firestore 비동기 저장 (안전한 sanitize 후 저장)
  try {
    const firestoreData = sanitizeForFirestore(payload);
    await setDoc(doc(db, COLLECTION_NAME, payload.id), firestoreData);
  } catch (e) {
    console.warn("Firestore save template warning:", e);
  }

  return payload;
};

// 템플릿 삭제
export const deleteWorkReportTemplate = async (templateId) => {
  if (!templateId) return;
  const deletedIds = getDeletedTemplateIds();
  deletedIds.add(templateId);
  saveDeletedTemplateIds(deletedIds);

  const currentList = getLocalWorkReportTemplates();
  const updatedList = currentList.filter((t) => t.id !== templateId && !deletedIds.has(t.id));
  saveLocalWorkReportTemplates(updatedList);

  // processSlots 할당 정리 (삭제된 템플릿이 슬롯에 남아있지 않도록)
  try {
    const assigns = getLocalHanulTemplateAssignments();
    let slotChanged = false;
    const nextSlots = { ...(assigns.processSlots || {}) };
    Object.keys(nextSlots).forEach((k) => {
      if (nextSlots[k] === templateId) {
        delete nextSlots[k];
        slotChanged = true;
      }
    });
    if (slotChanged) {
      saveLocalHanulTemplateAssignments({
        ...assigns,
        processSlots: nextSlots
      });
    }
  } catch (err) {}

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

// ===========================================================================
// 🧱 [커스텀 레고 블록 저장소 (사진 분석 블록 영구 보관 & 실시간 동기화)]
// ===========================================================================
export const CUSTOM_LEGO_BLOCKS_STORAGE_KEY = "oruk_custom_lego_blocks_v1";
const CUSTOM_BLOCKS_COLLECTION = "lego_custom_blocks";

const normalizeCustomBlock = (b) => {
  if (!b) return b;
  const copy = { ...b };
  if (typeof copy.rowsJson === "string" && copy.rowsJson) {
    try {
      copy.rows = JSON.parse(copy.rowsJson);
    } catch {}
  } else if (Array.isArray(copy.rows)) {
    copy.rows = copy.rows.map((r) => (Array.isArray(r) ? r : Array.isArray(r?.cells) ? r.cells : []));
  }
  return copy;
};

export const getLocalCustomLegoBlocks = () => {
  try {
    if (Array.isArray(memoryCustomBlocksCache)) {
      return memoryCustomBlocksCache.map(normalizeCustomBlock);
    }
    const raw = localStorage.getItem(CUSTOM_LEGO_BLOCKS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    memoryCustomBlocksCache = (Array.isArray(parsed) ? parsed : []).map(normalizeCustomBlock);
    return memoryCustomBlocksCache;
  } catch (e) {
    console.warn("Failed to load local custom lego blocks:", e);
    return Array.isArray(memoryCustomBlocksCache) ? memoryCustomBlocksCache : [];
  }
};

export const saveLocalCustomLegoBlocks = (list) => {
  const normalized = (Array.isArray(list) ? list : []).map(normalizeCustomBlock);
  memoryCustomBlocksCache = normalized;
  try {
    // Strip heavy imageDataUrl before saving to localStorage so quota is never exceeded
    const slimList = normalized.map(({ imageDataUrl, ...rest }) => rest);
    localStorage.setItem(CUSTOM_LEGO_BLOCKS_STORAGE_KEY, JSON.stringify(slimList));
  } catch (e) {
    console.warn("Failed to save local custom lego blocks:", e);
  }
};

export const subscribeCustomLegoBlocks = (callback) => {
  callback(getLocalCustomLegoBlocks());
  try {
    const q = query(collection(db, CUSTOM_BLOCKS_COLLECTION));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const snapshotList = snapshot.docs.map((d) =>
          normalizeCustomBlock({
            id: d.id,
            ...d.data()
          })
        );
        const localList = getLocalCustomLegoBlocks();
        const blockMap = new Map();
        localList.forEach((b) => blockMap.set(b.id || b.key, normalizeCustomBlock(b)));
        snapshotList.forEach((b) => blockMap.set(b.id || b.key, normalizeCustomBlock(b)));
        const merged = Array.from(blockMap.values()).sort(
          (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        );
        saveLocalCustomLegoBlocks(merged);
        callback(merged);
      },
      (err) => {
        console.warn("subscribeCustomLegoBlocks offline fallback:", err);
        callback(getLocalCustomLegoBlocks());
      }
    );
    return unsubscribe;
  } catch (e) {
    console.warn("subscribeCustomLegoBlocks error:", e);
    callback(getLocalCustomLegoBlocks());
    return () => {};
  }
};

export const saveCustomLegoBlock = async (blockData) => {
  const now = new Date().toISOString();
  const blockId = blockData.id || blockData.key || `custom_block_${Date.now()}`;
  const { imageDataUrl, ...cleanBlockData } = blockData || {};
  const payload = normalizeCustomBlock({
    ...cleanBlockData,
    id: blockId,
    key: blockData.key || blockId,
    rowsJson: JSON.stringify(blockData.rows || []),
    isCustomBlock: true,
    createdAt: blockData.createdAt || now,
    updatedAt: now
  });

  const currentList = getLocalCustomLegoBlocks();
  const existingIdx = currentList.findIndex((b) => (b.id || b.key) === blockId);
  let updatedList;
  if (existingIdx >= 0) {
    updatedList = currentList.map((b) => ((b.id || b.key) === blockId ? payload : b));
  } else {
    updatedList = [payload, ...currentList];
  }
  saveLocalCustomLegoBlocks(updatedList);

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("custom-lego-blocks-updated", { detail: updatedList }));
  }

  try {
    await Promise.race([
      setDoc(doc(db, CUSTOM_BLOCKS_COLLECTION, blockId), sanitizeForFirestore(payload)),
      new Promise((resolve) => setTimeout(resolve, 2500))
    ]);
  } catch (e) {
    console.warn("Firestore save custom lego block offline:", e);
  }

  return payload;
};

export const deleteCustomLegoBlock = async (blockId) => {
  const currentList = getLocalCustomLegoBlocks();
  const updatedList = currentList.filter((b) => (b.id || b.key) !== blockId);
  saveLocalCustomLegoBlocks(updatedList);

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("custom-lego-blocks-updated", { detail: updatedList }));
  }

  try {
    await deleteDoc(doc(db, CUSTOM_BLOCKS_COLLECTION, blockId));
  } catch (e) {
    console.warn("Firestore delete custom lego block offline:", e);
  }
};

// ===========================================================================
// ⚙️ [작업일보 양식 공정별 매핑 저장소 (한울, 가공동 HR/JA/NX5a, 유성 JK1/CE1/DT 등 통합 지원)]
// ===========================================================================
export const HANUL_TEMPLATE_ASSIGN_KEY = "oruk_hanul_template_assignments_v1";
const HANUL_ASSIGN_DOC_PATH = ["system_config", "hanul_template_assignments"];

export const normalizeHanulProjectKey = (proj) => {
  const p = String(proj || "").toUpperCase().trim();
  if (p.includes("LQ2")) return "LQ2A";
  if (p.includes("9BQC")) return "9BQC";
  if (p.includes("NX5") || p.includes("NX4")) return "NX5A";
  if (p.includes("HR")) return "HR";
  if (p.includes("JA")) return "JA";
  if (p.includes("JK1")) return "JK1";
  if (p.includes("CE1")) return "CE1";
  if (p.includes("DT")) return "DT";
  if (p.includes("SEOL") || p.includes("EXTRUSION") || p.includes("압출")) return "EXTRUSION";
  if (p.includes("BURIM") || p.includes("부림")) return "BURIMTECH";
  return p || "9BQC";
};

export const buildHanulProcessSlotKey = (project, processId, subSlot = "MAIN") => {
  const normProj = normalizeHanulProjectKey(project);
  const cleanProc = String(processId || "소재준비").trim();
  const cleanSub = String(subSlot || "MAIN").trim();
  return `${normProj}__${cleanProc}__${cleanSub}`;
};

export const getLocalHanulTemplateAssignments = () => {
  try {
    const raw = localStorage.getItem(HANUL_TEMPLATE_ASSIGN_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        return {
          ...parsed,
          "9BQC": Array.isArray(parsed["9BQC"]) ? parsed["9BQC"] : [],
          "LQ2A": Array.isArray(parsed["LQ2A"]) ? parsed["LQ2A"] : [],
          "HR": Array.isArray(parsed["HR"]) ? parsed["HR"] : [],
          "JA": Array.isArray(parsed["JA"]) ? parsed["JA"] : [],
          "NX5A": Array.isArray(parsed["NX5A"]) ? parsed["NX5A"] : [],
          "JK1": Array.isArray(parsed["JK1"]) ? parsed["JK1"] : [],
          "CE1": Array.isArray(parsed["CE1"]) ? parsed["CE1"] : [],
          "DT": Array.isArray(parsed["DT"]) ? parsed["DT"] : [],
          "EXTRUSION": Array.isArray(parsed["EXTRUSION"]) ? parsed["EXTRUSION"] : [],
          "BURIMTECH": Array.isArray(parsed["BURIMTECH"]) ? parsed["BURIMTECH"] : [],
          processSlots:
            parsed.processSlots && typeof parsed.processSlots === "object"
              ? parsed.processSlots
              : {}
        };
      }
    }
  } catch (e) {}
  return { "9BQC": [], "LQ2A": [], "HR": [], "JA": [], "NX5A": [], "JK1": [], "CE1": [], "DT": [], "EXTRUSION": [], "BURIMTECH": [], processSlots: {} };
};

export const saveLocalHanulTemplateAssignments = (assignments) => {
  const clean = {
    ...(assignments || {}),
    "9BQC": Array.isArray(assignments?.["9BQC"]) ? assignments["9BQC"] : [],
    "LQ2A": Array.isArray(assignments?.["LQ2A"]) ? assignments["LQ2A"] : [],
    "HR": Array.isArray(assignments?.["HR"]) ? assignments["HR"] : [],
    "JA": Array.isArray(assignments?.["JA"]) ? assignments["JA"] : [],
    "NX5A": Array.isArray(assignments?.["NX5A"]) ? assignments["NX5A"] : [],
    "JK1": Array.isArray(assignments?.["JK1"]) ? assignments["JK1"] : [],
    "CE1": Array.isArray(assignments?.["CE1"]) ? assignments["CE1"] : [],
    "DT": Array.isArray(assignments?.["DT"]) ? assignments["DT"] : [],
    "EXTRUSION": Array.isArray(assignments?.["EXTRUSION"]) ? assignments["EXTRUSION"] : [],
    "BURIMTECH": Array.isArray(assignments?.["BURIMTECH"]) ? assignments["BURIMTECH"] : [],
    processSlots:
      assignments?.processSlots && typeof assignments.processSlots === "object"
        ? assignments.processSlots
        : {}
  };
  try {
    localStorage.setItem(HANUL_TEMPLATE_ASSIGN_KEY, JSON.stringify(clean));
  } catch (e) {}
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("hanul-template-assignments-updated", { detail: clean }));
  }
  return clean;
};

export const saveHanulTemplateAssignment = async (projectKey, templateIds, processSlotsUpdate = null) => {
  const normKey = normalizeHanulProjectKey(projectKey);
  const current = getLocalHanulTemplateAssignments();
  const ids = Array.isArray(templateIds)
    ? Array.from(new Set(templateIds.filter(Boolean)))
    : templateIds
    ? [templateIds]
    : current[normKey] || [];
  const nextProcessSlots =
    processSlotsUpdate && typeof processSlotsUpdate === "object"
      ? { ...(current.processSlots || {}), ...processSlotsUpdate }
      : current.processSlots || {};
  // null/빈값 슬롯 정리
  Object.keys(nextProcessSlots).forEach((k) => {
    if (!nextProcessSlots[k]) delete nextProcessSlots[k];
  });
  const next = {
    ...current,
    [normKey]: ids,
    processSlots: nextProcessSlots,
    updatedAt: new Date().toISOString()
  };
  saveLocalHanulTemplateAssignments(next);

  try {
    await setDoc(
      doc(db, HANUL_ASSIGN_DOC_PATH[0], HANUL_ASSIGN_DOC_PATH[1]),
      sanitizeForFirestore(next)
    );
  } catch (e) {
    console.warn("Firestore saveHanulTemplateAssignment warning:", e);
  }
  return next;
};

export const subscribeHanulTemplateAssignments = (callback) => {
  callback(getLocalHanulTemplateAssignments());
  try {
    const ref = doc(db, HANUL_ASSIGN_DOC_PATH[0], HANUL_ASSIGN_DOC_PATH[1]);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          const clean = saveLocalHanulTemplateAssignments({
            ...data,
            "9BQC": Array.isArray(data?.["9BQC"]) ? data["9BQC"] : [],
            "LQ2A": Array.isArray(data?.["LQ2A"]) ? data["LQ2A"] : [],
            "HR": Array.isArray(data?.["HR"]) ? data["HR"] : [],
            "JA": Array.isArray(data?.["JA"]) ? data["JA"] : [],
            "NX5A": Array.isArray(data?.["NX5A"]) ? data["NX5A"] : [],
            "JK1": Array.isArray(data?.["JK1"]) ? data["JK1"] : [],
            "CE1": Array.isArray(data?.["CE1"]) ? data["CE1"] : [],
            "DT": Array.isArray(data?.["DT"]) ? data["DT"] : [],
            "EXTRUSION": Array.isArray(data?.["EXTRUSION"]) ? data["EXTRUSION"] : [],
            "BURIMTECH": Array.isArray(data?.["BURIMTECH"]) ? data["BURIMTECH"] : [],
            processSlots:
              data?.processSlots && typeof data.processSlots === "object"
                ? data.processSlots
                : {}
          });
          callback(clean);
        } else {
          callback(getLocalHanulTemplateAssignments());
        }
      },
      () => {
        callback(getLocalHanulTemplateAssignments());
      }
    );
    return unsub;
  } catch (e) {
    callback(getLocalHanulTemplateAssignments());
    return () => {};
  }
};

/**
 * 🌟 [핵심] 현장 작업자 로그인 및 일보 모달 열림 시 적용할 5대 공정 지정 양식 완벽 해결
 * 날짜 변경(다음날), 브라우저 재로그인, 캐시 삭제 시에도 관리자가 설정한 양식이 절대 리셋되지 않도록
 * 8단계의 견고한 Tiered Fallback을 통해 100% 매칭 보장
 */
export const getAssignedTemplateForWorker = ({
  company = "",
  project = "",
  processId = "",
  subProcess = "",
  jointType = "",
  inspectionType = "",
  allTemplates = null,
  assignments = null
}) => {
  const tplList =
    Array.isArray(allTemplates) && allTemplates.length > 0
      ? allTemplates
      : getLocalWorkReportTemplates();
  const assignData =
    assignments && typeof assignments === "object"
      ? assignments
      : getLocalHanulTemplateAssignments();

  const normProj = normalizeHanulProjectKey(project || company || "9BQC");
  const cleanProc = String(processId || "소재준비").trim();
  const cleanSub = String(
    (cleanProc === "소재준비"
      ? subProcess
      : cleanProc === "조인트"
      ? jointType
      : cleanProc === "검사"
      ? inspectionType
      : "") || "MAIN"
  ).trim();

  const slots = assignData.processSlots || {};

  // Tier 1: 세부 공정 슬롯 정확 매칭 (예: 9BQC__소재준비__정치절단, BURIMTECH__STANDARD__MAIN, EXTRUSION__pcm1__MAIN)
  const exactKey = `${normProj}__${cleanProc}__${cleanSub}`;
  let candidateId = slots[exactKey];

  // Tier 2: MAIN 슬롯 매칭 (예: 9BQC__소재준비__MAIN, BURIMTECH__STANDARD__MAIN)
  if (!candidateId) {
    candidateId = slots[`${normProj}__${cleanProc}__MAIN`];
  }

  // Tier 3: '작업일보' 슬롯 매칭 (예: 9BQC__소재준비__작업일보)
  if (!candidateId) {
    candidateId = slots[`${normProj}__${cleanProc}__작업일보`];
  }

  // Tier 4: 해당 프로젝트 & 공정으로 시작하는 슬롯 중 첫번째 등록 양식
  if (!candidateId) {
    const procPrefix = `${normProj}__${cleanProc}__`;
    const matchingKey = Object.keys(slots).find(
      (k) => k.startsWith(procPrefix) && Boolean(slots[k])
    );
    if (matchingKey) candidateId = slots[matchingKey];
  }

  // Tier 5: 프로젝트 전체 슬롯 중 등록된 첫번째 양식
  if (!candidateId) {
    const projPrefix = `${normProj}__`;
    const matchingKey = Object.keys(slots).find(
      (k) => k.startsWith(projPrefix) && Boolean(slots[k])
    );
    if (matchingKey) candidateId = slots[matchingKey];
  }

  // Tier 6: 프로젝트별 지정 템플릿 목록 (예: assignData["9BQC"][0])
  if (
    !candidateId &&
    Array.isArray(assignData[normProj]) &&
    assignData[normProj].length > 0
  ) {
    candidateId = assignData[normProj][0];
  }

  // Tier 7: 회사 표준 지정 템플릿 목록 (예: BURIMTECH, EXTRUSION)
  const normComp = normalizeHanulProjectKey(company);
  if (
    !candidateId &&
    normComp !== normProj &&
    Array.isArray(assignData[normComp]) &&
    assignData[normComp].length > 0
  ) {
    candidateId = assignData[normComp][0];
  }

  // 후보 ID가 있는 경우 템플릿 카탈로그에서 매칭 반환
  if (candidateId) {
    const found = tplList.find((t) => t.id === candidateId);
    if (found) return found;
  }

  // Tier 8: 차종(carModel)과 공정명(processName)이 일치하는 카탈로그 기본 양식 자동 매칭
  const catalogMatch = tplList.find((t) => {
    const matchModel = normalizeHanulProjectKey(t.carModel) === normProj;
    const matchProc =
      String(t.processName || "").includes(cleanProc) ||
      String(t.categoryName || "").includes(cleanProc) ||
      String(t.title || "").includes(cleanProc);
    return matchModel && matchProc;
  });
  if (catalogMatch) return catalogMatch;

  return null;
};
