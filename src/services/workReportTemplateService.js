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

export const TEMPLATE_STORAGE_KEY = "oruk_work_report_templates_v2";
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
  // 1. 소재준비일보: 9BQC 정치절단 (705-02 REV.4 실물 양식 1:1 완벽 일치)
  {
    id: "tpl_mat_prep_9bqc_cutting",
    categoryId: "MATERIAL_PREP",
    categoryName: "소재준비일보",
    title: "소재 준비 작업 일보 (G/RUN)",
    subTitle: "▣공정명 : 정치 절단    ※Record Time : Start / Half / Finish",
    formNo: "705-02(REV.4)",
    companyName: "(주)오륙",
    carModel: "9BQC",
    partName: "G/RUN",
    processName: "정치 절단",
    subProcess: "정치절단",
    divisionType: "SECTION_ABC", // SECTION_ABC, LH_RH, 4_COLUMNS, SINGLE
    isDatabaseBacked: true,
    blocks: {
      timeAndQty: true,
      specAndLot: true,
      machineCondition: false,
      defectMatrix: true,
      maintenance: true
    },
    specs: [
      { id: "sp_1", section: "A", name: "A", frtSpec: "881 ± 3mm", frtTarget: 881, frtTol: 3, rrSpec: "488 ± 3mm(가절단)", rrTarget: 488, rrTol: 3 },
      { id: "sp_2", section: "B", name: "B", frtSpec: "608 ± 5mm", frtTarget: 608, frtTol: 5, rrSpec: "658 ± 5mm", rrTarget: 658, rrTol: 5 },
      { id: "sp_3", section: "C", name: "C", frtSpec: "582 ± 5mm", frtTarget: 582, frtTol: 5, rrSpec: "658 ± 6mm", rrTarget: 658, rrTol: 6 }
    ],
    defectCategories: [
      {
        name: "압출소재 불량 (Extrusion Badness)",
        items: [
          "스코치(Scortch)",
          "외면 흠(Scratch)",
          "오염(Contamination)",
          "길이 미달(Length Bad)",
          "와이어 노출"
        ]
      },
      {
        name: "공정간 불량(Process Badness)",
        items: [
          "길이 (Length Bad)",
          "단컷팅(Step Cutt,g)",
          "기타 ( Etc )"
        ]
      }
    ],
    maintenanceConfig: {
      hasBladeChange: true,
      bladeChangeTitle: "칼날교체 시간",
      hasTroubleAction: true,
      troubleActionTitle: "설비 이상 조치사항",
      bladeWarningLimit: 50000
    },
    updatedAt: "2026-10-16T16:00:00.000Z"
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
    isDatabaseBacked: true,
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
    isDatabaseBacked: true,
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
    isDatabaseBacked: true,
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
    isDatabaseBacked: true,
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
    isDatabaseBacked: true,
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
  },
  // 7. [레고 블록 공식 탑재] JA G/RUN 표준 정밀가공 작업일보 (정치절단 & 단컷팅)
  {
    id: "tpl_lego_ja_precision",
    categoryId: "MATERIAL_PREP",
    categoryName: "소재준비일보",
    title: "JA G/RUN 표준 정밀가공 작업일보",
    subTitle: "▣ 공정명 : 정치절단 / 단컷팅",
    formNo: "705-02(REV.4)",
    companyName: "(주)오륙",
    carModel: "JA",
    partName: "G/RUN (FRT & RR)",
    processName: "정치절단 / 단컷팅",
    subProcess: "정치절단",
    divisionType: "SECTION_ABC",
    isLegoModular: true,
    isDatabaseBacked: true,
    source: "LEGO_MODULAR_BUILDER",
    blocks: {
      timeAndQty: true,
      specAndLot: true,
      machineCondition: false,
      defectMatrix: true,
      maintenance: true
    },
    specs: [
      { id: "c1", section: "A", name: "A단면", spec: "881 ± 3mm", frtSpec: "881 ± 3mm", lotStart: "261020-A01", lotHalf: "261020-A01", lotFinish: "261020-A01" },
      { id: "c2", section: "B", name: "B단면", spec: "608 ± 5mm", frtSpec: "608 ± 5mm", lotStart: "261020-B02", lotHalf: "261020-B02", lotFinish: "261020-B02" },
      { id: "c3", section: "C", name: "C단면", spec: "582 ± 5mm", frtSpec: "582 ± 5mm", lotStart: "261020-C03", lotHalf: "261020-C03", lotFinish: "261020-C03" }
    ],
    defectCategories: [
      {
        name: "불량소재 구분 (8대 불량)",
        items: ["외면 흠", "오 염", "코팅 불량", "단면 불량", "단컷팅 불량", "원단 들뜸"]
      }
    ],
    maintenanceConfig: {
      hasBladeChange: true,
      hasTroubleAction: true,
      bladeWarningLimit: 50000
    },
    updatedAt: new Date().toISOString()
  },

  // 8. [레고 블록 공식 탑재] JA G/RUN 코너 조인트 사출 성형 작업 일보
  {
    id: "tpl_lego_joint_injection",
    categoryId: "JOINT",
    categoryName: "조인트일보",
    title: "조인트 사출 성형 작업 일보",
    subTitle: "▣ 공정명 : G/RUN 코너 조인트 사출 성형",
    formNo: "703-01(REV.2)",
    companyName: "(주)오륙",
    carModel: "JA",
    partName: "G/RUN (FRT / RR)",
    processName: "조인트 사출",
    subProcess: "사출성형",
    divisionType: "LH_RH",
    isLegoModular: true,
    isDatabaseBacked: true,
    source: "LEGO_MODULAR_BUILDER",
    blocks: {
      timeAndQty: false,
      specAndLot: false,
      machineCondition: true,
      defectMatrix: true,
      maintenance: true
    },
    specs: [
      { id: "sp_j1", section: "FRT 코너", name: "FRT 코너 조인트", spec: "밀착성 양호", frtSpec: "밀착성 양호" },
      { id: "sp_j2", section: "RR 코너", name: "RR 코너 조인트", spec: "밀착성 양호", frtSpec: "밀착성 양호" }
    ],
    defectCategories: [
      {
        name: "조인트 사출 공정불량",
        items: ["떨어짐", "양부족", "밀 림", "단 차", "기 포", "씹 힘", "삽입 불량", "수 축"]
      }
    ],
    maintenanceConfig: {
      hasBladeChange: false,
      hasTroubleAction: true
    },
    updatedAt: new Date().toISOString()
  },

  // 9. [레고 블록 공식 탑재] JA 완제품 직각검사 일보
  {
    id: "tpl_lego_right_angle_insp",
    categoryId: "INSPECTION",
    categoryName: "검사일보",
    title: "완제품 직각검사 일보",
    subTitle: "▣ 공정명 : 완제품 직각검사 및 최종 외관 전수검사",
    formNo: "706-01(REV.3)",
    companyName: "(주)오륙",
    carModel: "JA",
    partName: "G/RUN (FRT & RR)",
    processName: "직각검사",
    subProcess: "최종검사",
    divisionType: "4_COLUMNS",
    isLegoModular: true,
    isDatabaseBacked: true,
    source: "LEGO_MODULAR_BUILDER",
    blocks: {
      timeAndQty: false,
      specAndLot: false,
      machineCondition: false,
      defectMatrix: true,
      maintenance: true
    },
    specs: [
      { id: "sp_ra1", section: "LH 직각도", name: "LH 직각 형합성", spec: "90° ± 0.5°", frtSpec: "90° ± 0.5°" },
      { id: "sp_ra2", section: "RH 직각도", name: "RH 직각 형합성", spec: "90° ± 0.5°", frtSpec: "90° ± 0.5°" }
    ],
    defectCategories: [
      {
        name: "FRT 직각검사 불량 항목 (사진 17 일치)",
        items: ["립컷팅 누락", "패드 누락", "외면 오염", "미사상", "과사상", "조인트 씹힘", "조인트 기포"]
      }
    ],
    maintenanceConfig: {
      hasBladeChange: false,
      hasTroubleAction: true
    },
    updatedAt: new Date().toISOString()
  },

  // 10. [레고 블록 공식 탑재] JA 도면 중요 치수 및 부자재(패드 5T) 검사 일보
  {
    id: "tpl_lego_drawing_spec",
    categoryId: "INSPECTION",
    categoryName: "검사일보",
    title: "도면 중요 치수 및 부자재(패드 5T) 검사 일보",
    subTitle: "▣ 공정명 : 도면 치수 검사 및 부자재 부착 검사 (LH / RH)",
    formNo: "706-02(REV.2)",
    companyName: "(주)오륙",
    carModel: "JA",
    partName: "G/RUN (RR LH)",
    processName: "치수 및 패드 검사",
    subProcess: "치수검사",
    divisionType: "SECTION_ABC",
    isLegoModular: true,
    isDatabaseBacked: true,
    source: "LEGO_MODULAR_BUILDER",
    blocks: {
      timeAndQty: false,
      specAndLot: true,
      machineCondition: false,
      defectMatrix: false,
      maintenance: true
    },
    specs: [
      { id: "sp_ds1", section: "A치수", name: "RR LH A 치수", spec: "482 ± 3mm", frtSpec: "482 ± 3mm" },
      { id: "sp_ds2", section: "B치수", name: "RR LH B 치수", spec: "658 ± 5mm", frtSpec: "658 ± 5mm" },
      { id: "sp_ds3", section: "D치수", name: "RR LH D 치수", spec: "418 ± 4mm", frtSpec: "418 ± 4mm" },
      { id: "sp_ds4", section: "패드 5T", name: "패드 5T 부착 규격", spec: "5T*5W*60L", frtSpec: "5T*5W*60L" }
    ],
    defectCategories: [],
    maintenanceConfig: {
      hasBladeChange: false,
      hasTroubleAction: true
    },
    updatedAt: new Date().toISOString()
  }

];

