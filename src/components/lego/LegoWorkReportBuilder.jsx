import React, { useState, useEffect, useMemo } from "react";
import {
  Database,
  Zap,
  Layers,
  Plus,
  Trash2,
  Edit3,
  Printer,
  Copy,
  Save,
  RotateCcw,
  CheckCircle2,
  FileSpreadsheet,
  Scissors,
  Wrench,
  Search,
  Sparkles,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Check,
  ChevronDown,
  ChevronRight,
  ArrowRight,
  Sliders,
  Maximize2,
  Download,
  AlertCircle,
  FolderPlus
} from "lucide-react";
import { saveMachiningWorkReport, deleteMachiningWorkReport } from "../../services/machiningWorkReportService";
import {
  translateTerm,
  getCurrentWorkLogLanguage,
  SUPPORTED_LANGUAGES,
  setWorkLogLanguage
} from "../../services/workLogI18nService";
import LegoBlockEditorModal from "./LegoBlockEditorModal.jsx";
import LegoBlockCollectionModal from "./LegoBlockCollectionModal.jsx";
import CommonDowntimeDefectPanel from "../common/CommonDowntimeDefectPanel.jsx";
import {
  BladeReplacementCycleBlock,
  MoldShotCountManageBlock
} from "../common/BladeAndMoldLifecycleBlocks.jsx";
import {
  saveWorkReportTemplate,
  getLocalWorkReportTemplates,
  subscribeWorkReportTemplates,
  deleteWorkReportTemplate,
  REPORT_MAJOR_CATEGORIES,
  getLocalCustomLegoBlocks,
  subscribeCustomLegoBlocks,
  saveCustomLegoBlock
} from "../../services/workReportTemplateService";

// =============================================================================
// 17대 레고 블록 원본 사진 메타데이터 (Excel '레고 양식.xlsx' 실물 1:1 완벽 매핑)
// =============================================================================
export const LEGO_IMAGE_REFERENCES = [
  {
    id: "img_1",
    imgFile: "/lego_images/lego_block_1.png",
    title: "[블록 1] 작업자 / 시간 / 생산수량",
    desc: "구분(FRT LH/RH, RR LH/RH), 작업자, 시간(시작/종료), 생산수량(정품/불량/재조인트)",
    blockKey: "timeAndOutput"
  },
  {
    id: "img_2",
    imgFile: "/lego_images/lego_block_2.png",
    title: "[블록 2] 2. 단컷팅 - FRT 구간 치수",
    desc: "구분 A(49mm), B(45mm) x SPEC, 초물/중물/종물 실측치 (인식오류 수정 완료)",
    blockKey: "stepCuttingFrt"
  },
  {
    id: "img_3",
    imgFile: "/lego_images/lego_block_3.png",
    title: "[블록 3] 2. 단컷팅 - RR 구간 치수",
    desc: "구분 A(40mm), B(39mm) x SPEC, 초물/중물/종물 실측치",
    blockKey: "stepCuttingRr"
  },
  {
    id: "img_4",
    imgFile: "/lego_images/lego_block_4.png",
    title: "[블록 4] 3. 재료 (Joint Material)",
    desc: "조인트 재료명 (Joint grade name) & 조인트 재료일자 (Joint material lot no)",
    blockKey: "jointMaterial"
  },
  {
    id: "img_5",
    imgFile: "/lego_images/lego_block_5.png",
    title: "[블록 5] 4. 사출온도 (Temperature)",
    desc: "Sett'g / Actual x Injection A, B, RR x 노즐, N2, H3, H4 온도 관리",
    blockKey: "injectionTemp"
  },
  {
    id: "img_6",
    imgFile: "/lego_images/lego_block_6.png",
    title: "[블록 6] 5. 사출조건 (Injection Condition)",
    desc: "거리(mm), 속도(mm/s), 압력(bar), 시간(sec) x SPEC, 초물/중물/종물",
    blockKey: "injectionCondition"
  },
  {
    id: "img_7",
    imgFile: "/lego_images/lego_block_7.png",
    title: "[블록 7] 6. 공정불량 종합 매트릭스",
    desc: "10대 불량 x 폐기불량(FRT A/B/C, RR A/B), 재조인트수량(FRT, RR), 공정간불량(FRT, RR)",
    blockKey: "jointDefectMatrix"
  },
  {
    id: "img_8",
    imgFile: "/lego_images/lego_block_8.png",
    title: "[블록 8] 공정명 & 차종/품명 표준 헤더",
    desc: "공정명: 단컷팅, 차종: JA, 품명: G/RUN, 작업자 서명란",
    blockKey: "basicInfo"
  },
  {
    id: "img_9",
    imgFile: "/lego_images/lego_block_9.png",
    title: "[블록 9] 작업시간 및 생산량(실적) 테이블",
    desc: "FRT LH/RH, RR LH/RH x A단면 실적, B단면 실적(시작/종료/수량)",
    blockKey: "workTimeOutput"
  },
  {
    id: "img_10",
    imgFile: "/lego_images/lego_block_10.png",
    title: "[블록 10] 불량소재구분 (8열 매트릭스)",
    desc: "FRT LH/RH A/B, RR LH/RH A/B (총 8열) x 압출불량 4종 + 공정간불량 2종",
    blockKey: "defectMaterialMatrix"
  },
  {
    id: "img_11",
    imgFile: "/lego_images/lego_block_11.png",
    title: "[블록 11] 부자재 LOT NO. (패드 5T)",
    desc: "패드 5T 입고일자 및 LOT 번호 (기존 패드 ST 오인식 ➔ 패드 5T 완벽 수정)",
    blockKey: "subMaterialLot"
  },
  {
    id: "img_12",
    imgFile: "/lego_images/lego_block_12.png",
    title: "[블록 12] 도면 치수 & 중요 검사 현황 LH",
    desc: "부품 도면 다이어그램(A, B, D) + RR LH A(482±3), RR LH B(658±5), 패드(5T*5W*60L)",
    blockKey: "drawingSpecCheck"
  },
  {
    id: "img_13",
    imgFile: "/lego_images/lego_block_13.png",
    title: "[블록 13] 직각검사 일보 제목 헤더",
    desc: "직각검사 일보 공식 타이틀 및 3단 결재선 (작성 / 검토 / 승인)",
    blockKey: "rightAngleHeader"
  },
  {
    id: "img_14",
    imgFile: "/lego_images/lego_block_14.png",
    title: "[블록 14] 완제품 직각검사 일보 종합 매트릭스",
    desc: "LH/RH 2/3호기 x 제품수량, 압출불량 6종, 조인트불량 9종, 후가공불량 9종, 특기사항",
    blockKey: "rightAngleMatrix"
  },
  {
    id: "img_15",
    imgFile: "/lego_images/lego_block_15.png",
    title: "[블록 15] 정치 절단 길이 (Spec cutting) & LOT NO.",
    desc: "Row A(881±3/488±3 가절단), Row B(608±5/658±5), Row C(582±5/658±6) + 초/중/종 + LOT NO.",
    blockKey: "specsCutting"
  },
  {
    id: "img_16",
    imgFile: "/lego_images/lego_block_16.png",
    title: "[블록 16] 불량소재구분 (Section A / B / C 3단면)",
    desc: "Section A, Section B, Section C x 길이 미달(Length Bad), 와이어 노출, 단컷팅 (신규 완벽 반영)",
    blockKey: "defectSectionAbc"
  },
  {
    id: "img_17",
    imgFile: "/lego_images/lego_block_17.png",
    title: "[블록 17] FRT 직각검사 불량 집계표 (FRT LH / RH)",
    desc: "립컷팅 누락, 패드 누락, 외면 오염, 미사상, 과사상, 조인트 씹힘 등 (누락되었던 17번째 블록 완벽 탑재)",
    blockKey: "frtRightAngleDefects"
  },
  {
    id: "img_18",
    imgFile: "/lego_images/lego_block_10.png",
    title: "[블록 18] 비가동 및 부적합품 발생내역 (조치전·후 사진)",
    desc: "압출동·가공동·한울·부림텍·유성 공통 비가동 및 부적합품 등록 + 조치전/조치후 사진 첨부",
    blockKey: "downtimeDefectPanel"
  },
  {
    id: "img_19",
    imgFile: "/lego_images/lego_block_9.png",
    title: "[블록 19] 칼날교체주기 관리 블록 (생산량 연동)",
    desc: "작업일보 생산량 기준 자동 합산 • 교체주기 횟수설정 • 처리결과(교체) 등록 및 0 리셋",
    blockKey: "bladeReplacementBlock"
  },
  {
    id: "img_20",
    imgFile: "/lego_images/lego_block_1.png",
    title: "[블록 20] 금형숏트수관리 블록 (생산량 연동)",
    desc: "작업일보 생산량 기준 숏트수 합산 • 숏트수설정 • 처리결과(습합, 검증완료) 등록 및 0 리셋",
    blockKey: "moldShotCountBlock"
  }
];

// =============================================================================
// 4가지 완성형 사전 조합 템플릿 프리셋 (인식오류 전면 수정)
// =============================================================================
export const PRESET_REPORTS = [
  {
    id: "REPORT_CUTTING",
    name: "소재준비작업일보",
    badge: "정치절단 & 단컷팅",
    category: "MATERIAL_PREP",
    desc: "사진 8, 9, 15, 2, 3, 10, 16, 11 조합 - 정치절단, FRT/RR 단컷팅, 불량소재 8열 및 A/B/C 단면",
    title: "소재준비작업일보",
    subTitle: "",
    processName: "소재준비",
    formNo: "705-02(REV.4)",
    companyName: "(주)오륙",
    carModel: "JA",
    partName: "G/RUN",
    targetQty: 350,
    orderQty: 350,
    workerName: "김작업",
    workDate: new Date().toISOString().slice(0, 10),
    shift: "주간",
    startTime: "08:00",
    finishTime: "17:00",
    activeBlocks: {
      basicInfo: true,
      workTimeOutput: true,
      specsCutting: true,
      stepCuttingFrt: true,
      stepCuttingRr: true,
      subMaterialLot: true,
      defectMaterialMatrix: true,
      defectSectionAbc: true,
      jointMaterial: false,
      injectionTemp: false,
      injectionCondition: false,
      jointDefectMatrix: false,
      drawingSpecCheck: false,
      rightAngleMatrix: false,
      frtRightAngleDefects: false,
      remarks: true,
      bladeReplacementBlock: true,
      moldShotCountBlock: true,
      downtimeDefectPanel: true
    },
    // 블록 15: 정치 절단 길이 (Spec cutting) - 실제 사진 15 실물 데이터 (초물/중물/종물 3회 측정 및 LOT NO. 3개)
    specsCutting: [
      {
        id: "c1",
        section: "A",
        spec1: "881 ± 3mm",
        start1: "881.0",
        half1: "880.8",
        finish1: "881.2",
        lotStart: "261020-A01",
        lotHalf: "261020-A01",
        lotFinish: "261020-A01",
        lotNo: "261020-A01"
      },
      {
        id: "c2",
        section: "B",
        spec1: "608 ± 5mm",
        start1: "608.2",
        half1: "607.9",
        finish1: "608.0",
        lotStart: "261020-B02",
        lotHalf: "261020-B02",
        lotFinish: "261020-B02",
        lotNo: "261020-B02"
      },
      {
        id: "c3",
        section: "C",
        spec1: "582 ± 5mm",
        start1: "582.0",
        half1: "582.5",
        finish1: "581.8",
        lotStart: "261020-C03",
        lotHalf: "261020-C03",
        lotFinish: "261020-C03",
        lotNo: "261020-C03"
      }
    ],
    // 블록 2: FRT 단컷팅 구간 치수 (사진 2)
    stepCuttingFrt: [
      { id: "scf_1", section: "A", spec: "49mm", startVal: "49.1", halfVal: "49.0", finishVal: "48.9" },
      { id: "scf_2", section: "B", spec: "45mm", startVal: "45.0", halfVal: "45.2", finishVal: "45.1" }
    ],
    // 블록 3: RR 단컷팅 구간 치수 (사진 3)
    stepCuttingRr: [
      { id: "scr_1", section: "A", spec: "40mm", startVal: "40.0", halfVal: "39.9", finishVal: "40.1" },
      { id: "scr_2", section: "B", spec: "39mm", startVal: "39.0", halfVal: "39.1", finishVal: "38.9" }
    ],
    // 블록 11: 부자재 LOT NO. (패드 5T)
    subMaterialLot: "패드 5T: 2026.10.19-01",
    // 블록 10: 불량소재구분 (8열)
    defectMaterialMatrix: [
      { id: "dm_1", category: "압출소재불량", name: "외면 흠", frtLhA: 0, frtRhA: 0, frtLhB: 1, frtRhB: 0, rrLhA: 0, rrRhA: 0, rrLhB: 0, rrRhB: 0 },
      { id: "dm_2", category: "압출소재불량", name: "오 염", frtLhA: 0, frtRhA: 0, frtLhB: 0, frtRhB: 0, rrLhA: 0, rrRhA: 0, rrLhB: 0, rrRhB: 0 },
      { id: "dm_3", category: "압출소재불량", name: "코팅 불량", frtLhA: 0, frtRhA: 0, frtLhB: 0, frtRhB: 0, rrLhA: 1, rrRhA: 0, rrLhB: 0, rrRhB: 0 },
      { id: "dm_4", category: "압출소재불량", name: "단면 불량", frtLhA: 0, frtRhA: 0, frtLhB: 0, frtRhB: 0, rrLhA: 0, rrRhA: 0, rrLhB: 0, rrRhB: 0 },
      { id: "dm_5", category: "공정간불량", name: "단컷팅 불량", frtLhA: 1, frtRhA: 0, frtLhB: 0, frtRhB: 0, rrLhA: 0, rrRhA: 0, rrLhB: 0, rrRhB: 0 },
      { id: "dm_6", category: "공정간불량", name: "원단 들뜸", frtLhA: 0, frtRhA: 0, frtLhB: 0, frtRhB: 0, rrLhA: 0, rrRhA: 0, rrLhB: 0, rrRhB: 0 }
    ],
    // 블록 16: 불량소재구분 (Section A / B / C 3단면)
    defectSectionAbc: [
      { id: "dsabc_1", name: "길이 미달 (Length Bad)", secA: 0, secB: 1, secC: 0 },
      { id: "dsabc_2", name: "와이어 노출 (Wire exposure)", secA: 0, secB: 0, secC: 0 },
      { id: "dsabc_3", name: "단컷팅 (Step cutting)", secA: 1, secB: 0, secC: 0 }
    ],
    // 블록 9: 작업시간 및 생산량
    workTimeOutput: [
      { id: "wto_1", division: "FRT LH", startA: "08:00", finishA: "12:00", qtyA: 180, startB: "13:00", finishB: "17:00", qtyB: 175 },
      { id: "wto_2", division: "FRT RH", startA: "08:00", finishA: "12:00", qtyA: 180, startB: "13:00", finishB: "17:00", qtyB: 178 },
      { id: "wto_3", division: "RR LH", startA: "08:00", finishA: "12:00", qtyA: 170, startB: "13:00", finishB: "17:00", qtyB: 168 },
      { id: "wto_4", division: "RR RH", startA: "08:00", finishA: "12:00", qtyA: 170, startB: "13:00", finishB: "17:00", qtyB: 170 }
    ],
    remarks: "정치 절단 칼날 상태 양호. 단컷팅 치수 기준치 이내 전수 검사 완료."
  },
  {
    id: "REPORT_JOINT",
    name: "조인트(사출) 가공일보",
    badge: "사출 성형 & 공정불량",
    category: "JOINT",
    desc: "사진 1, 4, 5, 6, 7 조합 - 조인트 재료, 4개존 사출온도, 사출조건, 10대 공정불량 종합 매트릭스",
    title: "조인트 사출 성형 작업 일보",
    subTitle: "▣ 공정명 : G/RUN 코너 조인트 사출 성형",
    formNo: "703-01(REV.2)",
    companyName: "(주)오륙",
    carModel: "JA",
    partName: "G/RUN (FRT / RR)",
    targetQty: 350,
    orderQty: 350,
    workerName: "박조인트",
    workDate: new Date().toISOString().slice(0, 10),
    shift: "주간",
    startTime: "08:00",
    finishTime: "17:00",
    activeBlocks: {
      basicInfo: true,
      workTimeOutput: false,
      specsCutting: false,
      stepCuttingFrt: false,
      stepCuttingRr: false,
      subMaterialLot: false,
      defectMaterialMatrix: false,
      defectSectionAbc: false,
      jointMaterial: true,
      injectionTemp: true,
      injectionCondition: true,
      jointDefectMatrix: true,
      drawingSpecCheck: false,
      rightAngleMatrix: false,
      frtRightAngleDefects: false,
      remarks: true,
      bladeReplacementBlock: true,
      moldShotCountBlock: true,
      downtimeDefectPanel: true
    },
    jointMaterial: {
      gradeName: "SJ-4004B (EPDM)",
      lotNo: "2026.10.15-M02"
    },
    injectionTemps: [
      { id: "t1", lineType: "Sett'g", machine: "Injection A", nozzle: "220℃", cyl1: "215℃", cyl2: "210℃", cyl3: "205℃" },
      { id: "t2", lineType: "Sett'g", machine: "Injection B", nozzle: "220℃", cyl1: "215℃", cyl2: "210℃", cyl3: "205℃" },
      { id: "t3", lineType: "Sett'g", machine: "Injection RR", nozzle: "215℃", cyl1: "210℃", cyl2: "205℃", cyl3: "200℃" },
      { id: "t4", lineType: "Actual", machine: "Injection A", nozzle: "221℃", cyl1: "216℃", cyl2: "211℃", cyl3: "206℃" },
      { id: "t5", lineType: "Actual", machine: "Injection B", nozzle: "219℃", cyl1: "214℃", cyl2: "209℃", cyl3: "204℃" },
      { id: "t6", lineType: "Actual", machine: "Injection RR", nozzle: "215℃", cyl1: "211℃", cyl2: "205℃", cyl3: "201℃" }
    ],
    injectionConditions: [
      { id: "ic_1", name: "거리 (Distance)", spec: "125 mm", startVal: "125", halfVal: "125", finishVal: "125" },
      { id: "ic_2", name: "속도 (Speed)", spec: "45 mm/s", startVal: "45", halfVal: "45", finishVal: "45" },
      { id: "ic_3", name: "압력 (Press)", spec: "140 bar", startVal: "140", halfVal: "139", finishVal: "140" },
      { id: "ic_4", name: "시간 (Time)", spec: "18.5 sec", startVal: "18.5", halfVal: "18.5", finishVal: "18.6" }
    ],
    jointDefects: [
      { name: "떨어짐 (Split)", frtA: 0, frtB: 1, frtC: 0, rrA: 0, rrB: 0, reworkFrt: 1, reworkRr: 0, processFrt: 0, processRr: 0 },
      { name: "양부족 (Short shot)", frtA: 0, frtB: 0, frtC: 0, rrA: 0, rrB: 0, reworkFrt: 0, reworkRr: 0, processFrt: 0, processRr: 0 },
      { name: "밀림 (Push)", frtA: 1, frtB: 0, frtC: 0, rrA: 0, rrB: 0, reworkFrt: 1, reworkRr: 0, processFrt: 0, processRr: 0 },
      { name: "단차 (Step)", frtA: 0, frtB: 0, frtC: 0, rrA: 1, rrB: 0, reworkFrt: 0, reworkRr: 1, processFrt: 0, processRr: 0 },
      { name: "기포 (Bubble)", frtA: 0, frtB: 0, frtC: 0, rrA: 0, rrB: 0, reworkFrt: 0, reworkRr: 0, processFrt: 0, processRr: 0 },
      { name: "씹힘 (Dents)", frtA: 0, frtB: 0, frtC: 0, rrA: 0, rrB: 0, reworkFrt: 0, reworkRr: 0, processFrt: 0, processRr: 0 },
      { name: "오염 (Contamination)", frtA: 0, frtB: 0, frtC: 0, rrA: 0, rrB: 0, reworkFrt: 0, reworkRr: 0, processFrt: 0, processRr: 0 },
      { name: "삽입불량 (Bad insert)", frtA: 0, frtB: 0, frtC: 0, rrA: 0, rrB: 0, reworkFrt: 0, reworkRr: 0, processFrt: 0, processRr: 0 },
      { name: "수축 (Sink mark)", frtA: 0, frtB: 0, frtC: 0, rrA: 0, rrB: 0, reworkFrt: 0, reworkRr: 0, processFrt: 0, processRr: 0 },
      { name: "기타 (The others)", frtA: 0, frtB: 0, frtC: 0, rrA: 0, rrB: 0, reworkFrt: 0, reworkRr: 0, processFrt: 0, processRr: 0 }
    ],
    remarks: "사출 온도 및 프레스 압력 조건 안정적 유지됨. 리워크 조인트 3건 즉시 재작업 조치."
  },
  {
    id: "REPORT_RIGHT_ANGLE",
    name: "완제품 직각검사 일보",
    badge: "완제품 검사 & 호기별",
    category: "INSPECTION",
    desc: "사진 13, 14, 17 조합 - LH/RH 2/3호기 종합 매트릭스 및 FRT 직각검사 불량 집계표 (립컷팅 누락 반영)",
    title: "직각검사 일보",
    subTitle: "▣ 공정명 : 완제품 직각검사 및 최종 외관 전수검사",
    formNo: "706-01(REV.3)",
    companyName: "(주)오륙",
    carModel: "JA",
    partName: "G/RUN (FRT & RR)",
    targetQty: 350,
    orderQty: 350,
    workerName: "이검사",
    workDate: new Date().toISOString().slice(0, 10),
    shift: "주간",
    startTime: "08:00",
    finishTime: "17:00",
    activeBlocks: {
      basicInfo: true,
      workTimeOutput: false,
      specsCutting: false,
      stepCuttingFrt: false,
      stepCuttingRr: false,
      subMaterialLot: false,
      defectMaterialMatrix: false,
      defectSectionAbc: false,
      jointMaterial: false,
      injectionTemp: false,
      injectionCondition: false,
      jointDefectMatrix: false,
      drawingSpecCheck: false,
      rightAngleMatrix: true,
      frtRightAngleDefects: true,
      remarks: true,
      bladeReplacementBlock: true,
      moldShotCountBlock: true,
      downtimeDefectPanel: true
    },
    machines: [
      { id: "m_lh2", name: "LH 2호기", workTime: "08:00 ~ 17:00", inspectQty: 320, goodQty: 312, reworkQty: 6, scrapQty: 2 },
      { id: "m_lh3", name: "LH 3호기", workTime: "08:00 ~ 17:00", inspectQty: 310, goodQty: 304, reworkQty: 5, scrapQty: 1 },
      { id: "m_rh2", name: "RH 2호기", workTime: "08:00 ~ 17:00", inspectQty: 330, goodQty: 324, reworkQty: 4, scrapQty: 2 },
      { id: "m_rh3", name: "RH 3호기", workTime: "08:00 ~ 17:00", inspectQty: 305, goodQty: 299, reworkQty: 5, scrapQty: 1 }
    ],
    extrusionDefects: [
      { id: "ed_1", name: "스코치", lh2: 0, lh3: 0, rh2: 0, rh3: 0 },
      { id: "ed_2", name: "외면 흠", lh2: 1, lh3: 1, rh2: 1, rh3: 0 },
      { id: "ed_3", name: "오 염", lh2: 0, lh3: 0, rh2: 0, rh3: 0 },
      { id: "ed_4", name: "코팅 불량", lh2: 0, lh3: 0, rh2: 0, rh3: 0 },
      { id: "ed_5", name: "단면 불량", lh2: 0, lh3: 0, rh2: 0, rh3: 0 },
      { id: "ed_6", name: "기타 ( )", lh2: 0, lh3: 0, rh2: 0, rh3: 0 }
    ],
    jointDefectsList: [
      { id: "jd_1", name: "떨어짐", lh2: 1, lh3: 0, rh2: 0, rh3: 1 },
      { id: "jd_2", name: "양부족", lh2: 0, lh3: 0, rh2: 0, rh3: 0 },
      { id: "jd_3", name: "밀 림", lh2: 1, lh3: 1, rh2: 0, rh3: 0 },
      { id: "jd_4", name: "단 차", lh2: 0, lh3: 0, rh2: 1, rh3: 0 },
      { id: "jd_5", name: "기 포", lh2: 0, lh3: 0, rh2: 0, rh3: 0 },
      { id: "jd_6", name: "씹 힘", lh2: 0, lh3: 0, rh2: 0, rh3: 0 },
      { id: "jd_7", name: "삽입 불량", lh2: 0, lh3: 0, rh2: 0, rh3: 0 },
      { id: "jd_8", name: "수 축", lh2: 0, lh3: 0, rh2: 0, rh3: 0 },
      { id: "jd_9", name: "기타 ( )", lh2: 0, lh3: 0, rh2: 0, rh3: 0 }
    ],
    postDefectsList: [
      { id: "pd_1", name: "길이 불량", lh2: 0, lh3: 0, rh2: 0, rh3: 0 },
      { id: "pd_2", name: "외면 오염", lh2: 1, lh3: 0, rh2: 0, rh3: 0 },
      { id: "pd_3", name: "과사상", lh2: 0, lh3: 0, rh2: 0, rh3: 0 },
      { id: "pd_4", name: "미사상", lh2: 1, lh3: 1, rh2: 0, rh3: 0 },
      { id: "pd_5", name: "마킹 누락", lh2: 0, lh3: 0, rh2: 0, rh3: 0 },
      { id: "pd_6", name: "PAD 누락", lh2: 0, lh3: 0, rh2: 0, rh3: 0 },
      { id: "pd_7", name: "PROTECT FILM 누락", lh2: 0, lh3: 0, rh2: 0, rh3: 0 },
      { id: "pd_8", name: "본드 오염", lh2: 0, lh3: 0, rh2: 0, rh3: 0 },
      { id: "pd_9", name: "기타 ( )", lh2: 0, lh3: 0, rh2: 0, rh3: 0 }
    ],
    // 블록 17: FRT 직각검사 불량 집계표 (사진 17 실물 100% 매핑)
    frtRightAngleDefects: [
      { id: "frt_d1", name: "립컷팅 누락", frtLh: 0, frtRh: 0 },
      { id: "frt_d2", name: "패드 누락", frtLh: 1, frtRh: 0 },
      { id: "frt_d3", name: "외면 오염", frtLh: 0, frtRh: 1 },
      { id: "frt_d4", name: "미사상", frtLh: 1, frtRh: 0 },
      { id: "frt_d5", name: "과사상", frtLh: 0, frtRh: 0 },
      { id: "frt_d6", name: "조인트 씹힘", frtLh: 0, frtRh: 0 },
      { id: "frt_d7", name: "조인트 기포", frtLh: 0, frtRh: 0 },
      { id: "frt_d8", name: "조인트 미성형", frtLh: 0, frtRh: 0 },
      { id: "frt_d9", name: "와이어 노출", frtLh: 0, frtRh: 0 }
    ],
    remarks: "전 호기 직각 형합성 및 외관 전수검사 완료. 불량률 1.2%로 목표(2.0% 이하) 달성."
  },
  {
    id: "REPORT_DRAWING_SPEC",
    name: "도면 치수 & 패드 검사일보",
    badge: "도면 A/B/D & 패드 규격",
    category: "INSPECTION",
    desc: "사진 12, 11 조합 - 도면 다이어그램 A, B, D 위치 대조 및 중요치수(482, 658) & 스폰지패드(5T*5W*60L)",
    title: "중요 치수 및 부자재(스폰지패드) 검사 일보",
    subTitle: "▣ 공정명 : 도면 치수 검사 및 부자재 부착 검사 (LH / RH)",
    formNo: "706-02(REV.2)",
    companyName: "(주)오륙",
    carModel: "JA",
    partName: "G/RUN (RR LH)",
    targetQty: 350,
    orderQty: 350,
    workerName: "정품질",
    workDate: new Date().toISOString().slice(0, 10),
    shift: "주간",
    startTime: "08:00",
    finishTime: "17:00",
    activeBlocks: {
      basicInfo: true,
      workTimeOutput: false,
      specsCutting: false,
      stepCuttingFrt: false,
      stepCuttingRr: false,
      subMaterialLot: true,
      defectMaterialMatrix: false,
      defectSectionAbc: false,
      jointMaterial: false,
      injectionTemp: false,
      injectionCondition: false,
      jointDefectMatrix: false,
      drawingSpecCheck: true,
      rightAngleMatrix: false,
      frtRightAngleDefects: false,
      remarks: true,
      bladeReplacementBlock: true,
      moldShotCountBlock: true,
      downtimeDefectPanel: true
    },
    drawingSpecs: [
      { id: "ds_1", section: "RR LH A", spec: "482 ± 3 mm", startVal: "482.5", halfVal: "482.0", finishVal: "481.8" },
      { id: "ds_2", section: "RR LH B", spec: "658 ± 5 mm", startVal: "658.0", halfVal: "657.5", finishVal: "659.0" },
      { id: "ds_3", section: "스폰지패드 규격", spec: "5T * 5W * 60L", startVal: "적합", halfVal: "적합", finishVal: "적합" }
    ],
    subMaterialLot: "패드 5T LOT : 2026.10.19-PD05",
    remarks: "도면 위치 A, B, D 치수 검사 결과 전 항목 공차 허용범위 만족."
  }
];

