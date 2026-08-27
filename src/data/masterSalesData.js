// Master Sales Data parsed from '매입-매출 정리본' (2026년 07월)
// Total Sales: ₩2,873,777,826 | Total Items: 81 | Total Qty: 390,489

export const MASTER_SALES_SUMMARY = {
  yearMonth: "2026-07",
  totalSales: 2873777826,
  prevMonthSales: 2861636284,
  momDiff: 12141542,
  totalQty: 390489,
  itemCount: 81,
  vehicleGroupCount: 23
};

export const MASTER_PROCESS_BREAKDOWN = [
  { process: "내수상품매출", label: "내수 완성차 납품", count: 51, totalAmount: 1096027550, share: 38.14, color: "#3B82F6" },
  { process: "PCM 매출", label: "PCM 압출/가공", count: 1, totalAmount: 934505308, share: 32.52, color: "#10B981" },
  { process: "수출상품매출", label: "북미/해외 수출", count: 15, totalAmount: 842048746, share: 29.30, color: "#8B5CF6" },
  { process: "A/S", label: "보수용 A/S 부품", count: 10, totalAmount: 1143312, share: 0.04, color: "#F59E0B" },
  { process: "EPDM", label: "EPDM 부품 라인", count: 4, totalAmount: 52910, share: 0.00, color: "#EC4899" }
];

