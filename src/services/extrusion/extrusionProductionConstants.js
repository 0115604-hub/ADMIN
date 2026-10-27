// Extrusion Production Constants & Standard Specifications
export const COLLECTION_NAME = "extrusion_work_reports";
export const EXTRUSION_PROD_STORAGE_KEY = "factory_extrusion_work_reports_v1";

export const EXTRUSION_STANDARD_SPECS = {
  extruder110Rpm: "26.4", // Ø110 압출속도 (표준 29.0±2.9 RPM)
  extruder70Rpm: "19.2",  // Ø70 압출속도 (표준 20.0±2.0 RPM)
  extruder60Rpm: "19.2",  // legacy fallback
  haulOffSpeed: "19.6",   // 라인 인취속도 (표준 20.0±1.0 m/분)
  waterZones110: {
    screw: "50.0",
    cylinder1: "50.0",
    cylinder2: "50.0",
    cylinder3: "50.0",
    head: "50.0"
  },
  waterZones70: {
    screw: "50.0",
    cylinder1: "50.0",
    cylinder2: "50.0",
    cylinder3: "50.0"
  },
  waterTemp: "50.0",      // 온수조 표준 50±5℃ (스크류, 실린더1~3, 헤드1)
  waterZones: [50.0, 50.0, 50.0, 50.0], // 온조기 1~4구간 표준
  cureZoneTemp: "212.0",  // PCM 13존 표준 210±20℃ (190~230℃)
  sprayGun1: "2.5",       // 코팅건 1번 2.5 bar
  sprayGun2: "2.6",       // 코팅건 2번 2.5 bar
  sprayGun3: "2.5",       // 코팅건 3번 2.5 bar
  sprayGun4: "2.4",       // 코팅건 4번 2.5 bar
  coatingThicknessBase: "16.1",  // 기저부 ≥ 15㎛
  coatingThicknessOuter: "20.8", // OUTER ≥ 15㎛
  coatingThicknessInner: "16.1", // INNER ≥ 15㎛
  rubberType: "W60433 (EPDM)",
  rubberLot: "UF10161726927029200A",
  coatingType: "HSC-2000B-3",
  coatingLot: "UF10161726927032700A",
  insertType: "SK5 0.5T",
  insertLot: "LOT-260930A",
  pcmZones: [211.0, 212.5, 214.0, 210.5, 209.0, 213.0, 212.0, 210.0, 211.5, 215.0, 208.5, 210.0, 212.0],
  // TPE Standard Specs (4개 압출기 속도 & 압출기온도 ±10℃ & 냉각수온도)
  tpeExtruder100Rpm: "25.0",
  tpeExtruder80Rpm: "20.0",
  tpeExtruder65Rpm: "18.0",
  tpeExtruder35Rpm: "15.0",
  tpeExtruder45Rpm: "15.0",
  tpeCoolingWaterTemp: "20",
  tpeTemps100: {
    screw: "180",
    cylinder1: "180",
    cylinder2: "185",
    cylinder3: "190",
    cylinder4: "195",
    cylinder5: "200",
    cylinder6: "200",
    adapter: "205",
    die: "210",
    head1: "205",
    head2: "205",
    hopperDryer: "80"
  },
  tpeTemps80: {
    cylinder1: "180",
    cylinder2: "185",
    cylinder3: "190",
    cylinder4: "195",
    adapter: "200",
    nozzle: "205",
    hopperDryer: "80"
  },
  tpeTemps65: {
    cylinder1: "180",
    cylinder2: "185",
    cylinder3: "190",
    adapter: "195",
    nozzle: "200",
    hopperDryer: "80"
  },
  tpeTemps35: {
    cylinder1: "180",
    cylinder2: "185",
    adapter: "190",
    nozzle: "195",
    hopperDryer: "80"
  },
  tpeTemps45: {
    cylinder1: "180",
    cylinder2: "185",
    adapter: "190",
    nozzle: "195",
    hopperDryer: "80"
  },
  // PVC Standard Specs (80Ø 압출속도 & 인취속도 & 7구간 압출기온도 ±10℃ & 냉각조/본드도포/후로킹/건조로)
  pvcExtruder80Rpm: "20.0",
  pvcHaulOffSpeed: "15.0",
  pvcTemps: {
    cylinder1: "170",
    cylinder2: "175",
    cylinder3: "180",
    cylinder4: "185",
    adapter: "190",
    nozzle: "195",
    die: "195"
  },
  pvcCoolingTankTemp: "20",
  // 본드도포 (공급기1, 2 RPM)
  pvcBondFeeder1Rpm: "15.0",
  pvcBondFeeder2Rpm: "15.0",
  pvcBondCoating: "양호",
  // 후로킹(식모)조건 (전압 kV, 전류 uA, 파일조건)
  pvcFlockVoltage: "50",
  pvcFlockCurrent: "120",
  pvcFlockingCondition: "0.8mm 양호",
  // 건조로 온도 (1~4존 / 존1~존4) & 구동속도
  pvcDryerDriveSpeed: "15.0",
  pvcDryerSpeed: "15.0",
  pvcDryerTemp: "160",
  pvcDryerZones: {
    zone1: "160",
    zone2: "160",
    zone3: "165",
    zone4: "165"
  }
};

