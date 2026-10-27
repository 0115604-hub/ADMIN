// =============================================================================
// 🧱 Lego Work Report Builder - Preset Templates & Master Image References
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
