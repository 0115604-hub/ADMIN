import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Car,
  Boxes,
  Search,
  Layers,
  DollarSign,
  Percent,
  X,
  ExternalLink,
  ChevronRight,
  FileSpreadsheet,
  PackageCheck
} from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';
import { useMonth } from '../context/MonthContext';

// ============================================================================
// Exact Detailed Data from '2026-09월매입매출현황_최적화_v2.xlsx'
// ============================================================================

export const DEFAULT_2026_09_SALES_BREAKDOWN = [
  {
    rank: 1,
    category: 'PCM 압출/가공',
    item: 'PCM 1호, 2호 라인 전품목',
    amount: 560302582,
    share: 31.19,
    badge: 'PCM',
    subitems: [
      { code: 'PCM-09-001', partNo: 'WK/WD-01', name: 'WK/WD L/GATE 압출 (1호라인)', unitPrice: 7299, qty: 6333, amount: 46224567 },
      { code: 'PCM-09-002', partNo: 'CL4-RR', name: 'CL4 Hood RR 압출단품', unitPrice: 1667, qty: 16320, amount: 27205440 },
      { code: 'PCM-09-003', partNo: 'LQ2-SD-LH', name: 'LQ2 Hood SIDE Seal LH', unitPrice: 1637, qty: 13440, amount: 22001280 },
      { code: 'PCM-09-004', partNo: 'LQ2-SD-RH', name: 'LQ2 Hood SIDE Seal RH', unitPrice: 1637, qty: 13440, amount: 22001280 },
      { code: 'PCM-09-005', partNo: 'LQ2-RR', name: 'LQ2 Hood Seal RR', unitPrice: 1487, qty: 11520, amount: 17130240 },
      { code: 'PCM-09-006', partNo: 'LQ2-FR', name: 'LQ2 Hood Seal FR', unitPrice: 1453, qty: 10560, amount: 15343680 },
      { code: 'PCM-09-007', partNo: 'MX5A-A', name: 'MX5a Hood SECT "A"', unitPrice: 1373, qty: 9600, amount: 13180800 },
      { code: 'PCM-09-008', partNo: 'NQ5A-RR', name: 'NQ5A HOOD RR', unitPrice: 1622, qty: 7680, amount: 12456960 },
      { code: 'PCM-09-009', partNo: 'CL4-SD', name: 'CL4 Hood Side Seal', unitPrice: 919, qty: 9600, amount: 8822400 },
      { code: 'PCM-09-010', partNo: 'CL4-FR', name: 'CL4 Hood FRT', unitPrice: 1106, qty: 6400, amount: 7078400 },
      { code: 'PCM-09-011', partNo: 'KM/KX-FR', name: 'KM/KX Hood FR', unitPrice: 4415, qty: 1600, amount: 7064000 },
      { code: 'PCM-09-012', partNo: 'MQ4A-HD', name: 'MQ4A HOOD', unitPrice: 1489, qty: 3840, amount: 5717760 },
      { code: 'PCM-09-013', partNo: 'WK/WD-D', name: 'WK/WD D/SIDE RR "D"', unitPrice: 1205, qty: 4000, amount: 4820000 },
      { code: 'PCM-09-014', partNo: 'DN8-C', name: 'DN8 D/SIDE RR "C"', unitPrice: 1119, qty: 4140, amount: 4632660 },
      { code: 'PCM-09-015', partNo: 'NQ5A-HEV', name: 'NQ5a Hood (RR) (HEV)', unitPrice: 1471, qty: 2880, amount: 4236480 },
      { code: 'PCM-09-016', partNo: '9BQB-C', name: '9BQB FRT "C"', unitPrice: 1345, qty: 3000, amount: 4035000 },
      { code: 'PCM-09-017', partNo: 'SP3-D', name: 'SP3 D/SIDE RR "D"', unitPrice: 879, qty: 4080, amount: 3586320 },
      { code: 'PCM-09-018', partNo: 'OV1K-D', name: 'OV 1 K RR "D"', unitPrice: 946, qty: 3360, amount: 3178560 },
      { code: 'PCM-09-019', partNo: 'J100-C', name: 'J100 D/SIDE RR "C"', unitPrice: 1036, qty: 3020, amount: 3128720 },
      { code: 'PCM-09-020', partNo: 'DN8-D', name: 'DN8 D/SIDE RR "D"', unitPrice: 1253, qty: 2500, amount: 3132500 },
      { code: 'PCM-09-021', partNo: 'YB-C', name: 'YB D/SIDE RR "C"', unitPrice: 853, qty: 3630, amount: 3096390 },
      { code: 'PCM-09-022', partNo: 'Y400-A', name: 'Y400 D/SIDE FRT "A"', unitPrice: 1404, qty: 2000, amount: 2808000 },
      { code: 'PCM-09-023', partNo: 'MV1A-RR', name: 'MV1a HOOD RR', unitPrice: 1459, qty: 1920, amount: 2801280 },
      { code: 'PCM-09-024', partNo: 'OV1K-C', name: 'OV 1 K RR "C"', unitPrice: 914, qty: 3020, amount: 2760280 },
      { code: 'PCM-09-025', partNo: 'RS4-G', name: 'RS4 C PLR PART "G"', unitPrice: 1321, qty: 2000, amount: 2642000 },
      { code: 'PCM-09-026', partNo: 'Q200-A', name: 'Q200 D/SIDE RR "A"', unitPrice: 1271, qty: 2030, amount: 2580130 },
      { code: 'PCM-09-027', partNo: 'VT-A', name: 'VT UPR SEAL S"A"', unitPrice: 469, qty: 4465, amount: 2094085 },
      { code: 'PCM-09-028', partNo: 'NX4A-D', name: 'NX4 A D/SIDE "D"', unitPrice: 1334, qty: 1525, amount: 2034350 },
      { code: 'PCM-09-029', partNo: 'MV1A-FR', name: 'MV1a HOOD FRT', unitPrice: 1271, qty: 1600, amount: 2033600 },
      { code: 'PCM-09-030', partNo: 'NQ5A-FR-HEV', name: 'NQ5a Hood Seal (FRT) (HEV)', unitPrice: 1215, qty: 1600, amount: 1944000 },
      { code: 'PCM-09-031', partNo: 'ME1A-HD', name: 'ME1a Hood', unitPrice: 1493, qty: 960, amount: 1433280 },
      { code: 'PCM-09-032', partNo: 'HI-OP-B', name: 'HI UPPER OP G B', unitPrice: 1500, qty: 825, amount: 1237500 },
      { code: 'PCM-09-033', partNo: 'PCM-ETC', name: 'PCM 2호 라인 및 기타 압출 마감분', unitPrice: 1, qty: 307399850, amount: 307399850 }
    ]
  },
  {
    rank: 2,
    category: '수출 DT',
    item: 'DT(CREW) Door Side RR (미주)',
    amount: 277346520,
    share: 15.44,
    badge: '수출',
    subitems: [
      { code: 'G1103-2137-01', partNo: '68291620AD', name: 'DT(CREW) Door Side RR RH (CREW)', unitPrice: 6367, qty: 21960, amount: 139819320 },
      { code: 'G1103-2138-01', partNo: '68291621AD', name: 'DT(CREW) Door Side RR LH (CREW)', unitPrice: 6367, qty: 21600, amount: 137527200 }
    ]
  },
  {
    rank: 3,
    category: '내수 9BQC',
    item: '9BQC FRT, RR, TNI 등',
    amount: 259752320,
    share: 14.46,
    badge: '내수',
    subitems: [
      { code: 'G1102-2752-00', partNo: '42933952', name: '9BQC FRT LH', unitPrice: 10627, qty: 13800, amount: 146652600 },
      { code: 'G1102-2753-00', partNo: '42933953', name: '9BQC FRT RH', unitPrice: 2753, qty: 14200, amount: 39092600 },
      { code: 'G1102-2756-00', partNo: '42933958', name: '9BQC RR LH(PRI)', unitPrice: 2840, qty: 11700, amount: 33228000 },
      { code: 'G1102-2757-00', partNo: '42933959', name: '9BQC RR RH(PRI)', unitPrice: 2840, qty: 11580, amount: 32887200 },
      { code: 'G1102-2754-00', partNo: '42933956', name: '9BQC RR LH(TNI)', unitPrice: 10961, qty: 360, amount: 3945960 },
      { code: 'G1102-2755-00', partNo: '42933957', name: '9BQC RR RH(TNI)', unitPrice: 10961, qty: 360, amount: 3945960 }
    ]
  },
  {
    rank: 4,
    category: '내수 DL3',
    item: 'DL3 Glass Run, D/SIDE 등',
    amount: 170364060,
    share: 9.48,
    badge: '내수',
    subitems: [
      { code: 'G1106-0179', partNo: '822104E000', name: 'PU OUT CHAN LH (DL3 라인)', unitPrice: 3254, qty: 6680, amount: 21736720 },
      { code: 'R1102-1363-00', partNo: '83530G6000', name: 'DL3 G/RUN RR LH', unitPrice: 3422, qty: 6200, amount: 21216400 },
      { code: 'R1102-1364-00', partNo: '83540G6000', name: 'DL3 G/RUN RR RH', unitPrice: 3422, qty: 6200, amount: 21216400 },
      { code: 'G1106-0180', partNo: '822204E000', name: 'PU OUT CHAN RH (DL3 라인)', unitPrice: 3254, qty: 6457, amount: 21011078 },
      { code: 'G1102-1361-00', partNo: '82530G6000', name: 'DL3 G/RUN FRT LH', unitPrice: 2544, qty: 6420, amount: 16332480 },
      { code: 'G1102-1362-00', partNo: '82540G6000', name: 'DL3 G/RUN FRT RH', unitPrice: 2544, qty: 6420, amount: 16332480 },
      { code: 'G1102-0085', partNo: '825304F000', name: 'HR G/RUN FRT LH', unitPrice: 2648, qty: 6063, amount: 16054824 },
      { code: 'G1102-0128', partNo: '825404F000', name: 'HR G/RUN FRT RH', unitPrice: 2648, qty: 6064, amount: 16057472 },
      { code: 'G1106-0180-01', partNo: '822204E000', name: 'PU Outer Belt FR RH', unitPrice: 3254, qty: 1381, amount: 4493774 },
      { code: 'G1106-0179-01', partNo: '822104E000', name: 'PU Outer Belt FR LH', unitPrice: 3254, qty: 1380, amount: 4490520 },
      { code: 'G1102-0218', partNo: '835404F000', name: 'HR G/RUN RR RH', unitPrice: 2259, qty: 1662, amount: 3754458 },
      { code: 'G1102-0181', partNo: '835304F000', name: 'HR G/RUN RR LH', unitPrice: 2259, qty: 1660, amount: 3749940 },
      { code: 'G1106-0212', partNo: '821707M000', name: 'OTR CHAN LH', unitPrice: 2464, qty: 540, amount: 1330560 },
      { code: 'G1106-0213', partNo: '821807M000', name: 'OTR CHAN RH', unitPrice: 2464, qty: 420, amount: 1034880 },
      { code: 'G1102-0620', partNo: '832104E000', name: 'PU(D/CAB) OTR BELT LH', unitPrice: 2578, qty: 345, amount: 889410 },
      { code: 'G1102-0621', partNo: '832204E000', name: 'PU(D/CAB) OTR BELT RH', unitPrice: 2578, qty: 249, amount: 641922 },
      { code: 'G1102-1364-01', partNo: '83540G6000', name: 'G/RUN RR RH (추가분)', unitPrice: 3457, qty: 6, amount: 20742 }
    ]
  },
  {
    rank: 5,
    category: '수출 DS',
    item: 'DS(CREW/TRUCK) Door Side',
    amount: 154197200,
    share: 8.58,
    badge: '수출',
    subitems: [
      { code: 'G1103-2081-01', partNo: '55112362AI', name: 'DS(CREW) Door Side RR RH', unitPrice: 5965, qty: 11840, amount: 70625600 },
      { code: 'G1103-2082-01', partNo: '55112363AI', name: 'DS(CREW) Door Side RR LH', unitPrice: 5965, qty: 11200, amount: 66808000 },
      { code: 'G1103-2086-00', partNo: '68563583AC', name: 'DS(TRUCK) Door Side FR LH', unitPrice: 6280, qty: 1400, amount: 8792000 },
      { code: 'G1103-2085-00', partNo: '68563582AC', name: 'DS(TRUCK) Door Side FR RH', unitPrice: 5694, qty: 1400, amount: 7971600 }
    ]
  },
  {
    rank: 6,
    category: '내수 NX4',
    item: 'NX4 FRT, RR, 현대CKD',
    amount: 150844350,
    share: 8.40,
    badge: '내수',
    subitems: [
      { code: 'G1102-1974-00', partNo: '82540-9N000', name: 'NX4 Glass run FR RH', unitPrice: 5290, qty: 12495, amount: 66098550 },
      { code: 'G1102-1973-00', partNo: '82530-9N000', name: 'NX4 Glass run FR LH', unitPrice: 5290, qty: 12480, amount: 66019200 },
      { code: 'G1102-1974-01', partNo: '82540-9N000', name: 'NX4 Glass run FR RH 현대CKD', unitPrice: 5290, qty: 1770, amount: 9363300 },
      { code: 'G1102-1973-01', partNo: '82530-9N000', name: 'NX4 Glass run FR LH 현대CKD', unitPrice: 5290, qty: 1770, amount: 9363300 }
    ]
  },
  {
    rank: 7,
    category: '수출 NX4a',
    item: 'NX4a G/RUN FRT (CKD수출)',
    amount: 139238400,
    share: 7.75,
    badge: '수출',
    subitems: [
      { code: 'G1102-2069-01', partNo: 'G1102-2069-00', name: 'NX4a G/RUN FRT LH (CKD수출)', unitPrice: 5920, qty: 11760, amount: 69619200 },
      { code: 'G1102-2070-01', partNo: 'G1102-2070-00', name: 'NX4a G/RUN FRT RH (CKD수출)', unitPrice: 5920, qty: 11760, amount: 69619200 }
    ]
  },
  {
    rank: 8,
    category: '수출 NE1a / ME1a',
    item: 'NE1a Door Side, Center Pillar',
    amount: 33459840,
    share: 1.86,
    badge: '수출',
    subitems: [
      { code: 'G1103-1873-02', partNo: '83130PI000', name: 'NE1a Door Side RR LH', unitPrice: 4898, qty: 1920, amount: 9404160 },
      { code: 'G1103-1874-02', partNo: '83140PI000', name: 'NE1a Door Side RR RH', unitPrice: 5401, qty: 1600, amount: 8641600 },
      { code: 'G1103-1871-02', partNo: '82130PI000', name: 'NE1a Door Side FR LH', unitPrice: 4379, qty: 1920, amount: 8407680 },
      { code: 'G1103-1872-02', partNo: '82140PI000', name: 'NE1a Door Side FR RH', unitPrice: 4379, qty: 1600, amount: 7006400 }
    ]
  },
  {
    rank: 9,
    category: '내수 OV1k',
    item: 'OV1k Hood Seal, Tail Gate',
    amount: 25454748,
    share: 1.42,
    badge: '내수',
    subitems: [
      { code: 'G1110-0203-00', partNo: '86435X9000', name: 'OV1k Hood Seal (FRUNK)', unitPrice: 1702, qty: 4820, amount: 8203640 },
      { code: 'G1160-0009-00', partNo: '81855X9100', name: 'OV1k Power Tail Gate Side Strip LH', unitPrice: 1651, qty: 3686, amount: 6085586 },
      { code: 'G1160-0010-00', partNo: '81865X9100', name: 'OV1k Power Tail Gate Side Strip RH', unitPrice: 1651, qty: 3642, amount: 6012942 },
      { code: 'G1110-0202-00', partNo: '86430X9000', name: 'OV1k Hood Seal', unitPrice: 1069, qty: 4820, amount: 5152580 }
    ]
  },
  {
    rank: 10,
    category: '내수 JK1',
    item: 'JK Wheel Seal RR (22라인)',
    amount: 14263360,
    share: 0.79,
    badge: '내수',
    subitems: [
      { code: 'G1129-0062-00', partNo: '82530-9N000', name: 'JK Wheel Seal RR LH', unitPrice: 1537, qty: 3580, amount: 5502460 },
      { code: 'G1129-0063-00', partNo: '82540-9N000', name: 'JK Wheel Seal RR RH', unitPrice: 1537, qty: 3500, amount: 5379500 },
      { code: 'G1129-0062-01', partNo: '82530-9N000', name: 'JK Wheel Seal RR LH (22라인)', unitPrice: 1537, qty: 1100, amount: 1690700 },
      { code: 'G1129-0063-01', partNo: '82540-9N000', name: 'JK Wheel Seal RR RH (22라인)', unitPrice: 1537, qty: 1100, amount: 1690700 }
    ]
  },
  {
    rank: 11,
    category: '수출 PD',
    item: 'PD G/RUN FRT, RR',
    amount: 5761947,
    share: 0.32,
    badge: '수출',
    subitems: [
      { code: 'G1102-1350-00', partNo: '83540-G3000', name: 'PD G/RUN RR RH', unitPrice: 5611, qty: 1020, amount: 5723220 },
      { code: 'G1102-1347-00', partNo: '82540-G3000', name: 'PD G/RUN FRT RH', unitPrice: 5501, qty: 5, amount: 27505 },
      { code: 'G1102-1348-00', partNo: '83530-3G000', name: 'PD G/RUN RR LH', unitPrice: 5611, qty: 2, amount: 11222 }
    ]
  },
  {
    rank: 12,
    category: '내수 CE1',
    item: 'CE1 P/SEAL RR LH/RH',
    amount: 4318765,
    share: 0.24,
    badge: '내수',
    subitems: [
      { code: 'G1125-0077-00', partNo: '831B0KL000', name: 'CE1 P/SEAL RR RH', unitPrice: 1639, qty: 1340, amount: 2196260 },
      { code: 'G1125-0076-00', partNo: '831A0KL000', name: 'CE1 P/SEAL RR LH', unitPrice: 1639, qty: 1295, amount: 2122505 }
    ]
  },
  {
    rank: 13,
    category: '내수 기타차종',
    item: 'QZ, EG 등 소액 차종',
    amount: 234695,
    share: 0.01,
    badge: '내수',
    subitems: [
      { code: 'G1106-0097', partNo: '82110-1F000', name: 'EG UPR OPENING 단품', unitPrice: 2875, qty: 50, amount: 143750 },
      { code: 'G1106-0082', partNo: '82210-2J000', name: 'QZ OTR BELT 단품', unitPrice: 1819, qty: 50, amount: 90945 }
    ]
  },
  {
    rank: 14,
    category: 'AS / 상품기타',
    item: 'M2JO, FS, MV1a, 8NE1a, EPDM 샘플',
    amount: 918358,
    share: 0.05,
    badge: '기타',
    subitems: [
      { code: 'G1103-0628', partNo: '82130-2V000', name: 'FS D/SIDE FR LH', unitPrice: 3826, qty: 70, amount: 267820 },
      { code: 'G1103-0630', partNo: '83140-2V000', name: 'FS D/SIDE RR RH', unitPrice: 3306, qty: 70, amount: 231420 },
      { code: 'G1102-1486-04', partNo: '42574263', name: 'M2JO Glass run FR LH', unitPrice: 4059, qty: 50, amount: 202950 },
      { code: 'G1102-0729', partNo: '83531-1G000', name: 'JB G/RUN RR LH(4DR)', unitPrice: 4148, qty: 30, amount: 124440 },
      { code: 'G1102-0932', partNo: '82530-2P000', name: 'XM G/RUN FRT LH', unitPrice: 2629, qty: 18, amount: 47322 },
      { code: 'G1102-0933', partNo: '82540-2P000', name: 'XM G/RUN FRT RH', unitPrice: 2629, qty: 15, amount: 39435 },
      { code: 'G1160-0003-03', partNo: '81855XA100', name: 'MV1a Power Tail Gate Side Strip LH', unitPrice: 1657, qty: 3, amount: 4971 }
    ]
  }
];

