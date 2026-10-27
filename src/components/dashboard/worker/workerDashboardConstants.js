import {
  DEFECT_TYPE_GROUPS,
  JAEYUL_EQUIPMENT_CATEGORIES,
  JAEYUL_EQUIPMENT_OPTIONS,
  JAEYUL_CATEGORY_EQUIPMENT_MAP,
  LOGS_PER_PAGE
} from "../../../hooks/dashboard";

export {
  DEFECT_TYPE_GROUPS,
  JAEYUL_EQUIPMENT_CATEGORIES,
  JAEYUL_EQUIPMENT_OPTIONS,
  JAEYUL_CATEGORY_EQUIPMENT_MAP,
  LOGS_PER_PAGE
};

// 30분 단위 시간 선택 목록 (종일 + 24시간 30분 간격)
export const TIME_OPTIONS_30MIN = [
  "종일",
  "06:00", "06:30", "07:00", "07:30", "08:00", "08:30",
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
  "15:00", "15:30", "16:00", "16:30", "17:00", "17:30",
  "18:00", "18:30", "19:00", "19:30", "20:00", "20:30",
  "21:00", "21:30", "22:00", "22:30", "23:00", "23:30",
  "00:00", "00:30", "01:00", "01:30", "02:00", "02:30",
  "03:00", "03:30", "04:00", "04:30", "05:00", "05:30"
];

// Storage key for Extrusion 4-Lines Downtime Data (Synced directly with ExtrusionDowntimeView)
export const STORAGE_KEY_EXTRUSION = "factory_extrusion_downtime_user_uploaded_v5";

