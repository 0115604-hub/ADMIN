// 삼랑진공장 압출 라인별 생산 아이템 현황 (Excel 기준 이니셜/차종순 정렬 데이터)
// 원본: 라인별 아이템현황.xlsx (PCM1, PCM3, PVC, TPE + TEST 압출)

export const EXTRUSION_LINE_BADGES = [
  { id: "pcm1", badge: "PCM1", shortName: "PCM 1호", name: "PCM #1 LINE", color: "teal", count: 49 },
  { id: "pcm3", badge: "PCM3", shortName: "PCM 3호", name: "PCM #3 LINE", color: "blue", count: 68 },
  { id: "pvc", badge: "PVC", shortName: "PVC", name: "PVC LINE", color: "amber", count: 15 },
  { id: "tpe", badge: "TPE", shortName: "TPE", name: "TPE LINE", color: "purple", count: 21 }
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
  ],
  "tpe": [
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
      "id": "tpe_test",
      "lineId": "tpe",
      "lineName": "TPE LINE",
      "lineBadge": "TPE",
      "vehicle": "TEST",
      "itemName": "TEST 압출",
      "label": "[TEST] TEST 압출",
      "isAS": false
    }
  ]
};

export const getAllExtrusionItems = () => [
  ...EXTRUSION_ITEMS_BY_LINE.pcm1,
  ...EXTRUSION_ITEMS_BY_LINE.pcm3,
  ...EXTRUSION_ITEMS_BY_LINE.pvc,
  ...EXTRUSION_ITEMS_BY_LINE.tpe
];

export const getItemsByLine = (lineId = "pcm1") => {
  const key = String(lineId || "pcm1").toLowerCase().trim();
  if (key.includes("pcm1") || key.includes("1호")) return EXTRUSION_ITEMS_BY_LINE.pcm1;
  if (key.includes("pcm3") || key.includes("3호")) return EXTRUSION_ITEMS_BY_LINE.pcm3;
  if (key.includes("pvc")) return EXTRUSION_ITEMS_BY_LINE.pvc;
  if (key.includes("tpe")) return EXTRUSION_ITEMS_BY_LINE.tpe;
  return EXTRUSION_ITEMS_BY_LINE.pcm1 || [];
};