export const LEGO_BLOCK_SWITCH_CATALOG = [
  { key: "basicInfo", label: "작업 기본정보 (차종/품명/공정명/작업자)", badge: "사진 8" },
  { key: "workTimeOutput", label: "작업시간 및 생산실적 (FRT/RR)", badge: "사진 9" },
  { key: "specsCutting", label: "정치 절단 길이 & LOT (881/608/582)", badge: "사진 15" },
  { key: "stepCuttingFrt", label: "단컷팅 치수 FRT (49mm, 45mm)", badge: "사진 2" },
  { key: "stepCuttingRr", label: "단컷팅 치수 RR (40mm, 39mm)", badge: "사진 3" },
  { key: "subMaterialLot", label: "부자재 LOT NO. (패드 5T)", badge: "사진 11" },
  { key: "defectMaterialMatrix", label: "불량소재구분 8열 (압출/공정간)", badge: "사진 10" },
  { key: "defectSectionAbc", label: "불량소재 Section A/B/C 3단면", badge: "사진 16" },
  { key: "timeAndOutput", label: "조인트 작업자 / 시간 / 생산수량", badge: "사진 1" },
  { key: "jointMaterial", label: "조인트 재료 (재료명/LOT)", badge: "사진 4" },
  { key: "injectionTemp", label: "사출온도 (Sett'g / Actual)", badge: "사진 5" },
  { key: "injectionCondition", label: "사출조건 (거리/속도/압력/시간)", badge: "사진 6" },
  { key: "jointDefectMatrix", label: "조인트 10대 공정불량 매트릭스", badge: "사진 7" },
  { key: "drawingSpecCheck", label: "도면 치수 & 패드 검사 (A/B/D)", badge: "사진 12" },
  { key: "rightAngleMatrix", label: "완제품 직각검사 종합 매트릭스", badge: "사진 13, 14" },
  { key: "frtRightAngleDefects", label: "FRT 직각검사 불량 집계표 (립컷팅)", badge: "사진 17" },
  { key: "remarks", label: "특기 사항 및 조치사항", badge: "공통" },
  { key: "bladeReplacementBlock", label: "칼날교체주기 관리 블록 (횟수설정/교체리셋)", badge: "공통" },
  { key: "moldShotCountBlock", label: "금형숏트수관리 블록 (습합·검증완료/리셋)", badge: "공통" },
  { key: "downtimeDefectPanel", label: "비가동 및 부적합품 발생내역 (조치전·후 사진)", badge: "공통" }
];

export const DEFAULT_BLOCK_ORDER = LEGO_BLOCK_SWITCH_CATALOG.map((b) => b.key);