// Dynamic Extrusion 4-Lines Summary calculated purely from real uploaded data
export const getExtrusionSummaryData = () => {
  let store = {};
  try {
    const saved = localStorage.getItem(STORAGE_KEY_EXTRUSION);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === "object") store = parsed;
    }
  } catch (e) {
    console.error("Failed to load extrusion store:", e);
  }

  const lineKeys = [
    { key: "pcm1", altKeys: ["pcm1", "pcm_1", "pcm#1"], defaultName: "압출 1호 (PCM #1)", defaultCode: "PCM #1", themeColor: "teal" },
    { key: "pcm3", altKeys: ["pcm3", "pcm_3", "pcm#3"], defaultName: "압출 3호 (PCM #3)", defaultCode: "PCM #3", themeColor: "blue" },
    { key: "pvc", altKeys: ["pvc", "pvc1", "pvc_1"], defaultName: "압출 PVC 라인", defaultCode: "PVC", themeColor: "amber" },
    { key: "tpe", altKeys: ["tpe", "tpe1", "tpe_1"], defaultName: "압출 TPE 라인", defaultCode: "TPE", themeColor: "purple" }
  ];

  return lineKeys.map(({ key, altKeys, defaultName, defaultCode, themeColor }) => {
    let lObj = null;
    if (store && typeof store === "object") {
      lObj = store[key];
      if (!lObj && Array.isArray(altKeys)) {
        for (const ak of altKeys) {
          if (store[ak]) {
            lObj = store[ak];
            break;
          }
        }
      }
    }
    if (!lObj || typeof lObj !== "object") lObj = {};

    const lineName = lObj.name || defaultName;
    const lineCode = lObj.code || defaultCode;
    const sheets = (lObj.sheets && typeof lObj.sheets === "object" ? lObj.sheets : null) ||
                   (lObj.weeklyData && typeof lObj.weeklyData === "object" ? lObj.weeklyData : null) || {};
    const sheetKeys = Object.keys(sheets);

    const flatRecords = Array.isArray(lObj)
      ? lObj
      : (Array.isArray(lObj.records) ? lObj.records : []);

    // If no data uploaded yet for this line
    if (sheetKeys.length === 0 && flatRecords.length === 0) {
      return {
        id: key,
        key,
        lineKey: key,
        line: lineName,
        name: lineName,
        code: lineCode,
        plant: "삼랑진공장",
        themeColor,
        status: "정상가동",
        statusColor: "emerald",
        currentMonth: "9월",
        currentMonthMin: 0,
        currentMonthHours: "0.0h",
        totalDowntimeMinutes: 0,
        issueCount: 0,
        mainReason: "특이사항 없음",
        actionTaken: "정상 운전",
        recentDate: "-",
        lossRate: "0.0%",
        opRatio: "100.0",
        isPending: true,
        monthlyTrend: [
          { month: "7월", opRate: "-", opNum: 100, lossRate: "-", lossNum: 0, isCurrent: false },
          { month: "8월", opRate: "-", opNum: 100, lossRate: "-", lossNum: 0, isCurrent: false },
          { month: "9월", opRate: "-", opNum: 100, lossRate: "-", lossNum: 0, isCurrent: true }
        ]
      };
    }

    // Monthly trends dynamically calculated from uploaded sheets
    const months = ["7월", "8월", "9월"];
    const monthlyTrend = months.map((m) => {
      const mSheets = sheetKeys.filter((k) => k.startsWith(m) || k.includes(m));
      if (mSheets.length === 0) {
        return {
          month: m,
          opRate: "-",
          opNum: 100,
          lossRate: "-",
          lossNum: 0,
          isCurrent: m === "9월"
        };
      }

      let mTotalMin = 0;
      let mPlanMin = 0;
      const mTotalBase = mSheets.length * 7200; // 5 days 24h per week (7,200 min)

      mSheets.forEach((w) => {
        const sh = sheets[w];
        const rows = Array.isArray(sh?.rows) ? sh.rows : [];
        rows.forEach((r) => {
          const noStr = String(r?.no || "").trim();
          const taskStr = String(r?.task || "").trim();
          if (noStr.includes("합계") || taskStr.includes("합계") || taskStr.includes("총 합계")) return;
          const min = Number(r?.minutes || 0);
          mTotalMin += min;
          if (r?.plan === "Y" || r?.plan === "y") mPlanMin += min;
        });
      });

      const netDowntime = Math.max(0, mTotalMin - mPlanMin);
      const netRunTime = Math.max(0, mTotalBase - mPlanMin);
      const opNum = netRunTime > 0 ? ((netRunTime - netDowntime) / netRunTime) * 100 : 100;
      const lossNum = mTotalBase > 0 ? (mTotalMin / mTotalBase) * 100 : 0;

      return {
        month: m,
        opRate: `${opNum.toFixed(1)}%`,
        opNum: Number(opNum.toFixed(1)),
        lossRate: `${lossNum.toFixed(1)}%`,
        lossNum: Number(lossNum.toFixed(1)),
        isCurrent: m === "9월"
      };
    });

    // 9월 (당월) 누적 비가동 시간 계산
    const sepSheets = sheetKeys.filter((w) => w.startsWith("9월") || w.includes("9월"));
    let sepMin = 0;
    let sepPlanMin = 0;
    const sepTotalBase = Math.max(1, sepSheets.length) * 7200;

    sepSheets.forEach((w) => {
      const sh = sheets[w];
      const rows = Array.isArray(sh?.rows) ? sh.rows : [];
      rows.forEach((r) => {
        const noStr = String(r?.no || "").trim();
        const taskStr = String(r?.task || "").trim();
        if (noStr.includes("합계") || taskStr.includes("합계") || taskStr.includes("총 합계")) return;
        const min = Number(r?.minutes || 0);
        sepMin += min;
        if (r?.plan === "Y" || r?.plan === "y") sepPlanMin += min;
      });
    });

    // If flat records exist and no sheet records, aggregate safely
    if (sepMin === 0 && flatRecords.length > 0) {
      sepMin = flatRecords.reduce((sum, r) => sum + (Number(r?.durationMinutes || r?.minutes) || 0), 0);
    }

    const currSep = monthlyTrend.find((m) => m.month === "9월") || monthlyTrend[monthlyTrend.length - 1];
    const sepHours = (sepMin / 60).toFixed(1) + "h";
    const sepNetDowntime = Math.max(0, sepMin - sepPlanMin);
    const sepNetRunTime = Math.max(0, sepTotalBase - sepPlanMin);
    const sepOpRatio =
      sepSheets.length > 0 && sepNetRunTime > 0
        ? (((sepNetRunTime - sepNetDowntime) / sepNetRunTime) * 100).toFixed(1)
        : (currSep?.opNum ? currSep.opNum.toFixed(1) : "100.0");
    const sepLossRate =
      sepSheets.length > 0 && sepTotalBase > 0
        ? `${((sepMin / sepTotalBase) * 100).toFixed(1)}%`
        : (currSep?.lossRate || "0.0%");

    let status = "정상가동";
    let statusColor = "emerald";
    if (sepMin > 180) {
      status = "가동주의";
      statusColor = "rose";
    } else if (sepMin > 60) {
      status = "점검대기";
      statusColor = "amber";
    }

    const latest = flatRecords.length > 0 ? flatRecords[flatRecords.length - 1] : null;

    return {
      id: key,
      key,
      lineKey: key,
      line: lineName,
      name: lineName,
      code: lineCode,
      plant: "삼랑진공장",
      themeColor,
      status,
      statusColor,
      currentMonth: "9월",
      currentMonthMin: sepMin,
      currentMonthHours: sepHours,
      totalDowntimeMinutes: sepMin,
      issueCount: flatRecords.length || sepSheets.length,
      mainReason: latest ? `${latest.reason || "설비점검"} (${latest.durationMinutes || latest.minutes}분)` : "특이사항 없음",
      actionTaken: latest ? latest.actionTaken || "조치 완료" : "정상 운전",
      recentDate: latest?.date || "-",
      lossRate: sepSheets.length > 0 ? sepLossRate : (currSep?.lossRate || "0.0%"),
      opRatio: sepOpRatio,
      isPending: false,
      monthlyTrend
    };
  });
};