// 로컬 스토리지 데이터 가져오기 (기본 10대 공식 템플릿 및 DB 연동 마이그레이션 자동 보장)
export const getLocalWorkReportTemplates = () => {
  try {
    const raw = localStorage.getItem(TEMPLATE_STORAGE_KEY);
    let cachedList = [];
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        cachedList = parsed;
      }
    }

    const tplMap = new Map();
    // 1. 기본 10대 공식 템플릿 우선 등록 (모두 isDatabaseBacked: true)
    DEFAULT_WORK_REPORT_TEMPLATES.forEach((tpl) => {
      tplMap.set(tpl.id, { ...tpl, isDatabaseBacked: true });
    });

    // 2. 사용자가 저장한 템플릿 및 변경사항 병합 (항상 isDatabaseBacked: true 부여)
    cachedList.forEach((tpl) => {
      const base = tplMap.get(tpl.id);
      tplMap.set(tpl.id, {
        ...(base || {}),
        ...tpl,
        isDatabaseBacked: true
      });
    });

    const merged = Array.from(tplMap.values());
    localStorage.setItem(TEMPLATE_STORAGE_KEY, JSON.stringify(merged));
    return merged;
  } catch (e) {
    console.warn("getLocalWorkReportTemplates fallback:", e);
    return DEFAULT_WORK_REPORT_TEMPLATES.map((t) => ({ ...t, isDatabaseBacked: true }));
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

// Firestore 실시간 구독 (기본 10종 템플릿 누락 시 자동 보충 및 DB 뱃지 부여)
export const subscribeWorkReportTemplates = (callback) => {
  let isInitial = true;
  try {
    const q = query(collection(db, COLLECTION_NAME));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const snapshotList = snapshot.docs.map((docSnap) => ({
            id: docSnap.id,
            ...docSnap.data(),
            isDatabaseBacked: true
          }));

          const tplMap = new Map();
          DEFAULT_WORK_REPORT_TEMPLATES.forEach((tpl) => {
            tplMap.set(tpl.id, { ...tpl, isDatabaseBacked: true });
          });
          snapshotList.forEach((tpl) => {
            const base = tplMap.get(tpl.id);
            tplMap.set(tpl.id, {
              ...(base || {}),
              ...tpl,
              isDatabaseBacked: true
            });
          });

          const merged = Array.from(tplMap.values());
          saveLocalWorkReportTemplates(merged);
          callback(merged);

          // Firestore에 누락된 표준 템플릿이 있다면 백그라운드 동기화
          if (isInitial) {
            DEFAULT_WORK_REPORT_TEMPLATES.forEach((defTpl) => {
              if (!snapshotList.some((s) => s.id === defTpl.id)) {
                setDoc(doc(db, COLLECTION_NAME, defTpl.id), sanitizeForFirestore({ ...defTpl, isDatabaseBacked: true })).catch(console.warn);
              }
            });
          }
        } else if (isInitial) {
          // 컬렉션이 비어있으면 초기 템플릿 마이그레이션 저장
          const defaults = getLocalWorkReportTemplates();
          callback(defaults);
          // 백그라운드에서 기본 템플릿 Firestore 업로드
          Promise.all(
            defaults.map((t) => setDoc(doc(db, COLLECTION_NAME, t.id), sanitizeForFirestore({ ...t, isDatabaseBacked: true })))
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
    isDatabaseBacked: true,
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

// ===========================================================================
// 🧱 [커스텀 레고 블록 저장소 (사진 분석 블록 영구 보관 & 실시간 동기화)]
// ===========================================================================
export const CUSTOM_LEGO_BLOCKS_STORAGE_KEY = "oruk_custom_lego_blocks_v1";
const CUSTOM_BLOCKS_COLLECTION = "lego_custom_blocks";

export const getLocalCustomLegoBlocks = () => {
  try {
    const raw = localStorage.getItem(CUSTOM_LEGO_BLOCKS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.warn("Failed to load local custom lego blocks:", e);
    return [];
  }
};

export const saveLocalCustomLegoBlocks = (list) => {
  try {
    localStorage.setItem(CUSTOM_LEGO_BLOCKS_STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn("Failed to save local custom lego blocks:", e);
  }
};

export const subscribeCustomLegoBlocks = (callback) => {
  try {
    const q = query(collection(db, CUSTOM_BLOCKS_COLLECTION));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const snapshotList = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data()
        }));
        const localList = getLocalCustomLegoBlocks();
        const blockMap = new Map();
        localList.forEach((b) => blockMap.set(b.id || b.key, b));
        snapshotList.forEach((b) => blockMap.set(b.id || b.key, b));
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
  const payload = {
    ...blockData,
    id: blockId,
    key: blockData.key || blockId,
    isCustomBlock: true,
    createdAt: blockData.createdAt || now,
    updatedAt: now
  };

  const currentList = getLocalCustomLegoBlocks();
  const existingIdx = currentList.findIndex((b) => (b.id || b.key) === blockId);
  let updatedList;
  if (existingIdx >= 0) {
    updatedList = currentList.map((b) => ((b.id || b.key) === blockId ? payload : b));
  } else {
    updatedList = [payload, ...currentList];
  }
  saveLocalCustomLegoBlocks(updatedList);

  try {
    await setDoc(doc(db, CUSTOM_BLOCKS_COLLECTION, blockId), sanitizeForFirestore(payload));
  } catch (e) {
    console.warn("Firestore save custom lego block offline:", e);
  }

  window.dispatchEvent(new CustomEvent("custom-lego-blocks-updated", { detail: updatedList }));
  return payload;
};

export const deleteCustomLegoBlock = async (blockId) => {
  const currentList = getLocalCustomLegoBlocks();
  const updatedList = currentList.filter((b) => (b.id || b.key) !== blockId);
  saveLocalCustomLegoBlocks(updatedList);

  try {
    await deleteDoc(doc(db, CUSTOM_BLOCKS_COLLECTION, blockId));
  } catch (e) {
    console.warn("Firestore delete custom lego block offline:", e);
  }

  window.dispatchEvent(new CustomEvent("custom-lego-blocks-updated", { detail: updatedList }));
};