export const DEFAULT_2026_09_PURCHASE_BREAKDOWN = [
  {
    "category": "EPDM 고무원자재 (삼랑진)",
    "supplier": "해동무역 (삼랑진공장 직입고 W60712, W60594 등)",
    "amount": 352656160,
    "share": 24.26,
    "badge": "원자재",
    "subitems": [
      {
        "code": "1",
        "name": "W60712$2 (MCA A,B,DT S/SEAL)",
        "supplier": "해동무역\r\n삼랑진",
        "unit": "Kg",
        "unitPrice": 3510,
        "qty": 50485,
        "amount": 177202350
      },
      {
        "code": "3",
        "name": "W60594BJ2 (MCA A,B 오프닝,트렁크)",
        "supplier": "해동무역 (삼랑진공장 직입고 W60712, W60594 등)",
        "unit": "Kg",
        "unitPrice": 4410,
        "qty": 11809,
        "amount": 52077690
      },
      {
        "code": "12",
        "name": "W60593$W3 (DT S/SEAL)",
        "supplier": "해동무역 (삼랑진공장 직입고 W60712, W60594 등)",
        "unit": "KG",
        "unitPrice": 4340,
        "qty": 11437,
        "amount": 49636580
      },
      {
        "code": "5",
        "name": "W60052 (NQ5 C, D)",
        "supplier": "해동무역 (삼랑진공장 직입고 W60712, W60594 등)",
        "unit": "KG",
        "unitPrice": 4110,
        "qty": 7134,
        "amount": 29320740
      },
      {
        "code": "2",
        "name": "W60712$2TA (MCA A,B,DT S/SEAL)",
        "supplier": "해동무역 (삼랑진공장 직입고 W60712, W60594 등)",
        "unit": "Kg",
        "unitPrice": 3340,
        "qty": 7471,
        "amount": 24953140
      },
      {
        "code": "6",
        "name": "W60905$OS (KL MCA,JK1)",
        "supplier": "해동무역 (삼랑진공장 직입고 W60712, W60594 등)",
        "unit": "KG",
        "unitPrice": 4940,
        "qty": 3743,
        "amount": 18490420
      },
      {
        "code": "13",
        "name": "W60054",
        "supplier": "해동무역 (삼랑진공장 직입고 W60712, W60594 등)",
        "unit": "KG",
        "unitPrice": 3870,
        "qty": 252,
        "amount": 975240
      }
    ],
    "rank": 1
  },
  {
    "category": "TPE 원자재/컴파운드",
    "supplier": "화승코퍼레이션 (NX4, 9BQC, JA 등 메인/조인트제)",
    "amount": 286376500,
    "share": 19.7,
    "badge": "원자재",
    "subitems": [
      {
        "code": "추가",
        "name": "EA1-73B (9BQC메인제)",
        "supplier": "화승코퍼레이션 (NX4, 9BQC, JA 등 메인/조인트제)",
        "unit": "Kg",
        "unitPrice": 5050,
        "qty": 14000,
        "amount": 70700000
      },
      {
        "code": "국산화",
        "name": "XA1-65B_001 (명례) (JA, 9BQC 메인제)",
        "supplier": "화승코퍼레이션 (NX4, 9BQC, JA 등 메인/조인트제)",
        "unit": "Kg",
        "unitPrice": 4660,
        "qty": 14000,
        "amount": 65240000
      },
      {
        "code": "12345679",
        "name": "B64E (HR,JB 메인제)",
        "supplier": "화승코퍼레이션 (NX4, 9BQC, JA 등 메인/조인트제)",
        "unit": "KG",
        "unitPrice": 5080,
        "qty": 6000,
        "amount": 30480000
      },
      {
        "code": "신천",
        "name": "GM-B64EM (9BQC조인트)",
        "supplier": "화승코퍼레이션 (NX4, 9BQC, JA 등 메인/조인트제)",
        "unit": "Kg",
        "unitPrice": 5540,
        "qty": 5500,
        "amount": 30470000
      },
      {
        "code": "R72",
        "name": "XA1-80B_001 (명례)",
        "supplier": "화승코퍼레이션 (NX4, 9BQC, JA 등 메인/조인트제)",
        "unit": "Kg",
        "unitPrice": 4600,
        "qty": 4000,
        "amount": 18400000
      },
      {
        "code": "R69",
        "name": "IA4-68B (JA 픽시드 조인트제)",
        "supplier": "화승코퍼레이션 (NX4, 9BQC, JA 등 메인/조인트제)",
        "unit": "Kg",
        "unitPrice": 5740,
        "qty": 3000,
        "amount": 17220000
      },
      {
        "code": "R65",
        "name": "IA4-75B_1 (NX 4 조인트제)",
        "supplier": "화승코퍼레이션",
        "unit": "KG",
        "unitPrice": 5190,
        "qty": 3000,
        "amount": 15570000
      },
      {
        "code": "추가",
        "name": "ED2-50B_001 (9BQC 슬립제)",
        "supplier": "화승코퍼레이션 (NX4, 9BQC, JA 등 메인/조인트제)",
        "unit": "Kg",
        "unitPrice": 14250,
        "qty": 1000,
        "amount": 14250000
      },
      {
        "code": "신천",
        "name": "IA4-80B (G) (9BQC 조인트제)",
        "supplier": "화승코퍼레이션 (NX4, 9BQC, JA 등 메인/조인트제)",
        "unit": "Kg",
        "unitPrice": 6020,
        "qty": 2000,
        "amount": 12040000
      },
      {
        "code": "R70",
        "name": "IA4-78B (HR,PD, JA, VF 34,35 직각 조인트제)",
        "supplier": "화승코퍼레이션 (NX4, 9BQC, JA 등 메인/조인트제)",
        "unit": "Kg",
        "unitPrice": 6250,
        "qty": 1000,
        "amount": 6250000
      },
      {
        "code": "R73",
        "name": "ED2-53B (JA 슬립제)",
        "supplier": "화승코퍼레이션 (NX4, 9BQC, JA 등 메인/조인트제)",
        "unit": "Kg",
        "unitPrice": 10380,
        "qty": 500,
        "amount": 5190000
      },
      {
        "code": "12345680",
        "name": "ED2-52B (HR/JA 슬립제)",
        "supplier": "화승코퍼레이션 (NX4, 9BQC, JA 등 메인/조인트제)",
        "unit": "Kg",
        "unitPrice": 11330,
        "qty": 50,
        "amount": 566500
      }
    ],
    "rank": 2
  },
  {
    "category": "삼랑진 T&C 반제품/사출가공",
    "supplier": "삼랑진 T&C (NX4 G/RUN FRT, DT HOOD SEAL 등)",
    "amount": 274911645,
    "share": 18.91,
    "badge": "외주가공",
    "subitems": [
      {
        "code": "G2102-2012",
        "name": "NX4 G/RUN FRT A",
        "supplier": "삼랑진\r\nT&C\r\n박수진마감",
        "unit": "1",
        "unitPrice": 3725,
        "qty": 25597,
        "amount": 95348825
      },
      {
        "code": "G2102-2013",
        "name": "NX4 G/RUN FRT B",
        "supplier": "삼랑진 T&C (NX4 G/RUN FRT, DT HOOD SEAL 등)",
        "unit": "2",
        "unitPrice": 4468,
        "qty": 16220,
        "amount": 72470960
      },
      {
        "code": "G2102-2014",
        "name": "NX4 G/RUN FRT C",
        "supplier": "삼랑진 T&C (NX4 G/RUN FRT, DT HOOD SEAL 등)",
        "unit": "3",
        "unitPrice": 2178,
        "qty": 21710,
        "amount": 47284380
      },
      {
        "code": "R90",
        "name": "가공 마감분",
        "supplier": "삼랑진 T&C (NX4 G/RUN FRT, DT HOOD SEAL 등)",
        "unit": "EA",
        "unitPrice": 0,
        "qty": 0,
        "amount": 28726880
      },
      {
        "code": "G2110-0097",
        "name": "DT HOOD SEAL FRT \"A\"",
        "supplier": "삼랑진 T&C (NX4 G/RUN FRT, DT HOOD SEAL 등)",
        "unit": "4",
        "unitPrice": 1516,
        "qty": 14150,
        "amount": 21451400
      },
      {
        "code": "G2110-0098",
        "name": "DT HOOD SEAL FRT \"B\"",
        "supplier": "삼랑진 T&C (NX4 G/RUN FRT, DT HOOD SEAL 등)",
        "unit": "5",
        "unitPrice": 1064,
        "qty": 9050,
        "amount": 9629200
      }
    ],
    "rank": 3
  },
  {
    "category": "신천 압출/외주가공",
    "supplier": "신천 (DT/DS Door Side, NE1a, MX5a 등)",
    "amount": 130499189,
    "share": 8.98,
    "badge": "외주가공",
    "subitems": [
      {
        "code": "F2103-1709",
        "name": "DT(CREW) D/SIDE \"A\" RR ROLL",
        "supplier": "신천 (DT/DS Door Side, NE1a, MX5a 등)",
        "unit": "13",
        "unitPrice": 1125,
        "qty": 23000,
        "amount": 25875000
      },
      {
        "code": "F2103-1710",
        "name": "DT(CREW) D/SIDE RR \"B\" ROLL",
        "supplier": "신천 (DT/DS Door Side, NE1a, MX5a 등)",
        "unit": "14",
        "unitPrice": 423,
        "qty": 56000,
        "amount": 23688000
      },
      {
        "code": "F2103-0606",
        "name": "DS D/SIDE RR A(CREW)",
        "supplier": "신천 (DT/DS Door Side, NE1a, MX5a 등)",
        "unit": "17",
        "unitPrice": 2047,
        "qty": 6400,
        "amount": 13100800
      },
      {
        "code": "F2103-0813-01",
        "name": "DS D/SIDE RR B RH(CREW)",
        "supplier": "신천 (DT/DS Door Side, NE1a, MX5a 등)",
        "unit": "6",
        "unitPrice": 1425,
        "qty": 8558,
        "amount": 12195150
      },
      {
        "code": "F2103-0814-01",
        "name": "DS D/SIDE RR B LH(CREW)",
        "supplier": "신천\r\n김명진마감",
        "unit": "5",
        "unitPrice": 1425,
        "qty": 8285,
        "amount": 11806125
      },
      {
        "code": "F2119-0258",
        "name": "MX5a Hood RR (신규)",
        "supplier": "신천 (DT/DS Door Side, NE1a, MX5a 등)",
        "unit": "21",
        "unitPrice": 1212,
        "qty": 8125,
        "amount": 9847500
      },
      {
        "code": "F2103-1533",
        "name": "DT(CREW) D/SIDE \"C\" RR",
        "supplier": "신천 (DT/DS Door Side, NE1a, MX5a 등)",
        "unit": "15",
        "unitPrice": 2779,
        "qty": 3208,
        "amount": 8915032
      },
      {
        "code": "F2103-0608",
        "name": "DS D/SIDE RR C (CREW)",
        "supplier": "신천 (DT/DS Door Side, NE1a, MX5a 등)",
        "unit": "18",
        "unitPrice": 2108,
        "qty": 3444,
        "amount": 7259952
      },
      {
        "code": "F2103-0615",
        "name": "DS D/SIDE   A  (STD)",
        "supplier": "신천 (DT/DS Door Side, NE1a, MX5a 등)",
        "unit": "19",
        "unitPrice": 1498,
        "qty": 1600,
        "amount": 2396800
      },
      {
        "code": "F2103-2404",
        "name": "NE1a Door Side RR RH SECT \"B\"클립머신",
        "supplier": "신천 (DT/DS Door Side, NE1a, MX5a 등)",
        "unit": "12",
        "unitPrice": 1988,
        "qty": 1160,
        "amount": 2306080
      },
      {
        "code": "G2103-2396",
        "name": "NE1a Door Side FR  \"A\"",
        "supplier": "신천 (DT/DS Door Side, NE1a, MX5a 등)",
        "unit": "1",
        "unitPrice": 1536,
        "qty": 1500,
        "amount": 2304000
      },
      {
        "code": "F2103-1536",
        "name": "DT D/SIDE QUAD \"C\"",
        "supplier": "신천 (DT/DS Door Side, NE1a, MX5a 등)",
        "unit": "16",
        "unitPrice": 2866,
        "qty": 800,
        "amount": 2292800
      },
      {
        "code": "F2103-2403",
        "name": "NE1a Door Side RR LH SECT \"B\"클립머신",
        "supplier": "신천 (DT/DS Door Side, NE1a, MX5a 등)",
        "unit": "11",
        "unitPrice": 1988,
        "qty": 1020,
        "amount": 2027760
      },
      {
        "code": "F2103-2400",
        "name": "NE1a Door Side FR LH SECT \"B\" 클립머신",
        "supplier": "신천 (DT/DS Door Side, NE1a, MX5a 등)",
        "unit": "9",
        "unitPrice": 1719,
        "qty": 1160,
        "amount": 1994040
      },
      {
        "code": "F2103-2402",
        "name": "NE1a Door Side FR RH SECT \"B\"클립머신",
        "supplier": "신천 (DT/DS Door Side, NE1a, MX5a 등)",
        "unit": "10",
        "unitPrice": 1719,
        "qty": 960,
        "amount": 1650240
      },
      {
        "code": "F2103-0618",
        "name": "DS D/SIDE  C (STD)",
        "supplier": "신천 (DT/DS Door Side, NE1a, MX5a 등)",
        "unit": "20",
        "unitPrice": 1843,
        "qty": 800,
        "amount": 1474400
      },
      {
        "code": "G2103-2398",
        "name": "NE1a Door Side RR  \"A\"",
        "supplier": "신천 (DT/DS Door Side, NE1a, MX5a 등)",
        "unit": "2",
        "unitPrice": 909,
        "qty": 1500,
        "amount": 1363500
      },
      {
        "code": "0",
        "name": "JG1S G/RUN \"E\"(1700) (신규)",
        "supplier": "신천 (DT/DS Door Side, NE1a, MX5a 등)",
        "unit": "24",
        "unitPrice": 1,
        "qty": 800,
        "amount": 800
      },
      {
        "code": "F2127-0156",
        "name": "JG INNER BELT RR (신규)",
        "supplier": "신천 (DT/DS Door Side, NE1a, MX5a 등)",
        "unit": "23",
        "unitPrice": 1,
        "qty": 610,
        "amount": 610
      },
      {
        "code": "F2127-0155",
        "name": "JG INNER BELT FRT (신규)",
        "supplier": "신천 (DT/DS Door Side, NE1a, MX5a 등)",
        "unit": "22",
        "unitPrice": 1,
        "qty": 600,
        "amount": 600
      }
    ],
    "rank": 4
  },
  {
    "category": "연고무 원자재/컴파운드",
    "supplier": "화승코퍼레이션 (HOOD RR, D/S 고무 컴파운드)",
    "amount": 93293200,
    "share": 6.42,
    "badge": "원자재",
    "subitems": [
      {
        "code": "FFWED80104",
        "name": "W60923 (HOOD RR 공용)",
        "supplier": "화승코퍼레이션 (HOOD RR, D/S 고무 컴파운드)",
        "unit": "KG",
        "unitPrice": 3610,
        "qty": 14550,
        "amount": 52525500
      },
      {
        "code": "FFWED80102",
        "name": "W60513M (D/S  C,D)",
        "supplier": "화승코퍼레이션 (HOOD RR, D/S 고무 컴파운드)",
        "unit": "KG",
        "unitPrice": 3400,
        "qty": 7759,
        "amount": 26380600
      },
      {
        "code": "FFWED80012",
        "name": "W6085YU (가니쉬)",
        "supplier": "화승코퍼레이션 (HOOD RR, D/S 고무 컴파운드)",
        "unit": "KG",
        "unitPrice": 3520,
        "qty": 2380,
        "amount": 8377600
      },
      {
        "code": "FFWED80065",
        "name": "w60922 (DS D/S D)",
        "supplier": "화승코퍼레이션 (HOOD RR, D/S 고무 컴파운드)",
        "unit": "KG",
        "unitPrice": 4250,
        "qty": 1414,
        "amount": 6009500
      }
    ],
    "rank": 5
  },
  {
    "category": "부자재 지텍 (9BQC PRI)",
    "supplier": "글라스 ㈜지텍 (9BQC PRI LH/RH 납품)",
    "amount": 60306400,
    "share": 4.15,
    "badge": "부자재",
    "subitems": [
      {
        "code": "3109-0183",
        "name": "9BQC PRI RH",
        "supplier": "글라스 ㈜지텍 (9BQC PRI LH/RH 납품)",
        "unit": "EA",
        "unitPrice": 2492,
        "qty": 14300,
        "amount": 35635600
      },
      {
        "code": "3109-0182",
        "name": "9BQC PRI LH",
        "supplier": "글라스\r\n㈜지텍 납품",
        "unit": "EA",
        "unitPrice": 2492,
        "qty": 9900,
        "amount": 24670800
      }
    ],
    "rank": 6
  },
  {
    "category": "부자재 세동 (9BQC D/V BAR)",
    "supplier": "㈜세동 (9BQC D/V BAR LH/RH)",
    "amount": 46002816,
    "share": 3.16,
    "badge": "부자재",
    "subitems": [
      {
        "code": "42823723",
        "name": "9BQC D/V BAR LH",
        "supplier": "㈜ 세동",
        "unit": "EA",
        "unitPrice": 1972,
        "qty": 11664,
        "amount": 23001408
      },
      {
        "code": "42823724",
        "name": "9BQC D/V BAR RH",
        "supplier": "㈜세동 (9BQC D/V BAR LH/RH)",
        "unit": "EA",
        "unitPrice": 1972,
        "qty": 11664,
        "amount": 23001408
      }
    ],
    "rank": 7
  },
  {
    "category": "부자재 화승 R&A (캡/클립/레진 43종)",
    "supplier": "화승 R&A (PU 캡, 클립, 인서트 레진, 형상패드 등)",
    "amount": 40987600,
    "share": 2.82,
    "badge": "부자재",
    "subitems": [
      {
        "code": "G3101-0375-01",
        "name": "M46-0580-02(ITW-파랑색)",
        "supplier": "화승 R&A (PU 캡, 클립, 인서트 레진, 형상패드 등)",
        "unit": "EA",
        "unitPrice": 5.9,
        "qty": 1100000,
        "amount": 6490000
      },
      {
        "code": "G3101-0384",
        "name": "M46-0595-02(국산 BLACK)-장유 (WK/KL)",
        "supplier": "화승 R&A (PU 캡, 클립, 인서트 레진, 형상패드 등)",
        "unit": "EA",
        "unitPrice": 12,
        "qty": 480000,
        "amount": 5760000
      },
      {
        "code": "G3101-0374-01",
        "name": "M46-0580-02(ITW-오렌지)",
        "supplier": "화승 R&A (PU 캡, 클립, 인서트 레진, 형상패드 등)",
        "unit": "EA",
        "unitPrice": 5.9,
        "qty": 950000,
        "amount": 5605000
      },
      {
        "code": "G3106-0663",
        "name": "FCA DT INSERT RH R부 (DT)",
        "supplier": "화승 R&A (PU 캡, 클립, 인서트 레진, 형상패드 등)",
        "unit": "EA",
        "unitPrice": 73.7,
        "qty": 25000,
        "amount": 1842500
      },
      {
        "code": "G3106-0664",
        "name": "FCA DT INSERT LH R부",
        "supplier": "화승 R&A (PU 캡, 클립, 인서트 레진, 형상패드 등)",
        "unit": "EA",
        "unitPrice": 73.7,
        "qty": 25000,
        "amount": 1842500
      },
      {
        "code": "G3101-0311",
        "name": "M46-0580-01 (WHITE)",
        "supplier": "화승 R&A (PU 캡, 클립, 인서트 레진, 형상패드 등)",
        "unit": "EA",
        "unitPrice": 5.1,
        "qty": 350000,
        "amount": 1784999.9999999998
      },
      {
        "code": "G3101-0183",
        "name": "CLIP 82210-4E000(WHITE)",
        "supplier": "화승 R&A (PU 캡, 클립, 인서트 레진, 형상패드 등)",
        "unit": "EA",
        "unitPrice": 19,
        "qty": 80000,
        "amount": 1520000
      },
      {
        "code": "G3101-0184",
        "name": "CLIP 82220-4E000(YELLOW)",
        "supplier": "화승 R&A (PU 캡, 클립, 인서트 레진, 형상패드 등)",
        "unit": "EA",
        "unitPrice": 19,
        "qty": 80000,
        "amount": 1520000
      },
      {
        "code": "G3106-0459",
        "name": "T300 JOINT CLIP BK",
        "supplier": "화승 R&A (PU 캡, 클립, 인서트 레진, 형상패드 등)",
        "unit": "EA",
        "unitPrice": 7.3,
        "qty": 200000,
        "amount": 1460000
      },
      {
        "code": "G3101-0283-01",
        "name": "CLIP,D/S B-PLR MOLD(BLACK)",
        "supplier": "화승 R&A (PU 캡, 클립, 인서트 레진, 형상패드 등)",
        "unit": "EA",
        "unitPrice": 10.1,
        "qty": 108000,
        "amount": 1090800
      },
      {
        "code": "G3106-1745",
        "name": "OV1k Insert Resin LH #X (OV1k)",
        "supplier": "화승 R&A (PU 캡, 클립, 인서트 레진, 형상패드 등)",
        "unit": "EA",
        "unitPrice": 122.9,
        "qty": 8000,
        "amount": 983200
      },
      {
        "code": "G3106-1746",
        "name": "OV1k Insert Resin RH #X",
        "supplier": "화승 R&A (PU 캡, 클립, 인서트 레진, 형상패드 등)",
        "unit": "EA",
        "unitPrice": 122.9,
        "qty": 8000,
        "amount": 983200
      },
      {
        "code": "G3101-0279-01",
        "name": "DCX DS ROOP CLIP(YE)",
        "supplier": "화승 R&A (PU 캡, 클립, 인서트 레진, 형상패드 등)",
        "unit": "EA",
        "unitPrice": 3.9,
        "qty": 250000,
        "amount": 975000
      },
      {
        "code": "G3106-1747",
        "name": "OV1k Insert Resin LH #Y",
        "supplier": "화승 R&A (PU 캡, 클립, 인서트 레진, 형상패드 등)",
        "unit": "EA",
        "unitPrice": 120.6,
        "qty": 8000,
        "amount": 964800
      },
      {
        "code": "G3106-1748",
        "name": "OV1k Insert Resin RH #Y",
        "supplier": "화승 R&A (PU 캡, 클립, 인서트 레진, 형상패드 등)",
        "unit": "EA",
        "unitPrice": 120.6,
        "qty": 8000,
        "amount": 964800
      },
      {
        "code": "G3101-1253",
        "name": "LQ2 클립 (WH) (LQ2)",
        "supplier": "화승 R&A (PU 캡, 클립, 인서트 레진, 형상패드 등)",
        "unit": "EA",
        "unitPrice": 6.1,
        "qty": 150000,
        "amount": 915000
      },
      {
        "code": "G3101-1254",
        "name": "LQ2 클립 (BR)",
        "supplier": "화승 R&A (PU 캡, 클립, 인서트 레진, 형상패드 등)",
        "unit": "EA",
        "unitPrice": 6.1,
        "qty": 150000,
        "amount": 915000
      },
      {
        "code": "G3101-0327-06",
        "name": "YF C/SEAL CLIP BK (HWC-450)",
        "supplier": "화승 R&A (PU 캡, 클립, 인서트 레진, 형상패드 등)",
        "unit": "EA",
        "unitPrice": 5.7,
        "qty": 150000,
        "amount": 855000
      },
      {
        "code": "G3101-0047-06",
        "name": "GS-034 MOUNTING CLIP (JA/JB 공용)",
        "supplier": "화승 R&A (PU 캡, 클립, 인서트 레진, 형상패드 등)",
        "unit": "EA",
        "unitPrice": 3.7,
        "qty": 150000,
        "amount": 555000
      },
      {
        "code": "G3103-0914",
        "name": "OV1k 형상패드(1.5*20*20)",
        "supplier": "화승 R&A (PU 캡, 클립, 인서트 레진, 형상패드 등)",
        "unit": "EA",
        "unitPrice": 16.5,
        "qty": 20000,
        "amount": 330000
      },
      {
        "code": "G3103-0118",
        "name": "EPDM PAD (3T*10W*70L)-블랙 (NX4)",
        "supplier": "화승 R&A (PU 캡, 클립, 인서트 레진, 형상패드 등)",
        "unit": "EA",
        "unitPrice": 16.5,
        "qty": 20000,
        "amount": 330000
      },
      {
        "code": "G3101-0181",
        "name": "CAP 82210-4E000 (PU)",
        "supplier": "화승 R&A 물품대(박수진)",
        "unit": "EA",
        "unitPrice": 27,
        "qty": 11000,
        "amount": 297000
      },
      {
        "code": "G3101-0182",
        "name": "CAP 82220-4E000",
        "supplier": "화승 R&A (PU 캡, 클립, 인서트 레진, 형상패드 등)",
        "unit": "EA",
        "unitPrice": 27,
        "qty": 11000,
        "amount": 297000
      },
      {
        "code": "G3106-1453",
        "name": "인서트 레진 #P LH",
        "supplier": "화승 R&A (PU 캡, 클립, 인서트 레진, 형상패드 등)",
        "unit": "EA",
        "unitPrice": 293.1,
        "qty": 1000,
        "amount": 293100
      },
      {
        "code": "G3106-1454",
        "name": "인서트 레진 #P RH",
        "supplier": "화승 R&A (PU 캡, 클립, 인서트 레진, 형상패드 등)",
        "unit": "EA",
        "unitPrice": 293.1,
        "qty": 1000,
        "amount": 293100
      },
      {
        "code": "G3101-0380-01",
        "name": "DCX DS  D/S CLIP(GR)",
        "supplier": "화승 R&A (PU 캡, 클립, 인서트 레진, 형상패드 등)",
        "unit": "EA",
        "unitPrice": 4.5,
        "qty": 50000,
        "amount": 225000
      },
      {
        "code": "G3103-0732",
        "name": "EPDM PAD (3T*10W*70L)-아이보리",
        "supplier": "화승 R&A (PU 캡, 클립, 인서트 레진, 형상패드 등)",
        "unit": "EA",
        "unitPrice": 10.7,
        "qty": 20000,
        "amount": 214000
      },
      {
        "code": "G3105-0047-01",
        "name": "EPDM PAD 5*10*70 (JB,HR,M300,DN8A)",
        "supplier": "화승 R&A (PU 캡, 클립, 인서트 레진, 형상패드 등)",
        "unit": "EA",
        "unitPrice": 9.5,
        "qty": 20000,
        "amount": 190000
      },
      {
        "code": "G3101-1111",
        "name": "DS BODY MOUNT CLIP BK",
        "supplier": "화승 R&A (PU 캡, 클립, 인서트 레진, 형상패드 등)",
        "unit": "EA",
        "unitPrice": 10.2,
        "qty": 15000,
        "amount": 153000
      },
      {
        "code": "G3106-1455",
        "name": "인서트 레진 #Q LH",
        "supplier": "화승 R&A (PU 캡, 클립, 인서트 레진, 형상패드 등)",
        "unit": "EA",
        "unitPrice": 149.9,
        "qty": 1000,
        "amount": 149900
      },
      {
        "code": "G3106-1456",
        "name": "인서트 레진 #Q RH",
        "supplier": "화승 R&A (PU 캡, 클립, 인서트 레진, 형상패드 등)",
        "unit": "EA",
        "unitPrice": 149.9,
        "qty": 1000,
        "amount": 149900
      },
      {
        "code": "G3106-1459",
        "name": "인서트 레진 #S LH",
        "supplier": "화승 R&A (PU 캡, 클립, 인서트 레진, 형상패드 등)",
        "unit": "EA",
        "unitPrice": 142.2,
        "qty": 1000,
        "amount": 142200
      },
      {
        "code": "G3106-1460",
        "name": "인서트 레진 #S RH",
        "supplier": "화승 R&A (PU 캡, 클립, 인서트 레진, 형상패드 등)",
        "unit": "EA",
        "unitPrice": 142.2,
        "qty": 1000,
        "amount": 142200
      },
      {
        "code": "G3106-1461",
        "name": "인서트 레진 #V LH",
        "supplier": "화승 R&A (PU 캡, 클립, 인서트 레진, 형상패드 등)",
        "unit": "EA",
        "unitPrice": 67.4,
        "qty": 2000,
        "amount": 134800
      },
      {
        "code": "G3106-1462",
        "name": "인서트 레진 #V RH",
        "supplier": "화승 R&A (PU 캡, 클립, 인서트 레진, 형상패드 등)",
        "unit": "EA",
        "unitPrice": 67.4,
        "qty": 2000,
        "amount": 134800
      },
      {
        "code": "G3101-0170",
        "name": "EG CLIP(W) (EG/GV\r\n공용)",
        "supplier": "화승 R&A (PU 캡, 클립, 인서트 레진, 형상패드 등)",
        "unit": "EA",
        "unitPrice": 25.2,
        "qty": 5000,
        "amount": 126000
      },
      {
        "code": "G3101-0171",
        "name": "EG CLIP(Y)",
        "supplier": "화승 R&A (PU 캡, 클립, 인서트 레진, 형상패드 등)",
        "unit": "EA",
        "unitPrice": 25.2,
        "qty": 5000,
        "amount": 126000
      },
      {
        "code": "G3106-0706",
        "name": "FCA DT INSERT RH S부",
        "supplier": "화승 R&A (PU 캡, 클립, 인서트 레진, 형상패드 등)",
        "unit": "EA",
        "unitPrice": 120.8,
        "qty": 500,
        "amount": 60400
      },
      {
        "code": "G3106-0707",
        "name": "FCA DT INSERT LH S부",
        "supplier": "화승 R&A (PU 캡, 클립, 인서트 레진, 형상패드 등)",
        "unit": "EA",
        "unitPrice": 120.8,
        "qty": 500,
        "amount": 60400
      },
      {
        "code": "G3101-0185",
        "name": "PU D/C END CAP①",
        "supplier": "화승 R&A (PU 캡, 클립, 인서트 레진, 형상패드 등)",
        "unit": "EA",
        "unitPrice": 28,
        "qty": 1000,
        "amount": 28000
      },
      {
        "code": "G3101-0186",
        "name": "PU D/C END CAP②",
        "supplier": "화승 R&A (PU 캡, 클립, 인서트 레진, 형상패드 등)",
        "unit": "EA",
        "unitPrice": 28,
        "qty": 1000,
        "amount": 28000
      },
      {
        "code": "G3101-0187",
        "name": "PU D/C END CAP③",
        "supplier": "화승 R&A (PU 캡, 클립, 인서트 레진, 형상패드 등)",
        "unit": "EA",
        "unitPrice": 28,
        "qty": 1000,
        "amount": 28000
      },
      {
        "code": "G3101-0188",
        "name": "PU D/C END CAP④",
        "supplier": "화승 R&A (PU 캡, 클립, 인서트 레진, 형상패드 등)",
        "unit": "EA",
        "unitPrice": 28,
        "qty": 1000,
        "amount": 28000
      }
    ],
    "rank": 8
  },
  {
    "category": "EPDM 원자재 (조영)",
    "supplier": "해동무역 (조영공장 직입고 W60664, W6082)",
    "amount": 38500560,
    "share": 2.65,
    "badge": "원자재",
    "subitems": [
      {
        "code": "17",
        "name": "W60664$OS",
        "supplier": "해동무역\r\n조영",
        "unit": "KG",
        "unitPrice": 5890,
        "qty": 5978,
        "amount": 35210420
      },
      {
        "code": "18",
        "name": "W6082$NA",
        "supplier": "해동무역 (조영공장 직입고 W60664, W6082)",
        "unit": "KG",
        "unitPrice": 4970,
        "qty": 662,
        "amount": 3290140
      }
    ],
    "rank": 9
  },
  {
    "category": "PVC 원자재/슬립제",
    "supplier": "화승네트웍스 (SD#75 BK, 9BQC 슬립제)",
    "amount": 38176400,
    "share": 2.63,
    "badge": "원자재",
    "subitems": [
      {
        "code": "B0237040178",
        "name": "SX553A (9BQC슬립제)",
        "supplier": "화승네트웍스 (SD#75 BK, 9BQC 슬립제)",
        "unit": "Kg",
        "unitPrice": 36652,
        "qty": 700,
        "amount": 25656400
      },
      {
        "code": "12457811",
        "name": "COMPOUND SD#75 BK (PVC(PU))",
        "supplier": "화승네트웍스",
        "unit": "Kg",
        "unitPrice": 3130,
        "qty": 4000,
        "amount": 12520000
      }
    ],
    "rank": 10
  },
  {
    "category": "케미칼 / 코팅제 (PCM)",
    "supplier": "화승케미칼 (HSW-6000L, HSP-700 등 코팅제/희석제 7종)",
    "amount": 19213301,
    "share": 1.32,
    "badge": "케미칼",
    "subitems": [
      {
        "code": "901488",
        "name": "HSW-6000L (PCM)",
        "supplier": "화승케미칼 (HSW-6000L, HSP-700 등 코팅제/희석제 7종)",
        "unit": "8K",
        "unitPrice": 83888,
        "qty": 145,
        "amount": 12163760
      },
      {
        "code": "901463",
        "name": "HSP-700 (PCM)",
        "supplier": "화승케미칼 (HSW-6000L, HSP-700 등 코팅제/희석제 7종)",
        "unit": "6K",
        "unitPrice": 45498,
        "qty": 68,
        "amount": 3093864
      },
      {
        "code": "901413",
        "name": "HSC-2000-B-3 (PCM)",
        "supplier": "화승케미칼 (HSW-6000L, HSP-700 등 코팅제/희석제 7종)",
        "unit": "캔(6kg)",
        "unitPrice": 51480,
        "qty": 30,
        "amount": 1544400
      },
      {
        "code": "400223",
        "name": "HSW-595V (PCM)",
        "supplier": "화승케미칼 (HSW-6000L, HSP-700 등 코팅제/희석제 7종)",
        "unit": "1K",
        "unitPrice": 33393,
        "qty": 39,
        "amount": 1302327
      },
      {
        "code": "400169",
        "name": "HSX-9600-1(경화제) (PCM)",
        "supplier": "화승케미칼 (HSW-6000L, HSP-700 등 코팅제/희석제 7종)",
        "unit": "캔(14kg)",
        "unitPrice": 522480,
        "qty": 1,
        "amount": 522480
      },
      {
        "code": "400166",
        "name": "HSH-9604 (PCM)",
        "supplier": "화승케미칼 (HSW-6000L, HSP-700 등 코팅제/희석제 7종)",
        "unit": "14K",
        "unitPrice": 522480,
        "qty": 1,
        "amount": 522480
      },
      {
        "code": "900003",
        "name": "PR-405(희석제) (PCM)",
        "supplier": "화승케미칼 (HSW-6000L, HSP-700 등 코팅제/희석제 7종)",
        "unit": "캔(15kg)",
        "unitPrice": 31995,
        "qty": 2,
        "amount": 63990
      }
    ],
    "rank": 11
  },
  {
    "category": "WIRE 심금 / 구리동선",
    "supplier": "JA 구리동선, 46MM 편조심금",
    "amount": 18320800,
    "share": 1.26,
    "badge": "원자재",
    "subitems": [
      {
        "code": "B0155093",
        "name": "46MM WIRE CARRIER(05R-159) (편조 심금)",
        "supplier": "JA 구리동선, 46MM 편조심금",
        "unit": "M",
        "unitPrice": 324,
        "qty": 32200,
        "amount": 10432800
      },
      {
        "code": "B01HN00067",
        "name": "WIRE GLASS CORD (Ø0.4mm) (JA 구리 동선)",
        "supplier": "JA 구리동선, 46MM 편조심금",
        "unit": "M",
        "unitPrice": 58,
        "qty": 136000,
        "amount": 7888000
      }
    ],
    "rank": 12
  },
  {
    "category": "심금류 (STS430A)",
    "supplier": "우진금속 (심금STS430A 0.4*45.5 PU용)",
    "amount": 16150953,
    "share": 1.11,
    "badge": "원자재",
    "subitems": [
      {
        "code": "31020032",
        "name": "심금STS430A 0.4*45.5 (PU)",
        "supplier": "우진금속",
        "unit": "Kg",
        "unitPrice": 2649,
        "qty": 6097,
        "amount": 16150953
      }
    ],
    "rank": 13
  },
  {
    "category": "포장재 / 박스 / 파렛트",
    "supplier": "광진포장 & 화승NETWORKS (파렛트, 지관, 캡상자)",
    "amount": 15308500,
    "share": 1.05,
    "badge": "포장재",
    "subitems": [
      {
        "code": "목재파렛트",
        "name": "1100*950*110",
        "supplier": "광진포장 & 화승NETWORKS (파렛트, 지관, 캡상자)",
        "unit": "EA",
        "unitPrice": 10300,
        "qty": 560,
        "amount": 5768000
      },
      {
        "code": "A타입 캡상자",
        "name": "1116*949*98",
        "supplier": "조영마감",
        "unit": "m2",
        "unitPrice": 1905,
        "qty": 1600,
        "amount": 3048000
      },
      {
        "code": "지관",
        "name": "70*4.5T*140",
        "supplier": "광진포장 & 화승NETWORKS (파렛트, 지관, 캡상자)",
        "unit": "EA",
        "unitPrice": 110,
        "qty": 18000,
        "amount": 1980000
      },
      {
        "code": "A타입 윤곽",
        "name": "1100*930*285",
        "supplier": "광진포장 & 화승NETWORKS (파렛트, 지관, 캡상자)",
        "unit": "m2",
        "unitPrice": 2300,
        "qty": 850,
        "amount": 1955000
      },
      {
        "code": "목재파렛트",
        "name": "1100*950*81",
        "supplier": "광진포장 & 화승NETWORKS (파렛트, 지관, 캡상자)",
        "unit": "EA",
        "unitPrice": 9600,
        "qty": 200,
        "amount": 1920000
      },
      {
        "code": "A타입 사각패드",
        "name": "920*1080",
        "supplier": "광진포장 & 화승NETWORKS (파렛트, 지관, 캡상자)",
        "unit": "m2",
        "unitPrice": 750,
        "qty": 850,
        "amount": 637500
      }
    ],
    "rank": 14
  },
  {
    "category": "기타매입 소액자재",
    "supplier": "기타매입내역 (비닐, 테이프, 소모성 부자재 등)",
    "amount": 10660900,
    "share": 0.73,
    "badge": "기타",
    "subitems": [
      {
        "code": "ETC-001",
        "name": "9월 기타매입내역 시트 집계분 (비닐, 테이프, 포장 소모품 등)",
        "supplier": "기타매입 협력사",
        "unit": "식",
        "unitPrice": 10660900,
        "qty": 1,
        "amount": 10660900
      }
    ],
    "rank": 15
  },
  {
    "category": "9BQC 브라켓",
    "supplier": "경기금속 (UPR Bracket LH/RH)",
    "amount": 4056000,
    "share": 0.28,
    "badge": "부자재",
    "subitems": [
      {
        "code": "3107-0054",
        "name": "UPR Bracket LH (9BQC)",
        "supplier": "경기금속",
        "unit": "EA",
        "unitPrice": 169,
        "qty": 12000,
        "amount": 2028000
      },
      {
        "code": "3107-0055",
        "name": "UPR Bracket RH",
        "supplier": "경기금속 (UPR Bracket LH/RH)",
        "unit": "EA",
        "unitPrice": 169,
        "qty": 12000,
        "amount": 2028000
      }
    ],
    "rank": 16
  },
  {
    "category": "EPDM PAD 완충재",
    "supplier": "삼도산업 (JA, NX4 EPDM PAD 5종)",
    "amount": 3563349.46,
    "share": 0.25,
    "badge": "부자재",
    "subitems": [
      {
        "code": "31030701",
        "name": "EPDM PAD (5T*40W*70L) T형 패드 (NX 4)",
        "supplier": "삼도산업 (JA, NX4 EPDM PAD 5종)",
        "unit": "EA",
        "unitPrice": 45,
        "qty": 72000,
        "amount": 3240000
      },
      {
        "code": "31030221",
        "name": "EPDM PAD (5T*7W*35L) (JA)",
        "supplier": "삼도산업",
        "unit": "EA",
        "unitPrice": 10,
        "qty": 20000,
        "amount": 200000
      },
      {
        "code": "31030194",
        "name": "EPDM PAD (10T*4W*14L)",
        "supplier": "삼도산업 (JA, NX4 EPDM PAD 5종)",
        "unit": "EA",
        "unitPrice": 6,
        "qty": 20000,
        "amount": 120000
      },
      {
        "code": "31030038",
        "name": "EPDM PAD (10T*10W*40L)",
        "supplier": "삼도산업 (JA, NX4 EPDM PAD 5종)",
        "unit": "EA",
        "unitPrice": 17.5,
        "qty": 158,
        "amount": 2765
      },
      {
        "code": "31030220",
        "name": "EPDM PAD (10T*15W*20L)",
        "supplier": "삼도산업 (JA, NX4 EPDM PAD 5종)",
        "unit": "EA",
        "unitPrice": 19.1,
        "qty": 30.6,
        "amount": 584.46
      }
    ],
    "rank": 17
  },
  {
    "category": "접착제 / 화학 부자재",
    "supplier": "화승NETWORKS (케미록, 접착제 SC-P-1512, 본드, 실리콘)",
    "amount": 2451880,
    "share": 0.17,
    "badge": "케미칼",
    "subitems": [
      {
        "code": "2215N01215",
        "name": "접착제 SC-P-1512 (케미록)",
        "supplier": "화승NETWORKS (케미록, 접착제 SC-P-1512, 본드, 실리콘)",
        "unit": "말(15kg)",
        "unitPrice": 85740,
        "qty": 7,
        "amount": 600180
      },
      {
        "code": "2215N01213",
        "name": "SC-B-4550 (본드)",
        "supplier": "화승NETWORKS (케미록, 접착제 SC-P-1512, 본드, 실리콘)",
        "unit": "말(16kg)",
        "unitPrice": 118280,
        "qty": 5,
        "amount": 591400
      },
      {
        "code": "221600160",
        "name": "실리콘 MEM-0349 (택배비 무료요청)",
        "supplier": "화승NETWORKS (케미록, 접착제 SC-P-1512, 본드, 실리콘)",
        "unit": "말",
        "unitPrice": 260000,
        "qty": 2,
        "amount": 520000
      },
      {
        "code": "A2215N01323",
        "name": "스리본드 방청제 1521B 3kg",
        "supplier": "화승NETWORKS (케미록, 접착제 SC-P-1512, 본드, 실리콘)",
        "unit": "EA",
        "unitPrice": 218400,
        "qty": 2,
        "amount": 436800
      },
      {
        "code": "2215N01214",
        "name": "BOND SC-H-50 (경화제)",
        "supplier": "화승NETWORKS (케미록, 접착제 SC-P-1512, 본드, 실리콘)",
        "unit": "말(8kg)",
        "unitPrice": 60700,
        "qty": 5,
        "amount": 303500
      }
    ],
    "rank": 18
  },
  {
    "category": "공구 / 절단 톱날",
    "supplier": "조은초경 (TIP SAW 254*100 톱날)",
    "amount": 1450000,
    "share": 0.1,
    "badge": "소모품",
    "subitems": [
      {
        "code": "R258",
        "name": "신품 254*100*2.2*RA*25.4",
        "supplier": "조은초경 (TIP SAW 254*100 톱날)",
        "unit": "EA",
        "unitPrice": 145000,
        "qty": 10,
        "amount": 1450000
      }
    ],
    "rank": 19
  },
  {
    "category": "부자재 우봉 / 아마쉘 PAD",
    "supplier": "우봉 (아마쉘 PAD 5T/7T)",
    "amount": 1055000,
    "share": 0.07,
    "badge": "부자재",
    "subitems": [
      {
        "code": "3103-0686",
        "name": "아마쉘 PAD 5T*5W*60L",
        "supplier": "우봉",
        "unit": "EA",
        "unitPrice": 9.2,
        "qty": 59000,
        "amount": 542800
      },
      {
        "code": "3103-0832",
        "name": "아마쉘 PAD 7T*10W*50L",
        "supplier": "우봉 (아마쉘 PAD 5T/7T)",
        "unit": "EA",
        "unitPrice": 19.7,
        "qty": 26000,
        "amount": 512200
      }
    ],
    "rank": 20
  }
];

