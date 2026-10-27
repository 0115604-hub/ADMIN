import { useState, useEffect, useMemo } from "react";
import {
  subscribeUrgentIssues,
  getLocalUrgentIssues
} from "../../../../services/urgentIssueService";
import { subscribeToExtrusionReports } from "../../../../services/extrusionProductionService";
import {
  subscribeExtrusionQualityIssues,
  getLocalExtrusionQualityIssues
} from "../../../../services/extrusionQualityIssueService";
import {
  subscribeHanulQualityIssues,
  getLocalHanulQualityIssues
} from "../../../../services/hanulQualityIssueService";
import {
  subscribeYuseongQualityIssues,
  getLocalYuseongQualityIssues
} from "../../../../services/yuseongQualityIssueService";
import {
  subscribeMachiningQualityIssues,
  getLocalMachiningQualityIssues
} from "../../../../services/machiningQualityIssueService";
import {
  getCore4MId,
  getNormalizedTitleKey,
  mergeUnified4MRecords,
  subscribeFourMChangePoints,
  getLocalFourMChangePoints,
  determineFourMCategory,
  getFourMBadgeColor
} from "../../../../services/fourMChangePointService";
import {
  subscribeSmartOvertimeData,
  getLocalSmartOvertimeData,
  cleanCompanyName,
  isWeekendByDate
} from "../../../../services/overtimeSmartService";
import {
  subscribe4MAbsenceLogs,
  getLocal4MAbsenceLogsMap
} from "../../../../services/absence4MService";
import {
  subscribePersonnelCards,
  getLocalPersonnelCardsMap
} from "../../../../services/personnelCardService";

// Safe date normalizer (YYYY-MM-DD)
export const normalizeDateStr = (raw, fallback = "") => {
  if (!raw) return fallback;
  if (typeof raw === "object" && raw.seconds) {
    return new Date(raw.seconds * 1000).toISOString().slice(0, 10);
  }
  const str = String(raw).trim();
  const match = str.match(/(\d{4})[.\-\/](\d{1,2})[.\-\/](\d{1,2})/);
  if (match) {
    return `${match[1]}-${String(match[2]).padStart(2, "0")}-${String(match[3]).padStart(2, "0")}`;
  }
  return str.slice(0, 10) || fallback;
};

/**
 * Custom Hook: useUnified4MData
 * Aggregates, cleans, normalizes and dedupes all 4M records across factories and subsystems.
 */