export const MATERIAL_PRESETS = {
  rubber: [
    { type: "W60433 (EPDM)", name: "EPDM W60433" },
    { type: "W60432 (EPDM)", name: "EPDM W60432" },
    { type: "SE-70 실리콘", name: "실리콘 SE-70" },
    { type: "TPE-V 65A", name: "TPE-V 65A" }
  ],
  coating: [
    { type: "HSC-2000B-3", name: "속건성 HSC-2000B-3" },
    { type: "UF-1016 우레탄", name: "우레탄 UF-1016" },
    { type: "PU-700B 수성", name: "수성 PU-700B" }
  ],
  insert: [
    { type: "SK5 0.5T", name: "SK5 0.5T" },
    { type: "SK5 0.6T", name: "SK5 0.6T" },
    { type: "SUS304 0.4T", name: "SUS304 0.4T" },
    { type: "AL 0.5T", name: "알루미늄 0.5T" }
  ]
};

export const EXTRUSION_LINE_OPTIONS = [
  { id: "pcm1", name: "PCM #1 LINE", shortName: "PCM 1호", badge: "PCM1", plant: "삼랑진공장", color: "teal", count: 49 },
  { id: "pcm3", name: "PCM #3 LINE", shortName: "PCM 3호", badge: "PCM3", plant: "삼랑진공장", color: "blue", count: 68 },
  { id: "pvc", name: "PVC LINE", shortName: "PVC", badge: "PVC", plant: "삼랑진공장", color: "amber", count: 15 },
  { id: "tpe", name: "TPE LINE", shortName: "TPE", badge: "TPE", plant: "삼랑진공장", color: "purple", count: 21 }
];

export const VEHICLE_PRESETS = [
  { code: "NX4", name: "투싼 (NX4)", itemPreset: "G/RUN FRT, RR" },
  { code: "GN7", name: "그랜저 (GN7)", itemPreset: "W/STRIP BODY S/D" },
  { code: "DL3", name: "K5 (DL3)", itemPreset: "DR SEC HOOD SEAL" },
  { code: "EV9", name: "EV9 (MV)", itemPreset: "BATTERY PACK SEAL" },
  { code: "GV80", name: "GV80 (JX1)", itemPreset: "W/STRIP ROOF" },
  { code: "MQ4", name: "쏘렌토 (MQ4)", itemPreset: "DOOR DRIP WEATHERSTRIP" },
  { code: "KA4", name: "카니발 (KA4)", itemPreset: "SLIDE DOOR G/RUN" },
  { code: "CN7", name: "아반떼 (CN7)", itemPreset: "TRUNK LID SEAL" }
];

export const WORKER_PRESETS = [
  { name: "공영국", title: "대리" },
  { name: "심임대", title: "반장" },
  { name: "이상은", title: "반장" },
  { name: "닉", title: "" },
  { name: "마이클", title: "" },
  { name: "존카를로", title: "" },
  { name: "지미", title: "" },
  { name: "만", title: "" },
  { name: "샤먼", title: "" },
  { name: "쿠마루", title: "" },
  { name: "이수루", title: "" }
];

