// 삼랑진공장 압출 라인별 생산 아이템 현황 (Excel 기준 이니셜/차종순 정렬 데이터)
// 원본: 라인별 아이템현황.xlsx + 압출라인별 BOM자료.xls (PCM1, PCM3, PVC, TPE + TEST 압출)

export const EXTRUSION_LINE_BADGES = [
  {
    "id": "pcm1",
    "badge": "PCM1",
    "shortName": "PCM 1호",
    "name": "PCM #1 LINE",
    "color": "teal",
    "count": 92
  },
  {
    "id": "pcm3",
    "badge": "PCM3",
    "shortName": "PCM 3호",
    "name": "PCM #3 LINE",
    "color": "blue",
    "count": 116
  },
  {
    "id": "pvc",
    "badge": "PVC",
    "shortName": "PVC",
    "name": "PVC LINE",
    "color": "amber",
    "count": 20
  },
  {
    "id": "tpe",
    "badge": "TPE",
    "shortName": "TPE",
    "name": "TPE LINE",
    "color": "purple",
    "count": 40
  }
];

export const EXTRUSION_ITEMS_BY_LINE = {
  "pcm1": [
    {
      "id": "pcm1_8",
      "lineId": "pcm1",
      "lineName": "PCM #1 LINE",
      "lineBadge": "PCM1",
      "vehicle": "BC4T",
      "itemName": "D/SIDE D",
      "label": "[BC4T] D/SIDE D",
      "isAS": false
    },
    {
      "id": "pcm1_excel_73",
      "lineId": "pcm1",
      "lineName": "PCM #1 LINE",
      "lineBadge": "PCM1",
      "vehicle": "BC4T",
      "itemName": "DR SIDE D",
      "label": "[BC4T] DR SIDE D",
      "isAS": false
    },
    {
      "id": "pcm1_excel_62",
      "lineId": "pcm1",
      "lineName": "PCM #1 LINE",
      "lineBadge": "PCM1",
      "vehicle": "BDM",
      "itemName": "HOOD RR",
      "label": "[BDM] HOOD RR",
      "isAS": false
    },
    {
      "id": "pcm1_47",
      "lineId": "pcm1",
      "lineName": "PCM #1 LINE",
      "lineBadge": "PCM1",
      "vehicle": "BK",
      "itemName": "DR SIDE B (A/S)",
      "label": "[BK] DR SIDE B (A/S)",
      "isAS": true
    },
    {
      "id": "pcm1_23",
      "lineId": "pcm1",
      "lineName": "PCM #1 LINE",
      "lineBadge": "PCM1",
      "vehicle": "BL7M",
      "itemName": "HOOD FRT",
      "label": "[BL7M] HOOD FRT",
      "isAS": false
    },
    {
      "id": "pcm1_17",
      "lineId": "pcm1",
      "lineName": "PCM #1 LINE",
      "lineBadge": "PCM1",
      "vehicle": "BL7M",
      "itemName": "HOOD RR",
      "label": "[BL7M] HOOD RR",
      "isAS": false
    },
    {
      "id": "pcm1_28",
      "lineId": "pcm1",
      "lineName": "PCM #1 LINE",
      "lineBadge": "PCM1",
      "vehicle": "C300",
      "itemName": "D/SIDE C",
      "label": "[C300] D/SIDE C",
      "isAS": false
    },
    {
      "id": "pcm1_excel_90",
      "lineId": "pcm1",
      "lineName": "PCM #1 LINE",
      "lineBadge": "PCM1",
      "vehicle": "CE1",
      "itemName": "DR SIDE D",
      "label": "[CE1] DR SIDE D",
      "isAS": false
    },
    {
      "id": "pcm1_excel_85",
      "lineId": "pcm1",
      "lineName": "PCM #1 LINE",
      "lineBadge": "PCM1",
      "vehicle": "CL4",
      "itemName": "DR SIDE D",
      "label": "[CL4] DR SIDE D",
      "isAS": false
    },
    {
      "id": "pcm1_24",
      "lineId": "pcm1",
      "lineName": "PCM #1 LINE",
      "lineBadge": "PCM1",
      "vehicle": "CL4",
      "itemName": "HOOD FRT",
      "label": "[CL4] HOOD FRT",
      "isAS": false
    },
    {
      "id": "pcm1_25",
      "lineId": "pcm1",
      "lineName": "PCM #1 LINE",
      "lineBadge": "PCM1",
      "vehicle": "CL4",
      "itemName": "HOOD FRT SIDE",
      "label": "[CL4] HOOD FRT SIDE",
      "isAS": false
    },
    {
      "id": "pcm1_18",
      "lineId": "pcm1",
      "lineName": "PCM #1 LINE",
      "lineBadge": "PCM1",
      "vehicle": "CL4",
      "itemName": "HOOD RR",
      "label": "[CL4] HOOD RR",
      "isAS": false
    },
    {
      "id": "pcm1_excel_91",
      "lineId": "pcm1",
      "lineName": "PCM #1 LINE",
      "lineBadge": "PCM1",
      "vehicle": "CN7",
      "itemName": "DR SIDE D",
      "label": "[CN7] DR SIDE D",
      "isAS": false
    },
    {
      "id": "pcm1_excel_59",
      "lineId": "pcm1",
      "lineName": "PCM #1 LINE",
      "lineBadge": "PCM1",
      "vehicle": "CN7",
      "itemName": "HOOD RR",
      "label": "[CN7] HOOD RR",
      "isAS": false
    },
    {
      "id": "pcm1_excel_88",
      "lineId": "pcm1",
      "lineName": "PCM #1 LINE",
      "lineBadge": "PCM1",
      "vehicle": "DL3A",
      "itemName": "DR SIDE D",
      "label": "[DL3A] DR SIDE D",
      "isAS": false
    },
    {
      "id": "pcm1_excel_64",
      "lineId": "pcm1",
      "lineName": "PCM #1 LINE",
      "lineBadge": "PCM1",
      "vehicle": "DL3A",
      "itemName": "HOOD RR",
      "label": "[DL3A] HOOD RR",
      "isAS": false
    },
    {
      "id": "pcm1_excel_84",
      "lineId": "pcm1",
      "lineName": "PCM #1 LINE",
      "lineBadge": "PCM1",
      "vehicle": "DN8",
      "itemName": "DR SIDE D",
      "label": "[DN8] DR SIDE D",
      "isAS": false
    },
    {
      "id": "pcm1_excel_63",
      "lineId": "pcm1",
      "lineName": "PCM #1 LINE",
      "lineBadge": "PCM1",
      "vehicle": "DN8A",
      "itemName": "HOOD RR",
      "label": "[DN8A] HOOD RR",
      "isAS": false
    },
    {
      "id": "pcm1_5",
      "lineId": "pcm1",
      "lineName": "PCM #1 LINE",
      "lineBadge": "PCM1",
      "vehicle": "DS",
      "itemName": "D/SIDE D",
      "label": "[DS] D/SIDE D",
      "isAS": false
    },
    {
      "id": "pcm1_3",
      "lineId": "pcm1",
      "lineName": "PCM #1 LINE",
      "lineBadge": "PCM1",
      "vehicle": "DT",
      "itemName": "SILL SEAL FRT",
      "label": "[DT] SILL SEAL FRT",
      "isAS": false
    },
    {
      "id": "pcm1_4",
      "lineId": "pcm1",
      "lineName": "PCM #1 LINE",
      "lineBadge": "PCM1",
      "vehicle": "DT",
      "itemName": "SILL SEAL RR",
      "label": "[DT] SILL SEAL RR",
      "isAS": false
    },
    {
      "id": "pcm1_40",
      "lineId": "pcm1",
      "lineName": "PCM #1 LINE",
      "lineBadge": "PCM1",
      "vehicle": "EN",
      "itemName": "DR SIDE C (A/S)",
      "label": "[EN] DR SIDE C (A/S)",
      "isAS": true
    },
    {
      "id": "pcm1_41",
      "lineId": "pcm1",
      "lineName": "PCM #1 LINE",
      "lineBadge": "PCM1",
      "vehicle": "EN",
      "itemName": "DR SIDE D (A/S)",
      "label": "[EN] DR SIDE D (A/S)",
      "isAS": true
    },
    {
      "id": "pcm1_excel_51",
      "lineId": "pcm1",
      "lineName": "PCM #1 LINE",
      "lineBadge": "PCM1",
      "vehicle": "EN",
      "itemName": "DR SIDE FRT (A/S)",
      "label": "[EN] DR SIDE FRT (A/S)",
      "isAS": true
    },
    {
      "id": "pcm1_excel_50",
      "lineId": "pcm1",
      "lineName": "PCM #1 LINE",
      "lineBadge": "PCM1",
      "vehicle": "EN",
      "itemName": "DR SIDE RR (A/S)",
      "label": "[EN] DR SIDE RR (A/S)",
      "isAS": true
    },
    {
      "id": "pcm1_excel_53",
      "lineId": "pcm1",
      "lineName": "PCM #1 LINE",
      "lineBadge": "PCM1",
      "vehicle": "FS",
      "itemName": "DR SIDE",
      "label": "[FS] DR SIDE",
      "isAS": false
    },
    {
      "id": "pcm1_excel_92",
      "lineId": "pcm1",
      "lineName": "PCM #1 LINE",
      "lineBadge": "PCM1",
      "vehicle": "GL3",
      "itemName": "DR SIDE D",
      "label": "[GL3] DR SIDE D",
      "isAS": false
    },
    {
      "id": "pcm1_11",
      "lineId": "pcm1",
      "lineName": "PCM #1 LINE",
      "lineBadge": "PCM1",
      "vehicle": "GL3",
      "itemName": "PART'G SEAL",
      "label": "[GL3] PART'G SEAL",
      "isAS": false
    },
    {
      "id": "pcm1_13",
      "lineId": "pcm1",
      "lineName": "PCM #1 LINE",
      "lineBadge": "PCM1",
      "vehicle": "GN7",
      "itemName": "HOOD RR",
      "label": "[GN7] HOOD RR",
      "isAS": false
    },
    {
      "id": "pcm1_excel_56",
      "lineId": "pcm1",
      "lineName": "PCM #1 LINE",
      "lineBadge": "PCM1",
      "vehicle": "HC",
      "itemName": "HOOD RR",
      "label": "[HC] HOOD RR",
      "isAS": false
    },
    {
      "id": "pcm1_46",
      "lineId": "pcm1",
      "lineName": "PCM #1 LINE",
      "lineBadge": "PCM1",
      "vehicle": "HG",
      "itemName": "DR SIDE C (A/S)",
      "label": "[HG] DR SIDE C (A/S)",
      "isAS": true
    },
    {
      "id": "pcm1_34",
      "lineId": "pcm1",
      "lineName": "PCM #1 LINE",
      "lineBadge": "PCM1",
      "vehicle": "HG",
      "itemName": "UPPER OP'G B (A/S)",
      "label": "[HG] UPPER OP'G B (A/S)",
      "isAS": true
    },
    {
      "id": "pcm1_33",
      "lineId": "pcm1",
      "lineName": "PCM #1 LINE",
      "lineBadge": "PCM1",
      "vehicle": "HG",
      "itemName": "UPPER OP'G C (A/S)",
      "label": "[HG] UPPER OP'G C (A/S)",
      "isAS": true
    },
    {
      "id": "pcm1_35",
      "lineId": "pcm1",
      "lineName": "PCM #1 LINE",
      "lineBadge": "PCM1",
      "vehicle": "HG(AG)",
      "itemName": "UPPER OP'G A (A/S)",
      "label": "[HG(AG)] UPPER OP'G A (A/S)",
      "isAS": true
    },
    {
      "id": "pcm1_30",
      "lineId": "pcm1",
      "lineName": "PCM #1 LINE",
      "lineBadge": "PCM1",
      "vehicle": "HI",
      "itemName": "UPPER OP'G B RR (A/S)",
      "label": "[HI] UPPER OP'G B RR (A/S)",
      "isAS": true
    },
    {
      "id": "pcm1_31",
      "lineId": "pcm1",
      "lineName": "PCM #1 LINE",
      "lineBadge": "PCM1",
      "vehicle": "HI(RS4)",
      "itemName": "C-PLR PART'G A RR (A/S)",
      "label": "[HI(RS4)] C-PLR PART'G A RR (A/S)",
      "isAS": true
    },
    {
      "id": "pcm1_excel_79",
      "lineId": "pcm1",
      "lineName": "PCM #1 LINE",
      "lineBadge": "PCM1",
      "vehicle": "J-300",
      "itemName": "HOOD FRT (A/S)",
      "label": "[J-300] HOOD FRT (A/S)",
      "isAS": true
    },
    {
      "id": "pcm1_excel_80",
      "lineId": "pcm1",
      "lineName": "PCM #1 LINE",
      "lineBadge": "PCM1",
      "vehicle": "J-309",
      "itemName": "HOOD FRT (A/S)",
      "label": "[J-309] HOOD FRT (A/S)",
      "isAS": true
    },
    {
      "id": "pcm1_29",
      "lineId": "pcm1",
      "lineName": "PCM #1 LINE",
      "lineBadge": "PCM1",
      "vehicle": "J100",
      "itemName": "D/SIDE C",
      "label": "[J100] D/SIDE C",
      "isAS": false
    },
    {
      "id": "pcm1_excel_76",
      "lineId": "pcm1",
      "lineName": "PCM #1 LINE",
      "lineBadge": "PCM1",
      "vehicle": "KL",
      "itemName": "H/SURROUND SEAL-1 (A/S)",
      "label": "[KL] H/SURROUND SEAL-1 (A/S)",
      "isAS": true
    },
    {
      "id": "pcm1_excel_77",
      "lineId": "pcm1",
      "lineName": "PCM #1 LINE",
      "lineBadge": "PCM1",
      "vehicle": "KL",
      "itemName": "H/SURROUND SEAL-2 (A/S)",
      "label": "[KL] H/SURROUND SEAL-2 (A/S)",
      "isAS": true
    },
    {
      "id": "pcm1_excel_67",
      "lineId": "pcm1",
      "lineName": "PCM #1 LINE",
      "lineBadge": "PCM1",
      "vehicle": "KS",
      "itemName": "HOOD FRT",
      "label": "[KS] HOOD FRT",
      "isAS": false
    },
    {
      "id": "pcm1_excel_66",
      "lineId": "pcm1",
      "lineName": "PCM #1 LINE",
      "lineBadge": "PCM1",
      "vehicle": "KS",
      "itemName": "HOOD RR",
      "label": "[KS] HOOD RR",
      "isAS": false
    },
    {
      "id": "pcm1_excel_52",
      "lineId": "pcm1",
      "lineName": "PCM #1 LINE",
      "lineBadge": "PCM1",
      "vehicle": "LM",
      "itemName": "DR SIDE",
      "label": "[LM] DR SIDE",
      "isAS": false
    },
    {
      "id": "pcm1_26",
      "lineId": "pcm1",
      "lineName": "PCM #1 LINE",
      "lineBadge": "PCM1",
      "vehicle": "LQ2",
      "itemName": "HOOD FRT",
      "label": "[LQ2] HOOD FRT",
      "isAS": false
    },
    {
      "id": "pcm1_21",
      "lineId": "pcm1",
      "lineName": "PCM #1 LINE",
      "lineBadge": "PCM1",
      "vehicle": "LQ2",
      "itemName": "HOOD RR",
      "label": "[LQ2] HOOD RR",
      "isAS": false
    },
    {
      "id": "pcm1_27",
      "lineId": "pcm1",
      "lineName": "PCM #1 LINE",
      "lineBadge": "PCM1",
      "vehicle": "LQ2",
      "itemName": "HOOD SIDE",
      "label": "[LQ2] HOOD SIDE",
      "isAS": false
    },
    {
      "id": "pcm1_9",
      "lineId": "pcm1",
      "lineName": "PCM #1 LINE",
      "lineBadge": "PCM1",
      "vehicle": "LW",
      "itemName": "D/SIDE C",
      "label": "[LW] D/SIDE C",
      "isAS": false
    },
    {
      "id": "pcm1_10",
      "lineId": "pcm1",
      "lineName": "PCM #1 LINE",
      "lineBadge": "PCM1",
      "vehicle": "LW",
      "itemName": "D/SIDE D",
      "label": "[LW] D/SIDE D",
      "isAS": false
    },
    {
      "id": "pcm1_excel_71",
      "lineId": "pcm1",
      "lineName": "PCM #1 LINE",
      "lineBadge": "PCM1",
      "vehicle": "LW1",
      "itemName": "HOOD RR",
      "label": "[LW1] HOOD RR",
      "isAS": false
    },
    {
      "id": "pcm1_excel_74",
      "lineId": "pcm1",
      "lineName": "PCM #1 LINE",
      "lineBadge": "PCM1",
      "vehicle": "MCA",
      "itemName": "H/SURROUND SEAL A (A/S)",
      "label": "[MCA] H/SURROUND SEAL A (A/S)",
      "isAS": true
    },
    {
      "id": "pcm1_excel_75",
      "lineId": "pcm1",
      "lineName": "PCM #1 LINE",
      "lineBadge": "PCM1",
      "vehicle": "MCA",
      "itemName": "H/SURROUND SEAL B (A/S)",
      "label": "[MCA] H/SURROUND SEAL B (A/S)",
      "isAS": true
    },
    {
      "id": "pcm1_1",
      "lineId": "pcm1",
      "lineName": "PCM #1 LINE",
      "lineBadge": "PCM1",
      "vehicle": "MCA",
      "itemName": "HOOD A",
      "label": "[MCA] HOOD A",
      "isAS": false
    },
    {
      "id": "pcm1_2",
      "lineId": "pcm1",
      "lineName": "PCM #1 LINE",
      "lineBadge": "PCM1",
      "vehicle": "MCA",
      "itemName": "HOOD B",
      "label": "[MCA] HOOD B",
      "isAS": false
    },
    {
      "id": "pcm1_19",
      "lineId": "pcm1",
      "lineName": "PCM #1 LINE",
      "lineBadge": "PCM1",
      "vehicle": "ME1",
      "itemName": "HOOD RR",
      "label": "[ME1] HOOD RR",
      "isAS": false
    },
    {
      "id": "pcm1_excel_69",
      "lineId": "pcm1",
      "lineName": "PCM #1 LINE",
      "lineBadge": "PCM1",
      "vehicle": "ME1A",
      "itemName": "HOOD RR",
      "label": "[ME1A] HOOD RR",
      "isAS": false
    },
    {
      "id": "pcm1_excel_81",
      "lineId": "pcm1",
      "lineName": "PCM #1 LINE",
      "lineBadge": "PCM1",
      "vehicle": "MPV-7",
      "itemName": "HOOD FRT (A/S)",
      "label": "[MPV-7] HOOD FRT (A/S)",
      "isAS": true
    },
    {
      "id": "pcm1_12",
      "lineId": "pcm1",
      "lineName": "PCM #1 LINE",
      "lineBadge": "PCM1",
      "vehicle": "MQ4",
      "itemName": "HOOD RR",
      "label": "[MQ4] HOOD RR",
      "isAS": false
    },
    {
      "id": "pcm1_16",
      "lineId": "pcm1",
      "lineName": "PCM #1 LINE",
      "lineBadge": "PCM1",
      "vehicle": "MV1A",
      "itemName": "HOOD RR",
      "label": "[MV1A] HOOD RR",
      "isAS": false
    },
    {
      "id": "pcm1_excel_68",
      "lineId": "pcm1",
      "lineName": "PCM #1 LINE",
      "lineBadge": "PCM1",
      "vehicle": "MX5A",
      "itemName": "HOOD RR",
      "label": "[MX5A] HOOD RR",
      "isAS": false
    },
    {
      "id": "pcm1_excel_86",
      "lineId": "pcm1",
      "lineName": "PCM #1 LINE",
      "lineBadge": "PCM1",
      "vehicle": "NE1A",
      "itemName": "DR SIDE D",
      "label": "[NE1A] DR SIDE D",
      "isAS": false
    },
    {
      "id": "pcm1_excel_83",
      "lineId": "pcm1",
      "lineName": "PCM #1 LINE",
      "lineBadge": "PCM1",
      "vehicle": "NQ5A",
      "itemName": "DR SIDE D",
      "label": "[NQ5A] DR SIDE D",
      "isAS": false
    },
    {
      "id": "pcm1_22",
      "lineId": "pcm1",
      "lineName": "PCM #1 LINE",
      "lineBadge": "PCM1",
      "vehicle": "NQ5A",
      "itemName": "HOOD FRT",
      "label": "[NQ5A] HOOD FRT",
      "isAS": false
    },
    {
      "id": "pcm1_15",
      "lineId": "pcm1",
      "lineName": "PCM #1 LINE",
      "lineBadge": "PCM1",
      "vehicle": "NQ5A",
      "itemName": "HOOD RR",
      "label": "[NQ5A] HOOD RR",
      "isAS": false
    },
    {
      "id": "pcm1_excel_89",
      "lineId": "pcm1",
      "lineName": "PCM #1 LINE",
      "lineBadge": "PCM1",
      "vehicle": "NX4A",
      "itemName": "DR SIDE D",
      "label": "[NX4A] DR SIDE D",
      "isAS": false
    },
    {
      "id": "pcm1_14",
      "lineId": "pcm1",
      "lineName": "PCM #1 LINE",
      "lineBadge": "PCM1",
      "vehicle": "NX5A",
      "itemName": "HOOD RR",
      "label": "[NX5A] HOOD RR",
      "isAS": false
    },
    {
      "id": "pcm1_excel_61",
      "lineId": "pcm1",
      "lineName": "PCM #1 LINE",
      "lineBadge": "PCM1",
      "vehicle": "ON",
      "itemName": "HOOD FRT",
      "label": "[ON] HOOD FRT",
      "isAS": false
    },
    {
      "id": "pcm1_excel_60",
      "lineId": "pcm1",
      "lineName": "PCM #1 LINE",
      "lineBadge": "PCM1",
      "vehicle": "ON",
      "itemName": "HOOD RR",
      "label": "[ON] HOOD RR",
      "isAS": false
    },
    {
      "id": "pcm1_48",
      "lineId": "pcm1",
      "lineName": "PCM #1 LINE",
      "lineBadge": "PCM1",
      "vehicle": "OS",
      "itemName": "DR SIDE D (A/S)",
      "label": "[OS] DR SIDE D (A/S)",
      "isAS": true
    },
    {
      "id": "pcm1_excel_87",
      "lineId": "pcm1",
      "lineName": "PCM #1 LINE",
      "lineBadge": "PCM1",
      "vehicle": "OV1K",
      "itemName": "DR SIDE D",
      "label": "[OV1K] DR SIDE D",
      "isAS": false
    },
    {
      "id": "pcm1_20",
      "lineId": "pcm1",
      "lineName": "PCM #1 LINE",
      "lineBadge": "PCM1",
      "vehicle": "OV1K",
      "itemName": "HOOD RR",
      "label": "[OV1K] HOOD RR",
      "isAS": false
    },
    {
      "id": "pcm1_38",
      "lineId": "pcm1",
      "lineName": "PCM #1 LINE",
      "lineBadge": "PCM1",
      "vehicle": "QL",
      "itemName": "DR SIDE C (A/S)",
      "label": "[QL] DR SIDE C (A/S)",
      "isAS": true
    },
    {
      "id": "pcm1_6",
      "lineId": "pcm1",
      "lineName": "PCM #1 LINE",
      "lineBadge": "PCM1",
      "vehicle": "QX",
      "itemName": "D/SIDE D",
      "label": "[QX] D/SIDE D",
      "isAS": false
    },
    {
      "id": "pcm1_excel_82",
      "lineId": "pcm1",
      "lineName": "PCM #1 LINE",
      "lineBadge": "PCM1",
      "vehicle": "RP",
      "itemName": "DR SIDE",
      "label": "[RP] DR SIDE",
      "isAS": false
    },
    {
      "id": "pcm1_37",
      "lineId": "pcm1",
      "lineName": "PCM #1 LINE",
      "lineBadge": "PCM1",
      "vehicle": "SA",
      "itemName": "DR SIDE B (A/S)",
      "label": "[SA] DR SIDE B (A/S)",
      "isAS": true
    },
    {
      "id": "pcm1_excel_57",
      "lineId": "pcm1",
      "lineName": "PCM #1 LINE",
      "lineBadge": "PCM1",
      "vehicle": "SC",
      "itemName": "HOOD RR",
      "label": "[SC] HOOD RR",
      "isAS": false
    },
    {
      "id": "pcm1_7",
      "lineId": "pcm1",
      "lineName": "PCM #1 LINE",
      "lineBadge": "PCM1",
      "vehicle": "SP3",
      "itemName": "D/SIDE D",
      "label": "[SP3] D/SIDE D",
      "isAS": false
    },
    {
      "id": "pcm1_excel_72",
      "lineId": "pcm1",
      "lineName": "PCM #1 LINE",
      "lineBadge": "PCM1",
      "vehicle": "SP3",
      "itemName": "DR SIDE D",
      "label": "[SP3] DR SIDE D",
      "isAS": false
    },
    {
      "id": "pcm1_excel_70",
      "lineId": "pcm1",
      "lineName": "PCM #1 LINE",
      "lineBadge": "PCM1",
      "vehicle": "SP3I",
      "itemName": "HOOD RR",
      "label": "[SP3I] HOOD RR",
      "isAS": false
    },
    {
      "id": "pcm1_excel_65",
      "lineId": "pcm1",
      "lineName": "PCM #1 LINE",
      "lineBadge": "PCM1",
      "vehicle": "SU2ID",
      "itemName": "HOOD RR",
      "label": "[SU2ID] HOOD RR",
      "isAS": false
    },
    {
      "id": "pcm1_43",
      "lineId": "pcm1",
      "lineName": "PCM #1 LINE",
      "lineBadge": "PCM1",
      "vehicle": "TB",
      "itemName": "UPPER SEAL A (A/S)",
      "label": "[TB] UPPER SEAL A (A/S)",
      "isAS": true
    },
    {
      "id": "pcm1_test",
      "lineId": "pcm1",
      "lineName": "PCM #1 LINE",
      "lineBadge": "PCM1",
      "vehicle": "TEST",
      "itemName": "TEST 압출",
      "label": "[TEST] TEST 압출",
      "isAS": false
    },
    {
      "id": "pcm1_44",
      "lineId": "pcm1",
      "lineName": "PCM #1 LINE",
      "lineBadge": "PCM1",
      "vehicle": "TF",
      "itemName": "UPPER OP'G A (A/S)",
      "label": "[TF] UPPER OP'G A (A/S)",
      "isAS": true
    },
    {
      "id": "pcm1_32",
      "lineId": "pcm1",
      "lineName": "PCM #1 LINE",
      "lineBadge": "PCM1",
      "vehicle": "TF",
      "itemName": "UPPER OP'G B (A/S)",
      "label": "[TF] UPPER OP'G B (A/S)",
      "isAS": true
    },
    {
      "id": "pcm1_36",
      "lineId": "pcm1",
      "lineName": "PCM #1 LINE",
      "lineBadge": "PCM1",
      "vehicle": "TG",
      "itemName": "UPPER OP'G A (A/S)",
      "label": "[TG] UPPER OP'G A (A/S)",
      "isAS": true
    },
    {
      "id": "pcm1_39",
      "lineId": "pcm1",
      "lineName": "PCM #1 LINE",
      "lineBadge": "PCM1",
      "vehicle": "TG",
      "itemName": "UPPER OP'G C (A/S)",
      "label": "[TG] UPPER OP'G C (A/S)",
      "isAS": true
    },
    {
      "id": "pcm1_excel_58",
      "lineId": "pcm1",
      "lineName": "PCM #1 LINE",
      "lineBadge": "PCM1",
      "vehicle": "TMA",
      "itemName": "HOOD RR",
      "label": "[TMA] HOOD RR",
      "isAS": false
    },
    {
      "id": "pcm1_excel_54",
      "lineId": "pcm1",
      "lineName": "PCM #1 LINE",
      "lineBadge": "PCM1",
      "vehicle": "UF",
      "itemName": "HOOD SEAL (A/S)",
      "label": "[UF] HOOD SEAL (A/S)",
      "isAS": true
    },
    {
      "id": "pcm1_excel_55",
      "lineId": "pcm1",
      "lineName": "PCM #1 LINE",
      "lineBadge": "PCM1",
      "vehicle": "VF",
      "itemName": "DR SIDE B",
      "label": "[VF] DR SIDE B",
      "isAS": false
    },
    {
      "id": "pcm1_45",
      "lineId": "pcm1",
      "lineName": "PCM #1 LINE",
      "lineBadge": "PCM1",
      "vehicle": "VF",
      "itemName": "UPPER OP'G A (A/S)",
      "label": "[VF] UPPER OP'G A (A/S)",
      "isAS": true
    },
    {
      "id": "pcm1_excel_78",
      "lineId": "pcm1",
      "lineName": "PCM #1 LINE",
      "lineBadge": "PCM1",
      "vehicle": "WK",
      "itemName": "CUTLINE SEAL (A/S)",
      "label": "[WK] CUTLINE SEAL (A/S)",
      "isAS": true
    },
    {
      "id": "pcm1_42",
      "lineId": "pcm1",
      "lineName": "PCM #1 LINE",
      "lineBadge": "PCM1",
      "vehicle": "XM",
      "itemName": "DR SIDE A (A/S)",
      "label": "[XM] DR SIDE A (A/S)",
      "isAS": true
    }
  ],
  "pcm3": [
    {
      "id": "pcm3_66",
      "lineId": "pcm3",
      "lineName": "PCM #3 LINE",
      "lineBadge": "PCM3",
      "vehicle": "BK",
      "itemName": "DR SIDE B (A/S)",
      "label": "[BK] DR SIDE B (A/S)",
      "isAS": true
    },
    {
      "id": "pcm3_23",
      "lineId": "pcm3",
      "lineName": "PCM #3 LINE",
      "lineBadge": "PCM3",
      "vehicle": "CE1",
      "itemName": "D/SIDE C",
      "label": "[CE1] D/SIDE C",
      "isAS": false
    },
    {
      "id": "pcm3_26",
      "lineId": "pcm3",
      "lineName": "PCM #3 LINE",
      "lineBadge": "PCM3",
      "vehicle": "CE1",
      "itemName": "D/SIDE D",
      "label": "[CE1] D/SIDE D",
      "isAS": false
    },
    {
      "id": "pcm3_excel_91",
      "lineId": "pcm3",
      "lineName": "PCM #3 LINE",
      "lineBadge": "PCM3",
      "vehicle": "CE1",
      "itemName": "DR SIDE C",
      "label": "[CE1] DR SIDE C",
      "isAS": false
    },
    {
      "id": "pcm3_excel_92",
      "lineId": "pcm3",
      "lineName": "PCM #3 LINE",
      "lineBadge": "PCM3",
      "vehicle": "CE1",
      "itemName": "DR SIDE D",
      "label": "[CE1] DR SIDE D",
      "isAS": false
    },
    {
      "id": "pcm3_18",
      "lineId": "pcm3",
      "lineName": "PCM #3 LINE",
      "lineBadge": "PCM3",
      "vehicle": "CL4",
      "itemName": "D/SIDE C",
      "label": "[CL4] D/SIDE C",
      "isAS": false
    },
    {
      "id": "pcm3_29",
      "lineId": "pcm3",
      "lineName": "PCM #3 LINE",
      "lineBadge": "PCM3",
      "vehicle": "CL4",
      "itemName": "D/SIDE D",
      "label": "[CL4] D/SIDE D",
      "isAS": false
    },
    {
      "id": "pcm3_excel_80",
      "lineId": "pcm3",
      "lineName": "PCM #3 LINE",
      "lineBadge": "PCM3",
      "vehicle": "CL4",
      "itemName": "DR SIDE C",
      "label": "[CL4] DR SIDE C",
      "isAS": false
    },
    {
      "id": "pcm3_excel_81",
      "lineId": "pcm3",
      "lineName": "PCM #3 LINE",
      "lineBadge": "PCM3",
      "vehicle": "CL4",
      "itemName": "DR SIDE D",
      "label": "[CL4] DR SIDE D",
      "isAS": false
    },
    {
      "id": "pcm3_excel_93",
      "lineId": "pcm3",
      "lineName": "PCM #3 LINE",
      "lineBadge": "PCM3",
      "vehicle": "CN7",
      "itemName": "DR SIDE C",
      "label": "[CN7] DR SIDE C",
      "isAS": false
    },
    {
      "id": "pcm3_excel_94",
      "lineId": "pcm3",
      "lineName": "PCM #3 LINE",
      "lineBadge": "PCM3",
      "vehicle": "CN7",
      "itemName": "DR SIDE D",
      "label": "[CN7] DR SIDE D",
      "isAS": false
    },
    {
      "id": "pcm3_excel_98",
      "lineId": "pcm3",
      "lineName": "PCM #3 LINE",
      "lineBadge": "PCM3",
      "vehicle": "DE",
      "itemName": "DR SIDE C",
      "label": "[DE] DR SIDE C",
      "isAS": false
    },
    {
      "id": "pcm3_excel_99",
      "lineId": "pcm3",
      "lineName": "PCM #3 LINE",
      "lineBadge": "PCM3",
      "vehicle": "DE",
      "itemName": "DR SIDE D",
      "label": "[DE] DR SIDE D",
      "isAS": false
    },
    {
      "id": "pcm3_8",
      "lineId": "pcm3",
      "lineName": "PCM #3 LINE",
      "lineBadge": "PCM3",
      "vehicle": "DE-CAR",
      "itemName": "D/SIDE C",
      "label": "[DE-CAR] D/SIDE C",
      "isAS": false
    },
    {
      "id": "pcm3_9",
      "lineId": "pcm3",
      "lineName": "PCM #3 LINE",
      "lineBadge": "PCM3",
      "vehicle": "DE-CAR",
      "itemName": "D/SIDE D",
      "label": "[DE-CAR] D/SIDE D",
      "isAS": false
    },
    {
      "id": "pcm3_33",
      "lineId": "pcm3",
      "lineName": "PCM #3 LINE",
      "lineBadge": "PCM3",
      "vehicle": "DL3(a)",
      "itemName": "D/SIDE D",
      "label": "[DL3(a)] D/SIDE D",
      "isAS": false
    },
    {
      "id": "pcm3_excel_86",
      "lineId": "pcm3",
      "lineName": "PCM #3 LINE",
      "lineBadge": "PCM3",
      "vehicle": "DL3A",
      "itemName": "DR SIDE C",
      "label": "[DL3A] DR SIDE C",
      "isAS": false
    },
    {
      "id": "pcm3_excel_87",
      "lineId": "pcm3",
      "lineName": "PCM #3 LINE",
      "lineBadge": "PCM3",
      "vehicle": "DL3A",
      "itemName": "DR SIDE D",
      "label": "[DL3A] DR SIDE D",
      "isAS": false
    },
    {
      "id": "pcm3_22",
      "lineId": "pcm3",
      "lineName": "PCM #3 LINE",
      "lineBadge": "PCM3",
      "vehicle": "DN8",
      "itemName": "D/SIDE C",
      "label": "[DN8] D/SIDE C",
      "isAS": false
    },
    {
      "id": "pcm3_30",
      "lineId": "pcm3",
      "lineName": "PCM #3 LINE",
      "lineBadge": "PCM3",
      "vehicle": "DN8",
      "itemName": "D/SIDE D",
      "label": "[DN8] D/SIDE D",
      "isAS": false
    },
    {
      "id": "pcm3_excel_78",
      "lineId": "pcm3",
      "lineName": "PCM #3 LINE",
      "lineBadge": "PCM3",
      "vehicle": "DN8",
      "itemName": "DR SIDE C",
      "label": "[DN8] DR SIDE C",
      "isAS": false
    },
    {
      "id": "pcm3_excel_79",
      "lineId": "pcm3",
      "lineName": "PCM #3 LINE",
      "lineBadge": "PCM3",
      "vehicle": "DN8",
      "itemName": "DR SIDE D",
      "label": "[DN8] DR SIDE D",
      "isAS": false
    },
    {
      "id": "pcm3_excel_106",
      "lineId": "pcm3",
      "lineName": "PCM #3 LINE",
      "lineBadge": "PCM3",
      "vehicle": "DT",
      "itemName": "HOOD SEAL A",
      "label": "[DT] HOOD SEAL A",
      "isAS": false
    },
    {
      "id": "pcm3_excel_107",
      "lineId": "pcm3",
      "lineName": "PCM #3 LINE",
      "lineBadge": "PCM3",
      "vehicle": "DT",
      "itemName": "HOOD SEAL B",
      "label": "[DT] HOOD SEAL B",
      "isAS": false
    },
    {
      "id": "pcm3_12",
      "lineId": "pcm3",
      "lineName": "PCM #3 LINE",
      "lineBadge": "PCM3",
      "vehicle": "DT",
      "itemName": "HORIZONTAL",
      "label": "[DT] HORIZONTAL",
      "isAS": false
    },
    {
      "id": "pcm3_excel_105",
      "lineId": "pcm3",
      "lineName": "PCM #3 LINE",
      "lineBadge": "PCM3",
      "vehicle": "DT",
      "itemName": "HORIZONTAL (BOX CAB B)",
      "label": "[DT] HORIZONTAL (BOX CAB B)",
      "isAS": false
    },
    {
      "id": "pcm3_13",
      "lineId": "pcm3",
      "lineName": "PCM #3 LINE",
      "lineBadge": "PCM3",
      "vehicle": "DT",
      "itemName": "VERTICAL",
      "label": "[DT] VERTICAL",
      "isAS": false
    },
    {
      "id": "pcm3_excel_104",
      "lineId": "pcm3",
      "lineName": "PCM #3 LINE",
      "lineBadge": "PCM3",
      "vehicle": "DT",
      "itemName": "VERTICAL (BOX CAB A)",
      "label": "[DT] VERTICAL (BOX CAB A)",
      "isAS": false
    },
    {
      "id": "pcm3_excel_103",
      "lineId": "pcm3",
      "lineName": "PCM #3 LINE",
      "lineBadge": "PCM3",
      "vehicle": "EG",
      "itemName": "UPPER SEAL",
      "label": "[EG] UPPER SEAL",
      "isAS": false
    },
    {
      "id": "pcm3_5",
      "lineId": "pcm3",
      "lineName": "PCM #3 LINE",
      "lineBadge": "PCM3",
      "vehicle": "EG",
      "itemName": "UPR SEAL",
      "label": "[EG] UPR SEAL",
      "isAS": false
    },
    {
      "id": "pcm3_excel_110",
      "lineId": "pcm3",
      "lineName": "PCM #3 LINE",
      "lineBadge": "PCM3",
      "vehicle": "EJ",
      "itemName": "DR SILL SEAL FRT",
      "label": "[EJ] DR SILL SEAL FRT",
      "isAS": false
    },
    {
      "id": "pcm3_excel_111",
      "lineId": "pcm3",
      "lineName": "PCM #3 LINE",
      "lineBadge": "PCM3",
      "vehicle": "EJ",
      "itemName": "DR SILL SEAL RR",
      "label": "[EJ] DR SILL SEAL RR",
      "isAS": false
    },
    {
      "id": "pcm3_44",
      "lineId": "pcm3",
      "lineName": "PCM #3 LINE",
      "lineBadge": "PCM3",
      "vehicle": "EJ",
      "itemName": "W/HOUSE SEAL",
      "label": "[EJ] W/HOUSE SEAL",
      "isAS": false
    },
    {
      "id": "pcm3_59",
      "lineId": "pcm3",
      "lineName": "PCM #3 LINE",
      "lineBadge": "PCM3",
      "vehicle": "EN",
      "itemName": "DR SIDE C (A/S)",
      "label": "[EN] DR SIDE C (A/S)",
      "isAS": true
    },
    {
      "id": "pcm3_60",
      "lineId": "pcm3",
      "lineName": "PCM #3 LINE",
      "lineBadge": "PCM3",
      "vehicle": "EN",
      "itemName": "DR SIDE D (A/S)",
      "label": "[EN] DR SIDE D (A/S)",
      "isAS": true
    },
    {
      "id": "pcm3_1",
      "lineId": "pcm3",
      "lineName": "PCM #3 LINE",
      "lineBadge": "PCM3",
      "vehicle": "GL3",
      "itemName": "D/SIDE C",
      "label": "[GL3] D/SIDE C",
      "isAS": false
    },
    {
      "id": "pcm3_34",
      "lineId": "pcm3",
      "lineName": "PCM #3 LINE",
      "lineBadge": "PCM3",
      "vehicle": "GL3",
      "itemName": "D/SIDE D",
      "label": "[GL3] D/SIDE D",
      "isAS": false
    },
    {
      "id": "pcm3_excel_95",
      "lineId": "pcm3",
      "lineName": "PCM #3 LINE",
      "lineBadge": "PCM3",
      "vehicle": "GL3",
      "itemName": "DR SIDE C",
      "label": "[GL3] DR SIDE C",
      "isAS": false
    },
    {
      "id": "pcm3_excel_96",
      "lineId": "pcm3",
      "lineName": "PCM #3 LINE",
      "lineBadge": "PCM3",
      "vehicle": "GL3",
      "itemName": "DR SIDE D",
      "label": "[GL3] DR SIDE D",
      "isAS": false
    },
    {
      "id": "pcm3_excel_97",
      "lineId": "pcm3",
      "lineName": "PCM #3 LINE",
      "lineBadge": "PCM3",
      "vehicle": "GL3",
      "itemName": "PART'G SEAL",
      "label": "[GL3] PART'G SEAL",
      "isAS": false
    },
    {
      "id": "pcm3_65",
      "lineId": "pcm3",
      "lineName": "PCM #3 LINE",
      "lineBadge": "PCM3",
      "vehicle": "HG",
      "itemName": "DR SIDE C (A/S)",
      "label": "[HG] DR SIDE C (A/S)",
      "isAS": true
    },
    {
      "id": "pcm3_53",
      "lineId": "pcm3",
      "lineName": "PCM #3 LINE",
      "lineBadge": "PCM3",
      "vehicle": "HG",
      "itemName": "UPPER OP'G B (A/S)",
      "label": "[HG] UPPER OP'G B (A/S)",
      "isAS": true
    },
    {
      "id": "pcm3_52",
      "lineId": "pcm3",
      "lineName": "PCM #3 LINE",
      "lineBadge": "PCM3",
      "vehicle": "HG",
      "itemName": "UPPER OP'G C (A/S)",
      "label": "[HG] UPPER OP'G C (A/S)",
      "isAS": true
    },
    {
      "id": "pcm3_54",
      "lineId": "pcm3",
      "lineName": "PCM #3 LINE",
      "lineBadge": "PCM3",
      "vehicle": "HG(AG)",
      "itemName": "UPPER OP'G A (A/S)",
      "label": "[HG(AG)] UPPER OP'G A (A/S)",
      "isAS": true
    },
    {
      "id": "pcm3_49",
      "lineId": "pcm3",
      "lineName": "PCM #3 LINE",
      "lineBadge": "PCM3",
      "vehicle": "HI",
      "itemName": "UPPER OP'G B RR (A/S)",
      "label": "[HI] UPPER OP'G B RR (A/S)",
      "isAS": true
    },
    {
      "id": "pcm3_50",
      "lineId": "pcm3",
      "lineName": "PCM #3 LINE",
      "lineBadge": "PCM3",
      "vehicle": "HI(RS4)",
      "itemName": "C-PLR PART'G A RR (A/S)",
      "label": "[HI(RS4)] C-PLR PART'G A RR (A/S)",
      "isAS": true
    },
    {
      "id": "pcm3_2",
      "lineId": "pcm3",
      "lineName": "PCM #3 LINE",
      "lineBadge": "PCM3",
      "vehicle": "J200",
      "itemName": "2ND SEAL A",
      "label": "[J200] 2ND SEAL A",
      "isAS": false
    },
    {
      "id": "pcm3_excel_69",
      "lineId": "pcm3",
      "lineName": "PCM #3 LINE",
      "lineBadge": "PCM3",
      "vehicle": "J200",
      "itemName": "2ND SEAL A FRT",
      "label": "[J200] 2ND SEAL A FRT",
      "isAS": false
    },
    {
      "id": "pcm3_excel_70",
      "lineId": "pcm3",
      "lineName": "PCM #3 LINE",
      "lineBadge": "PCM3",
      "vehicle": "J200",
      "itemName": "2ND SEAL A RR",
      "label": "[J200] 2ND SEAL A RR",
      "isAS": false
    },
    {
      "id": "pcm3_3",
      "lineId": "pcm3",
      "lineName": "PCM #3 LINE",
      "lineBadge": "PCM3",
      "vehicle": "J200",
      "itemName": "2ND SEAL B",
      "label": "[J200] 2ND SEAL B",
      "isAS": false
    },
    {
      "id": "pcm3_excel_71",
      "lineId": "pcm3",
      "lineName": "PCM #3 LINE",
      "lineBadge": "PCM3",
      "vehicle": "J200",
      "itemName": "2ND SEAL B RR",
      "label": "[J200] 2ND SEAL B RR",
      "isAS": false
    },
    {
      "id": "pcm3_38",
      "lineId": "pcm3",
      "lineName": "PCM #3 LINE",
      "lineBadge": "PCM3",
      "vehicle": "JG1",
      "itemName": "FRUNK",
      "label": "[JG1] FRUNK",
      "isAS": false
    },
    {
      "id": "pcm3_excel_112",
      "lineId": "pcm3",
      "lineName": "PCM #3 LINE",
      "lineBadge": "PCM3",
      "vehicle": "JG1",
      "itemName": "FRUNK (무천공)",
      "label": "[JG1] FRUNK (무천공)",
      "isAS": false
    },
    {
      "id": "pcm3_14",
      "lineId": "pcm3",
      "lineName": "PCM #3 LINE",
      "lineBadge": "PCM3",
      "vehicle": "KM/KX",
      "itemName": "HOOD SURROUND",
      "label": "[KM/KX] HOOD SURROUND",
      "isAS": false
    },
    {
      "id": "pcm3_45",
      "lineId": "pcm3",
      "lineName": "PCM #3 LINE",
      "lineBadge": "PCM3",
      "vehicle": "KM/KX",
      "itemName": "L/GATE CUTLINE",
      "label": "[KM/KX] L/GATE CUTLINE",
      "isAS": false
    },
    {
      "id": "pcm3_46",
      "lineId": "pcm3",
      "lineName": "PCM #3 LINE",
      "lineBadge": "PCM3",
      "vehicle": "KM74",
      "itemName": "L/GATE",
      "label": "[KM74] L/GATE",
      "isAS": false
    },
    {
      "id": "pcm3_excel_116",
      "lineId": "pcm3",
      "lineName": "PCM #3 LINE",
      "lineBadge": "PCM3",
      "vehicle": "KM74",
      "itemName": "LIFT GATE",
      "label": "[KM74] LIFT GATE",
      "isAS": false
    },
    {
      "id": "pcm3_6",
      "lineId": "pcm3",
      "lineName": "PCM #3 LINE",
      "lineBadge": "PCM3",
      "vehicle": "LF",
      "itemName": "D/SIDE C",
      "label": "[LF] D/SIDE C",
      "isAS": false
    },
    {
      "id": "pcm3_excel_100",
      "lineId": "pcm3",
      "lineName": "PCM #3 LINE",
      "lineBadge": "PCM3",
      "vehicle": "LF",
      "itemName": "DR SIDE C",
      "label": "[LF] DR SIDE C",
      "isAS": false
    },
    {
      "id": "pcm3_35",
      "lineId": "pcm3",
      "lineName": "PCM #3 LINE",
      "lineBadge": "PCM3",
      "vehicle": "ME1a",
      "itemName": "POWER T/GATE",
      "label": "[ME1a] POWER T/GATE",
      "isAS": false
    },
    {
      "id": "pcm3_excel_109",
      "lineId": "pcm3",
      "lineName": "PCM #3 LINE",
      "lineBadge": "PCM3",
      "vehicle": "ME1A",
      "itemName": "FRUNK",
      "label": "[ME1A] FRUNK",
      "isAS": false
    },
    {
      "id": "pcm3_16",
      "lineId": "pcm3",
      "lineName": "PCM #3 LINE",
      "lineBadge": "PCM3",
      "vehicle": "MV1a",
      "itemName": "FRUNK",
      "label": "[MV1a] FRUNK",
      "isAS": false
    },
    {
      "id": "pcm3_15",
      "lineId": "pcm3",
      "lineName": "PCM #3 LINE",
      "lineBadge": "PCM3",
      "vehicle": "MV1a",
      "itemName": "HOOD FRT",
      "label": "[MV1a] HOOD FRT",
      "isAS": false
    },
    {
      "id": "pcm3_17",
      "lineId": "pcm3",
      "lineName": "PCM #3 LINE",
      "lineBadge": "PCM3",
      "vehicle": "MV1a",
      "itemName": "POWER T/GATE",
      "label": "[MV1a] POWER T/GATE",
      "isAS": false
    },
    {
      "id": "pcm3_19",
      "lineId": "pcm3",
      "lineName": "PCM #3 LINE",
      "lineBadge": "PCM3",
      "vehicle": "NE1a",
      "itemName": "D/SIDE C",
      "label": "[NE1a] D/SIDE C",
      "isAS": false
    },
    {
      "id": "pcm3_31",
      "lineId": "pcm3",
      "lineName": "PCM #3 LINE",
      "lineBadge": "PCM3",
      "vehicle": "NE1a",
      "itemName": "D/SIDE D",
      "label": "[NE1a] D/SIDE D",
      "isAS": false
    },
    {
      "id": "pcm3_excel_82",
      "lineId": "pcm3",
      "lineName": "PCM #3 LINE",
      "lineBadge": "PCM3",
      "vehicle": "NE1A",
      "itemName": "DR SIDE C",
      "label": "[NE1A] DR SIDE C",
      "isAS": false
    },
    {
      "id": "pcm3_excel_83",
      "lineId": "pcm3",
      "lineName": "PCM #3 LINE",
      "lineBadge": "PCM3",
      "vehicle": "NE1A",
      "itemName": "DR SIDE D",
      "label": "[NE1A] DR SIDE D",
      "isAS": false
    },
    {
      "id": "pcm3_21",
      "lineId": "pcm3",
      "lineName": "PCM #3 LINE",
      "lineBadge": "PCM3",
      "vehicle": "NQ5A",
      "itemName": "D/SIDE C",
      "label": "[NQ5A] D/SIDE C",
      "isAS": false
    },
    {
      "id": "pcm3_28",
      "lineId": "pcm3",
      "lineName": "PCM #3 LINE",
      "lineBadge": "PCM3",
      "vehicle": "NQ5A",
      "itemName": "D/SIDE D",
      "label": "[NQ5A] D/SIDE D",
      "isAS": false
    },
    {
      "id": "pcm3_excel_76",
      "lineId": "pcm3",
      "lineName": "PCM #3 LINE",
      "lineBadge": "PCM3",
      "vehicle": "NQ5A",
      "itemName": "DR SIDE C",
      "label": "[NQ5A] DR SIDE C",
      "isAS": false
    },
    {
      "id": "pcm3_excel_77",
      "lineId": "pcm3",
      "lineName": "PCM #3 LINE",
      "lineBadge": "PCM3",
      "vehicle": "NQ5A",
      "itemName": "DR SIDE D",
      "label": "[NQ5A] DR SIDE D",
      "isAS": false
    },
    {
      "id": "pcm3_24",
      "lineId": "pcm3",
      "lineName": "PCM #3 LINE",
      "lineBadge": "PCM3",
      "vehicle": "NX4A",
      "itemName": "D/SDIE C",
      "label": "[NX4A] D/SDIE C",
      "isAS": false
    },
    {
      "id": "pcm3_27",
      "lineId": "pcm3",
      "lineName": "PCM #3 LINE",
      "lineBadge": "PCM3",
      "vehicle": "NX4A",
      "itemName": "D/SDIE D",
      "label": "[NX4A] D/SDIE D",
      "isAS": false
    },
    {
      "id": "pcm3_excel_88",
      "lineId": "pcm3",
      "lineName": "PCM #3 LINE",
      "lineBadge": "PCM3",
      "vehicle": "NX4A",
      "itemName": "DR SIDE C",
      "label": "[NX4A] DR SIDE C",
      "isAS": false
    },
    {
      "id": "pcm3_excel_89",
      "lineId": "pcm3",
      "lineName": "PCM #3 LINE",
      "lineBadge": "PCM3",
      "vehicle": "NX4A",
      "itemName": "DR SIDE D",
      "label": "[NX4A] DR SIDE D",
      "isAS": false
    },
    {
      "id": "pcm3_25",
      "lineId": "pcm3",
      "lineName": "PCM #3 LINE",
      "lineBadge": "PCM3",
      "vehicle": "NX4A OB",
      "itemName": "D/SDIE D",
      "label": "[NX4A OB] D/SDIE D",
      "isAS": false
    },
    {
      "id": "pcm3_excel_90",
      "lineId": "pcm3",
      "lineName": "PCM #3 LINE",
      "lineBadge": "PCM3",
      "vehicle": "NX4A(OB)",
      "itemName": "DR SIDE D",
      "label": "[NX4A(OB)] DR SIDE D",
      "isAS": false
    },
    {
      "id": "pcm3_excel_108",
      "lineId": "pcm3",
      "lineName": "PCM #3 LINE",
      "lineBadge": "PCM3",
      "vehicle": "NX5A",
      "itemName": "POWER T/GATE",
      "label": "[NX5A] POWER T/GATE",
      "isAS": false
    },
    {
      "id": "pcm3_67",
      "lineId": "pcm3",
      "lineName": "PCM #3 LINE",
      "lineBadge": "PCM3",
      "vehicle": "OS",
      "itemName": "DR SIDE D (A/S)",
      "label": "[OS] DR SIDE D (A/S)",
      "isAS": true
    },
    {
      "id": "pcm3_20",
      "lineId": "pcm3",
      "lineName": "PCM #3 LINE",
      "lineBadge": "PCM3",
      "vehicle": "OV1K",
      "itemName": "D/SIDE C",
      "label": "[OV1K] D/SIDE C",
      "isAS": false
    },
    {
      "id": "pcm3_32",
      "lineId": "pcm3",
      "lineName": "PCM #3 LINE",
      "lineBadge": "PCM3",
      "vehicle": "OV1K",
      "itemName": "D/SIDE D",
      "label": "[OV1K] D/SIDE D",
      "isAS": false
    },
    {
      "id": "pcm3_excel_84",
      "lineId": "pcm3",
      "lineName": "PCM #3 LINE",
      "lineBadge": "PCM3",
      "vehicle": "OV1K",
      "itemName": "DR SIDE C",
      "label": "[OV1K] DR SIDE C",
      "isAS": false
    },
    {
      "id": "pcm3_excel_85",
      "lineId": "pcm3",
      "lineName": "PCM #3 LINE",
      "lineBadge": "PCM3",
      "vehicle": "OV1K",
      "itemName": "DR SIDE D",
      "label": "[OV1K] DR SIDE D",
      "isAS": false
    },
    {
      "id": "pcm3_37",
      "lineId": "pcm3",
      "lineName": "PCM #3 LINE",
      "lineBadge": "PCM3",
      "vehicle": "OV1K",
      "itemName": "FRUNK",
      "label": "[OV1K] FRUNK",
      "isAS": false
    },
    {
      "id": "pcm3_36",
      "lineId": "pcm3",
      "lineName": "PCM #3 LINE",
      "lineBadge": "PCM3",
      "vehicle": "OV1K",
      "itemName": "POWER T/GATE",
      "label": "[OV1K] POWER T/GATE",
      "isAS": false
    },
    {
      "id": "pcm3_excel_113",
      "lineId": "pcm3",
      "lineName": "PCM #3 LINE",
      "lineBadge": "PCM3",
      "vehicle": "OV1K",
      "itemName": "PTG SIDE",
      "label": "[OV1K] PTG SIDE",
      "isAS": false
    },
    {
      "id": "pcm3_excel_74",
      "lineId": "pcm3",
      "lineName": "PCM #3 LINE",
      "lineBadge": "PCM3",
      "vehicle": "Q200",
      "itemName": "DR SIDE A RR",
      "label": "[Q200] DR SIDE A RR",
      "isAS": false
    },
    {
      "id": "pcm3_10",
      "lineId": "pcm3",
      "lineName": "PCM #3 LINE",
      "lineBadge": "PCM3",
      "vehicle": "Q200/Y400",
      "itemName": "D/SIDE A",
      "label": "[Q200/Y400] D/SIDE A",
      "isAS": false
    },
    {
      "id": "pcm3_11",
      "lineId": "pcm3",
      "lineName": "PCM #3 LINE",
      "lineBadge": "PCM3",
      "vehicle": "Q200/Y400",
      "itemName": "D/SIDE D",
      "label": "[Q200/Y400] D/SIDE D",
      "isAS": false
    },
    {
      "id": "pcm3_57",
      "lineId": "pcm3",
      "lineName": "PCM #3 LINE",
      "lineBadge": "PCM3",
      "vehicle": "QL",
      "itemName": "DR SIDE C (A/S)",
      "label": "[QL] DR SIDE C (A/S)",
      "isAS": true
    },
    {
      "id": "pcm3_39",
      "lineId": "pcm3",
      "lineName": "PCM #3 LINE",
      "lineBadge": "PCM3",
      "vehicle": "RS4",
      "itemName": "C PLR PART’G",
      "label": "[RS4] C PLR PART’G",
      "isAS": false
    },
    {
      "id": "pcm3_excel_115",
      "lineId": "pcm3",
      "lineName": "PCM #3 LINE",
      "lineBadge": "PCM3",
      "vehicle": "RS4",
      "itemName": "C-PLR PART'G",
      "label": "[RS4] C-PLR PART'G",
      "isAS": false
    },
    {
      "id": "pcm3_56",
      "lineId": "pcm3",
      "lineName": "PCM #3 LINE",
      "lineBadge": "PCM3",
      "vehicle": "SA",
      "itemName": "DR SIDE B (A/S)",
      "label": "[SA] DR SIDE B (A/S)",
      "isAS": true
    },
    {
      "id": "pcm3_62",
      "lineId": "pcm3",
      "lineName": "PCM #3 LINE",
      "lineBadge": "PCM3",
      "vehicle": "TB",
      "itemName": "UPPER SEAL A (A/S)",
      "label": "[TB] UPPER SEAL A (A/S)",
      "isAS": true
    },
    {
      "id": "pcm3_test",
      "lineId": "pcm3",
      "lineName": "PCM #3 LINE",
      "lineBadge": "PCM3",
      "vehicle": "TEST",
      "itemName": "TEST 압출",
      "label": "[TEST] TEST 압출",
      "isAS": false
    },
    {
      "id": "pcm3_63",
      "lineId": "pcm3",
      "lineName": "PCM #3 LINE",
      "lineBadge": "PCM3",
      "vehicle": "TF",
      "itemName": "UPPER OP'G A (A/S)",
      "label": "[TF] UPPER OP'G A (A/S)",
      "isAS": true
    },
    {
      "id": "pcm3_51",
      "lineId": "pcm3",
      "lineName": "PCM #3 LINE",
      "lineBadge": "PCM3",
      "vehicle": "TF",
      "itemName": "UPPER OP'G B (A/S)",
      "label": "[TF] UPPER OP'G B (A/S)",
      "isAS": true
    },
    {
      "id": "pcm3_55",
      "lineId": "pcm3",
      "lineName": "PCM #3 LINE",
      "lineBadge": "PCM3",
      "vehicle": "TG",
      "itemName": "UPPER OP'G A (A/S)",
      "label": "[TG] UPPER OP'G A (A/S)",
      "isAS": true
    },
    {
      "id": "pcm3_58",
      "lineId": "pcm3",
      "lineName": "PCM #3 LINE",
      "lineBadge": "PCM3",
      "vehicle": "TG",
      "itemName": "UPPER OP'G C (A/S)",
      "label": "[TG] UPPER OP'G C (A/S)",
      "isAS": true
    },
    {
      "id": "pcm3_64",
      "lineId": "pcm3",
      "lineName": "PCM #3 LINE",
      "lineBadge": "PCM3",
      "vehicle": "VF",
      "itemName": "UPPER OP'G A (A/S)",
      "label": "[VF] UPPER OP'G A (A/S)",
      "isAS": true
    },
    {
      "id": "pcm3_47",
      "lineId": "pcm3",
      "lineName": "PCM #3 LINE",
      "lineBadge": "PCM3",
      "vehicle": "VI",
      "itemName": "PART'G SEAL A RR (A/S)",
      "label": "[VI] PART'G SEAL A RR (A/S)",
      "isAS": true
    },
    {
      "id": "pcm3_48",
      "lineId": "pcm3",
      "lineName": "PCM #3 LINE",
      "lineBadge": "PCM3",
      "vehicle": "VI",
      "itemName": "UPPER SEAL A FRT (A/S)",
      "label": "[VI] UPPER SEAL A FRT (A/S)",
      "isAS": true
    },
    {
      "id": "pcm3_excel_102",
      "lineId": "pcm3",
      "lineName": "PCM #3 LINE",
      "lineBadge": "PCM3",
      "vehicle": "VT",
      "itemName": "UPPER SEAL",
      "label": "[VT] UPPER SEAL",
      "isAS": false
    },
    {
      "id": "pcm3_4",
      "lineId": "pcm3",
      "lineName": "PCM #3 LINE",
      "lineBadge": "PCM3",
      "vehicle": "VT",
      "itemName": "UPR SEAL",
      "label": "[VT] UPR SEAL",
      "isAS": false
    },
    {
      "id": "pcm3_40",
      "lineId": "pcm3",
      "lineName": "PCM #3 LINE",
      "lineBadge": "PCM3",
      "vehicle": "WD",
      "itemName": "DR SIDE D",
      "label": "[WD] DR SIDE D",
      "isAS": false
    },
    {
      "id": "pcm3_41",
      "lineId": "pcm3",
      "lineName": "PCM #3 LINE",
      "lineBadge": "PCM3",
      "vehicle": "WD",
      "itemName": "LIFT GATE",
      "label": "[WD] LIFT GATE",
      "isAS": false
    },
    {
      "id": "pcm3_42",
      "lineId": "pcm3",
      "lineName": "PCM #3 LINE",
      "lineBadge": "PCM3",
      "vehicle": "WK",
      "itemName": "LIFT GATE",
      "label": "[WK] LIFT GATE",
      "isAS": false
    },
    {
      "id": "pcm3_61",
      "lineId": "pcm3",
      "lineName": "PCM #3 LINE",
      "lineBadge": "PCM3",
      "vehicle": "XM",
      "itemName": "DR SIDE A (A/S)",
      "label": "[XM] DR SIDE A (A/S)",
      "isAS": true
    },
    {
      "id": "pcm3_excel_73",
      "lineId": "pcm3",
      "lineName": "PCM #3 LINE",
      "lineBadge": "PCM3",
      "vehicle": "Y400",
      "itemName": "DR SIDE A RR",
      "label": "[Y400] DR SIDE A RR",
      "isAS": false
    },
    {
      "id": "pcm3_excel_114",
      "lineId": "pcm3",
      "lineName": "PCM #3 LINE",
      "lineBadge": "PCM3",
      "vehicle": "Y400",
      "itemName": "UPPER OP'G B",
      "label": "[Y400] UPPER OP'G B",
      "isAS": false
    },
    {
      "id": "pcm3_43",
      "lineId": "pcm3",
      "lineName": "PCM #3 LINE",
      "lineBadge": "PCM3",
      "vehicle": "Y400",
      "itemName": "UPR OPG B",
      "label": "[Y400] UPR OPG B",
      "isAS": false
    },
    {
      "id": "pcm3_excel_72",
      "lineId": "pcm3",
      "lineName": "PCM #3 LINE",
      "lineBadge": "PCM3",
      "vehicle": "Y400(Q200)",
      "itemName": "DR SIDE A FRT",
      "label": "[Y400(Q200)] DR SIDE A FRT",
      "isAS": false
    },
    {
      "id": "pcm3_excel_75",
      "lineId": "pcm3",
      "lineName": "PCM #3 LINE",
      "lineBadge": "PCM3",
      "vehicle": "Y400(Q200)",
      "itemName": "DR SIDE D",
      "label": "[Y400(Q200)] DR SIDE D",
      "isAS": false
    },
    {
      "id": "pcm3_excel_101",
      "lineId": "pcm3",
      "lineName": "PCM #3 LINE",
      "lineBadge": "PCM3",
      "vehicle": "YB",
      "itemName": "DR SIDE C",
      "label": "[YB] DR SIDE C",
      "isAS": false
    },
    {
      "id": "pcm3_7",
      "lineId": "pcm3",
      "lineName": "PCM #3 LINE",
      "lineBadge": "PCM3",
      "vehicle": "YB-CAR",
      "itemName": "D/SIDE C",
      "label": "[YB-CAR] D/SIDE C",
      "isAS": false
    }
  ],
  "tpe": [
    {
      "id": "tpe_excel_28",
      "lineId": "tpe",
      "lineName": "TPE LINE",
      "lineBadge": "TPE",
      "vehicle": "9BQB",
      "itemName": "G/RUN C",
      "label": "[9BQB] G/RUN C",
      "isAS": false
    },
    {
      "id": "tpe_18",
      "lineId": "tpe",
      "lineName": "TPE LINE",
      "lineBadge": "TPE",
      "vehicle": "9BQB",
      "itemName": "G/RUN FRT A",
      "label": "[9BQB] G/RUN FRT A",
      "isAS": false
    },
    {
      "id": "tpe_19",
      "lineId": "tpe",
      "lineName": "TPE LINE",
      "lineBadge": "TPE",
      "vehicle": "9BQB",
      "itemName": "G/RUN FRT B",
      "label": "[9BQB] G/RUN FRT B",
      "isAS": false
    },
    {
      "id": "tpe_20",
      "lineId": "tpe",
      "lineName": "TPE LINE",
      "lineBadge": "TPE",
      "vehicle": "9BQB",
      "itemName": "G/RUN FRT C",
      "label": "[9BQB] G/RUN FRT C",
      "isAS": false
    },
    {
      "id": "tpe_excel_23",
      "lineId": "tpe",
      "lineName": "TPE LINE",
      "lineBadge": "TPE",
      "vehicle": "9BQC",
      "itemName": "G/RUN A FRT",
      "label": "[9BQC] G/RUN A FRT",
      "isAS": false
    },
    {
      "id": "tpe_excel_24",
      "lineId": "tpe",
      "lineName": "TPE LINE",
      "lineBadge": "TPE",
      "vehicle": "9BQC",
      "itemName": "G/RUN A RR",
      "label": "[9BQC] G/RUN A RR",
      "isAS": false
    },
    {
      "id": "tpe_excel_25",
      "lineId": "tpe",
      "lineName": "TPE LINE",
      "lineBadge": "TPE",
      "vehicle": "9BQC",
      "itemName": "G/RUN B FRT",
      "label": "[9BQC] G/RUN B FRT",
      "isAS": false
    },
    {
      "id": "tpe_excel_26",
      "lineId": "tpe",
      "lineName": "TPE LINE",
      "lineBadge": "TPE",
      "vehicle": "9BQC",
      "itemName": "G/RUN B RR",
      "label": "[9BQC] G/RUN B RR",
      "isAS": false
    },
    {
      "id": "tpe_excel_27",
      "lineId": "tpe",
      "lineName": "TPE LINE",
      "lineBadge": "TPE",
      "vehicle": "9BQC",
      "itemName": "G/RUN C FRT",
      "label": "[9BQC] G/RUN C FRT",
      "isAS": false
    },
    {
      "id": "tpe_13",
      "lineId": "tpe",
      "lineName": "TPE LINE",
      "lineBadge": "TPE",
      "vehicle": "9BQC",
      "itemName": "G/RUN FRT A",
      "label": "[9BQC] G/RUN FRT A",
      "isAS": false
    },
    {
      "id": "tpe_15",
      "lineId": "tpe",
      "lineName": "TPE LINE",
      "lineBadge": "TPE",
      "vehicle": "9BQC",
      "itemName": "G/RUN FRT B",
      "label": "[9BQC] G/RUN FRT B",
      "isAS": false
    },
    {
      "id": "tpe_17",
      "lineId": "tpe",
      "lineName": "TPE LINE",
      "lineBadge": "TPE",
      "vehicle": "9BQC",
      "itemName": "G/RUN FRT C",
      "label": "[9BQC] G/RUN FRT C",
      "isAS": false
    },
    {
      "id": "tpe_14",
      "lineId": "tpe",
      "lineName": "TPE LINE",
      "lineBadge": "TPE",
      "vehicle": "9BQC",
      "itemName": "G/RUN RR A",
      "label": "[9BQC] G/RUN RR A",
      "isAS": false
    },
    {
      "id": "tpe_16",
      "lineId": "tpe",
      "lineName": "TPE LINE",
      "lineBadge": "TPE",
      "vehicle": "9BQC",
      "itemName": "G/RUN RR B",
      "label": "[9BQC] G/RUN RR B",
      "isAS": false
    },
    {
      "id": "tpe_excel_29",
      "lineId": "tpe",
      "lineName": "TPE LINE",
      "lineBadge": "TPE",
      "vehicle": "BL",
      "itemName": "G/RUN A (A/S)",
      "label": "[BL] G/RUN A (A/S)",
      "isAS": true
    },
    {
      "id": "tpe_excel_30",
      "lineId": "tpe",
      "lineName": "TPE LINE",
      "lineBadge": "TPE",
      "vehicle": "BL",
      "itemName": "G/RUN B (A/S)",
      "label": "[BL] G/RUN B (A/S)",
      "isAS": true
    },
    {
      "id": "tpe_excel_31",
      "lineId": "tpe",
      "lineName": "TPE LINE",
      "lineBadge": "TPE",
      "vehicle": "BL",
      "itemName": "G/RUN C (A/S)",
      "label": "[BL] G/RUN C (A/S)",
      "isAS": true
    },
    {
      "id": "tpe_8",
      "lineId": "tpe",
      "lineName": "TPE LINE",
      "lineBadge": "TPE",
      "vehicle": "HR",
      "itemName": "G/RUN 'A' FRT",
      "label": "[HR] G/RUN 'A' FRT",
      "isAS": false
    },
    {
      "id": "tpe_9",
      "lineId": "tpe",
      "lineName": "TPE LINE",
      "lineBadge": "TPE",
      "vehicle": "HR",
      "itemName": "G/RUN 'A' RR",
      "label": "[HR] G/RUN 'A' RR",
      "isAS": false
    },
    {
      "id": "tpe_10",
      "lineId": "tpe",
      "lineName": "TPE LINE",
      "lineBadge": "TPE",
      "vehicle": "HR",
      "itemName": "G/RUN 'B' FRT",
      "label": "[HR] G/RUN 'B' FRT",
      "isAS": false
    },
    {
      "id": "tpe_11",
      "lineId": "tpe",
      "lineName": "TPE LINE",
      "lineBadge": "TPE",
      "vehicle": "HR",
      "itemName": "G/RUN 'B' RR",
      "label": "[HR] G/RUN 'B' RR",
      "isAS": false
    },
    {
      "id": "tpe_12",
      "lineId": "tpe",
      "lineName": "TPE LINE",
      "lineBadge": "TPE",
      "vehicle": "HR",
      "itemName": "G/RUN 'C' FRT",
      "label": "[HR] G/RUN 'C' FRT",
      "isAS": false
    },
    {
      "id": "tpe_1",
      "lineId": "tpe",
      "lineName": "TPE LINE",
      "lineBadge": "TPE",
      "vehicle": "JA",
      "itemName": "G/RUN 'A' FRT",
      "label": "[JA] G/RUN 'A' FRT",
      "isAS": false
    },
    {
      "id": "tpe_2",
      "lineId": "tpe",
      "lineName": "TPE LINE",
      "lineBadge": "TPE",
      "vehicle": "JA",
      "itemName": "G/RUN 'A' RR",
      "label": "[JA] G/RUN 'A' RR",
      "isAS": false
    },
    {
      "id": "tpe_3",
      "lineId": "tpe",
      "lineName": "TPE LINE",
      "lineBadge": "TPE",
      "vehicle": "JA",
      "itemName": "G/RUN 'B' FRT",
      "label": "[JA] G/RUN 'B' FRT",
      "isAS": false
    },
    {
      "id": "tpe_4",
      "lineId": "tpe",
      "lineName": "TPE LINE",
      "lineBadge": "TPE",
      "vehicle": "JA",
      "itemName": "G/RUN 'B' RR",
      "label": "[JA] G/RUN 'B' RR",
      "isAS": false
    },
    {
      "id": "tpe_5",
      "lineId": "tpe",
      "lineName": "TPE LINE",
      "lineBadge": "TPE",
      "vehicle": "JA",
      "itemName": "G/RUN 'C' FRT",
      "label": "[JA] G/RUN 'C' FRT",
      "isAS": false
    },
    {
      "id": "tpe_6",
      "lineId": "tpe",
      "lineName": "TPE LINE",
      "lineBadge": "TPE",
      "vehicle": "JA",
      "itemName": "G/RUN 'D' RR",
      "label": "[JA] G/RUN 'D' RR",
      "isAS": false
    },
    {
      "id": "tpe_excel_33",
      "lineId": "tpe",
      "lineName": "TPE LINE",
      "lineBadge": "TPE",
      "vehicle": "M2XX",
      "itemName": "G/RUN A FRT (A/S)",
      "label": "[M2XX] G/RUN A FRT (A/S)",
      "isAS": true
    },
    {
      "id": "tpe_excel_35",
      "lineId": "tpe",
      "lineName": "TPE LINE",
      "lineBadge": "TPE",
      "vehicle": "M2XX",
      "itemName": "G/RUN A RR(JC) (A/S)",
      "label": "[M2XX] G/RUN A RR(JC) (A/S)",
      "isAS": true
    },
    {
      "id": "tpe_excel_34",
      "lineId": "tpe",
      "lineName": "TPE LINE",
      "lineBadge": "TPE",
      "vehicle": "M2XX",
      "itemName": "G/RUN A RR(JO) (A/S)",
      "label": "[M2XX] G/RUN A RR(JO) (A/S)",
      "isAS": true
    },
    {
      "id": "tpe_excel_36",
      "lineId": "tpe",
      "lineName": "TPE LINE",
      "lineBadge": "TPE",
      "vehicle": "M2XX",
      "itemName": "G/RUN B FRT (A/S)",
      "label": "[M2XX] G/RUN B FRT (A/S)",
      "isAS": true
    },
    {
      "id": "tpe_excel_37",
      "lineId": "tpe",
      "lineName": "TPE LINE",
      "lineBadge": "TPE",
      "vehicle": "M2XX",
      "itemName": "G/RUN B RR (A/S)",
      "label": "[M2XX] G/RUN B RR (A/S)",
      "isAS": true
    },
    {
      "id": "tpe_excel_38",
      "lineId": "tpe",
      "lineName": "TPE LINE",
      "lineBadge": "TPE",
      "vehicle": "M2XX",
      "itemName": "G/RUN C FRT (A/S)",
      "label": "[M2XX] G/RUN C FRT (A/S)",
      "isAS": true
    },
    {
      "id": "tpe_excel_39",
      "lineId": "tpe",
      "lineName": "TPE LINE",
      "lineBadge": "TPE",
      "vehicle": "M2XX",
      "itemName": "G/RUN D RR(JO) (A/S)",
      "label": "[M2XX] G/RUN D RR(JO) (A/S)",
      "isAS": true
    },
    {
      "id": "tpe_excel_40",
      "lineId": "tpe",
      "lineName": "TPE LINE",
      "lineBadge": "TPE",
      "vehicle": "M2XX",
      "itemName": "G/RUN E RR(JC) (A/S)",
      "label": "[M2XX] G/RUN E RR(JC) (A/S)",
      "isAS": true
    },
    {
      "id": "tpe_7",
      "lineId": "tpe",
      "lineName": "TPE LINE",
      "lineBadge": "TPE",
      "vehicle": "QX",
      "itemName": "G/RUN 'D' RR",
      "label": "[QX] G/RUN 'D' RR",
      "isAS": false
    },
    {
      "id": "tpe_excel_22",
      "lineId": "tpe",
      "lineName": "TPE LINE",
      "lineBadge": "TPE",
      "vehicle": "QX(JA)",
      "itemName": "G/RUN D RR",
      "label": "[QX(JA)] G/RUN D RR",
      "isAS": false
    },
    {
      "id": "tpe_test",
      "lineId": "tpe",
      "lineName": "TPE LINE",
      "lineBadge": "TPE",
      "vehicle": "TEST",
      "itemName": "TEST 압출",
      "label": "[TEST] TEST 압출",
      "isAS": false
    },
    {
      "id": "tpe_excel_32",
      "lineId": "tpe",
      "lineName": "TPE LINE",
      "lineBadge": "TPE",
      "vehicle": "UB",
      "itemName": "D/SIDE D (A/S)",
      "label": "[UB] D/SIDE D (A/S)",
      "isAS": true
    }
  ],
  "pvc": [
    {
      "id": "pvc_13",
      "lineId": "pvc",
      "lineName": "PVC LINE",
      "lineBadge": "PVC",
      "vehicle": "B3",
      "itemName": "INR BELT",
      "label": "[B3] INR BELT",
      "isAS": false
    },
    {
      "id": "pvc_3",
      "lineId": "pvc",
      "lineName": "PVC LINE",
      "lineBadge": "PVC",
      "vehicle": "BC4T",
      "itemName": "ROOF GARNISH",
      "label": "[BC4T] ROOF GARNISH",
      "isAS": false
    },
    {
      "id": "pvc_excel_16",
      "lineId": "pvc",
      "lineName": "PVC LINE",
      "lineBadge": "PVC",
      "vehicle": "CENTER",
      "itemName": "PILLAR (A/S)",
      "label": "[CENTER] PILLAR (A/S)",
      "isAS": true
    },
    {
      "id": "pvc_10",
      "lineId": "pvc",
      "lineName": "PVC LINE",
      "lineBadge": "PVC",
      "vehicle": "DA/LA",
      "itemName": "CENTER PILLAR",
      "label": "[DA/LA] CENTER PILLAR",
      "isAS": false
    },
    {
      "id": "pvc_8",
      "lineId": "pvc",
      "lineName": "PVC LINE",
      "lineBadge": "PVC",
      "vehicle": "DAMAS",
      "itemName": "ROOF RAIL(대)",
      "label": "[DAMAS] ROOF RAIL(대)",
      "isAS": false
    },
    {
      "id": "pvc_9",
      "lineId": "pvc",
      "lineName": "PVC LINE",
      "lineBadge": "PVC",
      "vehicle": "DAMAS",
      "itemName": "ROOF RAIL(소)",
      "label": "[DAMAS] ROOF RAIL(소)",
      "isAS": false
    },
    {
      "id": "pvc_6",
      "lineId": "pvc",
      "lineName": "PVC LINE",
      "lineBadge": "PVC",
      "vehicle": "EG",
      "itemName": "INR BELT",
      "label": "[EG] INR BELT",
      "isAS": false
    },
    {
      "id": "pvc_5",
      "lineId": "pvc",
      "lineName": "PVC LINE",
      "lineBadge": "PVC",
      "vehicle": "EG",
      "itemName": "OTR CHAN'L",
      "label": "[EG] OTR CHAN'L",
      "isAS": false
    },
    {
      "id": "pvc_14",
      "lineId": "pvc",
      "lineName": "PVC LINE",
      "lineBadge": "PVC",
      "vehicle": "GRACE",
      "itemName": "TRIM OP'G",
      "label": "[GRACE] TRIM OP'G",
      "isAS": false
    },
    {
      "id": "pvc_4",
      "lineId": "pvc",
      "lineName": "PVC LINE",
      "lineBadge": "PVC",
      "vehicle": "GV",
      "itemName": "OTR CHAN'L",
      "label": "[GV] OTR CHAN'L",
      "isAS": false
    },
    {
      "id": "pvc_1",
      "lineId": "pvc",
      "lineName": "PVC LINE",
      "lineBadge": "PVC",
      "vehicle": "PU",
      "itemName": "OTR CHAN'L FRT",
      "label": "[PU] OTR CHAN'L FRT",
      "isAS": false
    },
    {
      "id": "pvc_2",
      "lineId": "pvc",
      "lineName": "PVC LINE",
      "lineBadge": "PVC",
      "vehicle": "PU",
      "itemName": "OTR CHAN'L RR",
      "label": "[PU] OTR CHAN'L RR",
      "isAS": false
    },
    {
      "id": "pvc_excel_19",
      "lineId": "pvc",
      "lineName": "PVC LINE",
      "lineBadge": "PVC",
      "vehicle": "QZ",
      "itemName": "OTR CHAN'L (A/S)",
      "label": "[QZ] OTR CHAN'L (A/S)",
      "isAS": true
    },
    {
      "id": "pvc_excel_17",
      "lineId": "pvc",
      "lineName": "PVC LINE",
      "lineBadge": "PVC",
      "vehicle": "ROOF",
      "itemName": "RAIL(대) (A/S)",
      "label": "[ROOF] RAIL(대) (A/S)",
      "isAS": true
    },
    {
      "id": "pvc_excel_18",
      "lineId": "pvc",
      "lineName": "PVC LINE",
      "lineBadge": "PVC",
      "vehicle": "ROOF",
      "itemName": "RAIL(소) (A/S)",
      "label": "[ROOF] RAIL(소) (A/S)",
      "isAS": true
    },
    {
      "id": "pvc_test",
      "lineId": "pvc",
      "lineName": "PVC LINE",
      "lineBadge": "PVC",
      "vehicle": "TEST",
      "itemName": "TEST 압출",
      "label": "[TEST] TEST 압출",
      "isAS": false
    },
    {
      "id": "pvc_7",
      "lineId": "pvc",
      "lineName": "PVC LINE",
      "lineBadge": "PVC",
      "vehicle": "VT",
      "itemName": "INR BELT",
      "label": "[VT] INR BELT",
      "isAS": false
    },
    {
      "id": "pvc_excel_20",
      "lineId": "pvc",
      "lineName": "PVC LINE",
      "lineBadge": "PVC",
      "vehicle": "W-3",
      "itemName": "OTR CHAN'L (A/S)",
      "label": "[W-3] OTR CHAN'L (A/S)",
      "isAS": true
    },
    {
      "id": "pvc_11",
      "lineId": "pvc",
      "lineName": "PVC LINE",
      "lineBadge": "PVC",
      "vehicle": "W3",
      "itemName": "OTR CHAN'L FRT",
      "label": "[W3] OTR CHAN'L FRT",
      "isAS": false
    },
    {
      "id": "pvc_12",
      "lineId": "pvc",
      "lineName": "PVC LINE",
      "lineBadge": "PVC",
      "vehicle": "W3",
      "itemName": "OTR CHAN'L RR",
      "label": "[W3] OTR CHAN'L RR",
      "isAS": false
    }
  ]
};

export const getAllExtrusionItems = () => {
  return [
    ...(EXTRUSION_ITEMS_BY_LINE.pcm1 || []),
    ...(EXTRUSION_ITEMS_BY_LINE.pcm3 || []),
    ...(EXTRUSION_ITEMS_BY_LINE.pvc || []),
    ...(EXTRUSION_ITEMS_BY_LINE.tpe || [])
  ];
};

export const getItemsByLine = (lineId = "pcm1") => {
  return EXTRUSION_ITEMS_BY_LINE[lineId] || EXTRUSION_ITEMS_BY_LINE.pcm1 || [];
};

export const findExtrusionItem = (lineId, vehicle, itemName) => {
  const list = getItemsByLine(lineId);
  return list.find(
    (it) =>
      it.vehicle?.toUpperCase() === vehicle?.toUpperCase() &&
      it.itemName?.toUpperCase() === itemName?.toUpperCase()
  );
};
