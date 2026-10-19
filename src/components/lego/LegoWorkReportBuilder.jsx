import React, { useState, useEffect, useMemo } from "react";
import {
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
  AlertCircle
} from "lucide-react";

// =============================================================================
// 16대 레고 블록 원본 사진 메타데이터 (Excel '레고 양식.xlsx' 실물 1:1 매핑)
// =============================================================================
export const LEGO_IMAGE_REFERENCES = [
  { id: "img_1", imgFile: "/lego_images/image_1_image1.png", title: "작업자 / 시간 / 생산수량 블록", desc: "구분(FRT, RR), 작업자, 시간(시작/종료), 수량(정품/불량/재조인트)" },
  { id: "img_2", imgFile: "/lego_images/image_2_image2.png", title: "[블록 2] 정치 절단 길이 & LOT NO.", desc: "단면별(C, D) 규격(600±5mm) 초/중/종 실측치 및 LOT 번호 일체형" },
  { id: "img_3", imgFile: "/lego_images/image_3_image3.png", title: "2. 단컷팅 (FRT 단컷팅 구간 치수)", desc: "구분(A 49mm, B 45mm) 초물/중물/종물 치수" },
  { id: "img_4", imgFile: "/lego_images/image_4_image4.png", title: "2. 단컷팅 (RR 단컷팅 구간 치수)", desc: "구분(A 40mm, B 39mm) 초물/중물/종물 치수" },
  { id: "img_5", imgFile: "/lego_images/image_5_image5.png", title: "3. 재료 (Joint Material)", desc: "조인트 재료명 및 재료 일자(LOT NO.)" },
  { id: "img_6", imgFile: "/lego_images/image_6_image6.png", title: "4. 사출온도 (Temperature)", desc: "Sett'g / Actual x 노즐, 실린더 1(N2), 2(H3), 3(H4) x 호기별" },
  { id: "img_7", imgFile: "/lego_images/image_7_image7.png", title: "5. 사출조건 (Injection Condition)", desc: "거리, 속도, 압력, 시간 x 초물/중물/종물" },
  { id: "img_8", imgFile: "/lego_images/image_8_image8.png", title: "6. 공정불량 종합 매트릭스", desc: "10대 불량 x 폐기불량(FRT/RR), 재조인트수량, 공정간불량" },
  { id: "img_9", imgFile: "/lego_images/image_9_image9.png", title: "공정명 & 차종/품명 헤더", desc: "공정명: 단컷팅, 차종: JA, 품명: G/RUN, 작업자" },
  { id: "img_10", imgFile: "/lego_images/image_10_image10.png", title: "호기별 작업시간 & 생산량(실적)", desc: "FRT LH/RH, RR LH/RH x A, B 단면 실적" },
  { id: "img_11", imgFile: "/lego_images/image_11_image11.png", title: "불량소재구분 매트릭스", desc: "FRT/RR LH/RH x 압출소재불량 4종 + 공정간불량 2종" },
  { id: "img_12", imgFile: "/lego_images/image_12_image12.png", title: "부자재 LOT NO.", desc: "패드 ST 등 부자재 LOT 일자 기록" },
  { id: "img_13", imgFile: "/lego_images/image_13_image13.png", title: "도면 치수 & 중요 치수 및 검사 현황 LH", desc: "부품 도면 위치 다이어그램(A, B, D) + 중요치수 482±3mm, 658±5mm, 패드 5T*5W*60L" },
  { id: "img_14", imgFile: "/lego_images/image_14_image14.png", title: "직각검사 일보 제목 헤더", desc: "직각검사 일보 공식 타이틀" },
  { id: "img_15", imgFile: "/lego_images/image_15_image15.png", title: "직각검사 일보 전체 본문 매트릭스", desc: "LH 2/3호기, RH 2/3호기 x 제품수량, 3대 불량 22종, 불량합계, 특기사항" },
  { id: "img_16", imgFile: "/lego_images/image_16_image16.png", title: "작업 기본 정보 디지털 바", desc: "작업일자, 주간/야간, 26명 작업자 마스터, 시작~종료시간" }
];