export const DOWNTIME_CATEGORIES = [
  { id: "압개시", label: "압개시", type: "비가동", color: "bg-sky-100 text-sky-900 border-sky-300", defaultDetail: "초기 압출 승온 및 제품 인취 세팅" },
  { id: "형교환", label: "형교환", type: "비가동", color: "bg-amber-100 text-amber-900 border-amber-300", defaultDetail: "금형(다이스) 교체 및 치수 세팅" },
  { id: "종료", label: "종료", type: "비가동", color: "bg-slate-200 text-slate-800 border-slate-300", defaultDetail: "작업 종료 및 라인 클리닝/정리" },
  { id: "포밍", label: "포밍", type: "비가동", color: "bg-teal-100 text-teal-900 border-teal-300", defaultDetail: "포밍 롤러/설비 세팅 및 형상 보정" },
  { id: "박리", label: "박리", type: "비가동", color: "bg-amber-100 text-amber-900 border-amber-300", defaultDetail: "접착/코팅 박리 발생 구간 점검 및 비가동 조치" },
  { id: "후로킹", label: "후로킹", type: "비가동", color: "bg-purple-100 text-purple-900 border-purple-300", defaultDetail: "후로킹(식모) 챔버/정전기 설비 점검 및 비가동 조치" },
  { id: "뜯김", label: "뜯김", type: "불량", color: "bg-rose-100 text-rose-900 border-rose-300", defaultDetail: "제품 표면 뜯김 발생으로 다이스 청소" },
  { id: "철심", label: "철심", type: "불량", color: "bg-orange-100 text-orange-900 border-orange-300", defaultDetail: "인서트 철심 사행 및 틀어짐 교정" },
  { id: "재압출", label: "재압출", type: "불량", color: "bg-amber-100 text-amber-900 border-amber-300", defaultDetail: "초기 규격 미달로 재압출 진행" },
  { id: "단면형상", label: "단면형상", type: "불량", color: "bg-indigo-100 text-indigo-900 border-indigo-300", defaultDetail: "립/돌기 부위 단면형상 불량 수정" },
  { id: "스코치", label: "스코치", type: "불량", color: "bg-red-100 text-red-900 border-red-300", defaultDetail: "스크류 과열 고무 탄화(스코치) 제거" },
  { id: "이물", label: "이물", type: "불량", color: "bg-rose-100 text-rose-900 border-rose-300", defaultDetail: "원료 내 이물 혼입 발견으로 스크린 교체" },
  { id: "미분산", label: "미분산", type: "불량", color: "bg-purple-100 text-purple-900 border-purple-300", defaultDetail: "카본/배합제 미분산 덩어리 발생 조치" },
  { id: "발포", label: "발포", type: "불량", color: "bg-teal-100 text-teal-900 border-teal-300", defaultDetail: "스폰지 발포 배율 불량 및 온도 조정" },
  { id: "원인불명", label: "원인불명", type: "불량", color: "bg-gray-200 text-gray-800 border-gray-400", defaultDetail: "원인불명 규격 이상 점검 및 재세팅" },
  { id: "밴딩", label: "밴딩", type: "불량", color: "bg-blue-100 text-blue-900 border-blue-300", defaultDetail: "제품 휨/밴딩 현상 냉각조 장력 조정" },
  { id: "심금절단", label: "심금절단", type: "불량", color: "bg-rose-100 text-rose-900 border-rose-300", defaultDetail: "인서트 심금 끊어짐/절단 연결 작업" },
  { id: "심금노출", label: "심금노출", type: "불량", color: "bg-red-100 text-red-900 border-red-300", defaultDetail: "심금 노출로 폐기 처리 및 위치 교정" },
  { id: "천공", label: "천공", type: "불량", color: "bg-emerald-100 text-emerald-900 border-emerald-300", defaultDetail: "홀 천공 위치 편차 및 펀칭기 점검" },
  { id: "연고무절단", label: "연고무절단", type: "불량", color: "bg-orange-100 text-orange-900 border-orange-300", defaultDetail: "연질고무 끊김/절단 발생 조치" },
  { id: "길이", label: "길이", type: "불량", color: "bg-cyan-100 text-cyan-900 border-cyan-300", defaultDetail: "절단 길이 편차 발생 치수 재세팅" },
  { id: "코팅", label: "코팅", type: "불량", color: "bg-sky-100 text-sky-900 border-sky-300", defaultDetail: "코팅 분사 노즐 막힘 청소 및 압력 조정" },
  { id: "설비이상", label: "설비이상", type: "비가동", color: "bg-rose-100 text-rose-900 border-rose-300", defaultDetail: "압출 모터/감속기/인취기 설비 이상 점검" },
  { id: "다이스수정", label: "다이스수정", type: "비가동", color: "bg-violet-100 text-violet-900 border-violet-300", defaultDetail: "다이스 간격/각도 수정 및 샘플 확인" },
  { id: "기술TRY", label: "기술TRY", type: "비가동", color: "bg-fuchsia-100 text-fuchsia-900 border-fuchsia-300", defaultDetail: "신규 금형/배합 시생산 기술TRY 진행" },
  { id: "기타", label: "기타", type: "비가동", color: "bg-gray-100 text-gray-800 border-gray-300", defaultDetail: "기타 비가동 및 불량 조치" }
];

export const TPM_CHECK_ITEMS = [
  { id: 1, category: "설비 기본조건", name: "청소, 윤활, 조임, 누유·누수 점검" },
  { id: 2, category: "압출기", name: "스크류, 실린더, 감속기, 모터 상태" },
  { id: 3, category: "다이스", name: "마모, 막힘, 변형, 체결상태" },
  { id: 4, category: "온도", name: "실린더·다이 온도 설정 및 편차" },
  { id: 5, category: "압력", name: "압출압력, 압력 변동, 이상압력" },
  { id: 6, category: "냉각", name: "냉각수 온도·유량·순환상태" },
  { id: 7, category: "인취/권취", name: "인취속도, 장력, 롤러 상태" },
  { id: 8, category: "절단", name: "절단기 상태, 칼날 마모, 절단길이" },
  { id: 9, category: "전기/제어", name: "센서, 인버터, 히터, 제어반" },
  { id: 10, category: "안전", name: "방호장치, 비상정지, 안전커버" }
];