export const LegoWorkReportBuilder = ({
  initialPresetId = "REPORT_CUTTING",
  initialWorkerName = "",
  initialWorkDate = "",
  initialTemplateData = null,
  onSaveWorkReport,
  onSaveToTemplateManager,
  onNavigateToCatalog,
  onDeleteWorkReport = null,
  isEmbedded = false,
  isWorkerRecordingMode = false,
  currentLang: propLang = null
}) => {
  // Current active report configuration
  const [currentReport, setCurrentReport] = useState(() => {
    // 🌟 작업자 기록 모드(isWorkerRecordingMode)이고 initialTemplateData가 제공된 경우:
    // 전역 브라우저 캐시("oruk_custom_lego_report_v2") 대신 전달된 작업자의 지정 템플릿/이전 작성 데이터를 최우선 로드하여
    // 다른 작업자의 이전 입력 내용과 섞이지 않도록 방지합니다.
    if (isWorkerRecordingMode && initialTemplateData?.legoConfig) {
      const cfg = JSON.parse(JSON.stringify(initialTemplateData.legoConfig));
      if (initialWorkerName) cfg.workerName = initialWorkerName;
      if (initialWorkDate) cfg.workDate = initialWorkDate;
      if (initialTemplateData.title) cfg.title = initialTemplateData.title;
      if (initialTemplateData.carModel) cfg.carModel = initialTemplateData.carModel;
      if (initialTemplateData.partName) cfg.partName = initialTemplateData.partName;
      if (initialTemplateData.processName) cfg.processName = initialTemplateData.processName;
      if (initialTemplateData.targetQty) cfg.targetQty = initialTemplateData.targetQty;
      if (initialTemplateData.orderQty) cfg.orderQty = initialTemplateData.orderQty;
      if (!cfg.targetQty) cfg.targetQty = cfg.orderQty || 350;
      if (!cfg.orderQty) cfg.orderQty = cfg.targetQty || 350;
      return cfg;
    }

    try {
      const saved = localStorage.getItem("oruk_custom_lego_report_v2");
      if (saved && !isWorkerRecordingMode) {
        const parsed = JSON.parse(saved);
        if (initialWorkerName) parsed.workerName = initialWorkerName;
        if (initialWorkDate) parsed.workDate = initialWorkDate;
        if (
          parsed.title === "소재 준비 작업 일보 (정치절단 & 단컷팅)" ||
          parsed.title === "소재 준비 작업 일보" ||
          parsed.title === "소재준비 작업일보"
        ) {
          parsed.title = "소재준비작업일보";
        }
        if (!parsed.processName) {
          parsed.processName = "소재준비";
        }
        parsed.activeBlocks = {
          bladeReplacementBlock: true,
          moldShotCountBlock: true,
          downtimeDefectPanel: true,
          ...(parsed.activeBlocks || {})
        };
        return parsed;
      }
    } catch {}
    const base = PRESET_REPORTS.find((p) => p.id === initialPresetId) || PRESET_REPORTS[0];
    const clone = JSON.parse(JSON.stringify(base));
    if (initialWorkerName) clone.workerName = initialWorkerName;
    if (initialWorkDate) clone.workDate = initialWorkDate;
    return clone;
  });

  const [viewMode, setViewMode] = useState("DIGITAL"); // 'DIGITAL' | 'PRINT_A4'
  const [showPhotoRefModal, setShowPhotoRefModal] = useState(false);
  const [photoModalTab, setPhotoModalTab] = useState("ALL"); // 'ALL' | 'UPLOAD'
  const [customBlocks, setCustomBlocks] = useState(() => getLocalCustomLegoBlocks());
  const [savedTemplates, setSavedTemplates] = useState(() => getLocalWorkReportTemplates());
  const [selectedPhotoFilter, setSelectedPhotoFilter] = useState("ALL");
  const [toastMsg, setToastMsg] = useState("");
  const [appliedTemplateBanner, setAppliedTemplateBanner] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 🎯 Block Selection & In-App Inspector State
  const [selectedBlockKey, setSelectedBlockKey] = useState("specsCutting");
  const [isBlockEditorOpen, setIsBlockEditorOpen] = useState(false);
  const [editingBlockKey, setEditingBlockKey] = useState("specsCutting");
  const [draggedBlockIdx, setDraggedBlockIdx] = useState(null);
  const [dragOverBlockIdx, setDragOverBlockIdx] = useState(null);
  // Custom block table column drag-and-drop state
  const [draggedCustomCol, setDraggedCustomCol] = useState(null); // { bKey, colIdx }
  const [dragOverCustomCol, setDragOverCustomCol] = useState(null); // { bKey, colIdx }

  // Subscribe to custom uploaded/analyzed Lego blocks & DB saved templates
  useEffect(() => {
    const unsub = subscribeCustomLegoBlocks((list) => {
      if (Array.isArray(list)) {
        setCustomBlocks(list);
      }
    });
    const unsubTemplates = subscribeWorkReportTemplates((list) => {
      if (Array.isArray(list)) {
        setSavedTemplates(list);
      }
    });
    const handleCustomEvent = (e) => {
      if (Array.isArray(e.detail)) {
        setCustomBlocks(e.detail);
      } else {
        setCustomBlocks(getLocalCustomLegoBlocks());
      }
    };
    const handleTemplatesEvent = (e) => {
      if (Array.isArray(e.detail)) {
        setSavedTemplates(e.detail);
      } else {
        setSavedTemplates(getLocalWorkReportTemplates());
      }
    };
    window.addEventListener("custom-lego-blocks-updated", handleCustomEvent);
    window.addEventListener("work-report-templates-updated", handleTemplatesEvent);
    return () => {
      unsub();
      unsubTemplates();
      window.removeEventListener("custom-lego-blocks-updated", handleCustomEvent);
      window.removeEventListener("work-report-templates-updated", handleTemplatesEvent);
    };
  }, []);

  // Auto-persist currentReport to localStorage whenever it changes so no assembled blocks are ever lost
  useEffect(() => {
    try {
      localStorage.setItem("oruk_custom_lego_report_v2", JSON.stringify(currentReport));
    } catch (e) {
      console.warn("Auto-save currentReport quota warning:", e);
    }
  }, [currentReport]);

  // 🌐 현장 근로자 다국어(한국어, 영어, 베트남어, 태국어, 인도네시아어, 미얀마어 등) 실시간 번역
  const [currentLang, setCurrentLang] = useState(() => propLang || getCurrentWorkLogLanguage());

  useEffect(() => {
    if (propLang) {
      setCurrentLang(propLang);
    }
  }, [propLang]);

  useEffect(() => {
    const handleLangChange = (e) => {
      if (e?.detail?.lang) {
        setCurrentLang(e.detail.lang);
      }
    };
    window.addEventListener("factory_language_changed", handleLangChange);
    return () => window.removeEventListener("factory_language_changed", handleLangChange);
  }, []);

  const t = (term) => translateTerm(term, currentLang);

  // Combined catalog: standard blocks + saved custom photo-analyzed blocks
  const combinedSwitchCatalog = useMemo(() => {
    const mergedCustomMap = new Map();
    customBlocks.forEach((cb) => {
      const k = cb.key || cb.id;
      if (k) mergedCustomMap.set(k, cb);
    });
    if (Array.isArray(currentReport.customBlocks)) {
      currentReport.customBlocks.forEach((cb) => {
        const k = cb.key || cb.id;
        if (k && !mergedCustomMap.has(k)) mergedCustomMap.set(k, cb);
      });
    }
    const allCustomList = Array.from(mergedCustomMap.values());
    const customSwitchItems = allCustomList.map((cb, idx) => ({
      key: cb.key || cb.id,
      label: cb.label || cb.title || `사진분석 블록 ${idx + 1}`,
      badge: cb.badge || `사진 ${18 + idx}`,
      isCustom: true,
      customData: cb
    }));
    return [...LEGO_BLOCK_SWITCH_CATALOG, ...customSwitchItems];
  }, [customBlocks, currentReport.customBlocks]);

  // Ordered block switches (persisted in currentReport.blockOrder)
  const orderedBlockItems = useMemo(() => {
    const savedOrder = Array.isArray(currentReport.blockOrder) ? currentReport.blockOrder : [];
    const seen = new Set();
    const list = [];
    savedOrder.forEach((key) => {
      const found = combinedSwitchCatalog.find((b) => b.key === key);
      if (found && !seen.has(key)) {
        seen.add(key);
        list.push(found);
      }
    });
    combinedSwitchCatalog.forEach((b) => {
      if (!seen.has(b.key)) {
        seen.add(b.key);
        list.push(b);
      }
    });
    return list;
  }, [currentReport.blockOrder, combinedSwitchCatalog]);

  const handleMoveBlockOrder = (fromIdx, direction) => {
    const toIdx = fromIdx + direction;
    if (toIdx < 0 || toIdx >= orderedBlockItems.length) return;
    const nextKeys = orderedBlockItems.map((b) => b.key);
    const [moved] = nextKeys.splice(fromIdx, 1);
    nextKeys.splice(toIdx, 0, moved);
    const movedLabel = orderedBlockItems[fromIdx]?.label || moved;
    setCurrentReport((prev) => ({
      ...prev,
      blockOrder: nextKeys
    }));
    showToast(`↕️ [${movedLabel}] 블록 순서가 ${toIdx + 1}번째로 변경되었습니다.`);
  };

  const handleBlockDrop = (dropIdx) => {
    if (draggedBlockIdx === null || draggedBlockIdx === dropIdx) {
      setDraggedBlockIdx(null);
      setDragOverBlockIdx(null);
      return;
    }
    const nextKeys = orderedBlockItems.map((b) => b.key);
    const movedLabel = orderedBlockItems[draggedBlockIdx]?.label || "";
    const [moved] = nextKeys.splice(draggedBlockIdx, 1);
    nextKeys.splice(dropIdx, 0, moved);
    setDraggedBlockIdx(null);
    setDragOverBlockIdx(null);
    setCurrentReport((prev) => ({
      ...prev,
      blockOrder: nextKeys
    }));
    showToast(`✨ 드래그 앤 드롭 완료! [${movedLabel}] → ${dropIdx + 1}번째 순서로 배치되었습니다.`);
  };

  const handleResetBlockOrder = () => {
    setCurrentReport((prev) => ({
      ...prev,
      blockOrder: [...DEFAULT_BLOCK_ORDER]
    }));
    showToast("🔄 17대 레고 블록 순서가 기본 순서로 초기화되었습니다.");
  };

  // 💾 Save to Catalog Modal State
  const [isSaveCatalogModalOpen, setIsSaveCatalogModalOpen] = useState(false);
  const [catalogMeta, setCatalogMeta] = useState({
    title: "",
    categoryId: "MATERIAL_PREP",
    carModel: "",
    partName: "",
    processName: ""
  });

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3000);
  };

  // Hydrate from initialTemplateData if provided by Template Manager or Admin Assignment
  useEffect(() => {
    if (initialTemplateData) {
      if (initialTemplateData.legoConfig) {
        const cfg = JSON.parse(JSON.stringify(initialTemplateData.legoConfig));
        if (initialTemplateData.title) cfg.title = initialTemplateData.title;
        if (initialTemplateData.carModel) cfg.carModel = initialTemplateData.carModel;
        if (initialTemplateData.partName) cfg.partName = initialTemplateData.partName;
        if (initialTemplateData.processName) cfg.processName = initialTemplateData.processName;
        if (initialWorkerName) cfg.workerName = initialWorkerName;
        if (initialWorkDate) cfg.workDate = initialWorkDate;
        if (initialTemplateData.targetQty) cfg.targetQty = initialTemplateData.targetQty;
        if (initialTemplateData.orderQty) cfg.orderQty = initialTemplateData.orderQty;
        if (!cfg.targetQty) cfg.targetQty = cfg.orderQty || 350;
        if (!cfg.orderQty) cfg.orderQty = cfg.targetQty || 350;
        if (Array.isArray(cfg.customBlocks) && cfg.customBlocks.length > 0) {
          setCustomBlocks((prev) => {
            const map = new Map();
            prev.forEach((b) => map.set(b.key || b.id, b));
            cfg.customBlocks.forEach((b) => map.set(b.key || b.id, b));
            return Array.from(map.values());
          });
        }
        setCurrentReport(cfg);
      } else {
        setCurrentReport((prev) => {
          const clone = JSON.parse(JSON.stringify(prev));
          if (initialTemplateData.title) clone.title = initialTemplateData.title;
          if (initialTemplateData.subTitle) clone.subTitle = initialTemplateData.subTitle;
          if (initialTemplateData.carModel) clone.carModel = initialTemplateData.carModel;
          if (initialTemplateData.partName) clone.partName = initialTemplateData.partName;
          if (initialTemplateData.processName) clone.processName = initialTemplateData.processName;
          if (initialTemplateData.formNo) clone.formNo = initialTemplateData.formNo;
          if (initialTemplateData.companyName) clone.companyName = initialTemplateData.companyName;
          if (initialWorkerName) clone.workerName = initialWorkerName;
          if (initialWorkDate) clone.workDate = initialWorkDate;
          if (initialTemplateData.targetQty) clone.targetQty = initialTemplateData.targetQty;
          if (initialTemplateData.orderQty) clone.orderQty = initialTemplateData.orderQty;
          if (!clone.targetQty) clone.targetQty = clone.orderQty || 350;
          if (!clone.orderQty) clone.orderQty = clone.targetQty || 350;
          if (initialTemplateData.specs && initialTemplateData.specs.length > 0) {
            clone.specsCutting = initialTemplateData.specs.map((sp, idx) => ({
              id: sp.id || `c_${idx}`,
              section: sp.section || sp.name || String.fromCharCode(65 + idx),
              spec1: sp.frtSpec || sp.spec || "600 ± 5mm",
              start1: String(sp.frtTarget || 600),
              half1: String(sp.frtTarget || 600),
              finish1: String(sp.frtTarget || 600),
              lotStart: sp.lotStart || `LOT-${sp.section || String.fromCharCode(65 + idx)}-01`,
              lotHalf: sp.lotHalf || `LOT-${sp.section || String.fromCharCode(65 + idx)}-01`,
              lotFinish: sp.lotFinish || `LOT-${sp.section || String.fromCharCode(65 + idx)}-01`,
              lotNo: `LOT-${sp.section || String.fromCharCode(65 + idx)}-01`
            }));
          }
          return clone;
        });
      }
      setAppliedTemplateBanner(initialTemplateData);
      if (!isWorkerRecordingMode) {
        showToast(`⚡ [${initialTemplateData.title || initialTemplateData.carModel}] 템플릿이 작업일보에 적용되었습니다!`);
      }
    }
  }, [initialTemplateData, initialWorkerName, initialWorkDate, isWorkerRecordingMode]);

  // Load a Preset
  const handleLoadPreset = (presetId) => {
    const found = PRESET_REPORTS.find((p) => p.id === presetId);
    if (!found) return;
    if (confirm(`'${found.name}' 양식으로 전환하시겠습니까?\n현재 입력 중인 내용이 선택한 템플릿의 기본 규격으로 재설정됩니다.`)) {
      const clone = JSON.parse(JSON.stringify(found));
      if (currentReport.workerName) clone.workerName = currentReport.workerName;
      if (currentReport.workDate) clone.workDate = currentReport.workDate;
      setCurrentReport(clone);
      showToast(`⚡ '${found.name}' 양식이 적용되었습니다.`);
    }
  };

  // Toggle active block
  const handleToggleBlock = (blockKey) => {
    const normalizedKey = blockKey === "rightAngleHeader" ? "rightAngleMatrix" : blockKey;
    setCurrentReport((prev) => ({
      ...prev,
      activeBlocks: {
        ...prev.activeBlocks,
        [normalizedKey]: !prev.activeBlocks?.[normalizedKey]
      }
    }));
  };

  // Build complete snapshot of assembled Lego blocks so nothing is ever omitted on save
  const buildFullLegoConfig = (overrides = {}) => {
    const mergedCustomMap = new Map();
    customBlocks.forEach((cb) => {
      const k = cb.key || cb.id;
      if (k) mergedCustomMap.set(k, cb);
    });
    if (Array.isArray(currentReport.customBlocks)) {
      currentReport.customBlocks.forEach((cb) => {
        const k = cb.key || cb.id;
        if (k && !mergedCustomMap.has(k)) mergedCustomMap.set(k, cb);
      });
    }
    const allCustomBlocks = Array.from(mergedCustomMap.values());
    const mergedCustomBlockTables = { ...(currentReport.customBlockTables || {}) };
    const enrichedCustomBlocks = allCustomBlocks.map((cb) => {
      const bKey = cb.key || cb.id;
      const tbl = mergedCustomBlockTables[bKey];
      const columns =
        Array.isArray(tbl?.columns) && tbl.columns.length > 0
          ? tbl.columns
          : Array.isArray(cb.columns) && cb.columns.length > 0
          ? cb.columns
          : ["항목 1", "항목 2", "항목 3"];
      const rows = Array.isArray(tbl?.rows)
        ? tbl.rows
        : Array.isArray(cb.rows)
        ? cb.rows
        : [["", "", ""]];
      mergedCustomBlockTables[bKey] = { columns, rows };
      return {
        ...cb,
        id: bKey,
        key: bKey,
        columns,
        rows
      };
    });

    return {
      ...currentReport,
      ...overrides,
      blockOrder: orderedBlockItems.map((b) => b.key),
      activeBlocks: { ...(currentReport.activeBlocks || {}) },
      customBlockTables: mergedCustomBlockTables,
      customBlocks: enrichedCustomBlocks,
      downtimeEvents: currentReport.downtimeEvents || []
    };
  };

  // Update Field helper
  const handleUpdateField = (key, value) => {
    setCurrentReport((prev) => ({
      ...prev,
      [key]: value
    }));
  };

  // Select a block & smooth scroll into view
  const handleSelectBlock = (key) => {
    setSelectedBlockKey(key);
    if (!currentReport.activeBlocks?.[key]) {
      setCurrentReport((prev) => ({
        ...prev,
        activeBlocks: {
          ...prev.activeBlocks,
          [key]: true
        }
      }));
    }
    setTimeout(() => {
      const el = document.getElementById(`block_container_${key}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 80);
  };

  // Open In-App Block Editor Modal for specific block
  const handleOpenBlockEditor = (key) => {
    setSelectedBlockKey(key);
    setEditingBlockKey(key);
    setIsBlockEditorOpen(true);
  };

  // Open Save-to-Catalog Modal
  const handleOpenSaveCatalogModal = () => {
    setCatalogMeta({
      title: currentReport.title || "소재준비작업일보",
      categoryId: "MATERIAL_PREP",
      carModel: currentReport.carModel || "JA",
      partName: currentReport.partName || "G/RUN",
      processName: currentReport.processName || "소재준비"
    });
    setIsSaveCatalogModalOpen(true);
  };

  // Confirm Save to Template Catalog
  const handleConfirmSaveCatalog = async () => {
    try {
      const curCat = REPORT_MAJOR_CATEGORIES.find((c) => c.id === catalogMeta.categoryId) || REPORT_MAJOR_CATEGORIES[1];
      const fullLegoConfig = buildFullLegoConfig({
        title: catalogMeta.title || currentReport.title || "소재준비작업일보",
        carModel: catalogMeta.carModel || currentReport.carModel || "JA",
        partName: catalogMeta.partName || currentReport.partName || "G/RUN",
        processName: catalogMeta.processName || currentReport.processName || "소재준비"
      });
      const tplPayload = {
        id: `tpl_lego_${Date.now()}`,
        categoryId: catalogMeta.categoryId,
        categoryName: curCat.name,
        title: fullLegoConfig.title,
        subTitle: "",
        carModel: fullLegoConfig.carModel,
        partName: fullLegoConfig.partName,
        processName: fullLegoConfig.processName,
        subProcess: "",
        divisionType: "SECTION_ABC",
        formNo: currentReport.formNo || "705-02(REV.4)",
        companyName: currentReport.companyName || "(주)오륙",
        isLegoModular: true,
        isDatabaseBacked: true,
        legoConfig: fullLegoConfig,
        blocks: {
          timeAndQty: Boolean(fullLegoConfig.activeBlocks?.workTimeOutput || fullLegoConfig.activeBlocks?.timeAndOutput),
          specAndLot: Boolean(
            fullLegoConfig.activeBlocks?.specsCutting ||
              fullLegoConfig.activeBlocks?.stepCuttingFrt ||
              fullLegoConfig.activeBlocks?.stepCuttingRr ||
              fullLegoConfig.activeBlocks?.drawingSpecCheck ||
              fullLegoConfig.activeBlocks?.subMaterialLot
          ),
          machineCondition: Boolean(
            fullLegoConfig.activeBlocks?.injectionTemp ||
              fullLegoConfig.activeBlocks?.injectionCondition ||
              fullLegoConfig.activeBlocks?.jointMaterial
          ),
          defectMatrix: Boolean(
            fullLegoConfig.activeBlocks?.defectMaterialMatrix ||
              fullLegoConfig.activeBlocks?.defectSectionAbc ||
              fullLegoConfig.activeBlocks?.jointDefectMatrix ||
              fullLegoConfig.activeBlocks?.rightAngleMatrix ||
              fullLegoConfig.activeBlocks?.frtRightAngleDefects
          ),
          maintenance: Boolean(fullLegoConfig.activeBlocks?.remarks || fullLegoConfig.activeBlocks?.downtimeDefectPanel)
        },
        specs: (fullLegoConfig.specsCutting || []).map((s) => ({
          id: s.id,
          section: s.section,
          name: s.section,
          frtSpec: s.spec1,
          rrSpec: s.spec1,
          spec: s.spec1,
          startVal: s.start1,
          halfVal: s.half1,
          finishVal: s.finish1,
          lotStart: s.lotStart,
          lotHalf: s.lotHalf,
          lotFinish: s.lotFinish,
          lotNo: s.lotNo
        })),
        updatedAt: new Date().toISOString()
      };

      setCurrentReport(fullLegoConfig);
      await saveWorkReportTemplate(tplPayload);
      if (onSaveToTemplateManager) {
        onSaveToTemplateManager(tplPayload);
      }
      setIsSaveCatalogModalOpen(false);
      showToast(`🎉 [${tplPayload.title}] 양식이 5대 공정별 표준 보관함에 공식 저장되었습니다!`);
    } catch (err) {
      console.error("템플릿 저장 실패:", err);
      alert("템플릿 저장 중 오류가 발생했습니다: " + err.message);
    }
  };

  // Reusable Interactive Block Wrapper with Selection, Ordering, and Action Toolbar
  const renderBlockWrapper = (blockKey, blockTitle, children, options = {}) => {
    if (!currentReport.activeBlocks?.[blockKey]) return null;
    const isSelected = !isWorkerRecordingMode && selectedBlockKey === blockKey;
    const { canAddRow = false, onAddRow = null, customBadge = null } = options;
    const orderIdx = orderedBlockItems.findIndex((b) => b.key === blockKey);

    return (
      <div
        id={`block_container_${blockKey}`}
        style={{ order: orderIdx >= 0 ? orderIdx : 99 }}
        onClick={isWorkerRecordingMode ? undefined : () => setSelectedBlockKey(blockKey)}
        className={`rounded-3xl transition-all relative group ${
          isWorkerRecordingMode
            ? "p-3 sm:p-4 border border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 shadow-xs"
            : isSelected
            ? "ring-4 ring-indigo-500/90 ring-offset-2 dark:ring-offset-slate-900 shadow-2xl bg-indigo-50/20 dark:bg-indigo-950/20 border-2 border-indigo-500 p-3 sm:p-4 cursor-pointer"
            : "hover:ring-2 hover:ring-indigo-300 dark:hover:ring-indigo-700/60 p-2 sm:p-3 border border-slate-200/60 dark:border-slate-800/80 hover:border-indigo-300 cursor-pointer"
        }`}
      >
        {/* Interactive Block Top Bar (항상 직관적으로 노출되는 In-App 블록 편집 & 🗑️ 블록제거 버튼) */}
        <div className={`flex items-center justify-between p-2 sm:p-2.5 mb-3 rounded-2xl transition-all flex-wrap gap-2 ${
          isWorkerRecordingMode
            ? "bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200"
            : isSelected
            ? "bg-gradient-to-r from-indigo-600 via-indigo-700 to-indigo-800 text-white shadow-lg"
            : "bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-indigo-400"
        }`}>
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${isWorkerRecordingMode ? "bg-emerald-500" : isSelected ? "bg-cyan-300 animate-pulse" : "bg-indigo-500"}`}></span>
            <span className="text-xs sm:text-sm font-black tracking-tight flex items-center gap-1.5 flex-wrap">
              <span>{isWorkerRecordingMode ? "🧱 " : isSelected ? "📍 " : "🧱 "}{blockTitle}</span>
              {isWorkerRecordingMode && (
                <span className="text-[10px] px-2 py-0.5 rounded-full font-black bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300/60 dark:border-emerald-800">
                  🔒 {t("SPEC 고정 · 실적기록 전용")}
                </span>
              )}
              {customBadge && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  isSelected && !isWorkerRecordingMode ? "bg-white/20 text-cyan-200" : "bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300"
                }`}>
                  {customBadge}
                </span>
              )}
            </span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap print:hidden">
            {!isWorkerRecordingMode && orderIdx >= 0 && (
              <div className="flex items-center gap-0.5 mr-0.5">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMoveBlockOrder(orderIdx, -1);
                  }}
                  disabled={orderIdx === 0}
                  className={`px-1.5 py-1 rounded-lg text-[10px] font-black transition cursor-pointer disabled:opacity-30 ${
                    isSelected
                      ? "bg-white/15 hover:bg-white/25 text-white"
                      : "bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-200"
                  }`}
                  title="이 블록을 위로 이동"
                >
                  ▲
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMoveBlockOrder(orderIdx, 1);
                  }}
                  disabled={orderIdx === orderedBlockItems.length - 1}
                  className={`px-1.5 py-1 rounded-lg text-[10px] font-black transition cursor-pointer disabled:opacity-30 ${
                    isSelected
                      ? "bg-white/15 hover:bg-white/25 text-white"
                      : "bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-200"
                  }`}
                  title="이 블록을 아래로 이동"
                >
                  ▼
                </button>
              </div>
            )}

            {!isWorkerRecordingMode && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenBlockEditor(blockKey);
                }}
                className={`px-3 py-1.5 rounded-xl font-black text-xs flex items-center gap-1.5 shadow-sm transition active:scale-95 cursor-pointer ${
                  isSelected
                    ? "bg-white text-indigo-700 hover:bg-indigo-50"
                    : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/20"
                }`}
                title="이 블록의 세부 규격, 항목, 텍스트를 In-App 모달에서 편집"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>✏️ In-App 블록 편집</span>
              </button>
            )}

            {!isWorkerRecordingMode && canAddRow && onAddRow && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onAddRow();
                }}
                className={`px-2.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 shadow-sm transition active:scale-95 cursor-pointer ${
                  isSelected
                    ? "bg-indigo-500 hover:bg-indigo-400 text-white"
                    : "bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 text-slate-800 dark:text-slate-100"
                }`}
                title="행 / 항목 추가"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>행 추가</span>
              </button>
            )}

            {/* 🌟 우측 블록 내 블록제거 이모티콘 버튼 */}
            {!isWorkerRecordingMode && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleBlock(blockKey);
                  showToast(`🗑️ [${blockTitle}] 블록이 양식에서 제거되었습니다. (좌측 스위치에서 다시 켤 수 있습니다)`);
                }}
                className="px-2.5 py-1.5 rounded-xl font-black text-xs bg-rose-600 hover:bg-rose-500 text-white shadow-sm flex items-center gap-1 transition active:scale-95 cursor-pointer"
                title="이 블록을 양식에서 즉시 제거"
              >
                <span>🗑️ 블록제거</span>
              </button>
            )}
          </div>
        </div>

        {children}
      </div>
    );
  };

  // ===========================================================================
  // 1. [행 추가 / 삭제 기능]
  // ===========================================================================
  // A. 정치절단 (Spec cutting) 행 추가/삭제
  const handleAddCuttingSpecRow = () => {
    const count = currentReport.specsCutting?.length || 0;
    const nextChar = String.fromCharCode(65 + count); // A, B, C, D, E...
    const datePrefix = new Date().toISOString().slice(2, 10).replace(/-/g, "");
    const newRow = {
      id: `c_${Date.now()}`,
      section: nextChar,
      spec1: "600 ± 5mm",
      start1: "",
      half1: "",
      finish1: "",
      lotStart: `${datePrefix}-${nextChar}01`,
      lotHalf: `${datePrefix}-${nextChar}01`,
      lotFinish: `${datePrefix}-${nextChar}01`,
      lotNo: `${datePrefix}-${nextChar}01`
    };
    setCurrentReport((prev) => ({
      ...prev,
      specsCutting: [...(prev.specsCutting || []), newRow]
    }));
    showToast(`➕ 정치절단 단면 [${nextChar}] 행이 추가되었습니다.`);
  };

  const handleDeleteCuttingSpecRow = (id) => {
    setCurrentReport((prev) => ({
      ...prev,
      specsCutting: (prev.specsCutting || []).filter((r) => r.id !== id)
    }));
    showToast("🗑️ 정치절단 단면 행이 삭제되었습니다.");
  };

  // B. 단컷팅 (FRT / RR) 행 추가/삭제
  const handleAddStepCuttingRow = (type) => {
    const listKey = type === "FRT" ? "stepCuttingFrt" : "stepCuttingRr";
    const nextSection = String.fromCharCode(65 + (currentReport[listKey]?.length || 0));
    const newRow = {
      id: `sc_${type}_${Date.now()}`,
      section: nextSection,
      spec: type === "FRT" ? "49mm" : "40mm",
      startVal: "",
      halfVal: "",
      finishVal: ""
    };
    setCurrentReport((prev) => ({
      ...prev,
      [listKey]: [...(prev[listKey] || []), newRow]
    }));
    showToast(`➕ 단컷팅 ${type} [${nextSection}] 치수 행이 추가되었습니다.`);
  };

  const handleDeleteStepCuttingRow = (type, id) => {
    const listKey = type === "FRT" ? "stepCuttingFrt" : "stepCuttingRr";
    setCurrentReport((prev) => ({
      ...prev,
      [listKey]: (prev[listKey] || []).filter((r) => r.id !== id)
    }));
    showToast("🗑️ 단컷팅 치수 행이 삭제되었습니다.");
  };

  // C. 도면 치수 검사 행 추가/삭제
  const handleAddDrawingSpecRow = () => {
    const newRow = {
      id: `ds_${Date.now()}`,
      section: "신규 측정 포인트",
      spec: "500 ± 3 mm",
      startVal: "",
      halfVal: "",
      finishVal: ""
    };
    setCurrentReport((prev) => ({
      ...prev,
      drawingSpecs: [...(prev.drawingSpecs || []), newRow]
    }));
    showToast("➕ 중요 치수 검사 행이 추가되었습니다.");
  };

  const handleDeleteDrawingSpecRow = (id) => {
    setCurrentReport((prev) => ({
      ...prev,
      drawingSpecs: (prev.drawingSpecs || []).filter((r) => r.id !== id)
    }));
    showToast("🗑️ 치수 검사 행이 삭제되었습니다.");
  };

  // D. 직각검사 호기 라인 추가/삭제
  const handleAddMachineRow = () => {
    const count = (currentReport.machines?.length || 0) + 1;
    const newMachine = {
      id: `m_${Date.now()}`,
      name: `호기 ${count}`,
      workTime: "08:00 ~ 17:00",
      inspectQty: 0,
      goodQty: 0,
      reworkQty: 0,
      scrapQty: 0
    };
    setCurrentReport((prev) => ({
      ...prev,
      machines: [...(prev.machines || []), newMachine]
    }));
    showToast(`➕ [${newMachine.name}] 호기 열이 추가되었습니다.`);
  };

  const handleDeleteMachineRow = (id) => {
    if ((currentReport.machines?.length || 0) <= 1) {
      alert("최소 1개 이상의 호기가 필요합니다.");
      return;
    }
    setCurrentReport((prev) => ({
      ...prev,
      machines: (prev.machines || []).filter((m) => m.id !== id)
    }));
    showToast("🗑️ 호기 열이 삭제되었습니다.");
  };

  // E. 공정불량(조인트) 항목 추가
  const handleAddJointDefectRow = () => {
    const defectName = prompt("추가할 공정불량 명칭을 입력하세요:", "원단 들뜸");
    if (!defectName) return;
    const newRow = {
      name: defectName,
      frtA: 0,
      frtB: 0,
      frtC: 0,
      rrA: 0,
      rrB: 0,
      reworkFrt: 0,
      reworkRr: 0,
      processFrt: 0,
      processRr: 0
    };
    setCurrentReport((prev) => ({
      ...prev,
      jointDefects: [...(prev.jointDefects || []), newRow]
    }));
    showToast(`➕ [${defectName}] 공정불량 항목이 추가되었습니다.`);
  };

  // F. 불량소재 Section A/B/C 항목 추가
  const handleAddDefectSectionAbcRow = () => {
    const defectName = prompt("추가할 불량소재구분 명칭을 입력하세요:", "이물 혼입");
    if (!defectName) return;
    const newRow = {
      id: `dsabc_${Date.now()}`,
      name: defectName,
      secA: 0,
      secB: 0,
      secC: 0
    };
    setCurrentReport((prev) => ({
      ...prev,
      defectSectionAbc: [...(prev.defectSectionAbc || []), newRow]
    }));
    showToast(`➕ [${defectName}] 불량소재 항목이 추가되었습니다.`);
  };

  // G. FRT 직각검사 불량 항목 추가
  const handleAddFrtRightAngleDefectRow = () => {
    const defectName = prompt("추가할 직각검사 불량 항목을 입력하세요:", "클립 누락");
    if (!defectName) return;
    const newRow = {
      id: `frt_d_${Date.now()}`,
      name: defectName,
      frtLh: 0,
      frtRh: 0
    };
    setCurrentReport((prev) => ({
      ...prev,
      frtRightAngleDefects: [...(prev.frtRightAngleDefects || []), newRow]
    }));
    showToast(`➕ [${defectName}] 직각검사 불량 항목이 추가되었습니다.`);
  };

  // ===========================================================================
  // 2. [치수 및 인라인 값 수정 헬퍼]
  // ===========================================================================
  const handleUpdateSpecValue = (listKey, rowId, field, newVal) => {
    setCurrentReport((prev) => ({
      ...prev,
      [listKey]: (prev[listKey] || []).map((row) => {
        if (row.id === rowId) {
          return { ...row, [field]: newVal };
        }
        return row;
      })
    }));
  };

  // ===========================================================================
  // 3. [공식 작업일보 등록 및 DB 영구 저장]
  // ===========================================================================
  const handleSaveOfficialWorkReport = async () => {
    setIsSubmitting(true);
    try {
      const now = new Date().toISOString();
      const fullLegoConfig = buildFullLegoConfig();
      const reportId =
        initialTemplateData?.reportDocId ||
        (initialTemplateData?.isExistingDraft ? initialTemplateData?.id : null) ||
        `lego_report_${fullLegoConfig.carModel || "JA"}_${Date.now()}`;

      // Compute total production metrics across active Lego blocks
      let totalGenuine = 0;
      let totalBad = 0;
      let totalRework = 0;

      if (Array.isArray(fullLegoConfig.workTimeOutput)) {
        fullLegoConfig.workTimeOutput.forEach((r) => {
          totalGenuine += Number(r.goodQty) || 0;
          totalBad += Number(r.defectQty) || 0;
          totalRework += Number(r.reworkQty) || 0;
        });
      }
      if (Array.isArray(fullLegoConfig.machines)) {
        fullLegoConfig.machines.forEach((m) => {
          totalGenuine += Number(m.goodQty) || 0;
          totalBad += Number(m.defectQty) || 0;
          totalRework += Number(m.reworkQty) || 0;
        });
      }

      let matrixBadSum = 0;
      if (Array.isArray(fullLegoConfig.defectMaterialMatrix)) {
        fullLegoConfig.defectMaterialMatrix.forEach((d) => {
          matrixBadSum +=
            (Number(d.extFrt) || 0) +
            (Number(d.extRr) || 0) +
            (Number(d.procFrt) || 0) +
            (Number(d.procRr) || 0);
        });
      }
      if (Array.isArray(fullLegoConfig.defectSectionAbc)) {
        fullLegoConfig.defectSectionAbc.forEach((d) => {
          matrixBadSum += (Number(d.secA) || 0) + (Number(d.secB) || 0) + (Number(d.secC) || 0);
        });
      }
      if (Array.isArray(fullLegoConfig.jointDefects)) {
        fullLegoConfig.jointDefects.forEach((d) => {
          matrixBadSum +=
            (Number(d.frtLh) || 0) +
            (Number(d.frtRh) || 0) +
            (Number(d.rrLh) || 0) +
            (Number(d.rrRh) || 0);
        });
      }
      if (Array.isArray(fullLegoConfig.frtRightAngleDefects)) {
        fullLegoConfig.frtRightAngleDefects.forEach((d) => {
          matrixBadSum += (Number(d.frtLh) || 0) + (Number(d.frtRh) || 0);
        });
      }

      const finalBad = Math.max(totalBad, matrixBadSum);
      const gross = totalGenuine + finalBad;
      const yieldRate = gross > 0 ? ((totalGenuine / gross) * 100).toFixed(1) : "100.0";
      const defectRate = gross > 0 ? ((finalBad / gross) * 100).toFixed(1) : "0.0";

      const computedTotals = {
        genuine: totalGenuine,
        bad: finalBad,
        rework: totalRework,
        gross,
        yieldRate,
        defectRate
      };

      // Assemble unified report payload
      const reportPayload = {
        id: reportId,
        reportType: "LEGO_MODULAR_WORK_REPORT",
        title: fullLegoConfig.title || "소재준비작업일보",
        subTitle: "",
        formNo: fullLegoConfig.formNo || "705-02",
        companyName: fullLegoConfig.companyName || "(주)오륙",
        carModel: fullLegoConfig.carModel || "JA",
        project: fullLegoConfig.carModel || "JA",
        partName: fullLegoConfig.partName || "G/RUN",
        processName: fullLegoConfig.processName || "소재준비",
        targetQty: Number(fullLegoConfig.targetQty || fullLegoConfig.orderQty) || 350,
        orderQty: Number(fullLegoConfig.orderQty || fullLegoConfig.targetQty) || 350,
        workerName: fullLegoConfig.workerName || "작업자",
        worker: fullLegoConfig.workerName || "작업자",
        writer: fullLegoConfig.workerName || "작업자",
        workDate: fullLegoConfig.workDate || new Date().toISOString().slice(0, 10),
        date: fullLegoConfig.workDate || new Date().toISOString().slice(0, 10),
        shift: fullLegoConfig.shift || "주간",
        startTime: fullLegoConfig.startTime || "08:00",
        finishTime: fullLegoConfig.finishTime || "17:00",
        workTimeOutput: fullLegoConfig.workTimeOutput || [],
        specsCutting: fullLegoConfig.specsCutting || [],
        stepCuttingFrt: fullLegoConfig.stepCuttingFrt || [],
        stepCuttingRr: fullLegoConfig.stepCuttingRr || [],
        subMaterialLot: fullLegoConfig.subMaterialLot || "",
        defectMaterialMatrix: fullLegoConfig.defectMaterialMatrix || [],
        defectSectionAbc: fullLegoConfig.defectSectionAbc || [],
        jointMaterial: fullLegoConfig.jointMaterial || {},
        injectionTemps: fullLegoConfig.injectionTemps || [],
        injectionConditions: fullLegoConfig.injectionConditions || [],
        jointDefects: fullLegoConfig.jointDefects || [],
        drawingSpecs: fullLegoConfig.drawingSpecs || [],
        machines: fullLegoConfig.machines || [],
        extrusionDefects: fullLegoConfig.extrusionDefects || [],
        jointDefectsList: fullLegoConfig.jointDefectsList || [],
        postDefectsList: fullLegoConfig.postDefectsList || [],
        frtRightAngleDefects: fullLegoConfig.frtRightAngleDefects || [],
        customBlockTables: fullLegoConfig.customBlockTables || {},
        customBlocks: fullLegoConfig.customBlocks || [],
        downtimeEvents: fullLegoConfig.downtimeEvents || [],
        remarks: fullLegoConfig.remarks || "",
        activeBlocks: fullLegoConfig.activeBlocks,
        blockOrder: fullLegoConfig.blockOrder,
        totals: computedTotals,
        legoConfig: fullLegoConfig,
        assignedTemplateId: initialTemplateData?.id || initialTemplateData?.assignedTemplateId || null,
        assignedSlotKey: initialTemplateData?.assignedSlotKey || null,
        createdAt: initialTemplateData?.createdAt || now,
        updatedAt: now
      };

      // 1. Save to local storage draft (quota-safe)
      setCurrentReport(fullLegoConfig);
      try {
        localStorage.setItem("oruk_custom_lego_report_v2", JSON.stringify(fullLegoConfig));
      } catch (storageErr) {
        console.warn("Draft localStorage quota warning:", storageErr);
      }

      // 2. 🌟 5대 공정 양식 보관함 등록 (작업자 기록 모드일 때는 템플릿 복제 없이 실적만 저장)
      const procText = `${fullLegoConfig.processName || ""} ${fullLegoConfig.title || ""}`;
      let matchedCatId = fullLegoConfig.category || "MATERIAL_PREP";
      if (procText.includes("압출")) {
        matchedCatId = "EXTRUSION";
      } else if (procText.includes("조인트") || procText.includes("사출")) {
        matchedCatId = "JOINT";
      } else if (procText.includes("후가공") || procText.includes("본드") || procText.includes("조립")) {
        matchedCatId = "POST_PROCESSING";
      } else if (procText.includes("검사") || procText.includes("직각") || procText.includes("치수")) {
        matchedCatId = "INSPECTION";
      } else if (procText.includes("절단") || procText.includes("컷팅") || procText.includes("소재")) {
        matchedCatId = "MATERIAL_PREP";
      }
      const matchedCatObj =
        REPORT_MAJOR_CATEGORIES.find((c) => c.id === matchedCatId) || REPORT_MAJOR_CATEGORIES[1];

      if (!isWorkerRecordingMode) {
        const savedTplPayload = await saveWorkReportTemplate({
          id: `tpl_lego_${fullLegoConfig.carModel || "JA"}_${Date.now()}`,
          categoryId: matchedCatObj.id,
          categoryName: matchedCatObj.name,
          title: fullLegoConfig.title || "소재준비작업일보",
          subTitle: "",
          carModel: fullLegoConfig.carModel || "JA",
          partName: fullLegoConfig.partName || "G/RUN",
          processName: fullLegoConfig.processName || "소재준비",
          formNo: fullLegoConfig.formNo || "705-02(REV.4)",
          companyName: fullLegoConfig.companyName || "(주)오륙",
          isLegoModular: true,
          isDatabaseBacked: true,
          legoConfig: fullLegoConfig,
          blocks: {
            timeAndQty: Boolean(fullLegoConfig.activeBlocks?.workTimeOutput || fullLegoConfig.activeBlocks?.timeAndOutput),
            specAndLot: Boolean(
              fullLegoConfig.activeBlocks?.specsCutting ||
                fullLegoConfig.activeBlocks?.stepCuttingFrt ||
                fullLegoConfig.activeBlocks?.stepCuttingRr ||
                fullLegoConfig.activeBlocks?.drawingSpecCheck ||
                fullLegoConfig.activeBlocks?.subMaterialLot
            ),
            machineCondition: Boolean(
              fullLegoConfig.activeBlocks?.injectionTemp ||
                fullLegoConfig.activeBlocks?.injectionCondition ||
                fullLegoConfig.activeBlocks?.jointMaterial
            ),
            defectMatrix: Boolean(
              fullLegoConfig.activeBlocks?.defectMaterialMatrix ||
                fullLegoConfig.activeBlocks?.defectSectionAbc ||
                fullLegoConfig.activeBlocks?.jointDefectMatrix ||
                fullLegoConfig.activeBlocks?.rightAngleMatrix ||
                fullLegoConfig.activeBlocks?.frtRightAngleDefects
            ),
            maintenance: Boolean(fullLegoConfig.activeBlocks?.remarks || fullLegoConfig.activeBlocks?.downtimeDefectPanel)
          },
          specs: (fullLegoConfig.specsCutting || []).map((s) => ({
            id: s.id,
            section: s.section,
            name: s.section,
            frtSpec: s.spec1,
            rrSpec: s.spec1,
            spec: s.spec1,
            startVal: s.start1,
            halfVal: s.half1,
            finishVal: s.finish1,
            lotStart: s.lotStart,
            lotHalf: s.lotHalf,
            lotFinish: s.lotFinish,
            lotNo: s.lotNo
          })),
          updatedAt: now
        });

        if (onSaveToTemplateManager) {
          onSaveToTemplateManager(savedTplPayload);
        }
      }

      // 3. Persist to official Machining Work Report Service (non-blocking error safe)
      try {
        await saveMachiningWorkReport(reportPayload);
      } catch (machiningErr) {
        console.warn("saveMachiningWorkReport warning:", machiningErr);
      }

      // 4. Dispatch system events for realtime sync across all dashboards
      window.dispatchEvent(new CustomEvent("machining-work-report-saved", { detail: reportPayload }));
      window.dispatchEvent(new CustomEvent("work-log-saved", { detail: reportPayload }));

      if (onSaveWorkReport) {
        await onSaveWorkReport(reportPayload);
      }

      if (isWorkerRecordingMode) {
        showToast(`✅ [${reportPayload.title}] 작업일보가 실시간 기록 저장되었습니다!`);
      } else {
        showToast(`🎉 [공식 등록 완료] 5대 공정 양식 보관함(${matchedCatObj.name}) 및 DB에 공식 저장되었습니다!`);
      }
    } catch (err) {
      console.error("작업일보 저장 오류:", err);
      alert("작업일보 저장 중 오류가 발생했습니다: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className={`space-y-4 max-w-[1700px] mx-auto text-left ${isEmbedded ? "pb-6" : "pb-16"}`}>
      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl bg-indigo-600 text-white font-black text-xs sm:text-sm shadow-2xl animate-bounce flex items-center gap-2.5 border-2 border-indigo-400">
          <Sparkles className="w-5 h-5 text-amber-300" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* ======================================================================= */}
      {/* 🌟 Top Hero: 레고 블록 작업일보 컨트롤 패널 (컴팩트 고시인성 디자인) */}
      {/* ======================================================================= */}
      <div className="bg-slate-900/95 dark:bg-slate-950 p-2.5 sm:p-3 rounded-2xl border border-slate-700/80 shadow-md text-white space-y-2">
        {/* 상단 1열: 타이틀 + 뱃지 (좌측) & 핵심 액션 버튼 (우측) */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
          {/* 좌측: 타이틀 (절대 줄바꿈/깨짐 없이 한 줄 고정) */}
          <div className="flex items-center gap-2 min-w-0">
            <span className="p-1.5 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 text-white shadow-xs shrink-0">
              <Layers className="w-4 h-4" />
            </span>
            <div className="flex items-center gap-1.5 flex-wrap min-w-0">
              <h1 className="text-xs sm:text-sm font-black tracking-tight text-white whitespace-nowrap">
                {isWorkerRecordingMode
                  ? `📋 [${currentReport.carModel || "지정양식"}] ${currentReport.title || "작업일보 기록"}`
                  : "🧩 레고 블록 작업일보 빌더"}
              </h1>
              {!isWorkerRecordingMode && (
                <button
                  type="button"
                  onClick={() => {
                    setPhotoModalTab("ALL");
                    setShowPhotoRefModal(true);
                  }}
                  className="text-[11px] px-2.5 py-0.5 rounded-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-black whitespace-nowrap shadow-xs cursor-pointer flex items-center gap-1 transition active:scale-95"
                  title="블록모음 보관함 열기 및 그림파일 블록사진 업로드 분석·저장"
                >
                  <span>🧱 블록모음</span>
                </button>
              )}
              {isWorkerRecordingMode && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10.5px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 font-black whitespace-nowrap">
                    🔒 SPEC 고정 · 기록 전용
                  </span>
                  <span className="text-[10.5px] px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-cyan-300 border border-indigo-400/40 font-black whitespace-nowrap">
                    🎯 목표(오더): {(Number(currentReport.targetQty || currentReport.orderQty) || 350).toLocaleString()} EA
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* 우측: 핵심 액션 버튼 (컴팩트 & 직관적 정렬) */}
          <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
            <button
              type="button"
              onClick={() => setViewMode(viewMode === "DIGITAL" ? "PRINT_A4" : "DIGITAL")}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer flex items-center gap-1 shadow-2xs whitespace-nowrap ${
                viewMode === "PRINT_A4"
                  ? "bg-purple-600 text-white ring-1 ring-purple-400"
                  : "bg-slate-800 hover:bg-slate-700 text-slate-200"
              }`}
            >
              <FileSpreadsheet className="w-3 h-3" />
              <span>{viewMode === "PRINT_A4" ? "디지털뷰" : "A4서식"}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-[11px] font-bold transition cursor-pointer flex items-center gap-1 whitespace-nowrap"
            >
              <Printer className="w-3 h-3" />
              <span>인쇄/PDF</span>
            </button>

            {/* 양식 보관함 바로가기 버튼 */}
            {!isWorkerRecordingMode && onNavigateToCatalog && (
              <button
                type="button"
                onClick={onNavigateToCatalog}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-[11px] font-bold transition cursor-pointer flex items-center gap-1 shadow-2xs whitespace-nowrap"
                title="5대 공정별 표준 양식 보관함으로 이동"
              >
                <Database className="w-3 h-3 text-cyan-400" />
                <span>양식 보관함</span>
              </button>
            )}

            {/* Save as New Template in Catalog */}
            {!isWorkerRecordingMode && (
              <button
                type="button"
                onClick={handleOpenSaveCatalogModal}
                className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-black text-[11px] transition cursor-pointer flex items-center gap-1 shadow-xs active:scale-95 whitespace-nowrap"
                title="현재 레고 블록 구성을 5대 공정별 표준 양식 보관함에 신규 템플릿으로 저장"
              >
                <Layers className="w-3 h-3 text-cyan-300" />
                <span>템플릿 저장</span>
              </button>
            )}

            {/* Delete Work Report Button */}
            {(onDeleteWorkReport || (currentReport.id && savedTemplates.some((t) => t.id === currentReport.id))) && (
              <button
                type="button"
                onClick={async () => {
                  const repTitle = currentReport.title || currentReport.partName || "작업일보";
                  if (!window.confirm(`정말로 이 등록된 작업일보 [${repTitle}] 항목을 영구 삭제하시겠습니까?\n삭제 후에는 복구할 수 없습니다.`)) return;
                  try {
                    if (onDeleteWorkReport) {
                      await onDeleteWorkReport();
                    } else if (currentReport.id) {
                      await deleteWorkReportTemplate(currentReport.id);
                      try { await deleteMachiningWorkReport(currentReport.id); } catch (err) {}
                      setCurrentReport(PRESET_REPORTS[0]);
                      setAppliedTemplateBanner(null);
                      showToast(`🗑️ [${repTitle}] 작업일보가 영구 삭제되었습니다.`);
                    }
                  } catch (err) {
                    alert("삭제 중 오류가 발생했습니다: " + err.message);
                  }
                }}
                className="px-2.5 py-1 rounded-lg bg-rose-950/80 hover:bg-rose-900 text-rose-200 border border-rose-700/60 font-black text-[11px] transition cursor-pointer flex items-center gap-1 shadow-xs active:scale-95 whitespace-nowrap"
                title="이 등록된 작업일보 영구 삭제"
              >
                <Trash2 className="w-3 h-3 text-rose-400" />
                <span>일보 삭제</span>
              </button>
            )}

            {/* Official DB Save Button */}
            <button
              type="button"
              onClick={handleSaveOfficialWorkReport}
              disabled={isSubmitting}
              className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs transition cursor-pointer flex items-center gap-1 shadow-sm active:scale-95 disabled:opacity-50 whitespace-nowrap"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSubmitting ? "저장 중..." : isWorkerRecordingMode ? "💾 작업일보 기록 저장" : "일보 공식 등록"}</span>
            </button>
          </div>
        </div>

        {/* 작업자 기록 모드일 때: 작업자명 / 작업일자 / 근무조 / 목표수량 빠른 확인·수정 바 */}
        {isWorkerRecordingMode && (
          <div className="pt-2 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
            <div className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1.5 rounded-xl border border-slate-700">
              <span className="text-[10.5px] font-bold text-slate-400 shrink-0">작업자:</span>
              <input
                type="text"
                value={currentReport.workerName || ""}
                onChange={(e) => handleUpdateField("workerName", e.target.value)}
                className="w-full bg-transparent text-cyan-300 font-black outline-none text-xs"
                placeholder="작업자 성명"
              />
            </div>
            <div className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1.5 rounded-xl border border-slate-700">
              <span className="text-[10.5px] font-bold text-slate-400 shrink-0">일자:</span>
              <input
                type="date"
                value={currentReport.workDate || ""}
                onChange={(e) => handleUpdateField("workDate", e.target.value)}
                className="w-full bg-transparent text-white font-mono font-bold outline-none text-xs"
              />
            </div>
            <div className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1.5 rounded-xl border border-slate-700">
              <span className="text-[10.5px] font-bold text-slate-400 shrink-0">근무조:</span>
              <select
                value={currentReport.shift || "주간"}
                onChange={(e) => handleUpdateField("shift", e.target.value)}
                className="w-full bg-slate-800 text-amber-300 font-black outline-none text-xs"
              >
                <option value="주간">주간 (Day)</option>
                <option value="야간">야간 (Night)</option>
              </select>
            </div>
            <div className="flex items-center gap-1.5 bg-indigo-950/80 px-2.5 py-1.5 rounded-xl border border-indigo-700/60">
              <span className="text-[10.5px] font-bold text-indigo-300 shrink-0">🎯 목표수량:</span>
              <span className="text-cyan-300 font-mono font-black text-xs">{(Number(currentReport.targetQty || currentReport.orderQty) || 350).toLocaleString()} EA</span>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1.5 rounded-xl border border-slate-700">
              <span className="text-[10.5px] font-bold text-slate-400 shrink-0">공정:</span>
              <span className="text-indigo-300 font-black truncate">{currentReport.processName === "외주가공" ? "가공/협력업체" : (currentReport.processName || "가공/협력업체")}</span>
            </div>
          </div>
        )}

        {/* 하단 2열: 💾 DB 저장 작업일보 전체 목록 (10개 등 저장된 모든 일보 즉시 표시) */}
        {!isWorkerRecordingMode && savedTemplates.length > 0 && (
          <div className="pt-1.5 border-t border-slate-800 flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-black text-emerald-400 shrink-0 flex items-center gap-1 whitespace-nowrap">
              <Database className="w-3 h-3 text-emerald-400" />
              <span>DB 저장 일보 ({savedTemplates.length}개):</span>
            </span>
            {savedTemplates.map((tpl, idx) => {
              const isSelected =
                currentReport.id === tpl.id ||
                (appliedTemplateBanner?.id && appliedTemplateBanner.id === tpl.id);
              const label = `${idx + 1}. ${tpl.carModel ? `[${tpl.carModel}] ` : ""}${tpl.title || tpl.partName || "작업일보"}`;
              return (
                <div
                  key={tpl.id || idx}
                  className={`inline-flex items-center rounded-lg text-xs font-black shrink-0 transition-all border ${
                    isSelected
                      ? "bg-emerald-500 text-slate-950 border-emerald-300 shadow-xs ring-1 ring-emerald-300"
                      : "bg-slate-950 text-emerald-200 hover:bg-slate-800 hover:text-white border-emerald-700/60"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      if (tpl.legoConfig) {
                        const cfg = JSON.parse(JSON.stringify(tpl.legoConfig));
                        cfg.id = tpl.id;
                        if (tpl.title) cfg.title = tpl.title;
                        if (tpl.carModel) cfg.carModel = tpl.carModel;
                        if (tpl.partName) cfg.partName = tpl.partName;
                        if (tpl.processName) cfg.processName = tpl.processName;
                        setCurrentReport(cfg);
                      } else {
                        setCurrentReport((prev) => ({
                          ...prev,
                          id: tpl.id,
                          title: tpl.title || prev.title,
                          carModel: tpl.carModel || prev.carModel,
                          partName: tpl.partName || prev.partName,
                          processName: tpl.processName || prev.processName
                        }));
                      }
                      setAppliedTemplateBanner(tpl);
                      showToast(`⚡ DB 저장 일보 [${label}] 양식을 불러왔습니다.`);
                    }}
                    className="px-2.5 py-1 flex items-center gap-1 cursor-pointer whitespace-nowrap"
                    title={`${tpl.categoryName || "공정"} | ${tpl.carModel || ""} ${tpl.partName || ""} (${tpl.title || ""}) 클릭 시 즉시 불러오기`}
                  >
                    <span>{label}</span>
                    {tpl.processName && (
                      <span
                        className={`text-[9px] px-1 py-0.2 rounded font-bold ${
                          isSelected ? "bg-slate-900 text-emerald-300" : "bg-slate-800 text-slate-300"
                        }`}
                      >
                        {tpl.processName}
                      </span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (!window.confirm(`[${label}] 등록된 일보/양식을 DB에서 영구 삭제하시겠습니까?\n삭제 후에는 복구할 수 없습니다.`)) return;
                      try {
                        await deleteWorkReportTemplate(tpl.id);
                        try {
                          await deleteMachiningWorkReport(tpl.id);
                        } catch (mErr) {}
                        if (currentReport.id === tpl.id) {
                          setCurrentReport(PRESET_REPORTS[0]);
                          setAppliedTemplateBanner(null);
                        }
                        showToast(`🗑️ [${label}] 등록된 일보가 삭제되었습니다.`);
                      } catch (err) {
                        alert("삭제 실패: " + err.message);
                      }
                    }}
                    className={`p-1 pr-1.5 transition cursor-pointer hover:bg-rose-500/20 rounded-r-lg ${
                      isSelected ? "text-slate-950 hover:text-rose-900" : "text-rose-400 hover:text-rose-200"
                    }`}
                    title="이 저장 일보 삭제"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* 하단 3열: ⚡ 4대 기본 표준 프리셋 탭 */}
        {!isWorkerRecordingMode && (
          <div className="pt-1.5 border-t border-slate-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <span className="text-[11px] font-black text-slate-400 shrink-0 flex items-center gap-1 whitespace-nowrap">
              <Sparkles className="w-3 h-3 text-cyan-400" />
              <span>기본 프리셋 (4종):</span>
            </span>
            {PRESET_REPORTS.map((preset) => {
              const isSelected = currentReport.id === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleLoadPreset(preset.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-black shrink-0 transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap ${
                    isSelected
                      ? "bg-cyan-500 text-slate-950 font-black shadow-xs ring-1 ring-cyan-300"
                      : "bg-slate-950 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800"
                  }`}
                >
                  <span>{preset.name}</span>
                  <span className={`text-[9px] px-1 py-0.2 rounded font-bold ${
                    isSelected ? "bg-slate-900 text-cyan-300" : "bg-slate-800 text-slate-400"
                  }`}>
                    {preset.badge}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ======================================================================= */}
      {/* 2-COLUMN MAIN WORKSPACE */}
      {/* ======================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* ===================================================================== */}
        {/* 🧱 LEFT: LEGO BLOCK SWITCHER & CUSTOMIZER */}
        {/* ===================================================================== */}
        {!isWorkerRecordingMode && (
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-md space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800 gap-2 flex-wrap">
              <h3 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-500" />
                <span>{combinedSwitchCatalog.length}대 레고 블록 조립 스위치</span>
              </h3>
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    setPhotoModalTab("UPLOAD");
                    setShowPhotoRefModal(true);
                  }}
                  className="px-2 py-0.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-[10px] font-black cursor-pointer shadow-2xs"
                  title="그림파일로 블록사진 업로드 및 자동 분석 저장"
                >
                  📷 +사진블록 추가
                </button>
                <span className="text-[10.5px] font-black text-indigo-600 dark:text-cyan-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-full">
                  ⠿ 드래그 순서변경
                </span>
                <button
                  type="button"
                  onClick={handleResetBlockOrder}
                  className="px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-[10px] font-bold text-slate-500 dark:text-slate-300 cursor-pointer"
                  title="블록 순서를 기본값으로 초기화"
                >
                  🔄 순서초기화
                </button>
              </div>
            </div>

            {/* Block Switches with Drag & Drop Ordering, Selection & In-App Edit */}
            <div className="space-y-1.5 max-h-[580px] overflow-y-auto pr-1">
              {orderedBlockItems.map((item, idx) => {
                const isActive = Boolean(currentReport.activeBlocks?.[item.key]);
                const isSelected = selectedBlockKey === item.key;
                const isDragged = draggedBlockIdx === idx;
                const isDragOver = dragOverBlockIdx === idx && draggedBlockIdx !== idx;
                return (
                  <div
                    key={item.key}
                    draggable
                    onDragStart={(e) => {
                      setDraggedBlockIdx(idx);
                      e.dataTransfer.effectAllowed = "move";
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = "move";
                      if (dragOverBlockIdx !== idx) {
                        setDragOverBlockIdx(idx);
                      }
                    }}
                    onDragLeave={() => {
                      if (dragOverBlockIdx === idx) {
                        setDragOverBlockIdx(null);
                      }
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      handleBlockDrop(idx);
                    }}
                    onDragEnd={() => {
                      setDraggedBlockIdx(null);
                      setDragOverBlockIdx(null);
                    }}
                    className={`w-full p-2 rounded-2xl border text-left flex items-center justify-between transition-all cursor-grab active:cursor-grabbing ${
                      isDragged ? "opacity-40 scale-95 border-dashed " : ""
                    }${
                      isDragOver ? "border-t-4 border-t-cyan-400 bg-indigo-500/15 " : ""
                    }${
                      isSelected
                        ? "bg-indigo-600 text-white border-indigo-700 shadow-md ring-2 ring-indigo-400 scale-[1.01]"
                        : isActive
                        ? "bg-indigo-50 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-700 text-indigo-950 dark:text-indigo-200 shadow-2xs hover:border-indigo-500"
                        : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-400 opacity-60 hover:opacity-100"
                    }`}
                  >
                    {/* Clickable label for block selection */}
                    <button
                      type="button"
                      onClick={() => handleSelectBlock(item.key)}
                      className="flex items-center gap-1.5 flex-1 min-w-0 text-left cursor-pointer"
                    >
                      <span
                        className={`text-xs px-1 rounded select-none cursor-grab shrink-0 ${
                          isSelected ? "text-indigo-200 hover:text-white" : "text-slate-400 hover:text-indigo-500"
                        }`}
                        title="마우스로 잡고 위아래로 드래그하여 순서를 변경하세요"
                      >
                        ⠿
                      </span>
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleBlock(item.key);
                        }}
                        className={`w-4 h-4 rounded flex items-center justify-center text-[10px] shrink-0 transition ${
                          isActive
                            ? isSelected
                              ? "bg-white text-indigo-700 font-black"
                              : "bg-indigo-600 text-white font-black"
                            : "border border-slate-400 hover:border-indigo-500"
                        }`}
                        title={isActive ? "클릭하여 비활성화" : "클릭하여 활성화"}
                      >
                        {isActive ? "✓" : ""}
                      </span>
                      <span className={`text-[11.5px] truncate ${isSelected ? "font-black text-white" : "font-bold"}`}>
                        {idx + 1}. {item.label}
                      </span>
                    </button>

                    <div className="flex items-center gap-1 shrink-0 ml-1">
                      {/* Up / Down Order Buttons */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveBlockOrder(idx, -1);
                        }}
                        disabled={idx === 0}
                        className={`px-1 py-0.5 rounded text-[9.5px] font-black transition cursor-pointer disabled:opacity-30 ${
                          isSelected
                            ? "hover:bg-indigo-700 text-indigo-100"
                            : "hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500"
                        }`}
                        title="위로 이동"
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveBlockOrder(idx, 1);
                        }}
                        disabled={idx === orderedBlockItems.length - 1}
                        className={`px-1 py-0.5 rounded text-[9.5px] font-black transition cursor-pointer disabled:opacity-30 ${
                          isSelected
                            ? "hover:bg-indigo-700 text-indigo-100"
                            : "hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500"
                        }`}
                        title="아래로 이동"
                      >
                        ▼
                      </button>

                      {/* In-App Block Editor Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenBlockEditor(item.key);
                        }}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-black transition cursor-pointer flex items-center gap-1 ${
                          isSelected
                            ? "bg-white text-indigo-700 hover:bg-indigo-50 shadow-xs"
                            : "bg-indigo-100 dark:bg-indigo-900/80 text-indigo-700 dark:text-indigo-200 hover:bg-indigo-200"
                        }`}
                        title="이 블록의 세부 내용 앱내 편집"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>편집</span>
                      </button>
                      <span className={`text-[9.5px] px-1.5 py-0.5 rounded-full font-bold ${
                        isSelected
                          ? "bg-indigo-700 text-indigo-200"
                          : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                      }`}>
                        {item.badge}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Header Metadata Customizer */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-md space-y-3">
            <h3 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-cyan-500" />
              <span>기본 메타데이터 수정</span>
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-0.5">차종명 (Car model)</label>
                <input
                  type="text"
                  value={currentReport.carModel || ""}
                  onChange={(e) => handleUpdateField("carModel", e.target.value)}
                  className="w-full px-2 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-black text-center text-cyan-600 dark:text-cyan-400"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-0.5">품명 (Part name)</label>
                <input
                  type="text"
                  value={currentReport.partName || ""}
                  onChange={(e) => handleUpdateField("partName", e.target.value)}
                  className="w-full px-2 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-black text-center"
                />
              </div>
              <div className="col-span-2">
                <label className="text-[11px] font-bold text-slate-400 block mb-0.5">공정명 (Process name)</label>
                <input
                  type="text"
                  value={currentReport.processName ?? "소재준비"}
                  onChange={(e) => {
                    const val = e.target.value;
                    setCurrentReport((prev) => ({
                      ...prev,
                      processName: val
                    }));
                  }}
                  placeholder="예: 소재준비 / 정치절단 / 단컷팅 / 조인트 / 직각검사"
                  className="w-full px-2 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-black text-center text-indigo-600 dark:text-indigo-400"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-0.5">작업자</label>
                <input
                  type="text"
                  value={currentReport.workerName || ""}
                  onChange={(e) => handleUpdateField("workerName", e.target.value)}
                  className="w-full px-2 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-black text-center text-indigo-600 dark:text-indigo-400"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-0.5">작업일자</label>
                <input
                  type="date"
                  value={currentReport.workDate || ""}
                  onChange={(e) => handleUpdateField("workDate", e.target.value)}
                  className="w-full px-2 py-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-black text-center font-mono"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-0.5">근무조</label>
                <select
                  value={currentReport.shift || "주간"}
                  onChange={(e) => handleUpdateField("shift", e.target.value)}
                  className="w-full px-2 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-black text-center"
                >
                  <option value="주간">주간 (Day)</option>
                  <option value="야간">야간 (Night)</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-0.5">양식 번호</label>
                <input
                  type="text"
                  value={currentReport.formNo || ""}
                  onChange={(e) => handleUpdateField("formNo", e.target.value)}
                  className="w-full px-2 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-black text-center font-mono"
                />
              </div>
            </div>
          </div>
        </div>
        )}

        {/* ===================================================================== */}
        {/* 📄 RIGHT: LIVE WORK REPORT FORM (실시간 양식 뷰 & 인라인 편집) */}
        {/* ===================================================================== */}
        <div className={`${isWorkerRecordingMode ? "lg:col-span-12" : "lg:col-span-8"} space-y-4`}>
          <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-5 text-slate-900 dark:text-white print:p-0 print:border-none print:shadow-none">
            
            {/* ================================================================= */}
            {/* 🏷️ [일보 헤더: 제목 & 결재란 (한 줄 통일 & 제목 클릭 수정 가능)] */}
            {/* ================================================================= */}
            <div className="border-b-2 border-slate-900 dark:border-slate-700 pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {/* Editable Report Title (한 줄 통일: 소재준비작업일보) */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono font-bold text-slate-400">{t("양식번호")}: {currentReport.formNo || "705-02"}</span>
                    {isWorkerRecordingMode ? (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                        🔒 {t("현장작업자 기록 모드 (SPEC 고정 · 실측치 기록 전용)")}
                      </span>
                    ) : (
                      <span className="text-[10px] text-cyan-600 dark:text-cyan-400 font-bold">✏️ {t("제목/치수 클릭 시 수정 가능")}</span>
                    )}
                  </div>
                  {isWorkerRecordingMode ? (
                    <h2 className="text-lg sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white py-1 mt-0.5">
                      {currentReport.title || "소재준비작업일보"}
                    </h2>
                  ) : (
                    <input
                      type="text"
                      value={currentReport.title || "소재준비작업일보"}
                      onChange={(e) => handleUpdateField("title", e.target.value)}
                      className="text-lg sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white bg-transparent border-b border-dashed border-slate-400 focus:border-indigo-500 outline-none w-full py-1 mt-0.5"
                      title="클릭하여 일보 제목을 자유롭게 수정하세요."
                    />
                  )}
                </div>

                {/* 3단 결재란 (작성 / 검토 / 승인) */}
                <div className="shrink-0">
                  <table className="border-collapse border border-black dark:border-slate-600 text-xs text-center font-bold">
                    <thead>
                      <tr className="bg-slate-100 dark:bg-slate-800 border-b border-black dark:border-slate-600 text-[11px]">
                        <th rowSpan={2} className="border-r border-black dark:border-slate-600 px-2 py-1 bg-slate-200 dark:bg-slate-700">{t("결재")}</th>
                        <th className="border-r border-black dark:border-slate-600 px-3 py-0.5">{t("작 성")}</th>
                        <th className="border-r border-black dark:border-slate-600 px-3 py-0.5">{t("검 토")}</th>
                        <th className="px-3 py-0.5">{t("승 인")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="h-10">
                        <td className="border-r border-black dark:border-slate-600 w-14">
                          <span className="text-[11px] font-black text-indigo-600 dark:text-indigo-400">{currentReport.workerName}</span>
                        </td>
                        <td className="border-r border-black dark:border-slate-600 w-14"></td>
                        <td className="w-14"></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* 🌟 Ordered Blocks Container (좌측 드래그 앤 드롭 순서 100% 실시간 동기화) */}
            <div className="flex flex-col gap-5">

            {/* ================================================================= */}
            {/* 🧱 BLOCK 8: 작업 기본 정보 (사진 8) - 차종 → 품명 → 공정명 순서 */}
            {/* ================================================================= */}
            {renderBlockWrapper("basicInfo", "[블록 8] 작업 기본 정보 헤더", (
              <div className="rounded-2xl p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between pb-1 border-b border-slate-200 dark:border-slate-800">
                  <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                    <span>🧱 {t("[블록 8] 작업 기본 정보 헤더")}</span>
                    <span className="text-[10px] text-slate-400">{t("(차종 · 품명 · 공정명 · 목표수량 · 작업자 · 근무시간)")}</span>
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-xs">
                  <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
                    <span className="text-[10px] font-bold text-slate-400 block">{t("차종 (Car model)")}</span>
                    {isWorkerRecordingMode ? (
                      <span className="font-black text-xs text-center block text-indigo-600 dark:text-cyan-400 py-1">
                        {currentReport.carModel || "-"}
                      </span>
                    ) : (
                      <input
                        type="text"
                        value={currentReport.carModel || ""}
                        onChange={(e) => handleUpdateField("carModel", e.target.value)}
                        className="font-black text-xs text-center w-full bg-transparent outline-none border-b border-dashed border-slate-300 text-indigo-600 dark:text-cyan-400"
                      />
                    )}
                  </div>
                  <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
                    <span className="text-[10px] font-bold text-slate-400 block">{t("품 명 (Part name)")}</span>
                    {isWorkerRecordingMode ? (
                      <span className="font-black text-xs text-center block py-1">
                        {currentReport.partName || "-"}
                      </span>
                    ) : (
                      <input
                        type="text"
                        value={currentReport.partName || ""}
                        onChange={(e) => handleUpdateField("partName", e.target.value)}
                        className="font-black text-xs text-center w-full bg-transparent outline-none border-b border-dashed border-slate-300"
                      />
                    )}
                  </div>
                  <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
                    <span className="text-[10px] font-bold text-slate-400 block">{t("공정명 (Process)")}</span>
                    {isWorkerRecordingMode ? (
                      <span className="font-black text-xs text-center block text-indigo-600 dark:text-indigo-400 py-1">
                        {currentReport.processName ?? "소재준비"}
                      </span>
                    ) : (
                      <input
                        type="text"
                        value={currentReport.processName ?? "소재준비"}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCurrentReport((prev) => ({
                            ...prev,
                            processName: val
                          }));
                        }}
                        className="font-black text-xs text-center w-full bg-transparent outline-none border-b border-dashed border-slate-300 text-indigo-600 dark:text-indigo-400"
                      />
                    )}
                  </div>
                  <div className="p-2 rounded-xl bg-indigo-50/90 dark:bg-indigo-950/60 border-2 border-indigo-400 dark:border-indigo-600 text-center">
                    <span className="text-[10px] font-extrabold text-indigo-700 dark:text-indigo-300 block">{t("목표수량 (관리자 오더)")}</span>
                    {isWorkerRecordingMode ? (
                      <span className="font-mono font-black text-xs sm:text-sm text-indigo-700 dark:text-cyan-300 block mt-0.5">
                        🎯 {(Number(currentReport.targetQty || currentReport.orderQty) || 350).toLocaleString()} EA
                      </span>
                    ) : (
                      <div className="flex items-center justify-center gap-1 mt-0.5">
                        <input
                          type="number"
                          value={currentReport.targetQty || currentReport.orderQty || 350}
                          onChange={(e) => {
                            const val = Number(e.target.value) || 0;
                            setCurrentReport((prev) => ({ ...prev, targetQty: val, orderQty: val }));
                          }}
                          className="font-mono font-black text-xs text-center w-16 bg-transparent outline-none border-b border-dashed border-indigo-400 text-indigo-700 dark:text-cyan-300"
                          placeholder="350"
                          title="관리자 오더 목표수량 설정"
                        />
                        <span className="text-[10px] font-bold text-slate-500">EA</span>
                      </div>
                    )}
                  </div>
                  <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
                    <span className="text-[10px] font-bold text-slate-400 block">{t("작업자 (Worker)")}</span>
                    <input
                      type="text"
                      value={currentReport.workerName || ""}
                      onChange={(e) => handleUpdateField("workerName", e.target.value)}
                      className="font-black text-xs text-center w-full bg-transparent outline-none border-b border-dashed border-slate-300"
                    />
                  </div>
                  <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
                    <span className="text-[10px] font-bold text-slate-400 block">{t("근무 시간")}</span>
                    <div className="flex items-center justify-center gap-1 font-bold text-xs mt-0.5">
                      <span>{currentReport.startTime}</span>
                      <span>~</span>
                      <span>{currentReport.finishTime}</span>
                    </div>
                  </div>
                </div>
              </div>
            ), { customBadge: "사진 8" })}

            {/* ================================================================= */}
            {/* 🧱 BLOCK 9: 작업시간 및 생산량(실적) 테이블 (사진 9) */}
            {/* ================================================================= */}
            {renderBlockWrapper("workTimeOutput", "[블록 9] 작업시간 및 생산실적 테이블", (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between pb-1">
                  <span className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>🧱 {t("[블록 9] 작업시간 및 생산실적 테이블")}</span>
                  </span>
                </div>
                <div className="overflow-x-auto border border-black dark:border-slate-600 rounded-xl">
                  <table className="w-full border-collapse text-xs text-center font-bold">
                    <thead>
                      <tr className="bg-amber-100 dark:bg-amber-950/70 border-b border-black dark:border-slate-600 text-[11px]">
                        <th rowSpan={2} className="border-r border-black dark:border-slate-600 p-1.5 w-[20%]">{t("구 분(Division)")}</th>
                        <th colSpan={3} className="border-r border-black dark:border-slate-600 p-1">{t("A단면 실적")}</th>
                        <th colSpan={3} className="p-1">{t("B단면 실적")}</th>
                      </tr>
                      <tr className="bg-amber-50 dark:bg-amber-950/50 border-b border-black dark:border-slate-600 text-[10px]">
                        <th className="border-r border-black dark:border-slate-600 p-1">{t("시작시간")}</th>
                        <th className="border-r border-black dark:border-slate-600 p-1">{t("종료시간")}</th>
                        <th className="border-r border-black dark:border-slate-600 p-1">{t("생산수량")}</th>
                        <th className="border-r border-black dark:border-slate-600 p-1">{t("시작시간")}</th>
                        <th className="border-r border-black dark:border-slate-600 p-1">{t("종료시간")}</th>
                        <th className="p-1">{t("생산수량")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(currentReport.workTimeOutput || []).map((row, idx) => (
                        <tr key={row.id || idx} className="border-b border-black dark:border-slate-600">
                          <td className="border-r border-black dark:border-slate-600 p-1 bg-slate-50 dark:bg-slate-800 font-black">
                            {isWorkerRecordingMode ? (
                              <span className="w-full text-center font-black block">{row.division || ""}</span>
                            ) : (
                              <input
                                type="text"
                                value={row.division || ""}
                                onChange={(e) => handleUpdateSpecValue("workTimeOutput", row.id, "division", e.target.value)}
                                className="w-full text-center font-black bg-transparent outline-none border-b border-dashed border-slate-300 dark:border-slate-600 focus:border-indigo-500"
                                title="구분명 수정 (클릭하여 직접 변경)"
                              />
                            )}
                          </td>
                          <td className="border-r border-black dark:border-slate-600 p-1">
                            <input
                              type="text"
                              value={row.startA || ""}
                              onChange={(e) => handleUpdateSpecValue("workTimeOutput", row.id, "startA", e.target.value)}
                              className="w-full text-center bg-transparent outline-none font-mono"
                            />
                          </td>
                          <td className="border-r border-black dark:border-slate-600 p-1">
                            <input
                              type="text"
                              value={row.finishA || ""}
                              onChange={(e) => handleUpdateSpecValue("workTimeOutput", row.id, "finishA", e.target.value)}
                              className="w-full text-center bg-transparent outline-none font-mono"
                            />
                          </td>
                          <td className="border-r border-black dark:border-slate-600 p-1 font-mono font-black text-indigo-600 dark:text-cyan-400">
                            <input
                              type="number"
                              value={row.qtyA || 0}
                              onChange={(e) => handleUpdateSpecValue("workTimeOutput", row.id, "qtyA", Number(e.target.value))}
                              className="w-full text-center bg-transparent outline-none font-mono font-black"
                            />
                          </td>
                          <td className="border-r border-black dark:border-slate-600 p-1">
                            <input
                              type="text"
                              value={row.startB || ""}
                              onChange={(e) => handleUpdateSpecValue("workTimeOutput", row.id, "startB", e.target.value)}
                              className="w-full text-center bg-transparent outline-none font-mono"
                            />
                          </td>
                          <td className="border-r border-black dark:border-slate-600 p-1">
                            <input
                              type="text"
                              value={row.finishB || ""}
                              onChange={(e) => handleUpdateSpecValue("workTimeOutput", row.id, "finishB", e.target.value)}
                              className="w-full text-center bg-transparent outline-none font-mono"
                            />
                          </td>
                          <td className="p-1 font-mono font-black text-indigo-600 dark:text-cyan-400">
                            <input
                              type="number"
                              value={row.qtyB || 0}
                              onChange={(e) => handleUpdateSpecValue("workTimeOutput", row.id, "qtyB", Number(e.target.value))}
                              className="w-full text-center bg-transparent outline-none font-mono font-black"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ), { customBadge: "사진 9" })}

            {/* ================================================================= */}
            {/* 🧱 BLOCK 15: 정치 절단 길이 & LOT NO. (사진 15) - [행 추가 & 치수 변경 완벽 지원] */}
            {/* ================================================================= */}
            {renderBlockWrapper("specsCutting", "[블록 15] 정치 절단 길이 (Spec cutting) & LOT NO.", (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span>🧱 {t("[블록 15] 정치 절단 길이 (Spec cutting) & LOT NO.")}</span>
                      <span className="text-[10px] px-2 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 font-bold">
                        사진 15 실물 일치 (881±3 / 608±5 / 582±5)
                      </span>
                    </span>
                  </div>
                  {!isWorkerRecordingMode && (
                    <button
                      type="button"
                      onClick={handleAddCuttingSpecRow}
                      className="px-2.5 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs transition cursor-pointer flex items-center gap-1 shadow-xs"
                      title="새로운 절단 단면(Section D, E...)을 추가합니다."
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{t("+ 단면 행 추가")}</span>
                    </button>
                  )}
                </div>

                <div className="overflow-x-auto border border-black dark:border-slate-600 rounded-xl">
                  <table className="w-full border-collapse text-xs text-center font-bold">
                    <thead>
                      <tr className="bg-amber-100 dark:bg-amber-950/70 border-b border-black dark:border-slate-600 text-[11px] text-black dark:text-white">
                        <th colSpan={3} className="border-r border-black dark:border-slate-600 p-1.5 w-[28%]">{t("구 분(Division)")}</th>
                        <th className="border-r border-black dark:border-slate-600 p-1.5 w-[23%]">{t("초물(Start)")}</th>
                        <th className="border-r border-black dark:border-slate-600 p-1.5 w-[23%]">{t("중물(Half)")}</th>
                        <th className="border-r border-black dark:border-slate-600 p-1.5 w-[22%]">{t("종물(Finish)")}</th>
                        {!isWorkerRecordingMode && <th className="p-1 w-[4%] print:hidden">{t("관리")}</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {(currentReport.specsCutting || []).map((row, idx) => (
                        <React.Fragment key={row.id || idx}>
                          {/* Row 1: 규격(Spec) - 인라인 치수 자유 수정 */}
                          <tr className="border-b border-black dark:border-slate-600">
                            {idx === 0 && (
                              <td
                                rowSpan={(currentReport.specsCutting?.length || 1) * 3}
                                className="border-r border-black dark:border-slate-600 bg-amber-50 dark:bg-amber-950/40 p-2 font-black w-[10%] text-center align-middle"
                              >
                                {isWorkerRecordingMode ? (
                                  <span className="w-full text-center font-black text-[11px] block">
                                    {t(currentReport.specCuttingProcessLabel ?? "정치 절단 길이")}
                                  </span>
                                ) : (
                                  <input
                                    type="text"
                                    value={t(currentReport.specCuttingProcessLabel ?? "정치 절단 길이")}
                                    onChange={(e) => handleUpdateField("specCuttingProcessLabel", e.target.value)}
                                    className="w-full text-center font-black text-[11px] bg-transparent outline-none border-b border-dashed border-slate-400 focus:border-indigo-500"
                                    title="공정/구분 명칭 수정"
                                  />
                                )}
                              </td>
                            )}
                            <td rowSpan={3} className="border-r border-black dark:border-slate-600 p-1.5 w-[9%] text-center font-black">
                              {isWorkerRecordingMode ? (
                                <span className="w-10 text-center font-black block mx-auto text-indigo-700 dark:text-cyan-400">
                                  {row.section}
                                </span>
                              ) : (
                                <input
                                  type="text"
                                  value={row.section}
                                  onChange={(e) => handleUpdateSpecValue("specsCutting", row.id, "section", e.target.value)}
                                  className="w-10 text-center font-black bg-transparent border-b border-dashed border-slate-400 outline-none"
                                  title="단면 명칭 수정 (A, B, C, D...)"
                                />
                              )}
                            </td>
                            <td className="border-r border-black dark:border-slate-600 p-1 bg-slate-50 dark:bg-slate-800 text-[11px] font-bold w-[9%]">
                              {t("규격(Spec)")}
                            </td>
                            <td colSpan={3} className="border-r border-black dark:border-slate-600 p-1 text-center font-black text-indigo-600 dark:text-cyan-400 bg-slate-50/50 dark:bg-slate-900/50">
                              {isWorkerRecordingMode ? (
                                <div className="py-1 px-2 text-center">
                                  <span className="inline-flex items-center gap-1 font-mono font-black text-indigo-700 dark:text-cyan-300 text-xs px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-slate-800 border border-indigo-200 dark:border-indigo-900/60 shadow-2xs">
                                    🔒 {row.spec1 || "-"}
                                  </span>
                                </div>
                              ) : (
                                <input
                                  type="text"
                                  value={row.spec1 || ""}
                                  onChange={(e) => handleUpdateSpecValue("specsCutting", row.id, "spec1", e.target.value)}
                                  className="w-full text-center font-black bg-transparent outline-none"
                                  title="규격/공차 직접 수정 (예: 881 ± 3mm)"
                                  placeholder={t("규격 입력 (예: 881 ± 3mm)")}
                                />
                              )}
                            </td>
                            {!isWorkerRecordingMode && (
                              <td rowSpan={3} className="p-1 align-middle text-center print:hidden w-[4%]">
                                <button
                                  type="button"
                                  onClick={() => handleDeleteCuttingSpecRow(row.id)}
                                  className="text-rose-500 hover:text-rose-700 p-1 rounded transition cursor-pointer"
                                  title="단면 행 삭제"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            )}
                          </tr>

                          {/* Row 2: 초/중/종 실측치 (초물, 중물, 종물 3개만 기록) */}
                          <tr className="border-b border-black dark:border-slate-600">
                            <td className="border-r border-black dark:border-slate-600 p-1 text-[11px] font-bold bg-slate-50 dark:bg-slate-800">
                              {t("초/중/종")}
                            </td>
                            <td className="border-r border-black dark:border-slate-600 p-1">
                              <input
                                type="text"
                                value={row.start1 || ""}
                                onChange={(e) => handleUpdateSpecValue("specsCutting", row.id, "start1", e.target.value)}
                                className="w-full text-center font-mono font-bold bg-transparent outline-none"
                                placeholder={t("초물")}
                              />
                            </td>
                            <td className="border-r border-black dark:border-slate-600 p-1">
                              <input
                                type="text"
                                value={row.half1 || ""}
                                onChange={(e) => handleUpdateSpecValue("specsCutting", row.id, "half1", e.target.value)}
                                className="w-full text-center font-mono font-bold bg-transparent outline-none"
                                placeholder={t("중물")}
                              />
                            </td>
                            <td className="border-r border-black dark:border-slate-600 p-1">
                              <input
                                type="text"
                                value={row.finish1 || ""}
                                onChange={(e) => handleUpdateSpecValue("specsCutting", row.id, "finish1", e.target.value)}
                                className="w-full text-center font-mono font-bold bg-transparent outline-none"
                                placeholder={t("종물")}
                              />
                            </td>
                          </tr>

                          {/* Row 3: LOT NO. (초물, 중물, 종물 3개 칸) */}
                          <tr className="border-b border-black dark:border-slate-600">
                            <td className="border-r border-black dark:border-slate-600 p-1 text-[11px] font-bold bg-slate-50 dark:bg-slate-800">
                              {t("LOT NO.")}
                            </td>
                            <td className="border-r border-black dark:border-slate-600 p-1">
                              <input
                                type="text"
                                value={row.lotStart ?? row.lotNo ?? ""}
                                onChange={(e) => handleUpdateSpecValue("specsCutting", row.id, "lotStart", e.target.value)}
                                className="w-full text-center font-mono font-bold bg-transparent outline-none text-slate-700 dark:text-slate-300"
                                placeholder={t("초물 LOT")}
                              />
                            </td>
                            <td className="border-r border-black dark:border-slate-600 p-1">
                              <input
                                type="text"
                                value={row.lotHalf ?? row.lotNo ?? ""}
                                onChange={(e) => handleUpdateSpecValue("specsCutting", row.id, "lotHalf", e.target.value)}
                                className="w-full text-center font-mono font-bold bg-transparent outline-none text-slate-700 dark:text-slate-300"
                                placeholder={t("중물 LOT")}
                              />
                            </td>
                            <td className="border-r border-black dark:border-slate-600 p-1">
                              <input
                                type="text"
                                value={row.lotFinish ?? row.lotNo ?? ""}
                                onChange={(e) => handleUpdateSpecValue("specsCutting", row.id, "lotFinish", e.target.value)}
                                className="w-full text-center font-mono font-bold bg-transparent outline-none text-slate-700 dark:text-slate-300"
                                placeholder={t("종물 LOT")}
                              />
                            </td>
                          </tr>
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ), { canAddRow: true, onAddRow: handleAddCuttingSpecRow, customBadge: "사진 15" })}

            {/* ================================================================= */}
            {/* 🧱 BLOCK 2 & 3: 단컷팅 치수 (FRT / RR) (사진 2, 3) */}
            {/* ================================================================= */}
            {renderBlockWrapper("stepCuttingFrt", "[블록 2] 단컷팅 FRT 구간 치수 (49/45mm)", (
              <div className="space-y-1.5 border border-black dark:border-slate-600 rounded-xl p-2.5 bg-slate-50/50 dark:bg-slate-950/40">
                <div className="flex items-center justify-between pb-1 border-b border-slate-300 dark:border-slate-700">
                  <span className="font-black text-xs text-slate-900 dark:text-white">
                    🧱 {t("[블록 2] 단컷팅 FRT 구간 치수 (49/45mm)")}
                  </span>
                  {!isWorkerRecordingMode && (
                    <button
                      type="button"
                      onClick={() => handleAddStepCuttingRow("FRT")}
                      className="px-2 py-0.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10.5px] cursor-pointer"
                    >
                      {t("+ 행 추가")}
                    </button>
                  )}
                </div>
                <table className="w-full border-collapse border border-black dark:border-slate-600 text-xs text-center font-bold">
                  <thead>
                    <tr className="bg-amber-100 dark:bg-amber-950/70 border-b border-black dark:border-slate-600 text-[11px]">
                      <th className="border-r border-black dark:border-slate-600 p-1 w-1/4">{t("구분")}</th>
                      {(currentReport.stepCuttingFrt || []).map((c) => (
                        <th key={c.id} className="border-r border-black dark:border-slate-600 p-1">
                          {isWorkerRecordingMode ? (
                            <span>{c.section || ""}</span>
                          ) : (
                            <input
                              type="text"
                              value={c.section || ""}
                              onChange={(e) => handleUpdateSpecValue("stepCuttingFrt", c.id, "section", e.target.value)}
                              className="w-full text-center font-black bg-transparent outline-none border-b border-dashed border-slate-400 focus:border-indigo-500"
                              title="구분(구간)명 수정"
                            />
                          )}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-black dark:border-slate-600">
                      <td className="border-r border-black dark:border-slate-600 p-1 bg-amber-50 dark:bg-amber-950/40 font-bold">{t("SPEC")}</td>
                      {(currentReport.stepCuttingFrt || []).map((c) => (
                        <td key={c.id} className="border-r border-black dark:border-slate-600 p-1 text-indigo-600 dark:text-cyan-400 font-black">
                          {isWorkerRecordingMode ? (
                            <span className="font-mono font-black text-indigo-700 dark:text-cyan-300 text-xs px-2 py-0.5 rounded bg-indigo-50 dark:bg-slate-800 border border-indigo-200 dark:border-indigo-900/60 inline-block">
                              🔒 {c.spec}
                            </span>
                          ) : (
                            <input
                              type="text"
                              value={c.spec}
                              onChange={(e) => handleUpdateSpecValue("stepCuttingFrt", c.id, "spec", e.target.value)}
                              className="w-full text-center bg-transparent outline-none font-black"
                            />
                          )}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-black dark:border-slate-600">
                      <td className="border-r border-black dark:border-slate-600 p-1 font-bold">{t("초물(Start)")}</td>
                      {(currentReport.stepCuttingFrt || []).map((c) => (
                        <td key={c.id} className="border-r border-black dark:border-slate-600 p-1">
                          <input
                            type="text"
                            value={c.startVal || ""}
                            onChange={(e) => handleUpdateSpecValue("stepCuttingFrt", c.id, "startVal", e.target.value)}
                            className="w-full text-center bg-transparent outline-none font-mono"
                          />
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-black dark:border-slate-600">
                      <td className="border-r border-black dark:border-slate-600 p-1 font-bold">{t("중물(Half)")}</td>
                      {(currentReport.stepCuttingFrt || []).map((c) => (
                        <td key={c.id} className="border-r border-black dark:border-slate-600 p-1">
                          <input
                            type="text"
                            value={c.halfVal || ""}
                            onChange={(e) => handleUpdateSpecValue("stepCuttingFrt", c.id, "halfVal", e.target.value)}
                            className="w-full text-center bg-transparent outline-none font-mono"
                          />
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="border-r border-black dark:border-slate-600 p-1 font-bold">{t("종물(Finish)")}</td>
                      {(currentReport.stepCuttingFrt || []).map((c) => (
                        <td key={c.id} className="border-r border-black dark:border-slate-600 p-1">
                          <input
                            type="text"
                            value={c.finishVal || ""}
                            onChange={(e) => handleUpdateSpecValue("stepCuttingFrt", c.id, "finishVal", e.target.value)}
                            className="w-full text-center bg-transparent outline-none font-mono"
                          />
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            ), { canAddRow: true, onAddRow: () => handleAddStepCuttingRow("FRT"), customBadge: "사진 2" })}

            {renderBlockWrapper("stepCuttingRr", "[블록 3] 단컷팅 RR 구간 치수 (40/39mm)", (
              <div className="space-y-1.5 border border-black dark:border-slate-600 rounded-xl p-2.5 bg-slate-50/50 dark:bg-slate-950/40">
                <div className="flex items-center justify-between pb-1 border-b border-slate-300 dark:border-slate-700">
                  <span className="font-black text-xs text-slate-900 dark:text-white">
                    🧱 {t("[블록 3] 단컷팅 RR 구간 치수 (40/39mm)")}
                  </span>
                  {!isWorkerRecordingMode && (
                    <button
                      type="button"
                      onClick={() => handleAddStepCuttingRow("RR")}
                      className="px-2 py-0.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10.5px] cursor-pointer"
                    >
                      {t("+ 행 추가")}
                    </button>
                  )}
                </div>
                <table className="w-full border-collapse border border-black dark:border-slate-600 text-xs text-center font-bold">
                  <thead>
                    <tr className="bg-amber-100 dark:bg-amber-950/70 border-b border-black dark:border-slate-600 text-[11px]">
                      <th className="border-r border-black dark:border-slate-600 p-1 w-1/4">{t("구분")}</th>
                      {(currentReport.stepCuttingRr || []).map((c) => (
                        <th key={c.id} className="border-r border-black dark:border-slate-600 p-1">
                          {isWorkerRecordingMode ? (
                            <span>{c.section || ""}</span>
                          ) : (
                            <input
                              type="text"
                              value={c.section || ""}
                              onChange={(e) => handleUpdateSpecValue("stepCuttingRr", c.id, "section", e.target.value)}
                              className="w-full text-center font-black bg-transparent outline-none border-b border-dashed border-slate-400 focus:border-indigo-500"
                              title="구분(구간)명 수정"
                            />
                          )}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-black dark:border-slate-600">
                      <td className="border-r border-black dark:border-slate-600 p-1 bg-amber-50 dark:bg-amber-950/40 font-bold">{t("SPEC")}</td>
                      {(currentReport.stepCuttingRr || []).map((c) => (
                        <td key={c.id} className="border-r border-black dark:border-slate-600 p-1 text-indigo-600 dark:text-cyan-400 font-black">
                          {isWorkerRecordingMode ? (
                            <span className="font-mono font-black text-indigo-700 dark:text-cyan-300 text-xs px-2 py-0.5 rounded bg-indigo-50 dark:bg-slate-800 border border-indigo-200 dark:border-indigo-900/60 inline-block">
                              🔒 {c.spec}
                            </span>
                          ) : (
                            <input
                              type="text"
                              value={c.spec}
                              onChange={(e) => handleUpdateSpecValue("stepCuttingRr", c.id, "spec", e.target.value)}
                              className="w-full text-center bg-transparent outline-none font-black"
                            />
                          )}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-black dark:border-slate-600">
                      <td className="border-r border-black dark:border-slate-600 p-1 font-bold">{t("초물(Start)")}</td>
                      {(currentReport.stepCuttingRr || []).map((c) => (
                        <td key={c.id} className="border-r border-black dark:border-slate-600 p-1">
                          <input
                            type="text"
                            value={c.startVal || ""}
                            onChange={(e) => handleUpdateSpecValue("stepCuttingRr", c.id, "startVal", e.target.value)}
                            className="w-full text-center bg-transparent outline-none font-mono"
                          />
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-black dark:border-slate-600">
                      <td className="border-r border-black dark:border-slate-600 p-1 font-bold">{t("중물(Half)")}</td>
                      {(currentReport.stepCuttingRr || []).map((c) => (
                        <td key={c.id} className="border-r border-black dark:border-slate-600 p-1">
                          <input
                            type="text"
                            value={c.halfVal || ""}
                            onChange={(e) => handleUpdateSpecValue("stepCuttingRr", c.id, "halfVal", e.target.value)}
                            className="w-full text-center bg-transparent outline-none font-mono"
                          />
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="border-r border-black dark:border-slate-600 p-1 font-bold">{t("종물(Finish)")}</td>
                      {(currentReport.stepCuttingRr || []).map((c) => (
                        <td key={c.id} className="border-r border-black dark:border-slate-600 p-1">
                          <input
                            type="text"
                            value={c.finishVal || ""}
                            onChange={(e) => handleUpdateSpecValue("stepCuttingRr", c.id, "finishVal", e.target.value)}
                            className="w-full text-center bg-transparent outline-none font-mono"
                          />
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            ), { canAddRow: true, onAddRow: () => handleAddStepCuttingRow("RR"), customBadge: "사진 3" })}

            {/* ================================================================= */}
            {/* 🧱 BLOCK 10: 불량소재구분 8열 매트릭스 (사진 10) */}
            {/* ================================================================= */}
            {renderBlockWrapper("defectMaterialMatrix", "[블록 10] 불량소재구분 8열 매트릭스", (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between pb-1">
                  <span className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>🧱 {t("[블록 10] 불량소재구분 (8열 매트릭스: 압출불량 & 공정간불량) (사진 10 대조)")}</span>
                  </span>
                </div>
                <div className="overflow-x-auto border border-black dark:border-slate-600 rounded-xl">
                  <table className="w-full border-collapse text-xs text-center font-bold">
                    <thead>
                      <tr className="bg-amber-100 dark:bg-amber-950/70 border-b border-black dark:border-slate-600 text-[11px]">
                        <th rowSpan={2} colSpan={2} className="border-r border-black dark:border-slate-600 p-1 w-[20%]">{t("구 분(Division)")}</th>
                        <th colSpan={4} className="border-r border-black dark:border-slate-600 p-1">FRT</th>
                        <th colSpan={4} className="p-1">RR</th>
                      </tr>
                      <tr className="bg-amber-50 dark:bg-amber-950/50 border-b border-black dark:border-slate-600 text-[10px]">
                        <th className="border-r border-black dark:border-slate-600 p-0.5">LH A</th>
                        <th className="border-r border-black dark:border-slate-600 p-0.5">RH A</th>
                        <th className="border-r border-black dark:border-slate-600 p-0.5">LH B</th>
                        <th className="border-r border-black dark:border-slate-600 p-0.5">RH B</th>
                        <th className="border-r border-black dark:border-slate-600 p-0.5">LH A</th>
                        <th className="border-r border-black dark:border-slate-600 p-0.5">RH A</th>
                        <th className="border-r border-black dark:border-slate-600 p-0.5">LH B</th>
                        <th className="p-0.5">RH B</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(currentReport.defectMaterialMatrix || []).map((row, idx) => (
                        <tr key={row.id || idx} className="border-b border-black dark:border-slate-600">
                          {idx === 0 && (
                            <td rowSpan={4} className="border-r border-black dark:border-slate-600 bg-amber-50 dark:bg-amber-950/30 p-1 font-black w-20">
                              {isWorkerRecordingMode ? (
                                <span className="w-full text-center font-black text-xs block">
                                  {t(currentReport.defectMatCat1Label ?? "압출소재불량")}
                                </span>
                              ) : (
                                <input
                                  type="text"
                                  value={t(currentReport.defectMatCat1Label ?? "압출소재불량")}
                                  onChange={(e) => handleUpdateField("defectMatCat1Label", e.target.value)}
                                  className="w-full text-center font-black text-xs bg-transparent outline-none border-b border-dashed border-slate-400 focus:border-indigo-500"
                                  title="구분 분류명 수정"
                                />
                              )}
                            </td>
                          )}
                          {idx === 4 && (
                            <td rowSpan={2} className="border-r border-black dark:border-slate-600 bg-amber-50 dark:bg-amber-950/30 p-1 font-black w-20">
                              {isWorkerRecordingMode ? (
                                <span className="w-full text-center font-black text-xs block">
                                  {t(currentReport.defectMatCat2Label ?? "공정간불량")}
                                </span>
                              ) : (
                                <input
                                  type="text"
                                  value={t(currentReport.defectMatCat2Label ?? "공정간불량")}
                                  onChange={(e) => handleUpdateField("defectMatCat2Label", e.target.value)}
                                  className="w-full text-center font-black text-xs bg-transparent outline-none border-b border-dashed border-slate-400 focus:border-indigo-500"
                                  title="구분 분류명 수정"
                                />
                              )}
                            </td>
                          )}
                          <td className="border-r border-black dark:border-slate-600 p-1 text-left px-1 font-bold bg-slate-50 dark:bg-slate-800">
                            {isWorkerRecordingMode ? (
                              <span className="font-bold text-xs block px-1">{t(row.name || "")}</span>
                            ) : (
                              <input
                                type="text"
                                value={t(row.name || "")}
                                onChange={(e) => handleUpdateSpecValue("defectMaterialMatrix", row.id, "name", e.target.value)}
                                className="w-full font-bold bg-transparent outline-none border-b border-dashed border-slate-300 dark:border-slate-600 focus:border-indigo-500 px-1"
                                title="구분(불량 항목)명 수정"
                              />
                            )}
                          </td>
                          <td className="border-r border-black dark:border-slate-600 p-0.5 font-mono">
                            <input
                              type="number"
                              value={row.frtLhA || 0}
                              onChange={(e) => handleUpdateSpecValue("defectMaterialMatrix", row.id, "frtLhA", Number(e.target.value))}
                              className="w-full text-center bg-transparent outline-none font-mono"
                            />
                          </td>
                          <td className="border-r border-black dark:border-slate-600 p-0.5 font-mono">
                            <input
                              type="number"
                              value={row.frtRhA || 0}
                              onChange={(e) => handleUpdateSpecValue("defectMaterialMatrix", row.id, "frtRhA", Number(e.target.value))}
                              className="w-full text-center bg-transparent outline-none font-mono"
                            />
                          </td>
                          <td className="border-r border-black dark:border-slate-600 p-0.5 font-mono">
                            <input
                              type="number"
                              value={row.frtLhB || 0}
                              onChange={(e) => handleUpdateSpecValue("defectMaterialMatrix", row.id, "frtLhB", Number(e.target.value))}
                              className="w-full text-center bg-transparent outline-none font-mono"
                            />
                          </td>
                          <td className="border-r border-black dark:border-slate-600 p-0.5 font-mono">
                            <input
                              type="number"
                              value={row.frtRhB || 0}
                              onChange={(e) => handleUpdateSpecValue("defectMaterialMatrix", row.id, "frtRhB", Number(e.target.value))}
                              className="w-full text-center bg-transparent outline-none font-mono"
                            />
                          </td>
                          <td className="border-r border-black dark:border-slate-600 p-0.5 font-mono">
                            <input
                              type="number"
                              value={row.rrLhA || 0}
                              onChange={(e) => handleUpdateSpecValue("defectMaterialMatrix", row.id, "rrLhA", Number(e.target.value))}
                              className="w-full text-center bg-transparent outline-none font-mono"
                            />
                          </td>
                          <td className="border-r border-black dark:border-slate-600 p-0.5 font-mono">
                            <input
                              type="number"
                              value={row.rrRhA || 0}
                              onChange={(e) => handleUpdateSpecValue("defectMaterialMatrix", row.id, "rrRhA", Number(e.target.value))}
                              className="w-full text-center bg-transparent outline-none font-mono"
                            />
                          </td>
                          <td className="border-r border-black dark:border-slate-600 p-0.5 font-mono">
                            <input
                              type="number"
                              value={row.rrLhB || 0}
                              onChange={(e) => handleUpdateSpecValue("defectMaterialMatrix", row.id, "rrLhB", Number(e.target.value))}
                              className="w-full text-center bg-transparent outline-none font-mono"
                            />
                          </td>
                          <td className="p-0.5 font-mono">
                            <input
                              type="number"
                              value={row.rrRhB || 0}
                              onChange={(e) => handleUpdateSpecValue("defectMaterialMatrix", row.id, "rrRhB", Number(e.target.value))}
                              className="w-full text-center bg-transparent outline-none font-mono"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ), { customBadge: "사진 10" })}

            {/* ================================================================= */}
            {/* 🧱 BLOCK 16: 불량소재구분 (Section A / B / C 3단면) (사진 16) */}
            {/* ================================================================= */}
            {renderBlockWrapper("defectSectionAbc", "[블록 16] 불량소재구분 (Section A / B / C 3단면)", (
              <div className="space-y-1.5 border border-black dark:border-slate-600 rounded-xl p-3 bg-slate-50/50 dark:bg-slate-950/40">
                <div className="flex items-center justify-between pb-1 border-b border-slate-300 dark:border-slate-700">
                  <span className="font-black text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>🧱 {t("[블록 16] 불량소재구분 (Section A / B / C 3단면) (사진 16 대조)")}</span>
                  </span>
                  {!isWorkerRecordingMode && (
                    <button
                      type="button"
                      onClick={handleAddDefectSectionAbcRow}
                      className="px-2 py-0.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10.5px] cursor-pointer"
                    >
                      {t("+ 항목 추가")}
                    </button>
                  )}
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-black dark:border-slate-600 text-xs text-center font-bold">
                    <thead>
                      <tr className="bg-amber-100 dark:bg-amber-950/70 border-b border-black dark:border-slate-600 text-[11px]">
                        <th className="border-r border-black dark:border-slate-600 p-1 w-1/2">{t("구 분 (Division)")}</th>
                        <th className="border-r border-black dark:border-slate-600 p-1">Section A</th>
                        <th className="border-r border-black dark:border-slate-600 p-1">Section B</th>
                        <th className="p-1">Section C</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(currentReport.defectSectionAbc || []).map((row) => (
                        <tr key={row.id} className="border-b border-black dark:border-slate-600">
                          <td className="border-r border-black dark:border-slate-600 p-1 text-left px-1 font-bold bg-slate-50 dark:bg-slate-800">
                            {isWorkerRecordingMode ? (
                              <span className="font-bold text-xs block px-1">{t(row.name || "")}</span>
                            ) : (
                              <input
                                type="text"
                                value={t(row.name || "")}
                                onChange={(e) => handleUpdateSpecValue("defectSectionAbc", row.id, "name", e.target.value)}
                                className="w-full font-bold bg-transparent outline-none border-b border-dashed border-slate-300 dark:border-slate-600 focus:border-indigo-500 px-1"
                                title="구분(불량 항목)명 수정"
                              />
                            )}
                          </td>
                          <td className="border-r border-black dark:border-slate-600 p-1">
                            <input
                              type="number"
                              value={row.secA || 0}
                              onChange={(e) => handleUpdateSpecValue("defectSectionAbc", row.id, "secA", Number(e.target.value))}
                              className="w-full text-center bg-transparent outline-none font-mono"
                            />
                          </td>
                          <td className="border-r border-black dark:border-slate-600 p-1">
                            <input
                              type="number"
                              value={row.secB || 0}
                              onChange={(e) => handleUpdateSpecValue("defectSectionAbc", row.id, "secB", Number(e.target.value))}
                              className="w-full text-center bg-transparent outline-none font-mono"
                            />
                          </td>
                          <td className="p-1">
                            <input
                              type="number"
                              value={row.secC || 0}
                              onChange={(e) => handleUpdateSpecValue("defectSectionAbc", row.id, "secC", Number(e.target.value))}
                              className="w-full text-center bg-transparent outline-none font-mono"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ), { canAddRow: true, onAddRow: handleAddDefectSectionAbcRow, customBadge: "사진 16" })}

            {/* ================================================================= */}
            {/* 🧱 BLOCK 1: 조인트 작업자 / 시간 / 생산수량 (사진 1) */}
            {/* ================================================================= */}
            {renderBlockWrapper("timeAndOutput", "[블록 1] 조인트 작업자 / 시간 / 생산수량", (
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 block">
                  🧱 {t("[블록 1] 조인트 작업자 / 시간 / 생산수량")}
                </span>
                <div className="overflow-x-auto border border-black dark:border-slate-600 rounded-xl">
                  <table className="w-full border-collapse text-xs text-center font-bold">
                    <thead>
                      <tr className="bg-amber-100 dark:bg-amber-950/70 border-b border-black dark:border-slate-600 text-[11px]">
                        <th className="border-r border-black dark:border-slate-600 p-1.5">{t("구 분")}</th>
                        <th className="border-r border-black dark:border-slate-600 p-1.5">{t("작업자")}</th>
                        <th className="border-r border-black dark:border-slate-600 p-1.5">{t("작업시간")}</th>
                        <th className="border-r border-black dark:border-slate-600 p-1.5">{t("정품수량")}</th>
                        <th className="border-r border-black dark:border-slate-600 p-1.5">{t("불량수량")}</th>
                        <th className="p-1.5">{t("재조인트")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(currentReport.jointDivisions || ["FRT LH", "FRT RH", "RR LH", "RR RH"]).map((div, dIdx) => (
                        <tr key={dIdx} className="border-b border-black dark:border-slate-600">
                          <td className="border-r border-black dark:border-slate-600 p-1 bg-slate-50 dark:bg-slate-800 font-black">
                            {isWorkerRecordingMode ? (
                              <span className="w-full text-center font-black block">{div || ""}</span>
                            ) : (
                              <input
                                type="text"
                                value={div || ""}
                                onChange={(e) => {
                                  const nextVal = e.target.value;
                                  const list = [...(currentReport.jointDivisions || ["FRT LH", "FRT RH", "RR LH", "RR RH"])];
                                  list[dIdx] = nextVal;
                                  setCurrentReport((prev) => ({ ...prev, jointDivisions: list }));
                                }}
                                className="w-full text-center font-black bg-transparent outline-none border-b border-dashed border-slate-300 dark:border-slate-600 focus:border-indigo-500"
                                title="구분명 수정 (클릭하여 직접 변경)"
                              />
                            )}
                          </td>
                          <td className="border-r border-black dark:border-slate-600 p-1">{currentReport.workerName || t("작업자")}</td>
                          <td className="border-r border-black dark:border-slate-600 p-1 font-mono">{currentReport.startTime} ~ {currentReport.finishTime}</td>
                          <td className="border-r border-black dark:border-slate-600 p-1 font-mono text-emerald-600 font-black">350</td>
                          <td className="border-r border-black dark:border-slate-600 p-1 font-mono text-rose-600">1</td>
                          <td className="p-1 font-mono text-amber-600">1</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ), { customBadge: "사진 1" })}

            {/* ================================================================= */}
            {/* 🧱 BLOCK 4: 조인트 재료 (사진 4) */}
            {/* ================================================================= */}
            {renderBlockWrapper("jointMaterial", "[블록 4] 3. 조인트 재료 (Joint Material)", (
              <div className="space-y-2 p-3 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800">
                    <span className="text-[10px] text-slate-400 block font-bold">{t("조인트 재료명 (Joint grade name) - 사진 4")}</span>
                    {isWorkerRecordingMode ? (
                      <span className="font-black text-xs sm:text-sm text-purple-700 dark:text-purple-300 block py-1">
                        🔒 {currentReport.jointMaterial?.gradeName || "SJ-4004B (EPDM)"}
                      </span>
                    ) : (
                      <input
                        type="text"
                        value={currentReport.jointMaterial?.gradeName || ""}
                        onChange={(e) => setCurrentReport((prev) => ({
                          ...prev,
                          jointMaterial: { ...prev.jointMaterial, gradeName: e.target.value }
                        }))}
                        className="font-black text-xs sm:text-sm w-full bg-transparent outline-none text-purple-700 dark:text-purple-300"
                      />
                    )}
                  </div>
                  <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800">
                    <span className="text-[10px] text-slate-400 block font-bold">{t("조인트 재료일자 (Joint material lot no)")}</span>
                    <input
                      type="text"
                      value={currentReport.jointMaterial?.lotNo || ""}
                      onChange={(e) => setCurrentReport((prev) => ({
                        ...prev,
                        jointMaterial: { ...prev.jointMaterial, lotNo: e.target.value }
                      }))}
                      className="font-black text-xs sm:text-sm w-full bg-transparent outline-none font-mono"
                    />
                  </div>
                </div>
              </div>
            ), { customBadge: "사진 4" })}

            {/* ================================================================= */}
            {/* 🧱 BLOCK 5: 사출 온도 테이블 (사진 5) */}
            {/* ================================================================= */}
            {renderBlockWrapper("injectionTemp", "[블록 5] 4. 사출온도 (Temperature)", (
              <div className="overflow-x-auto border border-black dark:border-slate-600 rounded-xl">
                <table className="w-full border-collapse text-xs text-center font-bold">
                  <thead>
                    <tr className="bg-amber-100 dark:bg-amber-950/70 border-b border-black dark:border-slate-600 text-[11px]">
                      <th colSpan={2} className="border-r border-black dark:border-slate-600 p-1 w-1/4">{t("구 분")}</th>
                      <th className="border-r border-black dark:border-slate-600 p-1">{t("노즐(Nozzle)")}</th>
                      <th className="border-r border-black dark:border-slate-600 p-1">{t("실린더 1(N2)")}</th>
                      <th className="border-r border-black dark:border-slate-600 p-1">{t("실린더 2(H3)")}</th>
                      <th className="p-1">{t("실린더 3(H4)")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(currentReport.injectionTemps || []).map((tItem, idx) => (
                      <tr key={tItem.id || idx} className="border-b border-black dark:border-slate-600">
                        {idx === 0 && (
                          <td rowSpan={3} className="border-r border-black dark:border-slate-600 bg-amber-50 dark:bg-amber-950/30 p-1 font-black w-14">
                            Sett'g
                          </td>
                        )}
                        {idx === 3 && (
                          <td rowSpan={3} className="border-r border-black dark:border-slate-600 bg-amber-50 dark:bg-amber-950/30 p-1 font-black w-14">
                            Actual
                          </td>
                        )}
                        <td className="border-r border-black dark:border-slate-600 p-1 font-bold">{tItem.machine}</td>
                        <td className="border-r border-black dark:border-slate-600 p-1 font-mono">{tItem.nozzle}</td>
                        <td className="border-r border-black dark:border-slate-600 p-1 font-mono">{tItem.cyl1}</td>
                        <td className="border-r border-black dark:border-slate-600 p-1 font-mono">{tItem.cyl2}</td>
                        <td className="p-1 font-mono">{tItem.cyl3}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ), { customBadge: "사진 5" })}

            {/* ================================================================= */}
            {/* 🧱 BLOCK 6: 사출 조건 테이블 (사진 6) */}
            {/* ================================================================= */}
            {renderBlockWrapper("injectionCondition", "[블록 6] 5. 사출조건 (Injection Condition)", (
              <div className="overflow-x-auto border border-black dark:border-slate-600 rounded-xl">
                <table className="w-full border-collapse text-xs text-center font-bold">
                  <thead>
                    <tr className="bg-amber-100 dark:bg-amber-950/70 border-b border-black dark:border-slate-600 text-[11px]">
                      <th className="border-r border-black dark:border-slate-600 p-1 w-1/4">{t("구 분 (항목)")}</th>
                      <th className="border-r border-black dark:border-slate-600 p-1 w-1/4">{t("SPEC")}</th>
                      <th className="border-r border-black dark:border-slate-600 p-1">{t("초물 (Start)")}</th>
                      <th className="border-r border-black dark:border-slate-600 p-1">{t("중물 (Half)")}</th>
                      <th className="p-1">{t("종물 (Finish)")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(currentReport.injectionConditions || []).map((c) => (
                      <tr key={c.id} className="border-b border-black dark:border-slate-600">
                        <td className="border-r border-black dark:border-slate-600 p-1 font-bold bg-slate-50 dark:bg-slate-800">{t(c.name)}</td>
                        <td className="border-r border-black dark:border-slate-600 p-1 text-purple-700 dark:text-purple-300 font-black">
                          <span className="font-mono font-black text-purple-700 dark:text-purple-300 text-xs px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 inline-block">
                            🔒 {c.spec}
                          </span>
                        </td>
                        <td className="border-r border-black dark:border-slate-600 p-1 font-mono">{c.startVal}</td>
                        <td className="border-r border-black dark:border-slate-600 p-1 font-mono">{c.halfVal}</td>
                        <td className="p-1 font-mono">{c.finishVal}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ), { customBadge: "사진 6" })}

            {/* ================================================================= */}
            {/* 🧱 BLOCK 7: 공정불량 종합 매트릭스 (사진 7) */}
            {/* ================================================================= */}
            {renderBlockWrapper("jointDefectMatrix", "[블록 7] 6. 공정불량 종합 매트릭스", (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>🧱 {t("[블록 7] 6. 공정불량 종합 매트릭스")}</span>
                  </span>
                  {!isWorkerRecordingMode && (
                    <button
                      type="button"
                      onClick={handleAddJointDefectRow}
                      className="px-2.5 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs transition cursor-pointer flex items-center gap-1 shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{t("+ 불량 항목 추가")}</span>
                    </button>
                  )}
                </div>

                <div className="overflow-x-auto border border-black dark:border-slate-600 rounded-xl">
                  <table className="w-full border-collapse text-xs text-center font-bold">
                    <thead>
                      <tr className="bg-amber-100 dark:bg-amber-950/70 border-b border-black dark:border-slate-600 text-[11px]">
                        <th rowSpan={3} className="border-r border-black dark:border-slate-600 p-1.5 w-[20%]">{t("구 분(Division)")}</th>
                        <th colSpan={5} className="border-r border-black dark:border-slate-600 p-1">{t("폐기불량(Disposal) - 조인트작업시")}</th>
                        <th colSpan={2} className="border-r border-black dark:border-slate-600 p-1">{t("재조인트수량(Rework)")}</th>
                        <th colSpan={2} className="p-1">{t("공정간불량(재조인트 불량포함)")}</th>
                      </tr>
                      <tr className="bg-amber-50 dark:bg-amber-950/50 border-b border-black dark:border-slate-600 text-[10px]">
                        <th colSpan={3} className="border-r border-black dark:border-slate-600 p-0.5">FRT LH/RH</th>
                        <th colSpan={2} className="border-r border-black dark:border-slate-600 p-0.5">RR LH/RH</th>
                        <th colSpan={2} className="border-r border-black dark:border-slate-600 p-0.5">(EA)</th>
                        <th colSpan={2} className="p-0.5">(Process Bad)</th>
                      </tr>
                      <tr className="bg-white dark:bg-slate-900 border-b border-black dark:border-slate-600 text-[10px]">
                        <th className="border-r border-black dark:border-slate-600 p-0.5">A</th>
                        <th className="border-r border-black dark:border-slate-600 p-0.5">B</th>
                        <th className="border-r border-black dark:border-slate-600 p-0.5">C</th>
                        <th className="border-r border-black dark:border-slate-600 p-0.5">A</th>
                        <th className="border-r border-black dark:border-slate-600 p-0.5">B</th>
                        <th className="border-r border-black dark:border-slate-600 p-0.5">FRT</th>
                        <th className="border-r border-black dark:border-slate-600 p-0.5">RR</th>
                        <th className="border-r border-black dark:border-slate-600 p-0.5">FRT</th>
                        <th className="p-0.5">RR</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(currentReport.jointDefects || []).map((row, idx) => (
                        <tr key={idx} className="border-b border-black dark:border-slate-600">
                          <td className="border-r border-black dark:border-slate-600 p-1 text-left px-1 font-bold bg-slate-50 dark:bg-slate-800">
                            {isWorkerRecordingMode ? (
                              <span className="font-bold text-xs block px-1">{t(row.name || "")}</span>
                            ) : (
                              <input
                                type="text"
                                value={t(row.name || "")}
                                onChange={(e) => {
                                  const nextVal = e.target.value;
                                  setCurrentReport((prev) => ({
                                    ...prev,
                                    jointDefects: (prev.jointDefects || []).map((r, i) =>
                                      i === idx ? { ...r, name: nextVal } : r
                                    )
                                  }));
                                }}
                                className="w-full font-bold bg-transparent outline-none border-b border-dashed border-slate-300 dark:border-slate-600 focus:border-indigo-500 px-1"
                                title="구분(공정불량 항목)명 수정"
                              />
                            )}
                          </td>
                          <td className="border-r border-black dark:border-slate-600 p-0.5 font-mono">{row.frtA || ""}</td>
                          <td className="border-r border-black dark:border-slate-600 p-0.5 font-mono">{row.frtB || ""}</td>
                          <td className="border-r border-black dark:border-slate-600 p-0.5 font-mono">{row.frtC || ""}</td>
                          <td className="border-r border-black dark:border-slate-600 p-0.5 font-mono">{row.rrA || ""}</td>
                          <td className="border-r border-black dark:border-slate-600 p-0.5 font-mono">{row.rrB || ""}</td>
                          <td className="border-r border-black dark:border-slate-600 p-0.5 font-mono">{row.reworkFrt || ""}</td>
                          <td className="border-r border-black dark:border-slate-600 p-0.5 font-mono">{row.reworkRr || ""}</td>
                          <td className="border-r border-black dark:border-slate-600 p-0.5 font-mono">{row.processFrt || ""}</td>
                          <td className="p-0.5 font-mono">{row.processRr || ""}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ), { canAddRow: true, onAddRow: handleAddJointDefectRow, customBadge: "사진 7" })}

            {/* ================================================================= */}
            {/* 🧱 BLOCK 12: 도면 치수 & 중요 치수 및 검사 현황 (사진 12) */}
            {/* ================================================================= */}
            {renderBlockWrapper("drawingSpecCheck", "[블록 12] 도면 치수 & 중요 검사 현황", (
              <div className="space-y-3 p-3.5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800">
                <div className="flex items-center justify-between pb-1 border-b border-emerald-200 dark:border-emerald-800">
                  <span className="text-xs font-black text-emerald-900 dark:text-emerald-300">
                    🧱 {t("[블록 12] 도면 치수 & 중요 검사 현황")}
                  </span>
                  {!isWorkerRecordingMode && (
                    <button
                      type="button"
                      onClick={handleAddDrawingSpecRow}
                      className="px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer"
                    >
                      {t("+ 치수 행 추가")}
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                  {/* 도면 원본 다이어그램 이미지 (A, B, D 위치) */}
                  <div className="md:col-span-5 bg-white dark:bg-slate-900 p-2 rounded-xl border border-emerald-200 dark:border-emerald-800 text-center">
                    <img
                      src="/lego_images/lego_block_12.png"
                      alt="도면 치수 위치 다이어그램 (A, B, D)"
                      className="max-h-56 mx-auto object-contain rounded"
                    />
                    <span className="text-[10px] text-slate-500 block mt-1">▲ 도면 다이어그램 A, B, D 측정 위치</span>
                  </div>

                  {/* 치수 검사 테이블 */}
                  <div className="md:col-span-7 overflow-x-auto border border-black dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900">
                    <table className="w-full border-collapse text-xs text-center font-bold">
                      <thead>
                        <tr className="bg-amber-100 dark:bg-amber-950/70 border-b border-black dark:border-slate-600 text-[11px]">
                          <th rowSpan={2} className="border-r border-black dark:border-slate-600 p-1 w-1/4">{t("항 목")}</th>
                          <th rowSpan={2} className="border-r border-black dark:border-slate-600 p-1 w-1/4">{t("규 격")}</th>
                          <th colSpan={3} className="p-1">{t("실 측 치")}</th>
                        </tr>
                        <tr className="bg-amber-50 dark:bg-amber-950/50 border-b border-black dark:border-slate-600 text-[10px]">
                          <th className="border-r border-black dark:border-slate-600 p-0.5">{t("초물")}</th>
                          <th className="border-r border-black dark:border-slate-600 p-0.5">{t("중물")}</th>
                          <th className="p-0.5">{t("종물")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(currentReport.drawingSpecs || []).map((ds) => (
                          <tr key={ds.id} className="border-b border-black dark:border-slate-600">
                            <td className="border-r border-black dark:border-slate-600 p-1 font-bold bg-slate-50 dark:bg-slate-800">
                              {isWorkerRecordingMode ? (
                                <span className="w-full text-center font-bold block">{ds.section}</span>
                              ) : (
                                <input
                                  type="text"
                                  value={ds.section}
                                  onChange={(e) => handleUpdateSpecValue("drawingSpecs", ds.id, "section", e.target.value)}
                                  className="w-full text-center bg-transparent outline-none font-bold"
                                />
                              )}
                            </td>
                            <td className="border-r border-black dark:border-slate-600 p-1 text-emerald-600 dark:text-emerald-400 font-black">
                              {isWorkerRecordingMode ? (
                                <span className="font-mono font-black text-emerald-700 dark:text-emerald-300 text-xs px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 inline-block">
                                  🔒 {ds.spec}
                                </span>
                              ) : (
                                <input
                                  type="text"
                                  value={ds.spec}
                                  onChange={(e) => handleUpdateSpecValue("drawingSpecs", ds.id, "spec", e.target.value)}
                                  className="w-full text-center bg-transparent outline-none font-black"
                                />
                              )}
                            </td>
                            <td className="border-r border-black dark:border-slate-600 p-1 font-mono">
                              <input
                                type="text"
                                value={ds.startVal || ""}
                                onChange={(e) => handleUpdateSpecValue("drawingSpecs", ds.id, "startVal", e.target.value)}
                                className="w-full text-center bg-transparent outline-none font-mono"
                              />
                            </td>
                            <td className="border-r border-black dark:border-slate-600 p-1 font-mono">
                              <input
                                type="text"
                                value={ds.halfVal || ""}
                                onChange={(e) => handleUpdateSpecValue("drawingSpecs", ds.id, "halfVal", e.target.value)}
                                className="w-full text-center bg-transparent outline-none font-mono"
                              />
                            </td>
                            <td className="p-1 font-mono">
                              <input
                                type="text"
                                value={ds.finishVal || ""}
                                onChange={(e) => handleUpdateSpecValue("drawingSpecs", ds.id, "finishVal", e.target.value)}
                                className="w-full text-center bg-transparent outline-none font-mono"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ), { canAddRow: true, onAddRow: handleAddDrawingSpecRow, customBadge: "사진 12" })}

            {/* ================================================================= */}
            {/* 🧱 BLOCK 14: 완제품 직각검사 호기별 종합 매트릭스 (사진 13, 14) */}
            {/* ================================================================= */}
            {renderBlockWrapper("rightAngleMatrix", "[블록 14] 완제품 직각검사 종합 매트릭스", (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>🧱 {t("[블록 14] 완제품 직각검사 종합 매트릭스")}</span>
                  </span>
                  {!isWorkerRecordingMode && (
                    <button
                      type="button"
                      onClick={handleAddMachineRow}
                      className="px-2.5 py-1 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs cursor-pointer flex items-center gap-1 shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{t("+ 호기 라인 추가")}</span>
                    </button>
                  )}
                </div>

                <div className="overflow-x-auto border border-black dark:border-slate-600 rounded-xl">
                  <table className="w-full border-collapse text-xs text-center font-bold">
                    <thead>
                      <tr className="bg-amber-100 dark:bg-amber-950/70 border-b border-black dark:border-slate-600 text-[11px]">
                        <th colSpan={2} className="border-r border-black dark:border-slate-600 p-1 w-1/4">{t("구 분")}</th>
                        {(currentReport.machines || []).map((m) => (
                          <th key={m.id} className="border-r border-black dark:border-slate-600 p-1">
                            {isWorkerRecordingMode ? (
                              <span className="w-full text-center font-black block">{m.name || ""}</span>
                            ) : (
                              <input
                                type="text"
                                value={m.name || ""}
                                onChange={(e) => {
                                  const nextVal = e.target.value;
                                  setCurrentReport((prev) => ({
                                    ...prev,
                                    machines: (prev.machines || []).map((item) =>
                                      item.id === m.id ? { ...item, name: nextVal } : item
                                    )
                                  }));
                                }}
                                className="w-full text-center font-black bg-transparent outline-none border-b border-dashed border-slate-400 focus:border-indigo-500"
                                title="호기/구분명 수정"
                              />
                            )}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {/* 작업시간 */}
                      <tr className="border-b border-black dark:border-slate-600">
                        <td rowSpan={2} className="border-r border-black dark:border-slate-600 bg-amber-50 dark:bg-amber-950/40 p-1 font-bold w-16">
                          {t("작업시간")}
                        </td>
                        <td className="border-r border-black dark:border-slate-600 p-1 font-bold">{t("시작 시간")}</td>
                        {(currentReport.machines || []).map((m) => (
                          <td key={m.id} className="border-r border-black dark:border-slate-600 p-1 font-mono">08:00</td>
                        ))}
                      </tr>
                      <tr className="border-b border-black dark:border-slate-600">
                        <td className="border-r border-black dark:border-slate-600 p-1 font-bold">{t("종료 시간")}</td>
                        {(currentReport.machines || []).map((m) => (
                          <td key={m.id} className="border-r border-black dark:border-slate-600 p-1 font-mono">17:00</td>
                        ))}
                      </tr>

                      {/* 제품 수량 */}
                      <tr className="border-b border-black dark:border-slate-600">
                        <td rowSpan={4} className="border-r border-black dark:border-slate-600 bg-cyan-50 dark:bg-cyan-950/40 p-1 font-bold">
                          {t("제품수량")}
                        </td>
                        <td className="border-r border-black dark:border-slate-600 p-1 font-bold">{t("검 사")}</td>
                        {(currentReport.machines || []).map((m) => (
                          <td key={m.id} className="border-r border-black dark:border-slate-600 p-1 font-mono font-black">{m.inspectQty}</td>
                        ))}
                      </tr>
                      <tr className="border-b border-black dark:border-slate-600">
                        <td className="border-r border-black dark:border-slate-600 p-1 font-bold text-emerald-600">{t("정 품")}</td>
                        {(currentReport.machines || []).map((m) => (
                          <td key={m.id} className="border-r border-black dark:border-slate-600 p-1 font-mono font-black text-emerald-600">{m.goodQty}</td>
                        ))}
                      </tr>
                      <tr className="border-b border-black dark:border-slate-600">
                        <td className="border-r border-black dark:border-slate-600 p-1 font-bold text-amber-600">{t("공정불량(리워크)")}</td>
                        {(currentReport.machines || []).map((m) => (
                          <td key={m.id} className="border-r border-black dark:border-slate-600 p-1 font-mono">{m.reworkQty}</td>
                        ))}
                      </tr>
                      <tr className="border-b border-black dark:border-slate-600">
                        <td className="border-r border-black dark:border-slate-600 p-1 font-bold text-rose-600">{t("완전불량(폐기)")}</td>
                        {(currentReport.machines || []).map((m) => (
                          <td key={m.id} className="border-r border-black dark:border-slate-600 p-1 font-mono text-rose-600">{m.scrapQty}</td>
                        ))}
                      </tr>

                      {/* 압출 불량 6종 */}
                      {(currentReport.extrusionDefects || []).map((ed, idx) => (
                        <tr key={ed.id || idx} className="border-b border-black dark:border-slate-600">
                          {idx === 0 && (
                            <td rowSpan={currentReport.extrusionDefects?.length || 6} className="border-r border-black dark:border-slate-600 bg-amber-50 dark:bg-amber-950/40 p-1 font-bold">
                              {t("압출불량")}
                            </td>
                          )}
                          <td className="border-r border-black dark:border-slate-600 p-1 font-bold">
                            {isWorkerRecordingMode ? (
                              <span className="w-full text-center font-bold block">{t(ed.name || "")}</span>
                            ) : (
                              <input
                                type="text"
                                value={t(ed.name || "")}
                                onChange={(e) => {
                                  const nextVal = e.target.value;
                                  setCurrentReport((prev) => ({
                                    ...prev,
                                    extrusionDefects: (prev.extrusionDefects || []).map((item, i) =>
                                      (item.id === ed.id || i === idx) ? { ...item, name: nextVal } : item
                                    )
                                  }));
                                }}
                                className="w-full text-center font-bold bg-transparent outline-none border-b border-dashed border-slate-300 dark:border-slate-600 focus:border-indigo-500"
                                title="구분(불량 항목)명 수정"
                              />
                            )}
                          </td>
                          {(currentReport.machines || []).map((m) => (
                            <td key={m.id} className="border-r border-black dark:border-slate-600 p-1 font-mono">0</td>
                          ))}
                        </tr>
                      ))}

                      {/* 후가공 불량 9종 */}
                      {(currentReport.postDefectsList || []).map((pd, idx) => (
                        <tr key={pd.id || idx} className="border-b border-black dark:border-slate-600">
                          {idx === 0 && (
                            <td rowSpan={currentReport.postDefectsList?.length || 9} className="border-r border-black dark:border-slate-600 bg-emerald-50 dark:bg-emerald-950/40 p-1 font-bold">
                              {t("후가공불량")}
                            </td>
                          )}
                          <td className="border-r border-black dark:border-slate-600 p-1 font-bold">
                            {isWorkerRecordingMode ? (
                              <span className="w-full text-center font-bold block">{t(pd.name || "")}</span>
                            ) : (
                              <input
                                type="text"
                                value={t(pd.name || "")}
                                onChange={(e) => {
                                  const nextVal = e.target.value;
                                  setCurrentReport((prev) => ({
                                    ...prev,
                                    postDefectsList: (prev.postDefectsList || []).map((item, i) =>
                                      (item.id === pd.id || i === idx) ? { ...item, name: nextVal } : item
                                    )
                                  }));
                                }}
                                className="w-full text-center font-bold bg-transparent outline-none border-b border-dashed border-slate-300 dark:border-slate-600 focus:border-indigo-500"
                                title="구분(불량 항목)명 수정"
                              />
                            )}
                          </td>
                          {(currentReport.machines || []).map((m) => (
                            <td key={m.id} className="border-r border-black dark:border-slate-600 p-1 font-mono">0</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ), { canAddRow: true, onAddRow: handleAddMachineRow, customBadge: "사진 13, 14" })}

            {/* ================================================================= */}
            {/* 🧱 BLOCK 17: FRT 직각검사 불량 집계표 (사진 17 - 신규 완벽 탑재) */}
            {/* ================================================================= */}
            {renderBlockWrapper("frtRightAngleDefects", "[블록 17] FRT 직각검사 불량 집계표", (
              <div className="space-y-1.5 border border-black dark:border-slate-600 rounded-xl p-3 bg-slate-50/50 dark:bg-slate-950/40">
                <div className="flex items-center justify-between pb-1 border-b border-slate-300 dark:border-slate-700">
                  <span className="font-black text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>🧱 {t("[블록 17] FRT 직각검사 불량 집계표")}</span>
                  </span>
                  {!isWorkerRecordingMode && (
                    <button
                      type="button"
                      onClick={handleAddFrtRightAngleDefectRow}
                      className="px-2 py-0.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10.5px] cursor-pointer"
                    >
                      {t("+ 불량 항목 추가")}
                    </button>
                  )}
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-black dark:border-slate-600 text-xs text-center font-bold">
                    <thead>
                      <tr className="bg-amber-100 dark:bg-amber-950/70 border-b border-black dark:border-slate-600 text-[11px]">
                        <th className="border-r border-black dark:border-slate-600 p-1 w-1/2">{t("불량 항목 (Defect item)")}</th>
                        <th className="border-r border-black dark:border-slate-600 p-1">FRT LH</th>
                        <th className="border-r border-black dark:border-slate-600 p-1">FRT RH</th>
                        <th className="p-1">{t("합 계")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(currentReport.frtRightAngleDefects || []).map((row) => (
                        <tr key={row.id} className="border-b border-black dark:border-slate-600">
                          <td className="border-r border-black dark:border-slate-600 p-1 text-left px-1 font-bold bg-slate-50 dark:bg-slate-800">
                            {isWorkerRecordingMode ? (
                              <span className="w-full font-bold block px-1">{t(row.name || "")}</span>
                            ) : (
                              <input
                                type="text"
                                value={t(row.name || "")}
                                onChange={(e) => handleUpdateSpecValue("frtRightAngleDefects", row.id, "name", e.target.value)}
                                className="w-full font-bold bg-transparent outline-none border-b border-dashed border-slate-300 dark:border-slate-600 focus:border-indigo-500 px-1"
                                title="구분(불량 항목)명 수정"
                              />
                            )}
                          </td>
                          <td className="border-r border-black dark:border-slate-600 p-1">
                            <input
                              type="number"
                              value={row.frtLh || 0}
                              onChange={(e) => handleUpdateSpecValue("frtRightAngleDefects", row.id, "frtLh", Number(e.target.value))}
                              className="w-full text-center bg-transparent outline-none font-mono"
                            />
                          </td>
                          <td className="border-r border-black dark:border-slate-600 p-1">
                            <input
                              type="number"
                              value={row.frtRh || 0}
                              onChange={(e) => handleUpdateSpecValue("frtRightAngleDefects", row.id, "frtRh", Number(e.target.value))}
                              className="w-full text-center bg-transparent outline-none font-mono"
                            />
                          </td>
                          <td className="p-1 font-mono font-black text-rose-600">
                            {(Number(row.frtLh) || 0) + (Number(row.frtRh) || 0)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ), { canAddRow: true, onAddRow: handleAddFrtRightAngleDefectRow, customBadge: "사진 17" })}

            {/* ================================================================= */}
            {/* 🧱 BLOCK 11 & 16: 부자재 LOT 및 특기사항 */}
            {/* ================================================================= */}
            {renderBlockWrapper("subMaterialLot", "[블록 11] 부자재 LOT NO. (패드 5T)", (
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-[11px] font-black text-indigo-600 dark:text-indigo-400 block">
                  🧱 {t("[블록 11] 부자재 LOT NO. (패드 5T)")}
                </span>
                <input
                  type="text"
                  value={currentReport.subMaterialLot || ""}
                  onChange={(e) => handleUpdateField("subMaterialLot", e.target.value)}
                  className="w-full font-bold text-xs bg-transparent outline-none border-b border-dashed border-slate-400 py-1"
                  placeholder={t("패드 5T 입고일자 및 LOT 번호 입력")}
                />
              </div>
            ), { customBadge: "사진 11" })}

            {renderBlockWrapper("remarks", "특기 사항 및 조치사항", (
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-[11px] font-black text-slate-400 block">{t("■ 특기 사항 (조치사항)")}</span>
                <input
                  type="text"
                  value={currentReport.remarks || ""}
                  onChange={(e) => handleUpdateField("remarks", e.target.value)}
                  className="w-full font-bold text-xs bg-transparent outline-none border-b border-dashed border-slate-400 py-1"
                  placeholder={t("설비 이상, 원부자재 교체, 조치사항 등 입력")}
                />
              </div>
            ), { customBadge: "공통" })}

            {renderBlockWrapper("bladeReplacementBlock", "칼날교체주기 관리 블록 (횟수설정 / 교체 리셋)", (
              <BladeReplacementCycleBlock
                todayProductionQty={
                  (currentReport.workTimeOutput || []).reduce(
                    (sum, r) => sum + (Number(r.qtyA) || 0) + (Number(r.qtyB) || 0),
                    0
                  ) +
                  (currentReport.timeAndOutput || []).reduce(
                    (sum, r) => sum + (Number(r.goodQty) || 0) + (Number(r.defectQty) || 0),
                    0
                  )
                }
                config={currentReport.bladeReplacementConfig || {}}
                workerName={currentReport.workerName || t("작업자")}
                currentLang={currentLang}
                onChangeConfig={(nextCfg) =>
                  setCurrentReport((prev) => ({
                    ...prev,
                    bladeReplacementConfig: nextCfg
                  }))
                }
              />
            ), { customBadge: "공통" })}

            {renderBlockWrapper("moldShotCountBlock", "금형숏트수관리 블록 (습합·검증완료 / 리셋)", (
              <MoldShotCountManageBlock
                todayProductionQty={
                  (currentReport.workTimeOutput || []).reduce(
                    (sum, r) => sum + (Number(r.qtyA) || 0) + (Number(r.qtyB) || 0),
                    0
                  ) +
                  (currentReport.timeAndOutput || []).reduce(
                    (sum, r) => sum + (Number(r.goodQty) || 0) + (Number(r.defectQty) || 0),
                    0
                  )
                }
                config={currentReport.moldShotCountConfig || {}}
                workerName={currentReport.workerName || t("작업자")}
                currentLang={currentLang}
                onChangeConfig={(nextCfg) =>
                  setCurrentReport((prev) => ({
                    ...prev,
                    moldShotCountConfig: nextCfg
                  }))
                }
              />
            ), { customBadge: "공통" })}

            {renderBlockWrapper("downtimeDefectPanel", "비가동 및 부적합품 발생내역 (조치전·후 사진)", (
              <CommonDowntimeDefectPanel
                title={t("비가동 및 부적합품 발생내역")}
                plantLabel={currentReport.companyName || "작업일보 공통"}
                unitLabel="부적합량(EA/kg)"
                currentLang={currentLang}
                events={currentReport.downtimeEvents || []}
                onChangeEvents={(nextEvents) =>
                  setCurrentReport((prev) => ({
                    ...prev,
                    downtimeEvents: nextEvents
                  }))
                }
              />
            ), { customBadge: "공통" })}

            {/* ================================================================= */}
            {/* 🧱 CUSTOM PHOTO-ANALYZED LEGO BLOCKS (그림파일 분석·저장 블록들) */}
            {/* ================================================================= */}
            {combinedSwitchCatalog
              .filter((item) => item.isCustom && item.customData)
              .map((item, cbIdx) => {
              const cb = item.customData;
              const bKey = cb.key || cb.id;
              const cols = Array.isArray(currentReport.customBlockTables?.[bKey]?.columns) &&
                currentReport.customBlockTables[bKey].columns.length > 0
                ? currentReport.customBlockTables[bKey].columns
                : Array.isArray(cb.columns) && cb.columns.length > 0
                ? cb.columns
                : ["항목 1", "항목 2", "항목 3"];
              const rowsData = Array.isArray(currentReport.customBlockTables?.[bKey]?.rows)
                ? currentReport.customBlockTables[bKey].rows
                : Array.isArray(cb.rows)
                ? cb.rows
                : [["", "", ""]];

              const handleMoveCustomColumn = (fromIdx, toIdx) => {
                if (fromIdx === null || toIdx === null || fromIdx === toIdx) return;
                if (toIdx < 0 || toIdx >= cols.length) return;
                const nextCols = [...cols];
                const [movedCol] = nextCols.splice(fromIdx, 1);
                nextCols.splice(toIdx, 0, movedCol);

                const nextRows = rowsData.map((r) => {
                  const nextRow = [...r];
                  const [movedCell] = nextRow.splice(fromIdx, 1);
                  nextRow.splice(toIdx, 0, movedCell);
                  return nextRow;
                });

                setCurrentReport((prev) => ({
                  ...prev,
                  customBlockTables: {
                    ...(prev.customBlockTables || {}),
                    [bKey]: {
                      columns: nextCols,
                      rows: nextRows
                    }
                  }
                }));
                showToast(`↔️ [${movedCol}] 열이 ${toIdx + 1}번째 순서로 변경되었습니다.`);
              };

              const handleUpdateCustomCell = (rIdx, cIdx, val) => {
                const nextRows = rowsData.map((r, rI) =>
                  rI === rIdx ? r.map((c, cI) => (cI === cIdx ? val : c)) : [...r]
                );
                setCurrentReport((prev) => ({
                  ...prev,
                  customBlockTables: {
                    ...(prev.customBlockTables || {}),
                    [bKey]: {
                      columns: cols,
                      rows: nextRows
                    }
                  }
                }));
              };

              const handleAddCustomRow = () => {
                const emptyRow = cols.map((_, idx) => (idx === 0 ? `구간 ${rowsData.length + 1}` : ""));
                const nextRows = [...rowsData, emptyRow];
                setCurrentReport((prev) => ({
                  ...prev,
                  customBlockTables: {
                    ...(prev.customBlockTables || {}),
                    [bKey]: {
                      columns: cols,
                      rows: nextRows
                    }
                  }
                }));
                showToast(`➕ [${cb.title || cb.label}] 블록에 새 행이 추가되었습니다.`);
              };

              const handleDeleteCustomRow = (rIdx) => {
                if (rowsData.length <= 1) return;
                const nextRows = rowsData.filter((_, i) => i !== rIdx);
                setCurrentReport((prev) => ({
                  ...prev,
                  customBlockTables: {
                    ...(prev.customBlockTables || {}),
                    [bKey]: {
                      columns: cols,
                      rows: nextRows
                    }
                  }
                }));
              };

              return (
                <React.Fragment key={bKey}>
                  {renderBlockWrapper(
                    bKey,
                    cb.title || `[블록 ${18 + cbIdx}] ${cb.label}`,
                    <div className="space-y-2 border border-black dark:border-slate-600 rounded-xl p-3 bg-slate-50/50 dark:bg-slate-950/40">
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse border border-black dark:border-slate-600 text-xs text-center font-bold">
                          <thead>
                            <tr className="bg-amber-100 dark:bg-amber-950/70 border-b border-black dark:border-slate-600 text-[11px]">
                              {cols.map((colName, cIdx) => {
                                const isColDragged =
                                  draggedCustomCol?.bKey === bKey && draggedCustomCol?.colIdx === cIdx;
                                const isColDragOver =
                                  dragOverCustomCol?.bKey === bKey &&
                                  dragOverCustomCol?.colIdx === cIdx &&
                                  draggedCustomCol?.colIdx !== cIdx;
                                return (
                                  <th
                                    key={cIdx}
                                    draggable={!isWorkerRecordingMode}
                                    onDragStart={(e) => {
                                      if (isWorkerRecordingMode) return;
                                      e.stopPropagation();
                                      setDraggedCustomCol({ bKey, colIdx: cIdx });
                                      e.dataTransfer.effectAllowed = "move";
                                    }}
                                    onDragOver={(e) => {
                                      if (isWorkerRecordingMode) return;
                                      e.preventDefault();
                                      e.stopPropagation();
                                      e.dataTransfer.dropEffect = "move";
                                      if (
                                        dragOverCustomCol?.bKey !== bKey ||
                                        dragOverCustomCol?.colIdx !== cIdx
                                      ) {
                                        setDragOverCustomCol({ bKey, colIdx: cIdx });
                                      }
                                    }}
                                    onDragLeave={(e) => {
                                      if (isWorkerRecordingMode) return;
                                      e.stopPropagation();
                                      if (
                                        dragOverCustomCol?.bKey === bKey &&
                                        dragOverCustomCol?.colIdx === cIdx
                                      ) {
                                        setDragOverCustomCol(null);
                                      }
                                    }}
                                    onDrop={(e) => {
                                      if (isWorkerRecordingMode) return;
                                      e.preventDefault();
                                      e.stopPropagation();
                                      if (draggedCustomCol?.bKey === bKey) {
                                        handleMoveCustomColumn(draggedCustomCol.colIdx, cIdx);
                                      }
                                      setDraggedCustomCol(null);
                                      setDragOverCustomCol(null);
                                    }}
                                    onDragEnd={(e) => {
                                      if (isWorkerRecordingMode) return;
                                      e.stopPropagation();
                                      setDraggedCustomCol(null);
                                      setDragOverCustomCol(null);
                                    }}
                                    className={`border-r border-black dark:border-slate-600 p-1.5 select-none transition-all ${
                                      !isWorkerRecordingMode ? "cursor-grab active:cursor-grabbing" : ""
                                    } ${
                                      isColDragged ? "opacity-40 scale-95 " : ""
                                    }${
                                      isColDragOver ? "border-l-4 border-l-indigo-500 bg-indigo-500/20 " : ""
                                    }`}
                                    title={!isWorkerRecordingMode ? "마우스로 잡고 좌우로 드래그하여 열 순서를 변경할 수 있습니다" : undefined}
                                  >
                                    {isWorkerRecordingMode ? (
                                      <span className="text-center font-bold block">{colName || ""}</span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 w-full justify-center">
                                        <span className="text-[10px] text-amber-700 dark:text-amber-300 print:hidden">⠿</span>
                                        <input
                                          type="text"
                                          value={colName || ""}
                                          onClick={(e) => e.stopPropagation()}
                                          onChange={(e) => {
                                            const nextCols = [...cols];
                                            nextCols[cIdx] = e.target.value;
                                            setCurrentReport((prev) => ({
                                              ...prev,
                                              customBlockTables: {
                                                ...(prev.customBlockTables || {}),
                                                [bKey]: {
                                                  columns: nextCols,
                                                  rows: rowsData
                                                }
                                              }
                                            }));
                                          }}
                                          className="text-center font-bold bg-transparent outline-none border-b border-dashed border-slate-400 focus:border-indigo-500 max-w-[120px]"
                                          title="열(구분) 명칭 수정"
                                        />
                                      </span>
                                    )}
                                  </th>
                                );
                              })}
                              {!isWorkerRecordingMode && <th className="p-1 w-10 print:hidden">삭제</th>}
                            </tr>
                          </thead>
                          <tbody>
                            {rowsData.map((rowArr, rIdx) => (
                              <tr key={rIdx} className="border-b border-black dark:border-slate-600">
                                {cols.map((_, cIdx) => (
                                  <td
                                    key={cIdx}
                                    className={`border-r border-black dark:border-slate-600 p-1 ${
                                      cIdx === 0 ? "bg-slate-50 dark:bg-slate-800 font-black" : ""
                                    }`}
                                  >
                                    {isWorkerRecordingMode && cIdx === 0 ? (
                                      <span className="w-full text-center block font-black">{rowArr?.[0] ?? ""}</span>
                                    ) : (
                                      <input
                                        type="text"
                                        value={rowArr?.[cIdx] ?? ""}
                                        onChange={(e) => handleUpdateCustomCell(rIdx, cIdx, e.target.value)}
                                        className="w-full text-center bg-transparent outline-none font-bold"
                                      />
                                    )}
                                  </td>
                                ))}
                                {!isWorkerRecordingMode && (
                                  <td className="p-1 print:hidden">
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteCustomRow(rIdx)}
                                      className="text-rose-500 hover:text-rose-700 text-xs font-black px-1 cursor-pointer"
                                      title="행 삭제"
                                    >
                                      ✕
                                    </button>
                                  </td>
                                )}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>,
                    {
                      canAddRow: !isWorkerRecordingMode,
                      onAddRow: handleAddCustomRow,
                      customBadge: cb.badge || `사진 ${18 + cbIdx} (AI분석)`
                    }
                  )}
                </React.Fragment>
              );
            })}

            </div>

            {/* Bottom Register Action Bar */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 flex-wrap">
              <span className="text-xs text-slate-500 font-bold">
                💡 {t("작성된 모든 치수 및 수량은 데이터베이스에 안전하게 영구 저장됩니다.")}
              </span>
              <div className="flex items-center gap-2">
                {(onDeleteWorkReport || (currentReport.id && savedTemplates.some((t) => t.id === currentReport.id))) && (
                  <button
                    type="button"
                    onClick={async () => {
                      const repTitle = currentReport.title || currentReport.partName || "작업일보";
                      if (!window.confirm(`정말로 이 등록된 작업일보 [${repTitle}] 항목을 영구 삭제하시겠습니까?\n삭제 후에는 복구할 수 없습니다.`)) return;
                      try {
                        if (onDeleteWorkReport) {
                          await onDeleteWorkReport();
                        } else if (currentReport.id) {
                          await deleteWorkReportTemplate(currentReport.id);
                          try { await deleteMachiningWorkReport(currentReport.id); } catch (err) {}
                          setCurrentReport(PRESET_REPORTS[0]);
                          setAppliedTemplateBanner(null);
                          showToast(`🗑️ [${repTitle}] 작업일보가 영구 삭제되었습니다.`);
                        }
                      } catch (err) {
                        alert("삭제 중 오류가 발생했습니다: " + err.message);
                      }
                    }}
                    className="px-4 py-2.5 rounded-2xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 font-black text-xs sm:text-sm transition cursor-pointer flex items-center gap-1.5"
                    title={t("등록된 작업일보 영구 삭제")}
                  >
                    <Trash2 className="w-4 h-4 text-rose-500" />
                    <span>{t("일보 삭제")}</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleSaveOfficialWorkReport}
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs sm:text-sm shadow-xl shadow-emerald-600/30 transition active:scale-95 cursor-pointer flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSubmitting ? t("데이터베이스 저장 중...") : isWorkerRecordingMode ? `💾 ${t("작업일보 기록 저장 (DB 등록)")}` : `✅ ${t("작업일보 공식 등록 (DB 저장)")}`}</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ======================================================================= */}
      {/* 🧱 MODAL: 레고 블록모음 & 블록사진 AI 분석·저장 센터 */}
      {/* ======================================================================= */}
      <LegoBlockCollectionModal
        isOpen={showPhotoRefModal}
        onClose={() => setShowPhotoRefModal(false)}
        standardBlocks={LEGO_IMAGE_REFERENCES}
        customBlocks={customBlocks}
        activeBlocks={currentReport.activeBlocks}
        onToggleBlock={handleToggleBlock}
        initialTab={photoModalTab}
        onShowToast={showToast}
        onCustomBlockSaved={(saved) => {
          const bKey = saved.key || saved.id;
          setCustomBlocks((prev) => [
            saved,
            ...prev.filter((b) => (b.id || b.key) !== bKey)
          ]);
          setCurrentReport((prev) => ({
            ...prev,
            activeBlocks: {
              ...(prev.activeBlocks || {}),
              [bKey]: true
            },
            customBlockTables: {
              ...(prev.customBlockTables || {}),
              [bKey]: {
                columns: saved.columns || [],
                rows: saved.rows || []
              }
            }
          }));
          setSelectedBlockKey(bKey);
        }}
      />

      {/* ======================================================================= */}
      {/* ✏️ MODAL: 레고 블록 속성 편집기 (In-App Inspector Modal) */}
      {/* ======================================================================= */}
      <LegoBlockEditorModal
        isOpen={isBlockEditorOpen}
        onClose={() => setIsBlockEditorOpen(false)}
        blockKey={editingBlockKey}
        currentReport={currentReport}
        onUpdateReport={setCurrentReport}
        onShowToast={showToast}
      />

      {/* ======================================================================= */}
      {/* 💾 MODAL: 5대 공정 템플릿 보관함 저장 (고시인성 다크 모달) */}
      {/* ======================================================================= */}
      {isSaveCatalogModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 text-white border-2 border-indigo-500/50 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 text-left">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-indigo-600 text-white shadow-md">
                  <FolderPlus className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-black text-white">
                      5대 공정 템플릿 보관함 저장
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 flex items-center gap-1">
                      <Database className="w-3 h-3 text-cyan-300" />
                      <span>DB 보관함 공식등록</span>
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">
                    현재 구성한 레고블록 양식을 템플릿 카탈로그에 공식 등록합니다.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSaveCatalogModalOpen(false)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block font-black text-cyan-300 mb-1">
                  5대 공정 대분류 선택
                </label>
                <select
                  value={catalogMeta.categoryId}
                  onChange={(e) => setCatalogMeta({ ...catalogMeta, categoryId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-600 bg-slate-800 text-white font-bold outline-none focus:border-cyan-400"
                >
                  {REPORT_MAJOR_CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name} ({cat.desc})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-black text-cyan-300 mb-1">
                  템플릿 양식명
                </label>
                <input
                  type="text"
                  value={catalogMeta.title}
                  onChange={(e) => setCatalogMeta({ ...catalogMeta, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-600 bg-slate-800 text-white font-bold outline-none focus:border-cyan-400"
                  placeholder="예: JA G/RUN 표준 정밀가공 작업일보"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-black text-cyan-300 mb-1">
                    적용 차종
                  </label>
                  <input
                    type="text"
                    value={catalogMeta.carModel}
                    onChange={(e) => setCatalogMeta({ ...catalogMeta, carModel: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-600 bg-slate-800 text-amber-300 font-black outline-none focus:border-cyan-400"
                    placeholder="예: JA, DL3, EV6"
                  />
                </div>
                <div>
                  <label className="block font-black text-cyan-300 mb-1">
                    품명
                  </label>
                  <input
                    type="text"
                    value={catalogMeta.partName}
                    onChange={(e) => setCatalogMeta({ ...catalogMeta, partName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-600 bg-slate-800 text-white font-bold outline-none focus:border-cyan-400"
                    placeholder="예: G/RUN, W/STRIP"
                  />
                </div>
              </div>

              <div>
                <label className="block font-black text-cyan-300 mb-1">
                  세부 공정명
                </label>
                <input
                  type="text"
                  value={catalogMeta.processName}
                  onChange={(e) => setCatalogMeta({ ...catalogMeta, processName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-600 bg-slate-800 text-white font-bold outline-none focus:border-cyan-400"
                  placeholder="예: 정치절단 및 사출 가공"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-700">
              <button
                type="button"
                onClick={() => setIsSaveCatalogModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 cursor-pointer"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleConfirmSaveCatalog}
                className="px-5 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>보관함에 저장하기</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LegoWorkReportBuilder;