// =============================================================================
// 4가지 완성형 사전 조합 템플릿 프리셋
// =============================================================================
export const PRESET_REPORTS = [
  {
    id: "REPORT_CUTTING",
    name: "소재준비/단컷팅 일보",
    badge: "정치절단 & 단컷팅",
    category: "MATERIAL_PREP",
    desc: "사진 9, 16, 10, 2, 3, 4, 12, 11 조합 - 정치절단, FRT/RR 단컷팅, 불량소재구분",
    title: "소재 준비 작업 일보 (정치절단 & 단컷팅)",
    subTitle: "▣ 공정명 : 정치절단 / 단컷팅  ※Record Time : 초물(Start) / 종물(Finish)",
    formNo: "705-02(REV.4)",
    companyName: "(주)오륙",
    carModel: "JA",
    partName: "G/RUN",
    workerName: "김작업",
    workDate: "2026-10-19",
    shift: "주간",
    startTime: "08:00",
    finishTime: "17:00",
    activeBlocks: {
      basicInfo: true,
      timeAndOutput: true,
      cuttingSpecLot: true,
      stepCuttingFrt: true,
      stepCuttingRr: true,
      subMaterialLot: true,
      defectMaterialMatrix: true,
      jointMaterial: false,
      injectionTemp: false,
      injectionCondition: false,
      jointDefectMatrix: false,
      drawingSpecCheck: false,
      rightAngleMatrix: false,
      remarks: true
    },
    specsCutting: [
      { id: "c1", section: "C", spec: "600 ± 5mm", target: 600, tol: 5, startVal: "601", halfVal: "600", finishVal: "599", lotNo: "261019-A" },
      { id: "c2", section: "D", spec: "600 ± 5mm", target: 600, tol: 5, startVal: "600", halfVal: "602", finishVal: "601", lotNo: "261019-B" }
    ],
    stepCuttingFrt: [
      { id: "scf_1", section: "A", spec: "49mm", target: 49, tol: 1, startVal: "49.1", halfVal: "49.0", finishVal: "48.9" },
      { id: "scf_2", section: "B", spec: "45mm", target: 45, tol: 1, startVal: "45.0", halfVal: "45.2", finishVal: "45.1" }
    ],
    stepCuttingRr: [
      { id: "scr_1", section: "A", spec: "40mm", target: 40, tol: 1, startVal: "40.0", halfVal: "39.9", finishVal: "40.1" },
      { id: "scr_2", section: "B", spec: "39mm", target: 39, tol: 1, startVal: "39.0", halfVal: "39.1", finishVal: "38.9" }
    ],
    subMaterialLot: "패드 ST: 2026.10.18-01",
    remarks: "정치 절단 칼날 상태 양호. 단컷팅 치수 기준치 이내 전수 검사 완료."
  },
  {
    id: "REPORT_JOINT",
    name: "조인트(사출) 가공일보",
    badge: "사출 성형 & 공정불량",
    category: "JOINT",
    desc: "사진 1, 5, 6, 7, 8 조합 - 조인트 재료, 4개존 사출온도, 사출조건, 10대 공정불량",
    title: "조인트 사출 성형 작업 일보",
    subTitle: "▣ 공정명 : G/RUN 코너 조인트 사출 성형",
    formNo: "703-01(REV.2)",
    companyName: "(주)오륙",
    carModel: "JA",
    partName: "G/RUN (FRT / RR)",
    workerName: "박조인트",
    workDate: "2026-10-19",
    shift: "주간",
    startTime: "08:00",
    finishTime: "17:00",
    activeBlocks: {
      basicInfo: true,
      timeAndOutput: false,
      cuttingSpecLot: false,
      stepCuttingFrt: false,
      stepCuttingRr: false,
      subMaterialLot: false,
      defectMaterialMatrix: false,
      jointMaterial: true,
      injectionTemp: true,
      injectionCondition: true,
      jointDefectMatrix: true,
      drawingSpecCheck: false,
      rightAngleMatrix: false,
      remarks: true
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
    name: "직각검사 일보",
    badge: "완제품 검사 & 호기별",
    category: "INSPECTION",
    desc: "사진 14, 15, 16 조합 - LH 2/3호기, RH 2/3호기 호기별 검사수량 및 3대 불량 22종 집계",
    title: "직각검사 일보",
    subTitle: "▣ 공정명 : 완제품 직각검사 및 최종 외관 전수검사",
    formNo: "706-01(REV.3)",
    companyName: "(주)오륙",
    carModel: "JA",
    partName: "G/RUN (FRT & RR)",
    workerName: "이검사",
    workDate: "2026-10-19",
    shift: "주간",
    startTime: "08:00",
    finishTime: "17:00",
    activeBlocks: {
      basicInfo: true,
      timeAndOutput: false,
      cuttingSpecLot: false,
      stepCuttingFrt: false,
      stepCuttingRr: false,
      subMaterialLot: false,
      defectMaterialMatrix: false,
      jointMaterial: false,
      injectionTemp: false,
      injectionCondition: false,
      jointDefectMatrix: false,
      drawingSpecCheck: false,
      rightAngleMatrix: true,
      remarks: true
    },
    machines: [
      { id: "m_lh2", name: "LH 2호기", workTime: "08:00 ~ 17:00", inspectQty: 320, goodQty: 312, reworkQty: 6, scrapQty: 2 },
      { id: "m_lh3", name: "LH 3호기", workTime: "08:00 ~ 17:00", inspectQty: 310, goodQty: 304, reworkQty: 5, scrapQty: 1 },
      { id: "m_rh2", name: "RH 2호기", workTime: "08:00 ~ 17:00", inspectQty: 330, goodQty: 324, reworkQty: 4, scrapQty: 2 },
      { id: "m_rh3", name: "RH 3호기", workTime: "08:00 ~ 17:00", inspectQty: 305, goodQty: 299, reworkQty: 5, scrapQty: 1 }
    ],
    extrusionDefects: [
      { name: "스코치", lh2: 0, lh3: 0, rh2: 0, rh3: 0 },
      { name: "외면 흠", lh2: 1, lh3: 1, rh2: 1, rh3: 0 },
      { name: "오 염", lh2: 0, lh3: 0, rh2: 0, rh3: 0 },
      { name: "코팅 불량", lh2: 0, lh3: 0, rh2: 0, rh3: 0 },
      { name: "단면 불량", lh2: 0, lh3: 0, rh2: 0, rh3: 0 },
      { name: "기타 ( )", lh2: 0, lh3: 0, rh2: 0, rh3: 0 }
    ],
    jointDefectsList: [
      { name: "떨어짐", lh2: 1, lh3: 0, rh2: 0, rh3: 1 },
      { name: "양부족", lh2: 0, lh3: 0, rh2: 0, rh3: 0 },
      { name: "밀 림", lh2: 1, lh3: 1, rh2: 0, rh3: 0 },
      { name: "단 차", lh2: 0, lh3: 0, rh2: 1, rh3: 0 },
      { name: "기 포", lh2: 0, lh3: 0, rh2: 0, rh3: 0 },
      { name: "씹 힘", lh2: 0, lh3: 0, rh2: 0, rh3: 0 },
      { name: "삽입 불량", lh2: 0, lh3: 0, rh2: 0, rh3: 0 },
      { name: "수 축", lh2: 0, lh3: 0, rh2: 0, rh3: 0 },
      { name: "기타 ( )", lh2: 0, lh3: 0, rh2: 0, rh3: 0 }
    ],
    postDefectsList: [
      { name: "길이 불량", lh2: 0, lh3: 0, rh2: 0, rh3: 0 },
      { name: "외면 오염", lh2: 1, lh3: 0, rh2: 0, rh3: 0 },
      { name: "과사상", lh2: 0, lh3: 0, rh2: 0, rh3: 0 },
      { name: "미사상", lh2: 1, lh3: 1, rh2: 0, rh3: 0 },
      { name: "마킹 누락", lh2: 0, lh3: 0, rh2: 0, rh3: 0 },
      { name: "PAD 누락", lh2: 0, lh3: 0, rh2: 0, rh3: 0 },
      { name: "PROTECT FILM 누락", lh2: 0, lh3: 0, rh2: 0, rh3: 0 },
      { name: "본드 오염", lh2: 0, lh3: 0, rh2: 0, rh3: 0 },
      { name: "기타 ( )", lh2: 0, lh3: 0, rh2: 0, rh3: 0 }
    ],
    remarks: "전 호기 직각 형합성 및 외관 전수검사 완료. 불량률 1.2%로 목표(2.0% 이하) 달성."
  },
  {
    id: "REPORT_DRAWING_SPEC",
    name: "도면 치수 & 패드 검사일보",
    badge: "도면 A/B/D & 패드 규격",
    category: "INSPECTION",
    desc: "사진 13, 12, 1 조합 - 도면 다이어그램 A, B, D 위치 대조 및 중요치수(482, 658) & 스폰지패드(5T*5W*60L)",
    title: "중요 치수 및 부자재(스폰지패드) 검사 일보",
    subTitle: "▣ 공정명 : 도면 치수 검사 및 부자재 부착 검사 (LH / RH)",
    formNo: "706-02(REV.2)",
    companyName: "(주)오륙",
    carModel: "JA",
    partName: "G/RUN (RR LH)",
    workerName: "정품질",
    workDate: "2026-10-19",
    shift: "주간",
    startTime: "08:00",
    finishTime: "17:00",
    activeBlocks: {
      basicInfo: true,
      timeAndOutput: false,
      cuttingSpecLot: false,
      stepCuttingFrt: false,
      stepCuttingRr: false,
      subMaterialLot: true,
      defectMaterialMatrix: false,
      jointMaterial: false,
      injectionTemp: false,
      injectionCondition: false,
      jointDefectMatrix: false,
      drawingSpecCheck: true,
      rightAngleMatrix: false,
      remarks: true
    },
    drawingSpecs: [
      { id: "ds_1", section: "RR LH A", spec: "482 ± 3 mm", target: 482, tol: 3, startVal: "482.5", halfVal: "482.0", finishVal: "481.8" },
      { id: "ds_2", section: "RR LH B", spec: "658 ± 5 mm", target: 658, tol: 5, startVal: "658.0", halfVal: "657.5", finishVal: "659.0" },
      { id: "ds_3", section: "스폰지패드규격", spec: "5T * 5W * 60L", target: null, tol: null, startVal: "적합", halfVal: "적합", finishVal: "적합" }
    ],
    subMaterialLot: "스폰지패드 LOT : 2026.10.17-PD05",
    remarks: "도면 위치 A, B, D 치수 검사 결과 전 항목 공차 허용범위 만족."
  }
];

export const LegoWorkReportBuilder = ({ onSaveToTemplateManager }) => {
  // Current active report configuration
  const [currentReport, setCurrentReport] = useState(() => {
    try {
      const saved = localStorage.getItem("oruk_custom_lego_report_v1");
      if (saved) return JSON.parse(saved);
    } catch {}
    return JSON.parse(JSON.stringify(PRESET_REPORTS[0]));
  });

  const [viewMode, setViewMode] = useState("DIGITAL"); // 'DIGITAL' | 'PRINT_A4'
  const [showPhotoRefModal, setShowPhotoRefModal] = useState(false);
  const [selectedPhotoRef, setSelectedPhotoRef] = useState(null);
  const [toastMsg, setToastMsg] = useState("");
  const [editingTitleKey, setEditingTitleKey] = useState(null);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 2500);
  };

  // Load a Preset
  const handleLoadPreset = (presetId) => {
    const found = PRESET_REPORTS.find((p) => p.id === presetId);
    if (!found) return;
    if (confirm(`'${found.name}' 양식으로 전환하시겠습니까? (현재 입력 중인 내용이 덮어쓰여집니다)`)) {
      setCurrentReport(JSON.parse(JSON.stringify(found)));
      showToast(`⚡ '${found.name}' 양식으로 전환되었습니다.`);
    }
  };

  // Save current report to local storage
  const handleSaveDraft = () => {
    try {
      localStorage.setItem("oruk_custom_lego_report_v1", JSON.stringify(currentReport));
      showToast("💾 레고 작업일보 양식이 안전하게 저장되었습니다!");
    } catch (e) {
      alert("저장 실패: " + e.message);
    }
  };

  // Toggle active block
  const handleToggleBlock = (blockKey) => {
    setCurrentReport((prev) => ({
      ...prev,
      activeBlocks: {
        ...prev.activeBlocks,
        [blockKey]: !prev.activeBlocks[blockKey]
      }
    }));
  };

  // Update Field helper
  const handleUpdateField = (key, value) => {
    setCurrentReport((prev) => ({
      ...prev,
      [key]: value
    }));
  };

  // ===========================================================================
  // 1. [행 추가 기능] (치수, 호기, 불량 항목)
  // ===========================================================================
  const handleAddCuttingSpecRow = () => {
    const nextChar = String.fromCharCode(67 + (currentReport.specsCutting?.length || 0)); // C, D, E, F...
    const newRow = {
      id: `c_${Date.now()}`,
      section: nextChar,
      spec: "600 ± 5mm",
      target: 600,
      tol: 5,
      startVal: "",
      halfVal: "",
      finishVal: "",
      lotNo: `261019-${nextChar}`
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
      specsCutting: prev.specsCutting.filter((r) => r.id !== id)
    }));
    showToast("🗑️ 행이 삭제되었습니다.");
  };

  const handleAddStepCuttingRow = (type) => {
    const listKey = type === "FRT" ? "stepCuttingFrt" : "stepCuttingRr";
    const nextSection = String.fromCharCode(65 + (currentReport[listKey]?.length || 0));
    const newRow = {
      id: `sc_${type}_${Date.now()}`,
      section: nextSection,
      spec: "40mm",
      target: 40,
      tol: 1,
      startVal: "",
      halfVal: "",
      finishVal: ""
    };
    setCurrentReport((prev) => ({
      ...prev,
      [listKey]: [...(prev[listKey] || []), newRow]
    }));
    showToast(`➕ 단컷팅 ${type} [${nextSection}] 행이 추가되었습니다.`);
  };

  const handleDeleteStepCuttingRow = (type, id) => {
    const listKey = type === "FRT" ? "stepCuttingFrt" : "stepCuttingRr";
    setCurrentReport((prev) => ({
      ...prev,
      [listKey]: prev[listKey].filter((r) => r.id !== id)
    }));
    showToast("🗑️ 행이 삭제되었습니다.");
  };

  const handleAddDrawingSpecRow = () => {
    const newRow = {
      id: `ds_${Date.now()}`,
      section: "신규 측정 포인트",
      spec: "500 ± 3 mm",
      target: 500,
      tol: 3,
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
      drawingSpecs: prev.drawingSpecs.filter((r) => r.id !== id)
    }));
    showToast("🗑️ 치수 행이 삭제되었습니다.");
  };

  const handleAddMachineRow = () => {
    const count = (currentReport.machines?.length || 0) + 1;
    const newMachine = {
      id: `m_${Date.now()}`,
      name: `LH ${count + 1}호기`,
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
    showToast(`➕ [${newMachine.name}] 호기 행이 추가되었습니다.`);
  };

  const handleDeleteMachineRow = (id) => {
    if ((currentReport.machines?.length || 0) <= 1) {
      alert("최소 1개 이상의 호기가 필요합니다.");
      return;
    }
    setCurrentReport((prev) => ({
      ...prev,
      machines: prev.machines.filter((m) => m.id !== id)
    }));
    showToast("🗑️ 호기가 삭제되었습니다.");
  };

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

  // ===========================================================================
  // 2. [치수 변경 기능] (Target, Tolerance, Spec String 인라인 수정)
  // ===========================================================================
  const handleUpdateSpecValue = (listKey, rowId, field, newVal) => {
    setCurrentReport((prev) => ({
      ...prev,
      [listKey]: (prev[listKey] || []).map((row) => {
        if (row.id === rowId) {
          const updated = { ...row, [field]: newVal };
          // If editing target or tol, recompute spec string
          if (field === "target" || field === "tol") {
            const t = field === "target" ? newVal : row.target;
            const tol = field === "tol" ? newVal : row.tol;
            if (t !== null && tol !== null) {
              updated.spec = `${t} ± ${tol}mm`;
            }
          }
          return updated;
        }
        return row;
      })
    }));
  };

  // Print Action
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4 max-w-[1700px] mx-auto text-left pb-16">
      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-2xl bg-indigo-600 text-white font-black text-xs shadow-2xl animate-bounce flex items-center gap-2 border border-indigo-400">
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* ======================================================================= */}
      {/* 🌟 Top Hero: 레고 블록 작업일보 빌더 컨트롤 패널 */}
      {/* ======================================================================= */}
      <div className="bg-slate-900 dark:bg-slate-950 p-4 sm:p-5 rounded-3xl border border-slate-700 shadow-xl text-white space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="p-2 rounded-2xl bg-gradient-to-tr from-indigo-600 to-cyan-500 text-white shadow-md">
                <Layers className="w-5 h-5" />
              </span>
              <h1 className="text-lg sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                <span>🧩 레고 블록 작업일보 빌더 (LEGO Form Builder)</span>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 font-bold">
                  16대 실물 블록 완벽 조합
                </span>
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              <strong>"레고 양식.xlsx"</strong>에 담긴 16장의 실물 사진 블록을 통일감 있는 모던 양식으로 재해석하였습니다. <strong>행 추가 • 치수 변경 • 제목 수정</strong>이 100% 자유롭습니다.
            </p>
          </div>

          {/* Top Actions Bar */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <button
              type="button"
              onClick={() => setShowPhotoRefModal(true)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-white border border-amber-500/40 text-xs font-black transition cursor-pointer flex items-center gap-1.5 shadow-xs"
              title="16장 원본 사진 레고 블록 열람"
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>원본 사진 16종 대조</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode(viewMode === "DIGITAL" ? "PRINT_A4" : "DIGITAL")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 shadow-xs ${
                viewMode === "PRINT_A4"
                  ? "bg-purple-600 text-white ring-2 ring-purple-400"
                  : "bg-slate-800 hover:bg-slate-700 text-slate-200"
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>{viewMode === "PRINT_A4" ? "🖥️ 디지털 뷰로 전환" : "🖨️ A4 인쇄 서식 보기"}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs transition cursor-pointer flex items-center gap-1.5 shadow-md active:scale-95"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>인쇄 / PDF 저장</span>
            </button>

            <button
              type="button"
              onClick={handleSaveDraft}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition cursor-pointer flex items-center gap-1.5 shadow-md active:scale-95"
            >
              <Save className="w-3.5 h-3.5" />
              <span>양식 저장</span>
            </button>
          </div>
        </div>

        {/* ⚡ 4대 프리셋 원클릭 탭 버튼 */}
        <div className="pt-2 border-t border-slate-800 flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-xs font-black text-slate-400 shrink-0 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>완성형 일보 선택:</span>
          </span>
          {PRESET_REPORTS.map((preset) => {
            const isSelected = currentReport.id === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleLoadPreset(preset.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black shrink-0 transition-all cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? "bg-cyan-500 text-slate-950 font-black shadow-md ring-2 ring-cyan-300 scale-102"
                    : "bg-slate-950 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700"
                }`}
              >
                <span>{preset.name}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  isSelected ? "bg-slate-900 text-cyan-300" : "bg-slate-800 text-slate-400"
                }`}>
                  {preset.badge}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ======================================================================= */}
      {/* 2-COLUMN MAIN WORKSPACE: Left Block Switcher vs Right Live Form */}
      {/* ======================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* ===================================================================== */}
        {/* 🧱 LEFT: LEGO BLOCK SWITCHER & CUSTOMIZER (스위치 & 행추가 제어판) */}
        {/* ===================================================================== */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-md space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-500" />
                <span>레고 블록 조립 스위치</span>
              </h3>
              <span className="text-[11px] font-bold text-slate-400">클릭하여 On/Off</span>
            </div>

            {/* Block Switches */}
            <div className="space-y-1.5">
              {[
                { key: "basicInfo", label: "1. 작업 기본정보 (차종/품명/작업자)", badge: "사진 9, 16" },
                { key: "timeAndOutput", label: "2. 작업시간 및 생산실적", badge: "사진 1, 10" },
                { key: "cuttingSpecLot", label: "3. 정치절단 치수 & LOT NO.", badge: "사진 2" },
                { key: "stepCuttingFrt", label: "4. 단컷팅 치수 (FRT LH/RH)", badge: "사진 3" },
                { key: "stepCuttingRr", label: "5. 단컷팅 치수 (RR LH/RH)", badge: "사진 4" },
                { key: "subMaterialLot", label: "6. 부자재 LOT NO. (패드 ST)", badge: "사진 12" },
                { key: "defectMaterialMatrix", label: "7. 불량소재구분 (압출/공정간)", badge: "사진 11" },
                { key: "jointMaterial", label: "8. 조인트 재료 (재료명/LOT)", badge: "사진 5" },
                { key: "injectionTemp", label: "9. 사출온도 (Sett'g / Actual)", badge: "사진 6" },
                { key: "injectionCondition", label: "10. 사출조건 (거리/속도/압력/시간)", badge: "사진 7" },
                { key: "jointDefectMatrix", label: "11. 조인트 6대 공정불량 매트릭스", badge: "사진 8" },
                { key: "drawingSpecCheck", label: "12. 도면 치수 & 패드 검사 (A/B/D)", badge: "사진 13" },
                { key: "rightAngleMatrix", label: "13. 직각검사 2/3호기 종합 매트릭스", badge: "사진 14, 15" },
                { key: "remarks", label: "14. 특기 사항 및 조치사항", badge: "공통" }
              ].map((item) => {
                const isActive = Boolean(currentReport.activeBlocks?.[item.key]);
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => handleToggleBlock(item.key)}
                    className={`w-full p-2.5 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                      isActive
                        ? "bg-indigo-50 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-700 text-indigo-950 dark:text-indigo-200 shadow-xs"
                        : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-400 opacity-60 hover:opacity-100"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-3.5 h-3.5 rounded flex items-center justify-center text-[10px] ${
                        isActive ? "bg-indigo-600 text-white" : "border border-slate-400"
                      }`}>
                        {isActive ? "✓" : ""}
                      </span>
                      <span className="text-xs font-black">{item.label}</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold shrink-0">
                      {item.badge}
                    </span>
                  </button>
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
                  className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-black text-center"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-0.5">품명 (Part name)</label>
                <input
                  type="text"
                  value={currentReport.partName || ""}
                  onChange={(e) => handleUpdateField("partName", e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-black text-center"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-0.5">회사명</label>
                <input
                  type="text"
                  value={currentReport.companyName || ""}
                  onChange={(e) => handleUpdateField("companyName", e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-black text-center"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-0.5">양식 번호</label>
                <input
                  type="text"
                  value={currentReport.formNo || ""}
                  onChange={(e) => handleUpdateField("formNo", e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-black text-center font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ===================================================================== */}
        {/* 📄 RIGHT: LIVE WORK REPORT FORM (실시간 양식 뷰 & 인라인 편집) */}
        {/* ===================================================================== */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-5 text-slate-900 dark:text-white print:p-0 print:border-none print:shadow-none">
            
            {/* ================================================================= */}
            {/* 🏷️ [일보 헤더: 제목 & 결재란 (제목 클릭 수정 가능)] */}
            {/* ================================================================= */}
            <div className="border-b-2 border-slate-900 dark:border-slate-700 pb-3">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                {/* Editable Report Title */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono font-bold text-slate-400">양식번호: {currentReport.formNo || "705-02"}</span>
                    <span className="text-[10px] text-cyan-600 dark:text-cyan-400 font-bold">✏️ 제목/치수 클릭 시 수정 가능</span>
                  </div>
                  <input
                    type="text"
                    value={currentReport.title || ""}
                    onChange={(e) => handleUpdateField("title", e.target.value)}
                    className="text-lg sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white bg-transparent border-b border-dashed border-slate-400 focus:border-indigo-500 outline-none w-full py-0.5 mt-0.5"
                    title="클릭하여 일보 제목을 자유롭게 수정하세요."
                  />
                  <input
                    type="text"
                    value={currentReport.subTitle || ""}
                    onChange={(e) => handleUpdateField("subTitle", e.target.value)}
                    className="text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-300 bg-transparent border-b border-dashed border-transparent hover:border-slate-400 focus:border-indigo-500 outline-none w-full py-0.5 mt-1"
                    title="클릭하여 공정명 부제목을 수정하세요."
                  />
                </div>

                {/* 3단 결재란 (작성 / 검토 / 승인) */}
                <div className="shrink-0">
                  <table className="border-collapse border border-black dark:border-slate-600 text-xs text-center font-bold">
                    <thead>
                      <tr className="bg-slate-100 dark:bg-slate-800 border-b border-black dark:border-slate-600 text-[11px]">
                        <th rowSpan={2} className="border-r border-black dark:border-slate-600 px-2 py-1 bg-slate-200 dark:bg-slate-700">결<br/>재</th>
                        <th className="border-r border-black dark:border-slate-600 px-3 py-0.5">작 성</th>
                        <th className="border-r border-black dark:border-slate-600 px-3 py-0.5">검 토</th>
                        <th className="px-3 py-0.5">승 인</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="h-10">
                        <td className="border-r border-black dark:border-slate-600 w-14"></td>
                        <td className="border-r border-black dark:border-slate-600 w-14"></td>
                        <td className="w-14"></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* ================================================================= */}
            {/* 🧱 BLOCK 1: 작업 기본 정보 (사진 9, 16) */}
            {/* ================================================================= */}
            {currentReport.activeBlocks?.basicInfo && (
              <div className="rounded-2xl p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between pb-1 border-b border-slate-200 dark:border-slate-800">
                  <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                    <span>🧱 [블록 1] 작업 기본 정보</span>
                    <span className="text-[10px] text-slate-400">(사진 9, 16 대조)</span>
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
                    <span className="text-[10px] font-bold text-slate-400 block">차종 (Car model)</span>
                    <span className="font-black text-sm text-indigo-600 dark:text-cyan-400">{currentReport.carModel}</span>
                  </div>
                  <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
                    <span className="text-[10px] font-bold text-slate-400 block">품 명 (Part name)</span>
                    <span className="font-black text-sm">{currentReport.partName}</span>
                  </div>
                  <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
                    <span className="text-[10px] font-bold text-slate-400 block">작업자 (Worker)</span>
                    <input
                      type="text"
                      value={currentReport.workerName || ""}
                      onChange={(e) => handleUpdateField("workerName", e.target.value)}
                      className="font-black text-xs text-center w-full bg-transparent outline-none border-b border-dashed border-slate-300"
                    />
                  </div>
                  <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
                    <span className="text-[10px] font-bold text-slate-400 block">작업 시간 (Time)</span>
                    <div className="flex items-center justify-center gap-1 font-bold text-xs mt-0.5">
                      <span>{currentReport.startTime}</span>
                      <span>~</span>
                      <span>{currentReport.finishTime}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ================================================================= */}
            {/* 🧱 BLOCK 2: 정치 절단 길이 & LOT NO. (사진 2) - [행 추가 & 치수 변경] */}
            {/* ================================================================= */}
            {currentReport.activeBlocks?.cuttingSpecLot && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span>[블록 2] 정치 절단 길이 & LOT NO.</span>
                      <span className="text-[10px] px-2 py-0.2 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800 font-bold">
                        사진 2 실물 일치
                      </span>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddCuttingSpecRow}
                    className="px-2.5 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs transition cursor-pointer flex items-center gap-1 shadow-xs"
                    title="새로운 절단 단면(Section E, F...)을 추가합니다."
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ 행 추가 (단면 추가)</span>
                  </button>
                </div>

                <div className="overflow-x-auto border border-black dark:border-slate-600 rounded-xl">
                  <table className="w-full border-collapse text-xs text-center font-bold">
                    <thead>
                      <tr className="bg-amber-100 dark:bg-amber-950/70 border-b border-black dark:border-slate-600 text-[11px] text-black dark:text-white">
                        <th colSpan={2} className="border-r border-black dark:border-slate-600 p-1.5 w-[20%]">구 분(Division)</th>
                        <th className="border-r border-black dark:border-slate-600 p-1.5 w-[13%]">초물(Start)</th>
                        <th className="border-r border-black dark:border-slate-600 p-1.5 w-[13%]">중물(Half)</th>
                        <th className="border-r border-black dark:border-slate-600 p-1.5 w-[13%]">종물(Finish)</th>
                        <th className="border-r border-black dark:border-slate-600 p-1.5 w-[13%]">초물(Start)</th>
                        <th className="border-r border-black dark:border-slate-600 p-1.5 w-[13%]">중물(Half)</th>
                        <th className="border-r border-black dark:border-slate-600 p-1.5 w-[13%]">종물(Finish)</th>
                        <th className="p-1 w-[5%] print:hidden">관리</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(currentReport.specsCutting || []).map((row, idx) => (
                        <React.Fragment key={row.id}>
                          {/* Row 1: 규격(Spec) - 치수 인라인 수정 가능 */}
                          <tr className="border-b border-black dark:border-slate-600">
                            {idx === 0 && (
                              <td
                                rowSpan={(currentReport.specsCutting?.length || 1) * 3}
                                className="border-r border-black dark:border-slate-600 bg-amber-50 dark:bg-amber-950/40 p-2 font-black w-[10%] text-center align-middle"
                              >
                                <div className="leading-tight">
                                  정치 절단<br />길이(Spec<br />cutting)
                                </div>
                              </td>
                            )}
                            <td rowSpan={3} className="border-r border-black dark:border-slate-600 p-1.5 w-[10%] text-center font-black">
                              <input
                                type="text"
                                value={row.section}
                                onChange={(e) => handleUpdateSpecValue("specsCutting", row.id, "section", e.target.value)}
                                className="w-10 text-center font-black bg-transparent border-b border-dashed border-slate-400 outline-none"
                                title="단면 명칭 수정"
                              />
                            </td>
                            <td className="border-r border-black dark:border-slate-600 p-1 bg-slate-50 dark:bg-slate-800 text-[11px] font-bold">
                              규격(Spec)
                            </td>
                            <td colSpan={3} className="border-r border-black dark:border-slate-600 p-1 text-center font-black text-indigo-600 dark:text-cyan-400 bg-slate-50/50 dark:bg-slate-900/50">
                              <input
                                type="text"
                                value={row.spec}
                                onChange={(e) => handleUpdateSpecValue("specsCutting", row.id, "spec", e.target.value)}
                                className="w-full text-center font-black bg-transparent outline-none"
                                title="규격/공차 직접 수정 (예: 600 ± 5mm)"
                              />
                            </td>
                            <td colSpan={3} className="border-r border-black dark:border-slate-600 p-1 text-center font-black text-indigo-600 dark:text-cyan-400 bg-slate-50/50 dark:bg-slate-900/50">
                              <input
                                type="text"
                                value={row.spec}
                                onChange={(e) => handleUpdateSpecValue("specsCutting", row.id, "spec", e.target.value)}
                                className="w-full text-center font-black bg-transparent outline-none"
                                title="규격/공차 직접 수정"
                              />
                            </td>
                            <td rowSpan={3} className="p-1 align-middle text-center print:hidden">
                              <button
                                type="button"
                                onClick={() => handleDeleteCuttingSpecRow(row.id)}
                                className="text-rose-500 hover:text-rose-700 p-1 rounded transition cursor-pointer"
                                title="단면 삭제"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>

                          {/* Row 2: 초/중/종 실측치 */}
                          <tr className="border-b border-black dark:border-slate-600">
                            <td className="border-r border-black dark:border-slate-600 p-1 text-[11px] font-bold bg-slate-50 dark:bg-slate-800">
                              초/중/종
                            </td>
                            <td className="border-r border-black dark:border-slate-600 p-1">
                              <input
                                type="text"
                                value={row.startVal || ""}
                                onChange={(e) => handleUpdateSpecValue("specsCutting", row.id, "startVal", e.target.value)}
                                className="w-full text-center font-mono font-bold bg-transparent outline-none"
                                placeholder="초물"
                              />
                            </td>
                            <td className="border-r border-black dark:border-slate-600 p-1">
                              <input
                                type="text"
                                value={row.halfVal || ""}
                                onChange={(e) => handleUpdateSpecValue("specsCutting", row.id, "halfVal", e.target.value)}
                                className="w-full text-center font-mono font-bold bg-transparent outline-none"
                                placeholder="중물"
                              />
                            </td>
                            <td className="border-r border-black dark:border-slate-600 p-1">
                              <input
                                type="text"
                                value={row.finishVal || ""}
                                onChange={(e) => handleUpdateSpecValue("specsCutting", row.id, "finishVal", e.target.value)}
                                className="w-full text-center font-mono font-bold bg-transparent outline-none"
                                placeholder="종물"
                              />
                            </td>
                            <td className="border-r border-black dark:border-slate-600 p-1">
                              <input type="text" className="w-full text-center font-mono font-bold bg-transparent outline-none" placeholder="초물" />
                            </td>
                            <td className="border-r border-black dark:border-slate-600 p-1">
                              <input type="text" className="w-full text-center font-mono font-bold bg-transparent outline-none" placeholder="중물" />
                            </td>
                            <td className="border-r border-black dark:border-slate-600 p-1">
                              <input type="text" className="w-full text-center font-mono font-bold bg-transparent outline-none" placeholder="종물" />
                            </td>
                          </tr>

                          {/* Row 3: LOT NO. */}
                          <tr className="border-b border-black dark:border-slate-600">
                            <td className="border-r border-black dark:border-slate-600 p-1 text-[11px] font-bold bg-slate-50 dark:bg-slate-800">
                              LOT NO.
                            </td>
                            <td colSpan={3} className="border-r border-black dark:border-slate-600 p-1">
                              <input
                                type="text"
                                value={row.lotNo || ""}
                                onChange={(e) => handleUpdateSpecValue("specsCutting", row.id, "lotNo", e.target.value)}
                                className="w-full text-center font-mono font-bold bg-transparent outline-none text-slate-600 dark:text-slate-300"
                                placeholder="압출 LOT 번호"
                              />
                            </td>
                            <td colSpan={3} className="border-r border-black dark:border-slate-600 p-1">
                              <input
                                type="text"
                                value={row.lotNo || ""}
                                onChange={(e) => handleUpdateSpecValue("specsCutting", row.id, "lotNo", e.target.value)}
                                className="w-full text-center font-mono font-bold bg-transparent outline-none text-slate-600 dark:text-slate-300"
                                placeholder="압출 LOT 번호"
                              />
                            </td>
                          </tr>
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ================================================================= */}
            {/* 🧱 BLOCK 3 & 4: 단컷팅 치수 (FRT / RR) (사진 3, 4) */}
            {/* ================================================================= */}
            {(currentReport.activeBlocks?.stepCuttingFrt || currentReport.activeBlocks?.stepCuttingRr) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* FRT 단컷팅 구간 치수 */}
                {currentReport.activeBlocks?.stepCuttingFrt && (
                  <div className="space-y-1.5 border border-black dark:border-slate-600 rounded-xl p-2.5 bg-slate-50/50 dark:bg-slate-950/40">
                    <div className="flex items-center justify-between pb-1 border-b border-slate-300 dark:border-slate-700">
                      <span className="font-black text-xs text-slate-900 dark:text-white">
                        2. 단컷팅 - FRT 구간 치수 (사진 3)
                      </span>
                      <button
                        type="button"
                        onClick={() => handleAddStepCuttingRow("FRT")}
                        className="px-2 py-0.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10.5px] cursor-pointer"
                      >
                        + 행 추가
                      </button>
                    </div>
                    <table className="w-full border-collapse border border-black dark:border-slate-600 text-xs text-center font-bold">
                      <thead>
                        <tr className="bg-amber-100 dark:bg-amber-950/70 border-b border-black dark:border-slate-600 text-[11px]">
                          <th className="border-r border-black dark:border-slate-600 p-1 w-1/4">구분</th>
                          {(currentReport.stepCuttingFrt || []).map((c) => (
                            <th key={c.id} className="border-r border-black dark:border-slate-600 p-1">
                              {c.section}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-black dark:border-slate-600">
                          <td className="border-r border-black dark:border-slate-600 p-1 bg-amber-50 dark:bg-amber-950/40 font-bold">SPEC</td>
                          {(currentReport.stepCuttingFrt || []).map((c) => (
                            <td key={c.id} className="border-r border-black dark:border-slate-600 p-1 text-indigo-600 dark:text-cyan-400 font-black">
                              <input
                                type="text"
                                value={c.spec}
                                onChange={(e) => handleUpdateSpecValue("stepCuttingFrt", c.id, "spec", e.target.value)}
                                className="w-full text-center bg-transparent outline-none font-black"
                              />
                            </td>
                          ))}
                        </tr>
                        <tr className="border-b border-black dark:border-slate-600">
                          <td className="border-r border-black dark:border-slate-600 p-1 font-bold">초물(Start)</td>
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
                          <td className="border-r border-black dark:border-slate-600 p-1 font-bold">중물(Half)</td>
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
                          <td className="border-r border-black dark:border-slate-600 p-1 font-bold">종물(Finish)</td>
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
                )}

                {/* RR 단컷팅 구간 치수 */}
                {currentReport.activeBlocks?.stepCuttingRr && (
                  <div className="space-y-1.5 border border-black dark:border-slate-600 rounded-xl p-2.5 bg-slate-50/50 dark:bg-slate-950/40">
                    <div className="flex items-center justify-between pb-1 border-b border-slate-300 dark:border-slate-700">
                      <span className="font-black text-xs text-slate-900 dark:text-white">
                        2. 단컷팅 - RR 구간 치수 (사진 4)
                      </span>
                      <button
                        type="button"
                        onClick={() => handleAddStepCuttingRow("RR")}
                        className="px-2 py-0.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10.5px] cursor-pointer"
                      >
                        + 행 추가
                      </button>
                    </div>
                    <table className="w-full border-collapse border border-black dark:border-slate-600 text-xs text-center font-bold">
                      <thead>
                        <tr className="bg-amber-100 dark:bg-amber-950/70 border-b border-black dark:border-slate-600 text-[11px]">
                          <th className="border-r border-black dark:border-slate-600 p-1 w-1/4">구분</th>
                          {(currentReport.stepCuttingRr || []).map((c) => (
                            <th key={c.id} className="border-r border-black dark:border-slate-600 p-1">
                              {c.section}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-black dark:border-slate-600">
                          <td className="border-r border-black dark:border-slate-600 p-1 bg-amber-50 dark:bg-amber-950/40 font-bold">SPEC</td>
                          {(currentReport.stepCuttingRr || []).map((c) => (
                            <td key={c.id} className="border-r border-black dark:border-slate-600 p-1 text-indigo-600 dark:text-cyan-400 font-black">
                              <input
                                type="text"
                                value={c.spec}
                                onChange={(e) => handleUpdateSpecValue("stepCuttingRr", c.id, "spec", e.target.value)}
                                className="w-full text-center bg-transparent outline-none font-black"
                              />
                            </td>
                          ))}
                        </tr>
                        <tr className="border-b border-black dark:border-slate-600">
                          <td className="border-r border-black dark:border-slate-600 p-1 font-bold">초물(Start)</td>
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
                          <td className="border-r border-black dark:border-slate-600 p-1 font-bold">중물(Half)</td>
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
                          <td className="border-r border-black dark:border-slate-600 p-1 font-bold">종물(Finish)</td>
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
                )}
              </div>
            )}

            {/* ================================================================= */}
            {/* 🧱 BLOCK 5 & 6 & 7: 조인트 사출온도 & 사출조건 (사진 5, 6, 7) */}
            {/* ================================================================= */}
            {(currentReport.activeBlocks?.jointMaterial || currentReport.activeBlocks?.injectionTemp || currentReport.activeBlocks?.injectionCondition) && (
              <div className="space-y-3 p-3.5 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800">
                <div className="flex items-center justify-between pb-1 border-b border-purple-200 dark:border-purple-800">
                  <span className="text-xs font-black text-purple-900 dark:text-purple-300">
                    사출 온도 및 성형 조건 (사진 5, 6, 7)
                  </span>
                </div>

                {/* 조인트 재료 (사진 5) */}
                {currentReport.activeBlocks?.jointMaterial && (
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800">
                      <span className="text-[10px] text-slate-400 block font-bold">조인트 재료명 (Joint grade name)</span>
                      <input
                        type="text"
                        value={currentReport.jointMaterial?.gradeName || ""}
                        onChange={(e) => setCurrentReport((prev) => ({
                          ...prev,
                          jointMaterial: { ...prev.jointMaterial, gradeName: e.target.value }
                        }))}
                        className="font-black text-sm w-full bg-transparent outline-none text-purple-700 dark:text-purple-300"
                      />
                    </div>
                    <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800">
                      <span className="text-[10px] text-slate-400 block font-bold">조인트 재료일자 (Joint material lot no)</span>
                      <input
                        type="text"
                        value={currentReport.jointMaterial?.lotNo || ""}
                        onChange={(e) => setCurrentReport((prev) => ({
                          ...prev,
                          jointMaterial: { ...prev.jointMaterial, lotNo: e.target.value }
                        }))}
                        className="font-black text-sm w-full bg-transparent outline-none font-mono"
                      />
                    </div>
                  </div>
                )}

                {/* 사출 온도 테이블 (사진 6) */}
                {currentReport.activeBlocks?.injectionTemp && (
                  <div className="overflow-x-auto border border-black dark:border-slate-600 rounded-xl">
                    <table className="w-full border-collapse text-xs text-center font-bold">
                      <thead>
                        <tr className="bg-amber-100 dark:bg-amber-950/70 border-b border-black dark:border-slate-600 text-[11px]">
                          <th colSpan={2} className="border-r border-black dark:border-slate-600 p-1 w-1/4">구 분</th>
                          <th className="border-r border-black dark:border-slate-600 p-1">노즐(Nozzle)</th>
                          <th className="border-r border-black dark:border-slate-600 p-1">실린더 1(N2)</th>
                          <th className="border-r border-black dark:border-slate-600 p-1">실린더 2(H3)</th>
                          <th className="p-1">실린더 3(H4)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(currentReport.injectionTemps || []).map((t, idx) => (
                          <tr key={t.id} className="border-b border-black dark:border-slate-600">
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
                            <td className="border-r border-black dark:border-slate-600 p-1 font-bold">{t.machine}</td>
                            <td className="border-r border-black dark:border-slate-600 p-1 font-mono">{t.nozzle}</td>
                            <td className="border-r border-black dark:border-slate-600 p-1 font-mono">{t.cyl1}</td>
                            <td className="border-r border-black dark:border-slate-600 p-1 font-mono">{t.cyl2}</td>
                            <td className="p-1 font-mono">{t.cyl3}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* ================================================================= */}
            {/* 🧱 BLOCK 8: 공정불량 종합 매트릭스 (사진 8) */}
            {/* ================================================================= */}
            {currentReport.activeBlocks?.jointDefectMatrix && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>6. 공정불량 종합 매트릭스 (사진 8)</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleAddJointDefectRow}
                    className="px-2.5 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs transition cursor-pointer flex items-center gap-1 shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ 불량 항목 추가</span>
                  </button>
                </div>

                <div className="overflow-x-auto border border-black dark:border-slate-600 rounded-xl">
                  <table className="w-full border-collapse text-xs text-center font-bold">
                    <thead>
                      <tr className="bg-amber-100 dark:bg-amber-950/70 border-b border-black dark:border-slate-600 text-[11px]">
                        <th rowSpan={3} className="border-r border-black dark:border-slate-600 p-1.5 w-[20%]">구 분(Division)</th>
                        <th colSpan={5} className="border-r border-black dark:border-slate-600 p-1">폐기불량(Disposal) - 조인트작업시</th>
                        <th colSpan={2} className="border-r border-black dark:border-slate-600 p-1">재조인트수량(Rework)</th>
                        <th colSpan={2} className="p-1">공정간불량(재조인트 불량포함)</th>
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
                          <td className="border-r border-black dark:border-slate-600 p-1 text-left px-2 font-bold bg-slate-50 dark:bg-slate-800">
                            {row.name}
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
            )}

            {/* ================================================================= */}
            {/* 🧱 BLOCK 13: 도면 치수 & 중요 치수 및 검사 현황 (사진 13) */}
            {/* ================================================================= */}
            {currentReport.activeBlocks?.drawingSpecCheck && (
              <div className="space-y-3 p-3.5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800">
                <div className="flex items-center justify-between pb-1 border-b border-emerald-200 dark:border-emerald-800">
                  <span className="text-xs font-black text-emerald-900 dark:text-emerald-300">
                    도면 기반 중요 치수 & 검사 현황 LH (사진 13 실물 대조)
                  </span>
                  <button
                    type="button"
                    onClick={handleAddDrawingSpecRow}
                    className="px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer"
                  >
                    + 치수 행 추가
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                  {/* 도면 원본 다이어그램 이미지 (A, B, D 위치) */}
                  <div className="md:col-span-5 bg-white dark:bg-slate-900 p-2 rounded-xl border border-emerald-200 dark:border-emerald-800 text-center">
                    <img
                      src="/lego_images/image_13_image13.png"
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
                          <th rowSpan={2} className="border-r border-black dark:border-slate-600 p-1 w-1/4">항 목</th>
                          <th rowSpan={2} className="border-r border-black dark:border-slate-600 p-1 w-1/4">규 격</th>
                          <th colSpan={3} className="p-1">실 측 치</th>
                        </tr>
                        <tr className="bg-amber-50 dark:bg-amber-950/50 border-b border-black dark:border-slate-600 text-[10px]">
                          <th className="border-r border-black dark:border-slate-600 p-0.5">초물</th>
                          <th className="border-r border-black dark:border-slate-600 p-0.5">중물</th>
                          <th className="p-0.5">종물</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(currentReport.drawingSpecs || []).map((ds) => (
                          <tr key={ds.id} className="border-b border-black dark:border-slate-600">
                            <td className="border-r border-black dark:border-slate-600 p-1 font-bold bg-slate-50 dark:bg-slate-800">
                              <input
                                type="text"
                                value={ds.section}
                                onChange={(e) => handleUpdateSpecValue("drawingSpecs", ds.id, "section", e.target.value)}
                                className="w-full text-center bg-transparent outline-none font-bold"
                              />
                            </td>
                            <td className="border-r border-black dark:border-slate-600 p-1 text-emerald-600 dark:text-emerald-400 font-black">
                              <input
                                type="text"
                                value={ds.spec}
                                onChange={(e) => handleUpdateSpecValue("drawingSpecs", ds.id, "spec", e.target.value)}
                                className="w-full text-center bg-transparent outline-none font-black"
                              />
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
            )}

            {/* ================================================================= */}
            {/* 🧱 BLOCK 15: 직각검사 일보 호기별 종합 매트릭스 (사진 14, 15) */}
            {/* ================================================================= */}
            {currentReport.activeBlocks?.rightAngleMatrix && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>직각검사 종합 매트릭스 (LH/RH 호기별) (사진 14, 15)</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleAddMachineRow}
                    className="px-2.5 py-1 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs cursor-pointer flex items-center gap-1 shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ 호기 라인 추가</span>
                  </button>
                </div>

                <div className="overflow-x-auto border border-black dark:border-slate-600 rounded-xl">
                  <table className="w-full border-collapse text-xs text-center font-bold">
                    <thead>
                      <tr className="bg-amber-100 dark:bg-amber-950/70 border-b border-black dark:border-slate-600 text-[11px]">
                        <th colSpan={2} className="border-r border-black dark:border-slate-600 p-1 w-1/4">구 분</th>
                        {(currentReport.machines || []).map((m) => (
                          <th key={m.id} className="border-r border-black dark:border-slate-600 p-1">
                            {m.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {/* 작업시간 */}
                      <tr className="border-b border-black dark:border-slate-600">
                        <td rowSpan={2} className="border-r border-black dark:border-slate-600 bg-amber-50 dark:bg-amber-950/40 p-1 font-bold w-16">
                          작업<br/>시간
                        </td>
                        <td className="border-r border-black dark:border-slate-600 p-1 font-bold">시작 시간</td>
                        {(currentReport.machines || []).map((m) => (
                          <td key={m.id} className="border-r border-black dark:border-slate-600 p-1 font-mono">08:00</td>
                        ))}
                      </tr>
                      <tr className="border-b border-black dark:border-slate-600">
                        <td className="border-r border-black dark:border-slate-600 p-1 font-bold">종료 시간</td>
                        {(currentReport.machines || []).map((m) => (
                          <td key={m.id} className="border-r border-black dark:border-slate-600 p-1 font-mono">17:00</td>
                        ))}
                      </tr>

                      {/* 제품 수량 */}
                      <tr className="border-b border-black dark:border-slate-600">
                        <td rowSpan={4} className="border-r border-black dark:border-slate-600 bg-cyan-50 dark:bg-cyan-950/40 p-1 font-bold">
                          제품<br/>수량
                        </td>
                        <td className="border-r border-black dark:border-slate-600 p-1 font-bold">검 사</td>
                        {(currentReport.machines || []).map((m) => (
                          <td key={m.id} className="border-r border-black dark:border-slate-600 p-1 font-mono font-black">{m.inspectQty}</td>
                        ))}
                      </tr>
                      <tr className="border-b border-black dark:border-slate-600">
                        <td className="border-r border-black dark:border-slate-600 p-1 font-bold text-emerald-600">정 품</td>
                        {(currentReport.machines || []).map((m) => (
                          <td key={m.id} className="border-r border-black dark:border-slate-600 p-1 font-mono font-black text-emerald-600">{m.goodQty}</td>
                        ))}
                      </tr>
                      <tr className="border-b border-black dark:border-slate-600">
                        <td className="border-r border-black dark:border-slate-600 p-1 font-bold text-amber-600">공정불량(리워크)</td>
                        {(currentReport.machines || []).map((m) => (
                          <td key={m.id} className="border-r border-black dark:border-slate-600 p-1 font-mono">{m.reworkQty}</td>
                        ))}
                      </tr>
                      <tr className="border-b border-black dark:border-slate-600">
                        <td className="border-r border-black dark:border-slate-600 p-1 font-bold text-rose-600">완전불량(폐기)</td>
                        {(currentReport.machines || []).map((m) => (
                          <td key={m.id} className="border-r border-black dark:border-slate-600 p-1 font-mono text-rose-600">{m.scrapQty}</td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ================================================================= */}
            {/* 🧱 BLOCK 12 & 14: 부자재 LOT 및 특기사항 */}
            {/* ================================================================= */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {currentReport.activeBlocks?.subMaterialLot && (
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="text-[11px] font-black text-slate-400 block">부자재 LOT NO. (사진 12)</span>
                  <input
                    type="text"
                    value={currentReport.subMaterialLot || ""}
                    onChange={(e) => handleUpdateField("subMaterialLot", e.target.value)}
                    className="w-full font-bold text-xs bg-transparent outline-none border-b border-dashed border-slate-400 py-1"
                    placeholder="패드 ST / 테이프 LOT 번호"
                  />
                </div>
              )}

              {currentReport.activeBlocks?.remarks && (
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="text-[11px] font-black text-slate-400 block">■ 특기 사항 (조치사항)</span>
                  <input
                    type="text"
                    value={currentReport.remarks || ""}
                    onChange={(e) => handleUpdateField("remarks", e.target.value)}
                    className="w-full font-bold text-xs bg-transparent outline-none border-b border-dashed border-slate-400 py-1"
                    placeholder="설비 이상, 원부자재 교체, 조치사항 등 입력"
                  />
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* ======================================================================= */}
      {/* 🖼️ MODAL: 16대 원본 사진 레고 블록 갤러리 */}
      {/* ======================================================================= */}
      {showPhotoRefModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-5xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-white">
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base sm:text-lg font-black flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-amber-400" />
                  <span>'레고 양식.xlsx' 원본 사진 16종 대조 갤러리</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  현장에서 캡처된 16개의 실물 레고 블록 사진 원본입니다.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPhotoRefModal(false)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-4 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {LEGO_IMAGE_REFERENCES.map((item, idx) => (
                <div key={item.id} className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-1 pb-1 border-b border-slate-800 mb-2">
                      <span className="text-xs font-black text-amber-300">사진 {idx + 1}</span>
                      <span className="text-[10px] text-slate-400 font-bold">{item.title}</span>
                    </div>
                    <div className="bg-white p-1 rounded-xl flex items-center justify-center min-h-[140px]">
                      <img src={item.imgFile} alt={item.title} className="max-h-40 max-w-full object-contain" />
                    </div>
                  </div>
                  <p className="text-[10.5px] text-slate-400 mt-1 leading-snug">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LegoWorkReportBuilder;