export const MASTER_VEHICLE_SALES = [
  {
    rank: 1,
    vehicleGroup: "PCM 압출/가공",
    category: "PCM 공정",
    itemCount: 1,
    totalQty: 1,
    totalAmount: 934505308,
    share: 32.52,
    details: [
      { itemCode: "PCM-07", partNumber: "PCM-TOTAL", partName: "PCM 매출 전체 (압출 및 가공 7월 정산)", unitPrice: 934505308, qty: 1, amount: 934505308, process: "PCM 매출" }
    ]
  },
  {
    rank: 2,
    vehicleGroup: "9BQC",
    category: "내수상품",
    itemCount: 8,
    totalQty: 87260,
    totalAmount: 612722880,
    share: 21.32,
    details: [
      { itemCode: "G1102-2756-00", partNumber: "42933958", partName: "9BQC RR LH (PRI)", unitPrice: 11028, qty: 21480, amount: 236881440, process: "내수상품매출" },
      { itemCode: "G1102-2757-00", partNumber: "42933959", partName: "9BQC RR RH (PRI)", unitPrice: 11028, qty: 21420, amount: 236219760, process: "내수상품매출" },
      { itemCode: "G1102-2752-00", partNumber: "42933952", partName: "9BQC FRT LH", unitPrice: 2858, qty: 21400, amount: 61161200, process: "내수상품매출" },
      { itemCode: "G1102-2753-00", partNumber: "42933953", partName: "9BQC FRT RH", unitPrice: 2858, qty: 21200, amount: 60589600, process: "내수상품매출" },
      { itemCode: "G1102-2754-00", partNumber: "42933956", partName: "9BQC RR LH (TNI)", unitPrice: 10598, qty: 780, amount: 8266440, process: "내수상품매출" },
      { itemCode: "G1102-2755-00", partNumber: "42933957", partName: "9BQC RR RH (TNI)", unitPrice: 10598, qty: 780, amount: 8266440, process: "내수상품매출" },
      { itemCode: "G1102-2463-00", partNumber: "42870825", partName: "9BQC Glass run RR RH PRIVACY", unitPrice: 10627, qty: 100, amount: 1062700, process: "내수상품매출" },
      { itemCode: "G1102-2544-00", partNumber: "42896296", partName: "9BQC Glass run FR RH", unitPrice: 2753, qty: 100, amount: 275300, process: "내수상품매출" }
    ]
  },
  {
    rank: 3,
    vehicleGroup: "DT (수출)",
    category: "수출상품",
    itemCount: 4,
    totalQty: 66240,
    totalAmount: 411099840,
    share: 14.31,
    details: [
      { itemCode: "G1103-2137-01", partNumber: "68291620AD", partName: "DT(CREW) Door Side RR RH (CREW)", unitPrice: 6206, qty: 32400, amount: 201074400, process: "수출상품매출" },
      { itemCode: "G1103-2138-01", partNumber: "68291621AD", partName: "DT(CREW) Door Side RR LH (CREW)", unitPrice: 6206, qty: 32400, amount: 201074400, process: "수출상품매출" },
      { itemCode: "G1103-2139-01", partNumber: "68291618AD", partName: "DT(QUAD) Door Side RR RH", unitPrice: 6216, qty: 720, amount: 4475520, process: "수출상품매출" },
      { itemCode: "G1103-2140-01", partNumber: "68291619AD", partName: "DT(QUAD) Door Side RR LH", unitPrice: 6216, qty: 720, amount: 4475520, process: "수출상품매출" }
    ]
  },
  {
    rank: 4,
    vehicleGroup: "NX4 (내수/수출)",
    category: "내수/수출",
    itemCount: 6,
    totalQty: 54680,
    totalAmount: 303396720,
    share: 10.56,
    details: [
      { itemCode: "G1102-2069-01", partNumber: "G1102-2069-00", partName: "NX4a G/RUN FRT LH (수출)", unitPrice: 5800, qty: 12960, amount: 75168000, process: "수출상품매출" },
      { itemCode: "G1102-2070-01", partNumber: "G1102-2070-00", partName: "NX4a G/RUN FRT RH (수출)", unitPrice: 5800, qty: 12960, amount: 75168000, process: "수출상품매출" },
      { itemCode: "G1102-1973-00", partNumber: "82530-9N000", partName: "NX4 FRT LH (내수)", unitPrice: 5322, qty: 13239, amount: 70457958, process: "내수상품매출" },
      { itemCode: "G1102-1974-00", partNumber: "82540-9N000", partName: "NX4 FRT RH (내수)", unitPrice: 5322, qty: 13239, amount: 70457958, process: "내수상품매출" },
      { itemCode: "G1102-1973-01", partNumber: "82530-9N000", partName: "NX4 Glass run FR LH 현대CKD", unitPrice: 5322, qty: 1141, amount: 6072402, process: "내수상품매출" },
      { itemCode: "G1102-1974-01", partNumber: "82540-9N000", partName: "NX4 Glass run FR RH 현대CKD", unitPrice: 5322, qty: 1141, amount: 6072402, process: "내수상품매출" }
    ]
  },
  {
    rank: 5,
    vehicleGroup: "DS (수출)",
    category: "수출상품",
    itemCount: 4,
    totalQty: 38400,
    totalAmount: 224624960,
    share: 7.82,
    details: [
      { itemCode: "G1103-2082-01", partNumber: "55112363AI", partName: "DS(CREW) Door Side RR LH", unitPrice: 5845, qty: 18880, amount: 110353600, process: "수출상품매출" },
      { itemCode: "G1103-2081-01", partNumber: "55112362AI", partName: "DS(CREW) Door Side RR RH", unitPrice: 5845, qty: 17280, amount: 101001600, process: "수출상품매출" },
      { itemCode: "G1103-2086-00", partNumber: "68563583AC", partName: "DS(TRUCK) Door Side FR LH", unitPrice: 6154, qty: 1120, amount: 6892480, process: "수출상품매출" },
      { itemCode: "G1103-2085-00", partNumber: "68563582AC", partName: "DS(TRUCK) Door Side FR RH", unitPrice: 5694, qty: 1120, amount: 6377280, process: "수출상품매출" }
    ]
  },
  {
    rank: 6,
    vehicleGroup: "JA",
    category: "내수상품",
    itemCount: 6,
    totalQty: 40119,
    totalAmount: 120024682,
    share: 4.18,
    details: [
      { itemCode: "R1102-1363-00", partNumber: "83530G6000", partName: "G/RUN RR LH", unitPrice: 3443, qty: 9800, amount: 33741400, process: "내수상품매출" },
      { itemCode: "R1102-1364-00", partNumber: "83540G6000", partName: "G/RUN RR RH", unitPrice: 3443, qty: 9800, amount: 33741400, process: "내수상품매출" },
      { itemCode: "G1102-1361-00", partNumber: "82530G6000", partName: "G/RUN FRT LH", unitPrice: 2558, qty: 10235, amount: 26181130, process: "내수상품매출" },
      { itemCode: "G1102-1362-00", partNumber: "82540G6000", partName: "G/RUN FRT RH", unitPrice: 2558, qty: 10225, amount: 26155550, process: "내수상품매출" },
      { itemCode: "G1102-1364-01", partNumber: "83540G6000", partName: "G/RUN RR RH", unitPrice: 3478, qty: 30, amount: 104340, process: "내수상품매출" },
      { itemCode: "G1102-1363-01", partNumber: "83530G6000", partName: "G/RUN RR RH", unitPrice: 3478, qty: 29, amount: 100862, process: "내수상품매출" }
    ]
  },
  {
    rank: 7,
    vehicleGroup: "PU",
    category: "내수상품",
    itemCount: 6,
    totalQty: 20137,
    totalAmount: 65083314,
    share: 2.26,
    details: [
      { itemCode: "G1106-0179", partNumber: "822104E000", partName: "PU OUT CHAN LH", unitPrice: 3275, qty: 7279, amount: 23838725, process: "내수상품매출" },
      { itemCode: "G1106-0180", partNumber: "822204E000", partName: "PU OUT CHAN RH", unitPrice: 3275, qty: 7271, amount: 23812525, process: "내수상품매출" },
      { itemCode: "G1106-0179-01", partNumber: "822104E000", partName: "PU Outer Belt FR LH", unitPrice: 3275, qty: 2160, amount: 7074000, process: "내수상품매출" },
      { itemCode: "G1106-0180-01", partNumber: "822204E000", partName: "PU Outer Belt FR RH", unitPrice: 3275, qty: 2160, amount: 7074000, process: "내수상품매출" },
      { itemCode: "G1102-0620", partNumber: "832104E000", partName: "PU(D/CAB) OTR BELT LH", unitPrice: 2592, qty: 647, amount: 1677024, process: "내수상품매출" },
      { itemCode: "G1102-0621", partNumber: "832204E000", partName: "PU(D/CAB) OTR BELT RH", unitPrice: 2592, qty: 620, amount: 1607040, process: "내수상품매출" }
    ]
  },
  {
    rank: 8,
    vehicleGroup: "NE1 / ME1 (수출/내수)",
    category: "수출/내수",
    itemCount: 6,
    totalQty: 11848,
    totalAmount: 56056961,
    share: 1.95,
    details: [
      { itemCode: "G1103-1874-02", partNumber: "83140PI000", partName: "NE1a Door Side RR RH", unitPrice: 5294, qty: 2880, amount: 15246720, process: "수출상품매출" },
      { itemCode: "G1103-1873-02", partNumber: "83130PI000", partName: "NE1a Door Side RR LH", unitPrice: 4898, qty: 2880, amount: 14106240, process: "수출상품매출" },
      { itemCode: "G1103-1872-02", partNumber: "82140PI000", partName: "NE1a Door Side FR RH", unitPrice: 4379, qty: 3200, amount: 14012800, process: "수출상품매출" },
      { itemCode: "G1103-1871-02", partNumber: "82130PI000", partName: "NE1a Door Side FR LH", unitPrice: 4379, qty: 2880, amount: 12611520, process: "수출상품매출" },
      { itemCode: "G1103-1871-01", partNumber: "82130PI000", partName: "NE1a Door Side FR LH (A/S)", unitPrice: 4379, qty: 8, amount: 35032, process: "A/S" },
      { itemCode: "G1103-1874-01", partNumber: "83140PI000", partName: "NE1a Door Side RR RH (A/S)", unitPrice: 4898, qty: 4, amount: 19592, process: "A/S" }
    ]
  },
  {
    rank: 9,
    vehicleGroup: "OV1k",
    category: "내수상품",
    itemCount: 4,
    totalQty: 30867,
    totalAmount: 46963911,
    share: 1.63,
    details: [
      { itemCode: "G1110-0203-00", partNumber: "86435X9000", partName: "OV1k Hood Seal (FRUNK)", unitPrice: 1712, qty: 8064, amount: 13805568, process: "내수상품매출" },
      { itemCode: "G1160-0010-00", partNumber: "81865X9100", partName: "OV1k Power Tail Gate Side Strip RH", unitPrice: 1661, qty: 7372, amount: 12244892, process: "내수상품매출" },
      { itemCode: "G1160-0009-00", partNumber: "81855X9100", partName: "OV1k Power Tail Gate Side Strip LH", unitPrice: 1661, qty: 7367, amount: 12236587, process: "내수상품매출" },
      { itemCode: "G1110-0202-00", partNumber: "86430X9000", partName: "OV1k Hood Seal", unitPrice: 1076, qty: 8064, amount: 8676864, process: "내수상품매출" }
    ]
  },
  {
    rank: 10,
    vehicleGroup: "HR",
    category: "내수상품",
    itemCount: 4,
    totalQty: 17838,
    totalAmount: 46713696,
    share: 1.63,
    details: [
      { itemCode: "G1102-0085", partNumber: "825304F000", partName: "G/RUN FRT LH", unitPrice: 2664, qty: 7898, amount: 21040272, process: "내수상품매출" },
      { itemCode: "G1102-0128", partNumber: "825404F000", partName: "G/RUN FRT RH", unitPrice: 2664, qty: 7882, amount: 20997648, process: "내수상품매출" },
      { itemCode: "G1102-0218", partNumber: "835404F000", partName: "G/RUN RR RH", unitPrice: 2272, qty: 1031, amount: 2342432, process: "내수상품매출" },
      { itemCode: "G1102-0181", partNumber: "835304F000", partName: "G/RUN RR LH", unitPrice: 2272, qty: 1027, amount: 2333344, process: "내수상품매출" }
    ]
  },
  {
    rank: 11,
    vehicleGroup: "JK 1 (내수/임가공)",
    category: "내수/임가공",
    itemCount: 4,
    totalQty: 16470,
    totalAmount: 25273340,
    share: 0.88,
    details: [
      { itemCode: "G1129-0063-00", partNumber: "82540-9N000", partName: "JK Wheel Seal RR RH", unitPrice: 1546, qty: 5410, amount: 8363860, process: "내수상품매출" },
      { itemCode: "G1129-0062-00", partNumber: "82530-9N000", partName: "JK Wheel Seal RR LH", unitPrice: 1546, qty: 5280, amount: 8162880, process: "내수상품매출" },
      { itemCode: "F1129-0062-00", partNumber: "831C0-AR000", partName: "JK Wheel Seal RR LH (임가공)", unitPrice: 1490, qty: 1690, amount: 2518100, process: "임가공" },
      { itemCode: "F1129-0063-00", partNumber: "831D0-AR000", partName: "JK Wheel Seal RR RH (임가공)", unitPrice: 1490, qty: 1690, amount: 2518100, process: "임가공" }
    ]
  },
  {
    rank: 12,
    vehicleGroup: "VT",
    category: "내수상품",
    itemCount: 1,
    totalQty: 3400,
    totalAmount: 12512000,
    share: 0.44,
    details: [
      { itemCode: "G1102-0832-01", partNumber: "81151-5H000", partName: "VT OUTER BELT 벨트라인", unitPrice: 3680, qty: 3400, amount: 12512000, process: "내수상품매출" }
    ]
  },
  {
    rank: 13,
    vehicleGroup: "GV",
    category: "내수상품",
    itemCount: 2,
    totalQty: 1650,
    totalAmount: 4087050,
    share: 0.14,
    details: [
      { itemCode: "G1106-0212", partNumber: "821707M000", partName: "OTR CHAN LH", unitPrice: 2477, qty: 830, amount: 2055910, process: "내수상품매출" },
      { itemCode: "G1106-0213", partNumber: "821807M000", partName: "OTR CHAN RH", unitPrice: 2477, qty: 820, amount: 2031140, process: "내수상품매출" }
    ]
  },
  {
    rank: 14,
    vehicleGroup: "CE1",
    category: "내수상품",
    itemCount: 2,
    totalQty: 1820,
    totalAmount: 3001180,
    share: 0.10,
    details: [
      { itemCode: "G1125-0076-00", partNumber: "831A0KL000", partName: "CE1 P/SEAL RR LH", unitPrice: 1649, qty: 921, amount: 1518729, process: "내수상품매출" },
      { itemCode: "G1125-0077-00", partNumber: "831B0KL000", partName: "CE1 P/SEAL RR RH", unitPrice: 1649, qty: 899, amount: 1482451, process: "내수상품매출" }
    ]
  },
  {
    rank: 15,
    vehicleGroup: "P417",
    category: "내수상품",
    itemCount: 2,
    totalQty: 460,
    totalAmount: 2949060,
    share: 0.10,
    details: [
      { itemCode: "G1109-0252-02", partNumber: "6608258820", partName: "P417 Upper Opening RH", unitPrice: 6411, qty: 240, amount: 1538640, process: "내수상품매출" },
      { itemCode: "G1109-0251-02", partNumber: "6608258819", partName: "P417 Upper Opening LH", unitPrice: 6411, qty: 220, amount: 1410420, process: "내수상품매출" }
    ]
  },
  {
    rank: 16,
    vehicleGroup: "QZ",
    category: "내수상품",
    itemCount: 2,
    totalQty: 1350,
    totalAmount: 2719033,
    share: 0.09,
    details: [
      { itemCode: "G1106-0317-00", partNumber: "821707P000", partName: "OTR CHAN LH", unitPrice: 2150, qty: 673, amount: 1446950, process: "내수상품매출" },
      { itemCode: "G1106-0318-00", partNumber: "821807P000", partName: "OTR CHAN RH", unitPrice: 1879, qty: 677, amount: 1272083, process: "내수상품매출" }
    ]
  },
  {
    rank: 17,
    vehicleGroup: "FS (A/S)",
    category: "A/S",
    itemCount: 3,
    totalQty: 179,
    totalAmount: 646125,
    share: 0.02,
    details: [
      { itemCode: "G1103-0628", partNumber: "82130-2V000", partName: "D/SIDE FR LH", unitPrice: 3850, qty: 100, amount: 385000, process: "A/S" },
      { itemCode: "G1103-0630", partNumber: "83140-2V000", partName: "D/SIDE RR RH", unitPrice: 3327, qty: 65, amount: 216255, process: "A/S" },
      { itemCode: "G1103-0633", partNumber: "83130-2V900", partName: "RR RH(RHD)", unitPrice: 3205, qty: 14, amount: 44870, process: "A/S" }
    ]
  },
  {
    rank: 18,
    vehicleGroup: "EG",
    category: "내수상품",
    itemCount: 2,
    totalQty: 248,
    totalAmount: 569904,
    share: 0.02,
    details: [
      { itemCode: "G1106-0010", partNumber: "821807A000", partName: "OTR CHAN RH", unitPrice: 2298, qty: 156, amount: 358488, process: "내수상품매출" },
      { itemCode: "G1106-0009", partNumber: "821707A000", partName: "OTR CHAN LH", unitPrice: 2298, qty: 92, amount: 211416, process: "내수상품매출" }
    ]
  },
  {
    rank: 19,
    vehicleGroup: "TY",
    category: "내수상품",
    itemCount: 2,
    totalQty: 140,
    totalAmount: 346780,
    share: 0.01,
    details: [
      { itemCode: "G1106-0669-00", partNumber: "AD66203598-1", partName: "TY Outer Belt FRT LH", unitPrice: 2477, qty: 70, amount: 173390, process: "내수상품매출" },
      { itemCode: "G1106-0670-00", partNumber: "AD62203598-2", partName: "TY Outer Belt FRT RH", unitPrice: 2477, qty: 70, amount: 173390, process: "내수상품매출" }
    ]
  },
  {
    rank: 20,
    vehicleGroup: "BL / BL7m",
    category: "A/S",
    itemCount: 1,
    totalQty: 130,
    totalAmount: 220220,
    share: 0.01,
    details: [
      { itemCode: "G1110-0171-01", partNumber: "86455BC000", partName: "BL7m Hood Seal (FRT)", unitPrice: 1694, qty: 130, amount: 220220, process: "A/S" }
    ]
  },
  {
    rank: 21,
    vehicleGroup: "GM (M2JO)",
    category: "A/S",
    itemCount: 1,
    totalQty: 50,
    totalAmount: 202950,
    share: 0.01,
    details: [
      { itemCode: "G1102-1487-03", partNumber: "42574263", partName: "M2JO Glass run FR RH", unitPrice: 4059, qty: 50, amount: 202950, process: "A/S" }
    ]
  },
  {
    rank: 22,
    vehicleGroup: "HI / VI",
    category: "EPDM",
    itemCount: 4,
    totalQty: 24,
    totalAmount: 52910,
    share: 0.00,
    details: [
      { itemCode: "G1127-0018-00", partNumber: "82231-D2000", partName: "INR BELT FRT LH", unitPrice: 2615, qty: 12, amount: 31380, process: "EPDM" },
      { itemCode: "G1106-0252", partNumber: "82241-3N000", partName: "INR BELT FRT RH", unitPrice: 1531, qty: 6, amount: 9186, process: "EPDM" },
      { itemCode: "G1106-0254", partNumber: "83241-3N000", partName: "INR BELT RR RH", unitPrice: 1662, qty: 5, amount: 8310, process: "EPDM" },
      { itemCode: "G1127-0020-00", partNumber: "83231-D2000", partName: "INR BELT RR LH", unitPrice: 4034, qty: 1, amount: 4034, process: "EPDM" }
    ]
  },
  {
    rank: 23,
    vehicleGroup: "PD",
    category: "A/S",
    itemCount: 1,
    totalQty: 2,
    totalAmount: 10666,
    share: 0.00,
    details: [
      { itemCode: "G1102-1346-00", partNumber: "82530-G3000", partName: "G/RUN FRT LH", unitPrice: 5333, qty: 2, amount: 10666, process: "A/S" }
    ]
  }
];