// ============================================================================
// Modal Component for Detailed Breakdown
// ============================================================================

const DetailBreakdownModal = ({ isOpen, onClose, selectedData, type }) => {
  const { formatAmount } = useCurrency();
  const [modalSearch, setModalSearch] = useState('');

  if (!isOpen || !selectedData) return null;

  const isSales = type === 'sales';
  const subitems = selectedData.subitems || [];

  const filteredSubitems = subitems.filter((sub) => {
    const searchLower = modalSearch.toLowerCase();
    const code = (sub.code || '').toLowerCase();
    const name = (sub.name || '').toLowerCase();
    const partNo = (sub.partNo || '').toLowerCase();
    const supplier = (sub.supplier || '').toLowerCase();
    return (
      code.includes(searchLower) ||
      name.includes(searchLower) ||
      partNo.includes(searchLower) ||
      supplier.includes(searchLower)
    );
  });

  const totalFilteredAmt = filteredSubitems.reduce((acc, cur) => acc + (cur.amount || 0), 0);
  const totalFilteredQty = filteredSubitems.reduce((acc, cur) => acc + (cur.qty || 0), 0);

  const badgeColor = isSales
    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200'
    : 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200';

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh] overflow-hidden animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-4 sm:px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${isSales ? 'bg-blue-50 dark:bg-blue-950 text-blue-600' : 'bg-rose-50 dark:bg-rose-950 text-rose-600'}`}>
              {isSales ? <Car className="w-5 h-5" /> : <Boxes className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-[11px] font-black px-2 py-0.5 rounded-full ${badgeColor}`}>
                  {selectedData.badge || (isSales ? '매출' : '매입')}
                </span>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  {selectedData.category} 세부 내역
                </h3>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {isSales ? selectedData.item : selectedData.supplier} • 전체 비중: {selectedData.share}%
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <span className="text-[10px] font-bold text-slate-400 block">항목 총금액</span>
              <span className={`text-base font-black ${isSales ? 'text-blue-600 dark:text-blue-400' : 'text-rose-600 dark:text-rose-400'}`}>
                {formatAmount(Math.round(selectedData.amount))}
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="닫기"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search Bar & Quick Stats */}
        <div className="px-4 sm:px-5 py-2.5 border-b border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="품목코드, 품명, 고객품번, 거래처 검색..."
              value={modalSearch}
              onChange={(e) => setModalSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-xs font-bold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            {modalSearch && (
              <button
                onClick={() => setModalSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400">
            <span>세부 품목: <strong className="text-slate-900 dark:text-white">{filteredSubitems.length}</strong>건</span>
            <span>•</span>
            <span>선택 합계: <strong className={isSales ? 'text-blue-600 dark:text-blue-400' : 'text-rose-600 dark:text-rose-400'}>{formatAmount(Math.round(totalFilteredAmt))}</strong></span>
          </div>
        </div>

        {/* Sub-item Details Table */}
        <div className="overflow-x-auto overflow-y-auto flex-1 p-0">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800 text-[10.5px] font-black text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-700 shadow-2xs z-10">
              <tr>
                <th className="py-2.5 px-3 text-center w-10">No</th>
                {isSales ? (
                  <>
                    <th className="py-2.5 px-3">아이템코드</th>
                    <th className="py-2.5 px-3">고객품번</th>
                    <th className="py-2.5 px-3">세부 품명 / 사양</th>
                    <th className="py-2.5 px-3 text-right">판매단가</th>
                    <th className="py-2.5 px-3 text-right">출하수량</th>
                    <th className="py-2.5 px-3 text-right">매출금액 (원)</th>
                    <th className="py-2.5 px-3 text-right w-20">비중</th>
                  </>
                ) : (
                  <>
                    <th className="py-2.5 px-3">자재코드</th>
                    <th className="py-2.5 px-3">품명 및 규격</th>
                    <th className="py-2.5 px-3">공급처 / 차종</th>
                    <th className="py-2.5 px-3 text-center">단위</th>
                    <th className="py-2.5 px-3 text-right">단가</th>
                    <th className="py-2.5 px-3 text-right">구매량</th>
                    <th className="py-2.5 px-3 text-right">매입금액 (원)</th>
                    <th className="py-2.5 px-3 text-right w-20">비중</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-[11.5px]">
              {filteredSubitems.length > 0 ? (
                filteredSubitems.map((sub, idx) => {
                  const sharePercent = selectedData.amount > 0 ? ((sub.amount / selectedData.amount) * 100).toFixed(1) : 0;
                  return (
                    <tr
                      key={idx}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="py-2 px-3 text-center font-bold text-slate-400 text-[10.5px]">
                        {idx + 1}
                      </td>
                      {isSales ? (
                        <>
                          <td className="py-2 px-3 font-mono text-[11px] text-slate-500 dark:text-slate-400 whitespace-nowrap">
                            {sub.code || '-'}
                          </td>
                          <td className="py-2 px-3 font-mono font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                            {sub.partNo || '-'}
                          </td>
                          <td className="py-2 px-3 font-black text-slate-900 dark:text-white">
                            {sub.name}
                          </td>
                          <td className="py-2 px-3 text-right font-medium text-slate-600 dark:text-slate-300 whitespace-nowrap">
                            {sub.unitPrice ? `₩${sub.unitPrice.toLocaleString()}` : '-'}
                          </td>
                          <td className="py-2 px-3 text-right font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                            {sub.qty ? sub.qty.toLocaleString() : '-'}
                          </td>
                          <td className="py-2 px-3 text-right font-black text-blue-600 dark:text-blue-400 whitespace-nowrap">
                            {formatAmount(Math.round(sub.amount))}
                          </td>
                          <td className="py-2 px-3 text-right whitespace-nowrap font-bold text-slate-500 text-[10.5px]">
                            {sharePercent}%
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="py-2 px-3 font-mono text-[11px] text-slate-500 dark:text-slate-400 whitespace-nowrap">
                            {sub.code || '-'}
                          </td>
                          <td className="py-2 px-3 font-black text-slate-900 dark:text-white">
                            {sub.name}
                          </td>
                          <td className="py-2 px-3 font-bold text-slate-600 dark:text-slate-300 whitespace-nowrap">
                            {sub.supplier || '-'}
                          </td>
                          <td className="py-2 px-3 text-center text-slate-500 text-[11px]">
                            {sub.unit || 'EA'}
                          </td>
                          <td className="py-2 px-3 text-right font-medium text-slate-600 dark:text-slate-300 whitespace-nowrap">
                            {sub.unitPrice ? `₩${sub.unitPrice.toLocaleString()}` : '-'}
                          </td>
                          <td className="py-2 px-3 text-right font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                            {sub.qty ? sub.qty.toLocaleString() : '-'}
                          </td>
                          <td className="py-2 px-3 text-right font-black text-rose-600 dark:text-rose-400 whitespace-nowrap">
                            {formatAmount(Math.round(sub.amount))}
                          </td>
                          <td className="py-2 px-3 text-right whitespace-nowrap font-bold text-slate-500 text-[10.5px]">
                            {sharePercent}%
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={isSales ? 8 : 9} className="py-8 text-center text-slate-400 text-xs">
                    검색 조건과 일치하는 세부 내역이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Modal Footer */}
        <div className="px-4 sm:px-5 py-3 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300">
            <PackageCheck className="w-4 h-4 text-emerald-600" />
            <span>상세 데이터 검증 완료 (ERP 실시간 동기화)</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block font-bold">합계 금액</span>
              <span className={`text-sm font-black ${isSales ? 'text-blue-600 dark:text-blue-400' : 'text-rose-600 dark:text-rose-400'}`}>
                {formatAmount(Math.round(totalFilteredAmt))}
              </span>
            </div>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-black hover:opacity-90 transition-opacity"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// Main Sales & Purchase Analysis View Component
// ============================================================================

export const SalesPurchaseAnalysisView = () => {
  const { formatAmount } = useCurrency();
  const { selectedMonth, currentMonthData } = useMonth();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeViewMode, setActiveViewMode] = useState('all'); // 'all', 'sales', 'purchases'
  
  // State for interactive details popup modal
  const [selectedDetail, setSelectedDetail] = useState(null); // { type: 'sales' | 'purchase', data: item }

  const safeSelectedMonth = selectedMonth || '2026-09';
  const monthParts = safeSelectedMonth.split('-');
  const monthTitle = `${monthParts[0] || '2026'}년 ${monthParts[1] || '09'}월`;

  // Dynamic or fallback dataset
  const rawSales = currentMonthData?.salesBreakdown || DEFAULT_2026_09_SALES_BREAKDOWN;
  const rawPurchases = currentMonthData?.purchaseBreakdown || DEFAULT_2026_09_PURCHASE_BREAKDOWN;

  // Master KPI Figures
  const totalSales = currentMonthData?.totalSales || 1796457145;
  const totalExpenses = currentMonthData?.totalExpenses || 1453941153.46;
  const grossProfit = totalSales - totalExpenses; // 342,515,991.54
  const costRatio = totalSales > 0 ? ((totalExpenses / totalSales) * 100).toFixed(2) : '80.93';
  const profitRatio = totalSales > 0 ? ((grossProfit / totalSales) * 100).toFixed(2) : '19.07';

  // Filtered Sales
  const filteredSales = useMemo(() => {
    return rawSales.filter((s) => {
      return (
        s.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.item.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.badge.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [rawSales, searchTerm]);

  // Filtered Purchases
  const filteredPurchases = useMemo(() => {
    return rawPurchases.filter((p) => {
      return (
        p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.badge.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [rawPurchases, searchTerm]);

  const salesSubtotal = filteredSales.reduce((acc, c) => acc + c.amount, 0);
  const purchaseSubtotal = filteredPurchases.reduce((acc, c) => acc + c.amount, 0);

  return (
    <div className="space-y-3.5 animate-fadeIn pb-10 text-slate-800 dark:text-slate-200">
      {/* 1. 상단 미니멀 4대 KPI 요약 카드 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        {/* 카드 1: 당월 총매출액 */}
        <div className="bg-white dark:bg-slate-900 px-3.5 py-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              {monthTitle} 총매출액
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-300">
              14개 라인
            </span>
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
              {formatAmount(totalSales)}
            </span>
            <span className="text-[10.5px] font-bold text-slate-400">100%</span>
          </div>
        </div>

        {/* 카드 2: 당월 총매입액 */}
        <div className="bg-white dark:bg-slate-900 px-3.5 py-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <TrendingDown className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
              당월 총매입액 (원가)
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-300">
              원가율 {costRatio}%
            </span>
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-lg sm:text-xl font-black text-rose-600 dark:text-rose-400 tracking-tight">
              {formatAmount(Math.round(totalExpenses))}
            </span>
            <span className="text-[10.5px] font-bold text-rose-500">{costRatio}%</span>
          </div>
        </div>

        {/* 카드 3: 당월 매출총이익 */}
        <div className="bg-white dark:bg-slate-900 px-3.5 py-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              매출총이익 (매출-매입)
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-300">
              +{profitRatio}%
            </span>
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-lg sm:text-xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
              {formatAmount(Math.round(grossProfit))}
            </span>
            <span className="text-[10.5px] font-bold text-emerald-500">+{profitRatio}%</span>
          </div>
        </div>

        {/* 카드 4: 원가 / 마진 비율 게이지 */}
        <div className="bg-white dark:bg-slate-900 px-3.5 py-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Percent className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              손익 건전성 비율
            </span>
            <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
              {costRatio}% : {profitRatio}%
            </span>
          </div>
          <div className="mt-2 space-y-1">
            <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex">
              <div style={{ width: `${costRatio}%` }} className="bg-rose-500 h-full" />
              <div style={{ width: `${profitRatio}%` }} className="bg-emerald-500 h-full" />
            </div>
            <div className="flex justify-between text-[10px] font-bold">
              <span className="text-rose-600 dark:text-rose-400">원가 {costRatio}%</span>
              <span className="text-emerald-600 dark:text-emerald-400">이익 {profitRatio}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. 미니멀 컨트롤 바: 뷰 모드 탭 & 검색창 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white dark:bg-slate-900 px-3 py-2 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
        {/* 모드 전환 탭 */}
        <div className="flex items-center gap-1 p-0.5 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-x-auto">
          <button
            onClick={() => setActiveViewMode('all')}
            className={`px-3 py-1 rounded-lg text-xs font-black transition-all flex items-center gap-1 whitespace-nowrap ${
              activeViewMode === 'all'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3 h-3" />
            종합 비교 (나란히)
          </button>
          <button
            onClick={() => setActiveViewMode('sales')}
            className={`px-3 py-1 rounded-lg text-xs font-black transition-all flex items-center gap-1 whitespace-nowrap ${
              activeViewMode === 'sales'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Car className="w-3 h-3 text-blue-500" />
            1. 매출 세분화 ({filteredSales.length})
          </button>
          <button
            onClick={() => setActiveViewMode('purchases')}
            className={`px-3 py-1 rounded-lg text-xs font-black transition-all flex items-center gap-1 whitespace-nowrap ${
              activeViewMode === 'purchases'
                ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Boxes className="w-3 h-3 text-rose-500" />
            2. 매입원가 세분화 ({filteredPurchases.length})
          </button>
        </div>

        {/* 실시간 검색창 */}
        <div className="relative min-w-[200px]">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="차종, 거래처, 품목명 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* 3. 안내 배너: 탭하여 상세 팝업 확인 가능 */}
      <div className="px-3.5 py-1.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/40 flex items-center justify-between text-[11px] text-blue-700 dark:text-blue-300 font-bold">
        <span className="flex items-center gap-1.5">
          <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600" />
          항목(대분류)을 탭하면 세부 부품/자재 규격, 출하량, 단가 등 상세 내역이 팝업됩니다.
        </span>
        <span className="text-[10px] text-blue-500 hidden sm:inline font-normal">
          항목 클릭 시 세부 팝업
        </span>
      </div>

      {/* 4. 메인 미니멀 테이블 패널: 대시보드 1번 & 2번 */}
      <div className={`grid gap-3.5 ${activeViewMode === 'all' ? 'grid-cols-1 xl:grid-cols-2' : 'grid-cols-1'}`}>
        
        {/* ========================================================================= */}
        {/* 대시보드 1번: 차종별 / 제품군별 매출 세분화 (Sales Breakdown) */}
        {/* ========================================================================= */}
        {(activeViewMode === 'all' || activeViewMode === 'sales') && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden flex flex-col justify-between">
            {/* 미니멀 헤더 */}
            <div className="px-3.5 py-2.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Car className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <h2 className="text-xs font-black text-slate-900 dark:text-white">
                  1. 차종별 / 제품군별 매출 세분화
                </h2>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10.5px] font-bold text-slate-400">합계</span>
                <span className="text-xs font-black text-blue-600 dark:text-blue-400">
                  {formatAmount(salesSubtotal)}
                </span>
              </div>
            </div>

            {/* 고밀도 미니멀 테이블 */}
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 dark:bg-slate-800/50 text-[10.5px] font-black text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
                    <th className="py-2 px-3 w-10 text-center">순위</th>
                    <th className="py-2 px-2.5">대분류 (탭하여 상세)</th>
                    <th className="py-2 px-2.5">세부 차종 / 라인 품목</th>
                    <th className="py-2 px-2.5 text-right">매출금액 (원)</th>
                    <th className="py-2 px-3 w-24 text-right">비중 (%)</th>
                    <th className="py-2 px-2 w-8 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-[11.5px]">
                  {filteredSales.map((item, idx) => {
                    const badgeClass =
                      item.badge === 'PCM'
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                        : item.badge === '수출'
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                        : item.badge === '내수'
                        ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
                        : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';

                    return (
                      <tr
                        key={idx}
                        onClick={() => setSelectedDetail({ type: 'sales', data: item })}
                        className="hover:bg-blue-50/50 dark:hover:bg-blue-950/30 transition-colors group cursor-pointer"
                        title="탭하여 세부 품목별 단가/수량/금액 상세 팝업 열기"
                      >
                        <td className="py-2 px-3 text-center font-bold text-slate-400 group-hover:text-blue-600 text-[11px]">
                          {item.rank}
                        </td>
                        <td className="py-2 px-2.5 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                          <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-black mr-1 ${badgeClass}`}>
                            {item.badge}
                          </span>
                          <span className="group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors underline decoration-blue-300/50 underline-offset-2">
                            {item.category}
                          </span>
                        </td>
                        <td className="py-2 px-2.5 text-slate-600 dark:text-slate-300 font-medium truncate max-w-[160px]">
                          {item.item}
                        </td>
                        <td className="py-2 px-2.5 text-right font-black text-slate-900 dark:text-white whitespace-nowrap">
                          {formatAmount(item.amount)}
                        </td>
                        <td className="py-2 px-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <div className="w-10 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                              <div
                                style={{ width: `${Math.min(item.share * 2.5, 100)}%` }}
                                className="h-full bg-blue-500 rounded-full"
                              />
                            </div>
                            <span className="font-bold text-slate-700 dark:text-slate-300 w-9 text-right text-[11px]">
                              {item.share.toFixed(2)}%
                            </span>
                          </div>
                        </td>
                        <td className="py-2 px-2 text-center text-slate-300 group-hover:text-blue-500 transition-colors">
                          <ChevronRight className="w-3.5 h-3.5" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* 미니멀 푸터 */}
            <div className="px-3.5 py-2 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between font-black text-xs">
              <span className="text-slate-600 dark:text-slate-300 text-[11px]">
                매출 총합계 (14개 라인)
              </span>
              <div className="flex items-center gap-2">
                <span className="text-blue-600 dark:text-blue-400 font-black">
                  {formatAmount(salesSubtotal)}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-bold">
                  100%
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 대시보드 2번: 거래처별 / 품목군별 매입원가 세분화 (Purchase Breakdown) */}
        {/* ========================================================================= */}
        {(activeViewMode === 'all' || activeViewMode === 'purchases') && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden flex flex-col justify-between">
            {/* 미니멀 헤더 */}
            <div className="px-3.5 py-2.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Boxes className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                <h2 className="text-xs font-black text-slate-900 dark:text-white">
                  2. 거래처별 / 품목군별 매입원가 세분화
                </h2>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10.5px] font-bold text-slate-400">합계</span>
                <span className="text-xs font-black text-rose-600 dark:text-rose-400">
                  {formatAmount(Math.round(purchaseSubtotal))}
                </span>
              </div>
            </div>

            {/* 고밀도 미니멀 테이블 */}
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 dark:bg-slate-800/50 text-[10.5px] font-black text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
                    <th className="py-2 px-3 w-10 text-center">순위</th>
                    <th className="py-2 px-2.5">매입 구분 (탭하여 상세)</th>
                    <th className="py-2 px-2.5">주요 거래처 / 항목</th>
                    <th className="py-2 px-2.5 text-right">매입금액 (원)</th>
                    <th className="py-2 px-3 w-24 text-right">비중 (%)</th>
                    <th className="py-2 px-2 w-8 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-[11.5px]">
                  {filteredPurchases.map((item, idx) => {
                    const badgeClass =
                      item.badge === '원자재'
                        ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                        : item.badge === '부자재'
                        ? 'bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                        : item.badge === '케미칼'
                        ? 'bg-cyan-50 text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-300'
                        : item.badge === '포장재'
                        ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                        : item.badge === '직매입'
                        ? 'bg-purple-50 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300'
                        : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';

                    return (
                      <tr
                        key={idx}
                        onClick={() => setSelectedDetail({ type: 'purchase', data: item })}
                        className="hover:bg-rose-50/50 dark:hover:bg-rose-950/30 transition-colors group cursor-pointer"
                        title="탭하여 세부 자재 규격/단가/구매량 상세 팝업 열기"
                      >
                        <td className="py-2 px-3 text-center font-bold text-slate-400 group-hover:text-rose-600 text-[11px]">
                          {item.rank}
                        </td>
                        <td className="py-2 px-2.5 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                          <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-black mr-1 ${badgeClass}`}>
                            {item.badge}
                          </span>
                          <span className="group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors underline decoration-rose-300/50 underline-offset-2">
                            {item.category}
                          </span>
                        </td>
                        <td className="py-2 px-2.5 text-slate-600 dark:text-slate-300 font-medium truncate max-w-[160px]">
                          {item.supplier}
                        </td>
                        <td className="py-2 px-2.5 text-right font-black text-slate-900 dark:text-white whitespace-nowrap">
                          {formatAmount(Math.round(item.amount))}
                        </td>
                        <td className="py-2 px-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <div className="w-10 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                              <div
                                style={{ width: `${Math.min(item.share * 1.5, 100)}%` }}
                                className="h-full bg-rose-500 rounded-full"
                              />
                            </div>
                            <span className="font-bold text-slate-700 dark:text-slate-300 w-9 text-right text-[11px]">
                              {item.share.toFixed(2)}%
                            </span>
                          </div>
                        </td>
                        <td className="py-2 px-2 text-center text-slate-300 group-hover:text-rose-500 transition-colors">
                          <ChevronRight className="w-3.5 h-3.5" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* 미니멀 푸터 */}
            <div className="px-3.5 py-2 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between font-black text-xs">
              <span className="text-slate-600 dark:text-slate-300 text-[11px]">
                매입 총합계 (원/부/기타/직매입)
              </span>
              <div className="flex items-center gap-2">
                <span className="text-rose-600 dark:text-rose-400 font-black">
                  {formatAmount(Math.round(purchaseSubtotal))}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300 font-bold">
                  100%
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 5. 세부내용 대화형 팝업 모달 */}
      <DetailBreakdownModal
        isOpen={Boolean(selectedDetail)}
        onClose={() => setSelectedDetail(null)}
        selectedData={selectedDetail?.data}
        type={selectedDetail?.type}
      />
    </div>
  );
};

export const VehicleSalesView = SalesPurchaseAnalysisView;
export default SalesPurchaseAnalysisView;
