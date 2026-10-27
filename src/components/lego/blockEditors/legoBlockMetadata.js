// Block Metadata for labels and descriptions
export const BLOCK_METADATA_MAP = {
  timeAndOutput: {
    number: "블록 1",
    title: "조인트 작업자 / 시간 / 생산수량",
    desc: "구분(FRT LH/RH, RR LH/RH), 작업자, 작업시간 및 정품/불량/재조인트 수량 관리",
    imgFile: "/lego_images/lego_block_1.png"
  },
  basicInfo: {
    number: "블록 8",
    title: "공정명 & 차종/품명 표준 헤더",
    desc: "공정명, 차종(Car model), 품명(Part name), 작업자, 근무조, 시작/종료 시간 등 기본 메타데이터",
    imgFile: "/lego_images/lego_block_8.png"
  },
  workTimeOutput: {
    number: "블록 9",
    title: "작업시간 및 생산량(실적) 테이블",
    desc: "구분(FRT LH/RH, RR LH/RH)별 A단면/B단면 작업시간(시작/종료) 및 생산수량",
    imgFile: "/lego_images/lego_block_9.png"
  },
  specsCutting: {
    number: "블록 15",
    title: "정치 절단 길이 (Spec cutting) & LOT NO.",
    desc: "단면(A, B, C...) x 규격1(881±3 등) 및 규격2(488±3 가절단 등) 초물/중물/종물 실측치 & LOT NO.",
    imgFile: "/lego_images/lego_block_15.png"
  },
  stepCuttingFrt: {
    number: "블록 2",
    title: "2. 단컷팅 - FRT 구간 치수",
    desc: "FRT 구분 A(49mm), B(45mm) x SPEC 및 초물/중물/종물 실측치 관리",
    imgFile: "/lego_images/lego_block_2.png"
  },
  stepCuttingRr: {
    number: "블록 3",
    title: "2. 단컷팅 - RR 구간 치수",
    desc: "RR 구분 A(40mm), B(39mm) x SPEC 및 초물/중물/종물 실측치 관리",
    imgFile: "/lego_images/lego_block_3.png"
  },
  subMaterialLot: {
    number: "블록 11",
    title: "부자재 LOT NO. (패드 5T)",
    desc: "스폰지 패드 5T 입고일자 및 LOT 번호 관리 (도면 5T*5W*60L)",
    imgFile: "/lego_images/lego_block_11.png"
  },
  defectMaterialMatrix: {
    number: "블록 10",
    title: "불량소재구분 (8열 매트릭스)",
    desc: "FRT LH/RH A/B, RR LH/RH A/B (총 8열) x 압출소재불량(외면흠/오염/코팅/단면) 및 공정간불량",
    imgFile: "/lego_images/lego_block_10.png"
  },
  defectSectionAbc: {
    number: "블록 16",
    title: "불량소재구분 (Section A / B / C 3단면)",
    desc: "Section A, B, C 단면별 길이 미달, 와이어 노출, 단컷팅 불량 집계표",
    imgFile: "/lego_images/lego_block_16.png"
  },
  jointMaterial: {
    number: "블록 4",
    title: "3. 조인트 재료 (Joint Material)",
    desc: "조인트 재료명 (Grade name: SJ-4004B EPDM) & LOT NO 관리",
    imgFile: "/lego_images/lego_block_4.png"
  },
  injectionTemp: {
    number: "블록 5",
    title: "4. 사출온도 (Temperature)",
    desc: "Sett'g / Actual x Injection A, B, RR x 노즐, N2, H3, H4 온도 관리",
    imgFile: "/lego_images/lego_block_5.png"
  },
  injectionCondition: {
    number: "블록 6",
    title: "5. 사출조건 (Injection Condition)",
    desc: "거리(125mm), 속도(45mm/s), 압력(140bar), 시간(18.5s) x 초물/중물/종물 조건 관리",
    imgFile: "/lego_images/lego_block_6.png"
  },
  jointDefectMatrix: {
    number: "블록 7",
    title: "6. 조인트 공정불량 종합 매트릭스",
    desc: "10대 불량 항목 x 폐기불량(FRT/RR), 재조인트수량, 공정간불량 관리",
    imgFile: "/lego_images/lego_block_7.png"
  },
  drawingSpecCheck: {
    number: "블록 12",
    title: "도면 치수 & 중요 검사 현황 LH",
    desc: "부품 도면 다이어그램 A, B, D 위치 대조 및 실측 검사 (482±3, 658±5, 패드 5T)",
    imgFile: "/lego_images/lego_block_12.png"
  },
  rightAngleMatrix: {
    number: "블록 13, 14",
    title: "완제품 직각검사 일보 종합 매트릭스",
    desc: "LH/RH 2/3호기 라인 x 생산수량, 압출불량, 조인트불량, 후가공불량 3대 집계",
    imgFile: "/lego_images/lego_block_14.png"
  },
  frtRightAngleDefects: {
    number: "블록 17",
    title: "FRT 직각검사 불량 집계표 (FRT LH / RH)",
    desc: "립컷팅 누락, 패드 누락, 외면 오염, 미사상, 과사상, 조인트 씹힘 등 (17번째 실물 블록)",
    imgFile: "/lego_images/lego_block_17.png"
  },
  remarks: {
    number: "블록 16+",
    title: "특기 사항 및 조치 사항 (Remarks)",
    desc: "칼날 교체, 이상 발생 시 조치 이력 및 특별 공지사항 기록",
    imgFile: null
  }
};