export const useUnified4MData = (workLogs = []) => {
  const [urgentIssues, setUrgentIssues] = useState(() => getLocalUrgentIssues());
  const [extrusionReports, setExtrusionReports] = useState([]);
  const [extrusionQualityAlerts, setExtrusionQualityAlerts] = useState(() => getLocalExtrusionQualityIssues());
  const [hanulQualityIssues, setHanulQualityIssues] = useState(() => getLocalHanulQualityIssues());
  const [yuseongQualityIssues, setYuseongQualityIssues] = useState(() => getLocalYuseongQualityIssues());
  const [machiningQualityIssues, setMachiningQualityIssues] = useState(() => getLocalMachiningQualityIssues());
  const [fourMLedgerRecords, setFourMLedgerRecords] = useState(() => getLocalFourMChangePoints());
  const [fourMRevision, setFourMRevision] = useState(0);
  const [smartOvertimeData, setSmartOvertimeData] = useState(() => getLocalSmartOvertimeData());
  const [absenceLogsMap, setAbsenceLogsMap] = useState(() => getLocal4MAbsenceLogsMap());
  const [personnelCardsMap, setPersonnelCardsMap] = useState(() => getLocalPersonnelCardsMap());
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefreshedAt, setLastRefreshedAt] = useState(new Date());

  useEffect(() => {
    setIsLoading(true);

    const unsubIssues = subscribeUrgentIssues((issues) => {
      setUrgentIssues(issues || []);
      setIsLoading(false);
    });

    const unsubExt = subscribeToExtrusionReports((reports) => {
      setExtrusionReports(reports || []);
    });

    const unsubExtQuality = subscribeExtrusionQualityIssues((alerts) => {
      setExtrusionQualityAlerts(alerts || []);
    });

    const unsubHanulQuality = subscribeHanulQualityIssues((alerts) => {
      setHanulQualityIssues(alerts || []);
    });

    const unsubYuseongQuality = subscribeYuseongQualityIssues((alerts) => {
      setYuseongQualityIssues(alerts || []);
    });

    const unsubMachQuality = subscribeMachiningQualityIssues((alerts) => {
      setMachiningQualityIssues(alerts || []);
    });

    const unsubLedger = subscribeFourMChangePoints((ledgerList) => {
      setFourMLedgerRecords(ledgerList || []);
    });

    const unsubSmartOt = subscribeSmartOvertimeData((data) => {
      if (data) {
        setSmartOvertimeData(data);
      }
    });

    const unsubAbsenceLogs = subscribe4MAbsenceLogs((logs) => {
      if (logs) {
        setAbsenceLogsMap(logs);
      }
    });

    const unsubCards = subscribePersonnelCards((cards) => {
      if (cards) {
        setPersonnelCardsMap(cards);
      }
    });

    const handleCardEvent = (e) => {
      if (e.detail?.cardData) {
        const { cardKey, cardData } = e.detail;
        setPersonnelCardsMap((prev) => ({
          ...prev,
          [cardKey]: cardData,
          [`${cleanCompanyName(cardData.company)}_${cardData.name}`]: cardData,
          [`${cardData.company}_${cardData.name}`]: cardData
        }));
      }
    };

    const handleFourMOverrideEvent = () => {
      setFourMLedgerRecords(getLocalFourMChangePoints());
      setFourMRevision((r) => r + 1);
    };

    window.addEventListener("oryuk_personnel_card_updated", handleCardEvent);
    window.addEventListener("fourM_override_updated", handleFourMOverrideEvent);

    return () => {
      if (unsubIssues) unsubIssues();
      if (unsubExt) unsubExt();
      if (unsubExtQuality) unsubExtQuality();
      if (unsubHanulQuality) unsubHanulQuality();
      if (unsubYuseongQuality) unsubYuseongQuality();
      if (unsubMachQuality) unsubMachQuality();
      if (unsubLedger) unsubLedger();
      if (unsubSmartOt) unsubSmartOt();
      if (unsubAbsenceLogs) unsubAbsenceLogs();
      if (unsubCards) unsubCards();
      window.removeEventListener("oryuk_personnel_card_updated", handleCardEvent);
      window.removeEventListener("fourM_override_updated", handleFourMOverrideEvent);
    };
  }, []);

  const handleManualRefresh = () => {
    setLastRefreshedAt(new Date());
    setUrgentIssues(getLocalUrgentIssues());
    setExtrusionQualityAlerts(getLocalExtrusionQualityIssues());
    setHanulQualityIssues(getLocalHanulQualityIssues());
    setYuseongQualityIssues(getLocalYuseongQualityIssues());
    setMachiningQualityIssues(getLocalMachiningQualityIssues());
    setFourMLedgerRecords(getLocalFourMChangePoints());
    setSmartOvertimeData(getLocalSmartOvertimeData());
    setAbsenceLogsMap(getLocal4MAbsenceLogsMap());
    setPersonnelCardsMap(getLocalPersonnelCardsMap());
  };

  const todayStr = useMemo(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  // 취합 및 단일 원천 파이프라인
  const allUnifiedRecords = useMemo(() => {
    const unified = [];

    // 1. [Method/Machine/Material] 관리자 품질경보 및 부적합/결함 변동점 취합
    (urgentIssues || []).forEach((issue) => {
      if (!issue) return;
      const isDel = issue.isDeleted === true || issue.isDeleted === "true" || issue.deleted === true;

      const rawCat = String(issue.category || "").trim();
      if (
        rawCat === "오픈이슈" ||
        rawCat === "open_issue" ||
        rawCat.includes("오픈이슈") ||
        rawCat === "회의일정" ||
        rawCat.includes("회의") ||
        rawCat === "공지사항" ||
        rawCat === "사내공지" ||
        rawCat === "공유사항"
      ) {
        return;
      }

      const catLower = rawCat.toLowerCase();
      const titleLower = String(issue.title || "").toLowerCase();
      const contentLower = String(issue.content || "").toLowerCase();

      const isQualityAlert =
        rawCat === "품질경보" ||
        rawCat === "부적합경보" ||
        rawCat === "품질 경보" ||
        rawCat === "부적합 경보" ||
        rawCat === "품질이슈" ||
        rawCat === "품질 이슈" ||
        catLower === "quality_alert" ||
        catLower === "quality_issue" ||
        catLower === "quality" ||
        rawCat.includes("품질경보") ||
        rawCat.includes("부적합경보") ||
        rawCat.includes("품질") ||
        rawCat.includes("부적합") ||
        issue.type === "QUALITY_ALERT" ||
        issue.type === "품질경보" ||
        titleLower.includes("품질경보") ||
        titleLower.includes("부적합경보") ||
        titleLower.includes("가류조") ||
        titleLower.includes("코팅") ||
        titleLower.includes("클립") ||
        titleLower.includes("불량") ||
        titleLower.includes("이상") ||
        contentLower.includes("가류조") ||
        contentLower.includes("코팅") ||
        contentLower.includes("클립");

      if (!isQualityAlert) return;

      const rawDate =
        issue.date ||
        issue.expireDate ||
        issue.startDate ||
        issue.targetDate ||
        (issue.createdAt ? issue.createdAt : todayStr);
      const dateStr = normalizeDateStr(rawDate, todayStr);

      const isResolved = Boolean(
        issue.isResolved || (issue.actionResult && issue.actionResult.trim()) || isDel
      );

      const displayTitle = issue.title || issue.content || "(부적합경보 발령)";
      const displayContent = issue.content || issue.details || "";

      unified.push({
        id: `urg_${issue.id || issue._docId || Math.random()}`,
        fourM: determineFourMCategory(issue),
        origin: "부적합경보",
        sourceType: "QUALITY_ALERT",
        badgeColor: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200 border-rose-300 dark:border-rose-800",
        plant: issue.plant || "삼랑진공장",
        line: issue.line || issue.process || "품질/제조",
        writer: issue.author ? `${issue.author} ${issue.authorTitle || ""}`.trim() : "품질관리자",
        title: displayTitle,
        date: dateStr,
        time: issue.time || (issue.createdAt && issue.createdAt.includes(":") ? issue.createdAt.slice(11, 16) : ""),
        content: displayContent,
        actionResult: issue.actionResult || "",
        actionAuthor: issue.actionAuthor || "",
        actionAt: issue.actionAt || "",
        images: Array.isArray(issue.images) ? issue.images : [],
        actionImages: Array.isArray(issue.actionImages) ? issue.actionImages : [],
        replies: Array.isArray(issue.replies) ? issue.replies : [],
        isResolved,
        validation: isResolved ? "초·중·종물 한도견본 대조 및 유효성 확인" : "유효성 검증 대기중",
        severity: "HIGH",
        downtimeMinutes: 0,
        scrapKg: 0,
        raw: issue
      });
    });

    // 2. [Machine] 전재율 책임의 설비수리이력만 취합
    (workLogs || []).forEach((log) => {
      if (log.isDeleted) return;

      const isJeonOrMaintenance = log.writer === "전재율" || log.process === "설비보전" || (Array.isArray(log.maintenanceItems) && log.maintenanceItems.length > 0) || (typeof log.maintenanceItems === "string" && log.maintenanceItems.includes("content"));
      if (!isJeonOrMaintenance) return;

      let mItems = [];
      if (Array.isArray(log.maintenanceItems)) {
        mItems = log.maintenanceItems;
      } else if (typeof log.maintenanceItems === "string" && log.maintenanceItems.trim().startsWith("[")) {
        try {
          mItems = JSON.parse(log.maintenanceItems);
        } catch (e) {
          mItems = [];
        }
      }

      let repairSummaryTitle = "";
      if (mItems.length > 0) {
        repairSummaryTitle = mItems
          .map((m) => {
            const eq = m.equipmentName && m.equipmentName !== "직접입력" && m.equipmentName !== "내용직접입력" ? `[${m.equipmentName}] ` : "";
            return `${eq}${m.content || ""}`.trim();
          })
          .filter(Boolean)
          .join(" / ");
      }

      if (!repairSummaryTitle && log.workContent) {
        const cleanLines = log.workContent
          .split("\n")
          .map((l) => l.replace(/^[•\-\*\[\d\]\s>]+/, "").replace(/설비보전내용:\s*/, "").trim())
          .filter(Boolean);
        repairSummaryTitle = cleanLines.slice(0, 2).join(" / ");
      }

      const lineOrEquipment = log.line || (mItems[0] ? `${mItems[0].category}(${mItems[0].equipmentName || ""})` : "설비보전");
      const displayTitle = repairSummaryTitle || `[${lineOrEquipment}] 점검 및 보전수리`;

      const maintDetailList = mItems
        .map((m, idx) => `[${idx + 1}] ${m.category || "설비"} > ${m.equipmentName || "일반"}\n• 설비보전내용: ${m.content || ""}`)
        .join("\n\n");

      const fullContent = [
        maintDetailList ? `[설비보전 및 수리점검 내역]\n${maintDetailList}` : "",
        !maintDetailList && log.workContent ? `[작업 상세]\n${log.workContent}` : "",
        log.issues && log.issues !== "-" && log.issues !== "없음" ? `[특이 이상발생]\n${log.issues}` : ""
      ].filter(Boolean).join("\n\n");

      let parsedImages = [];
      if (Array.isArray(log.images)) parsedImages = log.images;
      else if (Array.isArray(log.photos)) parsedImages = log.photos;
      else if (typeof log.images === "string" && log.images.trim().startsWith("[")) {
        try { parsedImages = JSON.parse(log.images); } catch (e) {}
      } else if (typeof log.photos === "string" && log.photos.trim().startsWith("[")) {
        try { parsedImages = JSON.parse(log.photos); } catch (e) {}
      }

      unified.push({
        id: `wl_maint_${log.id}`,
        fourM: "Machine",
        origin: "설비수리",
        sourceType: "MAINTENANCE",
        badgeColor: "bg-indigo-100 text-indigo-900 dark:bg-indigo-950 dark:text-indigo-200 border-indigo-300 dark:border-indigo-700",
        plant: log.plant || "삼랑진공장",
        line: lineOrEquipment,
        writer: "전재율 책임",
        title: displayTitle,
        date: log.date || todayStr,
        time: log.createdAt ? log.createdAt.slice(11, 16) : "",
        content: fullContent || log.workContent || displayTitle,
        actionResult: log.approvalComment || "수리 및 점검 조치 완료",
        actionAuthor: log.approverName || "전재율",
        actionAt: log.approvalDate || log.date || "",
        images: parsedImages,
        actionImages: [],
        replies: [],
        isResolved: true,
        validation: "설비 점검 및 보전수리 초물 가동 합격",
        severity: "NORMAL",
        downtimeMinutes: 0,
        scrapKg: 0,
        raw: log
      });
    });

    // 3. [Machine & Material] 작업자 작업일보 - TPM 이상발생, 비가동, 불량손실
    (extrusionReports || []).forEach((report) => {
      // 3-1. TPM 이상신고 (Machine)
      const hasTpmText = Boolean(report.tpmIssueText && report.tpmIssueText.trim());
      const hasTpmPhotos = Array.isArray(report.tpmIssuePhotos) && report.tpmIssuePhotos.length > 0;
      const abnormalChecks = (report.tpmChecks || []).filter((c) => c && (c.status === "WARN" || c.status === "NG"));

      if (hasTpmText || hasTpmPhotos || abnormalChecks.length > 0) {
        const checkSummary = abnormalChecks
          .map((c) => `• [${c.status === "NG" ? "불량" : "요관찰"}] ${c.id}: ${c.note || "조치필요"}`)
          .join("\n");

        const fullContent = [
          hasTpmText ? `[현장 이상신고] ${report.tpmIssueText}` : "",
          abnormalChecks.length > 0 ? `[TPM 10대 자주보전 점검]\n${checkSummary}` : ""
        ].filter(Boolean).join("\n\n");

        const tpmDisplayTitle = report.tpmIssueText
          ? `[${report.lineName || report.lineId || "압출"}] ${report.tpmIssueText}`
          : `[TPM 이상] ${report.lineName || report.lineId} 자주보전 이상신고`;

        unified.push({
          id: `ext_tpm_${report.id}`,
          fourM: "Machine",
          origin: "TPM 이상신고",
          sourceType: "EXTRUSION_TPM",
          badgeColor: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 border-amber-300 dark:border-amber-700",
          plant: report.plant || "삼랑진공장",
          line: report.lineName || report.lineId || "압출라인",
          writer: report.worker || "압출 작업자",
          title: tpmDisplayTitle,
          date: report.date || todayStr,
          time: report.createdAt ? report.createdAt.slice(11, 16) : "",
          content: fullContent,
          actionResult: report.notes || "",
          actionAuthor: report.approvedBy || "",
          actionAt: report.approvedAt || "",
          images: report.tpmIssuePhotos || [],
          actionImages: [],
          replies: [],
          isResolved: report.approvalStatus === "승인",
          validation: report.approvalStatus === "승인" ? "TPM 조치 및 자주보전 검증 완료" : "TPM 점검 및 조치 진행중",
          severity: abnormalChecks.some((c) => c.status === "NG") ? "HIGH" : "MEDIUM",
          downtimeMinutes: 0,
          scrapKg: 0,
          raw: report
        });
      }

      // 3-2. 비가동 (Machine) & 불량손실 (Material)
      const dtEvents = Array.isArray(report.downtimeEvents) ? report.downtimeEvents : [];
      dtEvents.forEach((ev, evIdx) => {
        const catClean = String(ev.category || "").replace(/\s+/g, "").toUpperCase();
        if (
          catClean === "압개시" ||
          catClean === "형교환" ||
          catClean === "종료" ||
          catClean === "기술TRY" ||
          catClean.startsWith("압개시") ||
          catClean.startsWith("형교환") ||
          catClean.startsWith("종료") ||
          catClean.startsWith("기술TRY")
        ) {
          return;
        }

        const isDefect = ev.type === "불량" || ["뜯김", "철심", "재압출", "단면형상", "스코치", "이물", "미분산", "발포", "원인불명", "밴딩", "심금절단", "심금노출", "천공", "연고무절단", "길이", "코팅"].includes(ev.category);
        const minutes = Number(ev.minutes) || 0;
        const scrapKg = Number(ev.scrapKg) || 0;

        if (minutes > 0 || scrapKg > 0 || ev.detail) {
          const fourMType = isDefect ? "Material" : "Machine";
          const originName = isDefect ? "불량손실" : "비가동";

          unified.push({
            id: `ext_dt_${report.id}_${ev.id || evIdx}`,
            fourM: fourMType,
            origin: originName,
            sourceType: isDefect ? "EXTRUSION_DEFECT" : "EXTRUSION_DOWNTIME",
            badgeColor: isDefect
              ? "bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-200 border-rose-300 dark:border-rose-700"
              : "bg-orange-100 text-orange-900 dark:bg-orange-950 dark:text-orange-200 border-orange-300 dark:border-orange-700",
            plant: report.plant || "삼랑진공장",
            line: report.lineName || report.lineId || "압출라인",
            writer: report.worker || "압출 작업자",
            title: `[${report.lineName || report.lineId || "압출"}] ${ev.category} ${ev.detail ? `(${ev.detail})` : ""}`,
            date: report.date || todayStr,
            time: ev.startTime ? `${ev.startTime}~${ev.endTime}` : (report.createdAt ? report.createdAt.slice(11, 16) : ""),
            content: ev.detail || `${ev.category} 발생으로 인한 ${originName}`,
            actionResult: report.notes || "현장 라인 즉시 조치 및 정상 가동",
            actionAuthor: report.worker || "작업자",
            actionAt: report.approvedAt || report.date || "",
            images: [],
            actionImages: [],
            replies: [],
            isResolved: true,
            validation: isDefect ? "불량 원인제거 및 유효성 확인" : "라인 정상가동 및 초물검사 완료",
            severity: scrapKg >= 10 || minutes >= 60 ? "HIGH" : "NORMAL",
            downtimeMinutes: minutes,
            scrapKg: scrapKg,
            raw: { report, event: ev }
          });
        }
      });
    });

    // 4. [Method] 압출 전용 품질 이슈 (부적합경보)
    (extrusionQualityAlerts || []).forEach((alert) => {
      if (!alert || alert.id === "ext_qual_demo_1" || alert.id === "ext_qual_demo_2" || String(alert.id).startsWith("demo_")) return;

      const title = alert.title
        ? `[부적합경보] ${alert.title}`
        : `[부적합경보] ${alert.defectType || "압출 품질이상"}`;
      const content = alert.content || alert.details || alert.description || alert.defectType || "";
      const dateStr = normalizeDateStr(alert.date || alert.createdAt, todayStr);
      const isResolved = Boolean(alert.status === "RESOLVED" || alert.status === "CLOSED" || alert.isResolved || (alert.actionResult && alert.actionResult.trim().length > 0));

      const causeImages = Array.isArray(alert.causeImages)
        ? alert.causeImages
        : Array.isArray(alert.images)
        ? alert.images
        : [];
      const actionImages = Array.isArray(alert.actionImages) ? alert.actionImages : [];

      unified.push({
        id: `ext_q_${alert.id}`,
        fourM: determineFourMCategory(alert),
        origin: "부적합경보",
        sourceType: "QUALITY_ALERT",
        badgeColor: "bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-200 border-rose-300 dark:border-rose-700",
        plant: alert.plant || "삼랑진공장",
        line: alert.line || alert.lineId || "압출라인",
        writer: alert.author ? `${alert.author} ${alert.authorTitle || ""}`.trim() : "설유철 책임",
        title: title,
        date: dateStr,
        time: alert.time || (alert.createdAt && alert.createdAt.includes(":") ? alert.createdAt.slice(11, 16) : ""),
        content: content,
        actionResult: alert.actionResult || alert.actionNotes || alert.actionGuide || "",
        actionAuthor: alert.actionAuthor || alert.author || "",
        actionAt: alert.updatedAt || alert.actionAt || "",
        images: causeImages,
        actionImages: actionImages,
        replies: Array.isArray(alert.replies) ? alert.replies : [],
        isResolved: isResolved,
        validation: isResolved ? "압출 부적합경보 조치 및 유효성 확인 완료" : "유효성 검증 대기중",
        severity: "HIGH",
        downtimeMinutes: 0,
        scrapKg: 0,
        raw: alert
      });
    });

    // 4-B. 한울 가공/협력업체 부적합경보
    (hanulQualityIssues || []).forEach((alert) => {
      if (!alert || alert.isDeleted === true || alert.status === "DELETED") return;

      const title = alert.title
        ? `[한울 부적합] ${alert.title}`
        : `[한울 부적합] ${alert.defectType || "한울 품질이상"}`;
      const content = alert.content || alert.defectType || "";
      const dateStr = normalizeDateStr(alert.targetDate || alert.date || alert.createdAt, todayStr);
      const isResolved = Boolean(alert.status === "RESOLVED" || alert.status === "CLOSED" || alert.isResolved || (alert.actionResult && alert.actionResult.trim().length > 0));

      const causeImages = Array.isArray(alert.causeImages)
        ? alert.causeImages
        : Array.isArray(alert.images)
        ? alert.images
        : [];
      const actionImages = Array.isArray(alert.actionImages) ? alert.actionImages : [];

      unified.push({
        id: `hanul_q_${alert.id}`,
        fourM: determineFourMCategory(alert),
        origin: "부적합경보",
        sourceType: "QUALITY_ALERT",
        badgeColor: "bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-200 border-rose-300 dark:border-rose-700",
        plant: alert.plant || "한림공장",
        line: alert.line || "가공/협력업체(한울)",
        writer: alert.author ? `${alert.author} ${alert.authorTitle || ""}`.trim() : "황수현 대표",
        title: title,
        date: dateStr,
        time: alert.time || (alert.createdAt && alert.createdAt.includes(":") ? alert.createdAt.slice(11, 16) : ""),
        content: content,
        actionResult: alert.actionResult || "",
        actionAuthor: alert.actionAuthor || alert.author || "",
        actionAt: alert.actionAt || alert.updatedAt || "",
        images: causeImages,
        actionImages: actionImages,
        replies: Array.isArray(alert.replies) ? alert.replies : [],
        isResolved: isResolved,
        validation: isResolved ? "한울 부적합경보 조치 및 유효성 확인 완료" : "유효성 검증 대기중",
        severity: alert.severity || "HIGH",
        downtimeMinutes: 0,
        scrapKg: 0,
        raw: alert
      });
    });

    // 4-C. 유성 가공/협력업체 부적합경보
    (yuseongQualityIssues || []).forEach((alert) => {
      if (!alert || alert.isDeleted === true || alert.status === "DELETED") return;

      const title = alert.title
        ? `[유성 부적합] ${alert.title}`
        : `[유성 부적합] ${alert.defectType || "유성 품질이상"}`;
      const content = alert.content || alert.description || alert.defectType || "";
      const dateStr = normalizeDateStr(alert.date || alert.createdAt, todayStr);
      const isResolved = Boolean(alert.status === "RESOLVED" || alert.status === "CLOSED" || alert.isResolved || (alert.actionResult && alert.actionResult.trim().length > 0));

      const causeImages = Array.isArray(alert.causeImages)
        ? alert.causeImages
        : Array.isArray(alert.images)
        ? alert.images
        : [];
      const actionImages = Array.isArray(alert.actionImages) ? alert.actionImages : [];

      unified.push({
        id: `ys_q_${alert.id}`,
        fourM: determineFourMCategory(alert),
        origin: "부적합경보",
        sourceType: "QUALITY_ALERT",
        badgeColor: "bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-200 border-rose-300 dark:border-rose-700",
        plant: alert.plant || "삼랑진공장",
        line: alert.project || alert.line || "가공/협력업체(유성)",
        writer: alert.author ? `${alert.author} ${alert.authorTitle || ""}`.trim() : "이성기 대표",
        title: title,
        date: dateStr,
        time: alert.time || (alert.createdAt && alert.createdAt.includes(":") ? alert.createdAt.slice(11, 16) : ""),
        content: content,
        actionResult: alert.actionResult || alert.actionNotes || "",
        actionAuthor: alert.actionAuthor || alert.author || "",
        actionAt: alert.actionAt || alert.updatedAt || "",
        images: causeImages,
        actionImages: actionImages,
        replies: Array.isArray(alert.replies) ? alert.replies : [],
        isResolved: isResolved,
        validation: isResolved ? "유성 부적합경보 조치 및 유효성 확인 완료" : "유효성 검증 대기중",
        severity: alert.severity || "HIGH",
        downtimeMinutes: 0,
        scrapKg: 0,
        raw: alert
      });
    });

    // 4-D. 가공동 부적합경보
    (machiningQualityIssues || []).forEach((alert) => {
      if (!alert || alert.isDeleted === true || alert.status === "DELETED") return;

      const title = alert.title
        ? `[가공 부적합] ${alert.title}`
        : `[가공 부적합] ${alert.defectType || "가공 품질이상"}`;
      const content = alert.content || alert.defectType || "";
      const dateStr = normalizeDateStr(alert.date || alert.createdAt, todayStr);
      const isResolved = alert.status === "RESOLVED" || (alert.status !== "ACTIVE" && Boolean(alert.actionResult && alert.actionResult.trim()));

      const causeImages = Array.isArray(alert.causeImages)
        ? alert.causeImages
        : Array.isArray(alert.images)
        ? alert.images
        : [];
      const actionImages = Array.isArray(alert.actionImages) ? alert.actionImages : [];

      unified.push({
        id: `mach_q_${alert.id}`,
        fourM: determineFourMCategory(alert),
        origin: "부적합경보",
        sourceType: "QUALITY_ALERT",
        badgeColor: "bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-200 border-rose-300 dark:border-rose-700",
        plant: alert.plant || "삼랑진공장",
        line: alert.line || "가공동",
        writer: alert.author ? `${alert.author} ${alert.authorTitle || ""}`.trim() : "가공동",
        title: title,
        date: dateStr,
        time: alert.time || (alert.createdAt && alert.createdAt.includes(":") ? alert.createdAt.slice(11, 16) : ""),
        content: content,
        actionResult: alert.actionResult || "",
        actionAuthor: alert.actionAuthor || alert.author || "",
        actionAt: alert.actionAt || alert.updatedAt || "",
        images: causeImages,
        actionImages: actionImages,
        replies: Array.isArray(alert.replies) ? alert.replies : [],
        isResolved: isResolved,
        validation: isResolved ? "가공 부적합경보 조치 및 유효성 확인 완료" : "유효성 검증 대기중",
        severity: alert.severity || "HIGH",
        downtimeMinutes: 0,
        scrapKg: 0,
        raw: alert
      });
    });

    // 5. [Man] 5개 업체 결근 및 4M 인원 대체투입 취합 (오륙, 조영, 유성, 한울, 부림텍)
    const registeredAbsenceKeys = new Set();

    // 5-1. 4M 결근 및 대체투입 상세 로그 (Absence4MModal 등록분)
    const absenceList = Object.values(absenceLogsMap || {});
    absenceList.forEach((log) => {
      if (!log || !log.date) return;
      const compClean = cleanCompanyName(log.company || "오륙");
      const workerName = String(log.absentWorker?.name || log.name || "").trim();
      const key = `${compClean}_${workerName}_${log.date}`;
      registeredAbsenceKeys.add(key);

      const cardKey = `${compClean}_${workerName}`;
      const absentCard = personnelCardsMap[cardKey] || personnelCardsMap[`${log.company}_${workerName}`] || log.absentWorker || {};
      const absentDept = absentCard.dept || log.absentWorker?.dept || "생산팀";
      const absentPos = absentCard.position || log.absentWorker?.position || "사원";
      const absentSkill = absentCard.skillLevel || log.absentWorker?.skillLevel || 3;
      const absentMainProc = absentCard.mainProcess || log.process || log.line || "압출";
      const absentReason = log.absentWorker?.reason || log.reason || "휴가";
      const absentPhoto = absentCard.photoUrl || log.absentWorker?.photoUrl || "";

      const isSub = Boolean(log.substituteWorker?.name && log.substituteWorker?.name !== "라인비가동" && !log.substituteWorker?.isLineStopped);
      const isLineStopped = log.substituteWorker?.name === "라인비가동" || log.substituteWorker?.isLineStopped;

      let subName = isLineStopped ? "라인비가동" : (log.substituteWorker?.name || "");
      let subPos = "사원";
      let subDept = "생산팀";
      let subPhoto = "";
      if (isSub) {
        const subCardKey = `${compClean}_${log.substituteWorker.name}`;
        const subCard = personnelCardsMap[subCardKey] || personnelCardsMap[`${log.company}_${log.substituteWorker.name}`] || log.substituteWorker || {};
        subPos = subCard.position || log.substituteWorker.position || "사원";
        subDept = subCard.dept || log.substituteWorker.dept || "생산팀";
        subPhoto = subCard.photoUrl || log.substituteWorker.photoUrl || "";
      }

      const plant = log.plant || (compClean === "오륙" || compClean === "유성" ? "삼랑진공장" : "한림공장");
      const line = `${absentMainProc} 공정`;

      const title = isLineStopped
        ? `[${compClean}] ${workerName}(${absentPos}, ${absentDept}) 결근 ➔ [라인비가동]`
        : `[${compClean}] ${workerName}(${absentPos}, ${absentDept}) 결근 ➔ ${isSub ? `${subName}(${subPos}) 대체투입` : "대체 미투입 (라인조정)"}`;

      const content = [
        `[4M Man 인원변동 결근내역]`,
        `• 소속업체: ${compClean}`,
        `• 소속부서: ${absentDept}`,
        `• 결근근로자: ${workerName} (${absentPos}, Lv.${absentSkill})`,
        `• 대체작업자: ${isLineStopped ? "라인비가동 (대체 미투입)" : (isSub ? `${subName} (${subPos}, ${subDept})` : "미배치 (라인 가동 조정)")}`,
        `• 결근사유: ${absentReason}`,
        `• 담당공정: ${line}`,
        log.remarks || log.notes ? `• 특기사항: ${log.remarks || log.notes}` : ""
      ].filter(Boolean).join("\n");

      const actionResult = isLineStopped
        ? "라인 비가동 (공정 정지/품질영향 없음)"
        : (isSub
            ? `대체작업자 ${subName}(${subPos}) 투입 완료 (${log.checkpoints?.firstPieceCheck ? "초물검사 완료" : "초물검사 미실시"} / ${log.checkpoints?.workInstructionTold ? "특별교육 완료" : "특별교육 미실시"})`
            : "라인 작업 인원 조정 및 비가동 조치");

      const validation = isLineStopped
        ? "라인 비가동 확인 (품질영향 없음)"
        : (isSub
            ? (log.checkpoints?.firstPieceCheck ? "초물 한도검사 & 특별교육 유효성 확인 완료" : "초물검사 및 특별교육 실시 필수")
            : "대체 투입 시 초물검사 및 특별교육 필수");

      const images = [absentPhoto, subPhoto].filter(Boolean);
      if (Array.isArray(log.photos)) {
        log.photos.forEach((p) => { if (p && !images.includes(p)) images.push(p); });
      }

      unified.push({
        id: `man_log_${log.id || key}`,
        fourM: "Man",
        origin: isSub ? "4M 대체투입" : "결근발생",
        sourceType: "MAN_ABSENCE_LOG",
        badgeColor: "bg-purple-100 text-purple-900 dark:bg-purple-950 dark:text-purple-200 border-purple-300 dark:border-purple-700",
        plant,
        line,
        writer: log.supervisor || log.writer || `${compClean} 관리자`,
        title,
        date: log.date,
        time: log.time || "",
        content,
        actionResult,
        actionAuthor: log.supervisor || "관리자",
        actionAt: log.date || "",
        images: images,
        actionImages: [],
        replies: [],
        isResolved: isSub || isLineStopped,
        validation,
        severity: log.riskLevel === "HIGH" ? "HIGH" : "NORMAL",
        downtimeMinutes: 0,
        scrapKg: 0,
        raw: log
      });
    });

    // 5-2. 5개사 근태/연장근무 매트릭스 결근 발생분 (스마트 연장근무 출근부 연동)
    const ym = smartOvertimeData?.yearMonth || todayStr.slice(0, 7);
    const matrix = smartOvertimeData?.attendanceMatrix || [];

    const weekendDaysSet = new Set();
    for (let d = 1; d <= 31; d++) {
      const dStr = String(d).padStart(2, "0");
      if (isWeekendByDate(`${ym}-${dStr}`)) {
        weekendDaysSet.add(d);
      }
    }

    matrix.forEach((w) => {
      if (!w || !w.name) return;
      const rawComp = w.company || "오륙";
      const compClean = cleanCompanyName(rawComp);
      const workerName = String(w.name).trim();

      const cardKey = `${compClean}_${workerName}`;
      const card = personnelCardsMap[cardKey] || personnelCardsMap[`${rawComp}_${workerName}`] || w.personnelCard || {};
      const resolvedComp = card?.company ? cleanCompanyName(card.company) : compClean;
      const resolvedDept = card?.dept || w.dept || "생산팀";
      const resolvedPos = card?.position || w.position || "사원";
      const resolvedSkill = card?.skillLevel || 3;
      const resolvedMainProc = card?.mainProcess || w.line || "압출";
      const photoUrl = card?.photoUrl || w.photoUrl || "";
      const plant = (resolvedComp === "오륙" || resolvedComp === "유성") ? "삼랑진공장" : "한림공장";
      const line = `${resolvedMainProc} 공정`;
      const dailyObj = w.daily || w;

      for (let d = 1; d <= 31; d++) {
        if (weekendDaysSet.has(d)) continue;

        const val = dailyObj[d] !== undefined ? dailyObj[d] : dailyObj[String(d)];
        if (!val) continue;
        const strVal = typeof val === "string" ? val.trim() : String(val).trim();
        if (strVal === "결근" || strVal === "무단결근" || strVal === "휴가" || strVal === "연차" || strVal === "반차" || strVal.includes("결근")) {
          const dStr = String(d).padStart(2, "0");
          const dateStr = `${ym}-${dStr}`;
          const key = `${resolvedComp}_${workerName}_${dateStr}`;
          if (registeredAbsenceKeys.has(key)) continue;
          registeredAbsenceKeys.add(key);

          const title = `[${resolvedComp}] ${workerName}(${resolvedPos}, ${resolvedDept}) 결근 발생 (${line})`;
          const content = `[4M Man 인원변동 결근내역]\n• 소속업체: ${resolvedComp}\n• 소속부서: ${resolvedDept}\n• 결근근로자: ${workerName} (${resolvedPos}, Lv.${resolvedSkill})\n• 담당공정: ${line}\n• 발생일자: ${dateStr}\n• 근태구분: ${strVal}\n• 조치내용: 4M Man 작업자 결근에 따른 대체인원 투입 점검, 특별교육 및 공정 초물검사 실시`;

          unified.push({
            id: `man_matrix_${resolvedComp}_${workerName}_${dateStr}`,
            fourM: "Man",
            origin: "결근발생",
            sourceType: "MAN_ABSENCE_MATRIX",
            badgeColor: "bg-purple-100 text-purple-900 dark:bg-purple-950 dark:text-purple-200 border-purple-300 dark:border-purple-700",
            plant,
            line,
            writer: `${workerName} (${resolvedComp})`,
            title,
            date: dateStr,
            time: "",
            content,
            actionResult: "대체인원 투입 점검, 특별교육 및 현장 공정 모니터링 진행",
            actionAuthor: "관리자",
            actionAt: dateStr,
            images: photoUrl ? [photoUrl] : [],
            actionImages: [],
            replies: [],
            isResolved: false,
            validation: "대체 투입 시 초물검사 및 특별교육 필수",
            severity: "NORMAL",
            downtimeMinutes: 0,
            scrapKg: 0,
            raw: { ...w, personnelCard: card }
          });
        }
      }
    });

    // 6. [Canonical 4M Pipeline] 공식 4M 변동점 관리대장(four_m_change_points) 및 전 소스 단일 원천 통합
    const rawLedgerItems = (fourMLedgerRecords || []).filter((rec) => {
      if (!rec) return false;
      const cat = String(rec.category || rec.sourceCategory || rec.raw?.category || "").trim();
      const origin = String(rec.origin || "").trim();
      return !(
        cat === "오픈이슈" ||
        cat === "open_issue" ||
        cat.includes("오픈이슈") ||
        origin === "오픈이슈" ||
        cat === "회의일정" ||
        cat.includes("회의") ||
        cat === "공지사항" ||
        cat === "사내공지"
      );
    }).map((rec) => {
      const recId = String(rec.id || "");
      const origId = String(rec.originalId || "");
      const rawId = String(rec.rawId || "");
      return {
        id: recId.startsWith("ledger_") ? recId : `ledger_${recId}`,
        originalId: origId || recId,
        rawId: rawId,
        fourM: rec.fourM || determineFourMCategory(rec),
        origin: rec.origin || "변동점대장",
        sourceType: rec.sourceType || "OFFICIAL_LEDGER",
        badgeColor: rec.badgeColor || getFourMBadgeColor(rec.fourM || "Method"),
        plant: rec.plant || "삼랑진공장",
        line: rec.line || "생산/품질",
        writer: rec.writer || rec.registeredBy || "관리자",
        title: rec.title || "(변동점)",
        date: rec.date || todayStr,
        time: rec.time || "",
        content: rec.content || "",
        actionResult: rec.actionResult || "",
        actionAuthor: rec.actionAuthor || "",
        actionAt: rec.actionAt || "",
        images: Array.isArray(rec.images) ? rec.images : [],
        actionImages: Array.isArray(rec.actionImages) ? rec.actionImages : [],
        replies: Array.isArray(rec.replies) ? rec.replies : [],
        isResolved: Boolean(rec.isResolved),
        validation: rec.validation || (rec.isResolved ? "조치 및 유효성 확인 완료" : "유효성 검증 대기중"),
        severity: rec.severity || "NORMAL",
        downtimeMinutes: Number(rec.downtimeMinutes) || 0,
        scrapKg: Number(rec.scrapKg) || 0,
        raw: rec,
        isOfficialLedger: Boolean(rec.isOfficialLedger)
      };
    });

    // Canonical Single Source of Truth Pipeline
    const canonicalMap = new Map();
    const titleIndexMap = new Map();

    [...unified, ...rawLedgerItems].forEach((item) => {
      if (!item) return;
      const coreId = getCore4MId(item);
      const titleKey = getNormalizedTitleKey(item);

      let matchedKey = null;
      if (coreId && coreId.length >= 8 && canonicalMap.has(`core_${coreId}`)) {
        matchedKey = `core_${coreId}`;
      } else if (titleKey && titleIndexMap.has(titleKey)) {
        matchedKey = titleIndexMap.get(titleKey);
      }

      if (matchedKey && canonicalMap.has(matchedKey)) {
        const existing = canonicalMap.get(matchedKey);
        canonicalMap.set(matchedKey, mergeUnified4MRecords(existing, item));
      } else {
        const primaryKey = (coreId && coreId.length >= 8) ? `core_${coreId}` : `item_${item.id || Math.random()}`;
        canonicalMap.set(primaryKey, item);
        if (titleKey) {
          titleIndexMap.set(titleKey, primaryKey);
        }
      }
    });

    const dedupedUnified = Array.from(canonicalMap.values());

    const ledgerSet = new Set(
      (fourMLedgerRecords || []).flatMap((r) => [
        r.originalId,
        r.id,
        r.rawId,
        `ledger_${r.originalId}`,
        `ledger_${r.id}`,
        getCore4MId(r)
      ].filter(Boolean))
    );

    return dedupedUnified
      .map((item) => {
        const coreId = getCore4MId(item);
        const isReg =
          ledgerSet.has(item.id) ||
          ledgerSet.has(`ledger_${item.id}`) ||
          (coreId && ledgerSet.has(coreId)) ||
          Boolean(item.raw?.id && ledgerSet.has(item.raw.id)) ||
          Boolean(item.isOfficialLedger && (item.classifiedBy === "이창엽" || item.registeredBy === "이창엽" || item.isQualityClassified));

        return {
          ...item,
          isRegisteredInLedger: isReg
        };
      })
      .sort((a, b) => {
        if (b.date !== a.date) return (b.date || "").localeCompare(a.date || "");
        if (b.time !== a.time) return (b.time || "").localeCompare(a.time || "");
        return String(b.id || "").localeCompare(String(a.id || ""));
      });
  }, [
    urgentIssues,
    extrusionReports,
    workLogs,
    extrusionQualityAlerts,
    hanulQualityIssues,
    yuseongQualityIssues,
    machiningQualityIssues,
    fourMLedgerRecords,
    smartOvertimeData,
    absenceLogsMap,
    todayStr,
    personnelCardsMap,
    fourMRevision
  ]);

  return {
    allUnifiedRecords,
    fourMLedgerRecords,
    setFourMLedgerRecords,
    fourMRevision,
    setFourMRevision,
    isLoading,
    lastRefreshedAt,
    todayStr,
    handleManualRefresh
  };
};
