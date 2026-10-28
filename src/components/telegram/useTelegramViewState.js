import { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { useMonth } from "../../context/MonthContext";
import {
  getLocalTelegramConfig,
  saveTelegramConfig,
  subscribeTelegramConfig,
  testTelegramConnection,
  sendTelegramMessage,
  getLocalTelegramTemplates,
  saveTelegramCustomTemplate,
  deleteTelegramCustomTemplate,
  subscribeTelegramCustomTemplates
} from "../../services/telegramService";
import {
  buildDailyMorningBriefingText
} from "../../services/telegramAggregator";
import {
  getKSTDateString,
  getKSTFormattedString
} from "../../utils/dateUtils";
import {
  getLocalCommonSchedules,
  subscribeCommonSchedules,
  formatCommonSchedulesForTelegram,
  injectCommonSchedulesIntoPnLTemplate
} from "../../services/commonScheduleService";
import {
  calculatePrevDateInfo,
  computeMorningAttendance,
  computeMorningApprovalDocs,
  computeMorningApprovalDocLines,
  computeMorningWorkLogs,
  computeMorningOpenIssues,
  computeMorningOpenIssueLines,
  generateDefaultUnifiedMessage,
  generateDefaultManagementMessage
} from "./telegramViewDataHelper";

export const useTelegramViewState = () => {
  const { isAdmin, currentProfile } = useAuth();
  const { selectedMonth, currentMonthData, allMonthlyData } = useMonth();

  // 🌟 Main 3 Tabs: "unified" (오륙통합방) | "management" (경영총괄) | "config" (설정)
  const [activeMainTab, setActiveMainTab] = useState("unified");

  // Sub-tab for 오륙통합방: "briefing" | "quality" | "notice_meeting" | "approval"
  const [unifiedMsgType, setUnifiedMsgType] = useState("briefing");
  const [qualityStage, setQualityStage] = useState("1"); // "1": 신규발령, "2": 조치완료, "3": 종결삭제
  const [noticeMeetingType, setNoticeMeetingType] = useState("notice"); // "notice" | "meeting" | "meeting_result" | "meeting_reply"
  const [approvalType, setApprovalType] = useState("draft"); // "draft" | "approve" | "reject" | "worklog"

  // Sub-tab for 경영총괄: "pnl" | "today_schedule"
  const [managementMsgType, setManagementMsgType] = useState("pnl");

  // Preview Mode: "edit" (직접 텍스트 편집) vs "preview" (렌더링 미리보기)
  const [unifiedViewMode, setUnifiedViewMode] = useState("edit");
  const [managementViewMode, setManagementViewMode] = useState("edit");

  // Saved Custom Templates State
  const [savedTemplates, setSavedTemplates] = useState(() => getLocalTelegramTemplates());
  const [templateSavedToast, setTemplateSavedToast] = useState(false);
  const [templateResetToast, setTemplateResetToast] = useState(false);
  const [loadingLiveBriefing, setLoadingLiveBriefing] = useState(false);

  // Editable Message Texts (Direct In-Place Editing)
  const [editableUnifiedText, setEditableUnifiedText] = useState("");
  const [editableManagementText, setEditableManagementText] = useState("");

  // Telegram Config State
  const [telegramConfig, setTelegramConfig] = useState(() => getLocalTelegramConfig());
  const [testingTelegram, setTestingTelegram] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [savedConfigToast, setSavedConfigToast] = useState(false);

  // Common Schedules
  const [commonSchedules, setCommonSchedules] = useState(() => getLocalCommonSchedules());

  useEffect(() => {
    const unsub = subscribeCommonSchedules((scheds) => {
      setCommonSchedules(scheds);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = subscribeTelegramConfig((cfg) => {
      setTelegramConfig(cfg);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = subscribeTelegramCustomTemplates((templates) => {
      setSavedTemplates(templates || {});
    });
    return () => unsub();
  }, []);

  const todayDateStr = getKSTDateString();
  const dateFormatted = `${getKSTFormattedString(todayDateStr).split(" ")[0]} 07:40`;
  const dayName = new Date().toLocaleDateString("ko-KR", { weekday: "short" });

  // Current Template Key for Unified Room
  const currentUnifiedTemplateKey = useMemo(() => {
    if (unifiedMsgType === "briefing") return "unified_briefing";
    if (unifiedMsgType === "quality") return `unified_quality_${qualityStage}`;
    if (unifiedMsgType === "notice_meeting") return `unified_${noticeMeetingType}`;
    return `unified_approval_${approvalType}`;
  }, [unifiedMsgType, qualityStage, noticeMeetingType, approvalType]);

  const currentManagementTemplateKey = useMemo(() => {
    return managementMsgType === "today_schedule" ? "management_today_schedule" : "management_pnl";
  }, [managementMsgType]);

  const isUnifiedTemplateCustom = Boolean(savedTemplates[currentUnifiedTemplateKey]?.text);
  const isManagementTemplateCustom = Boolean(savedTemplates[currentManagementTemplateKey]?.text);

  // 1. 오륙통합방 실시간 데이터
  const [sendingUnified, setSendingUnified] = useState(false);
  const [unifiedToast, setUnifiedToast] = useState(false);
  const [copyToast, setCopyToast] = useState(false);

  const prevDateInfo = useMemo(() => calculatePrevDateInfo(todayDateStr), [todayDateStr]);

  const { samStr: morningAttendanceSamStr, hanStr: morningAttendanceHanStr } = useMemo(
    () => computeMorningAttendance(prevDateInfo),
    [prevDateInfo]
  );

  const morningApprovalDocs = useMemo(() => computeMorningApprovalDocs(todayDateStr), [todayDateStr]);

  const morningApprovalDocLines = useMemo(
    () => computeMorningApprovalDocLines(morningApprovalDocs),
    [morningApprovalDocs]
  );

  const { morningWorkLogLines } = useMemo(() => computeMorningWorkLogs(prevDateInfo), [prevDateInfo]);

  const morningOpenIssues = useMemo(() => computeMorningOpenIssues(), []);

  const morningOpenIssueLines = useMemo(
    () => computeMorningOpenIssueLines(morningOpenIssues),
    [morningOpenIssues]
  );

  const getGeneratedUnifiedText = useCallback(() =>
    generateDefaultUnifiedMessage({
      unifiedMsgType,
      qualityStage,
      noticeMeetingType,
      approvalType,
      todayDateStr,
      currentProfile,
      morningAttendanceSamStr,
      morningAttendanceHanStr,
      morningApprovalDocs,
      morningWorkLogLines,
      morningOpenIssues,
      morningOpenIssueLines,
      prevDateInfo
    }), [
      unifiedMsgType,
      qualityStage,
      noticeMeetingType,
      approvalType,
      todayDateStr,
      currentProfile,
      morningAttendanceSamStr,
      morningAttendanceHanStr,
      morningApprovalDocs,
      morningWorkLogLines,
      morningOpenIssues,
      morningOpenIssueLines,
      prevDateInfo
    ]);

  // Load custom template if exists, else load default text from Aggregator
  useEffect(() => {
    let saved = savedTemplates[currentUnifiedTemplateKey]?.text;
    if (unifiedMsgType === "briefing" && saved && (saved.includes("일일 모닝 브리핑") || saved.includes("전일 근태실적") || saved.includes("특근보고서 등 (대기:"))) {
      deleteTelegramCustomTemplate(currentUnifiedTemplateKey);
      setSavedTemplates((prev) => {
        const next = { ...prev };
        delete next[currentUnifiedTemplateKey];
        return next;
      });
      saved = null;
    }

    if (saved) {
      let sanitized = saved;
      if (sanitized.includes("권태형") || sanitized.includes("대표이사") || sanitized.includes("대표님")) {
        sanitized = sanitized
          .split("\n")
          .filter((line) => !line.includes("권태형") && !line.includes("대표이사") && !line.includes("대표님") && !line.includes("대표"))
          .join("\n");
      }
      setEditableUnifiedText(sanitized);
    } else {
      if (unifiedMsgType === "briefing") {
        setLoadingLiveBriefing(true);
        buildDailyMorningBriefingText(null, null)
          .then((liveText) => {
            setEditableUnifiedText(liveText);
          })
          .catch((err) => {
            console.error("Live briefing aggregator error:", err);
            setEditableUnifiedText(getGeneratedUnifiedText());
          })
          .finally(() => {
            setLoadingLiveBriefing(false);
          });
      } else {
        setEditableUnifiedText(getGeneratedUnifiedText());
      }
    }
  }, [currentUnifiedTemplateKey, savedTemplates, unifiedMsgType, morningAttendanceSamStr, morningAttendanceHanStr, morningApprovalDocLines, morningWorkLogLines, morningOpenIssueLines, getGeneratedUnifiedText]);

  // 2. 경영총괄 실시간 데이터
  const [selectedPnLChannel, setSelectedPnLChannel] = useState("-1003939516875"); // Default: 경영방
  const [sendingDailyPnL, setSendingDailyPnL] = useState(false);
  const [dailyPnLToast, setDailyPnLToast] = useState(false);

  const todayCommonSchedules = useMemo(() => {
    if (!commonSchedules || !Array.isArray(commonSchedules)) return [];
    return commonSchedules.filter((s) => {
      const regDate = s.createdAt ? s.createdAt.slice(0, 10) : (s.startDate || s.date);
      const startDate = s.startDate || s.date;
      const endDate = s.endDate || startDate;
      const effectiveStart = regDate <= startDate ? regDate : startDate;
      return Boolean(effectiveStart && endDate && effectiveStart <= todayDateStr && todayDateStr <= endDate);
    });
  }, [commonSchedules, todayDateStr]);

  const totalSales = currentMonthData?.salesSummary?.totalSales || currentMonthData?.totalSales || 0;
  const totalPurchases = currentMonthData?.purchaseSummary?.ledgerBenchmark || currentMonthData?.jajaeSummary?.totalAmount || currentMonthData?.purchaseSummary?.totalPurchase || currentMonthData?.totalExpenses || 0;

  const prevMonthKey = useMemo(() => {
    const safeMonth = selectedMonth || "2026-09";
    const [y, m] = safeMonth.split("-").map(Number);
    const prevD = new Date(y || 2026, (m || 9) - 2, 1);
    const prevY = prevD.getFullYear();
    const prevM = String(prevD.getMonth() + 1).padStart(2, "0");
    return `${prevY}-${prevM}`;
  }, [selectedMonth]);

  const prevMonthData = useMemo(() => {
    return allMonthlyData?.[prevMonthKey] || null;
  }, [allMonthlyData, prevMonthKey]);

  const prevSales = prevMonthData?.salesSummary?.totalSales || 2090811613;
  const prevPurchases = prevMonthData?.purchaseSummary?.ledgerBenchmark || prevMonthData?.jajaeSummary?.totalAmount || prevMonthData?.purchaseSummary?.totalPurchase || 1342582214.5;

  const salesAchievementPct = prevSales > 0 ? ((totalSales / prevSales) * 100).toFixed(1) : "46.2";
  const purchaseAchievementPct = prevPurchases > 0 ? ((totalPurchases / prevPurchases) * 100).toFixed(1) : "72.8";
  const costRatio = totalSales > 0 ? ((totalPurchases / totalSales) * 100).toFixed(1) : "101.3";

  const uncompletedCommonSchedules = useMemo(() => {
    if (!commonSchedules || !Array.isArray(commonSchedules)) return [];
    return commonSchedules.filter((s) => !s.isCompleted);
  }, [commonSchedules]);

  const commonSchedsText = useMemo(() => {
    return formatCommonSchedulesForTelegram(uncompletedCommonSchedules, todayDateStr);
  }, [uncompletedCommonSchedules, todayDateStr]);

  const asOfUploadBadge = currentMonthData?.latestFile?.uploadedAtFormatted
    ? ` (${currentMonthData.latestFile.uploadedAtFormatted} 업로드 기준 누적)`
    : "";

  const getGeneratedManagementText = useCallback(() =>
    generateDefaultManagementMessage({
      managementMsgType,
      todayDateStr,
      todayCommonSchedules,
      totalSales,
      totalPurchases,
      costRatio,
      salesAchievementPct,
      purchaseAchievementPct,
      prevMonthKey,
      commonSchedsText,
      asOfUploadBadge,
      dateFormatted
    }), [
      managementMsgType,
      todayDateStr,
      todayCommonSchedules,
      totalSales,
      totalPurchases,
      costRatio,
      salesAchievementPct,
      purchaseAchievementPct,
      prevMonthKey,
      commonSchedsText,
      asOfUploadBadge,
      dateFormatted
    ]);

  // Load custom management template if exists, else load default text
  useEffect(() => {
    const saved = savedTemplates[currentManagementTemplateKey]?.text;
    if (saved) {
      if (managementMsgType === "pnl") {
        let sanitized = saved
          .replace(/\[오륙\s*(경영정보공유|경영정보|경영진\/임원|경영진)\]/g, "[오륙]")
          .replace(/일일\s*아침\s*손익결산\s*브리핑/g, "매출 & 일정공유")
          .replace(/일일아침손익결산/g, "매출 & 일정공유")
          .replace(/손익결산\s*브리핑/g, "매출 & 일정공유")
          .replace(/\[3\]\s*태형이랑\s*&\s*미영이랑/g, "[3] 사내 공통일정")
          .replace(/태형이랑\s*&\s*미영이랑/g, "사내 공통일정")
          .replace(/경영정보공유/g, "")
          .replace(/경영정보/g, "");
        const livePnL = {
          salesAmount: Math.round(totalSales),
          purchaseAmount: Math.round(totalPurchases),
          costRatio,
          salesAchievementRate: `${salesAchievementPct}% (${Number(salesAchievementPct) >= 100 ? `▲ +${(Number(salesAchievementPct) - 100).toFixed(1)}% 초과` : `▼ ${(Number(salesAchievementPct) - 100).toFixed(1)}%`})`,
          purchaseAchievementRate: `${purchaseAchievementPct}% (${Number(purchaseAchievementPct) <= 100 ? `▼ ${(100 - Number(purchaseAchievementPct)).toFixed(1)}% 절감` : `▲ +${(Number(purchaseAchievementPct) - 100).toFixed(1)}% 증가`})`
        };
        sanitized = injectCommonSchedulesIntoPnLTemplate(sanitized, commonSchedsText, dateFormatted, livePnL);
        setEditableManagementText(sanitized);
      } else {
        setEditableManagementText(saved);
      }
    } else {
      setEditableManagementText(getGeneratedManagementText());
    }
  }, [currentManagementTemplateKey, managementMsgType, savedTemplates, totalSales, totalPurchases, costRatio, salesAchievementPct, purchaseAchievementPct, commonSchedsText, todayCommonSchedules, selectedPnLChannel, dateFormatted, getGeneratedManagementText]);

  // Handlers
  const handleSaveTelegramConfig = async (e) => {
    if (e) e.preventDefault();
    await saveTelegramConfig(telegramConfig);
    setSavedConfigToast(true);
    setTimeout(() => setSavedConfigToast(false), 2500);
  };

  const handleTestTelegram = async (customChatId = null) => {
    const targetChat = customChatId || telegramConfig.chatId;
    if (!telegramConfig.botToken || !targetChat) {
      alert("Bot Token과 Chat ID를 모두 입력해주세요.");
      return;
    }
    setTestingTelegram(true);
    setTestResult(null);
    try {
      const res = await testTelegramConnection(telegramConfig.botToken, targetChat);
      setTestResult(res);
      if (res.success) {
        await saveTelegramConfig(telegramConfig);
      }
    } catch (err) {
      setTestResult({ success: false, error: err.message });
    } finally {
      setTestingTelegram(false);
    }
  };

  const handleSaveUnifiedTemplate = async () => {
    if (!editableUnifiedText.trim()) {
      alert("저장할 메시지 내용이 비어 있습니다.");
      return;
    }
    await saveTelegramCustomTemplate(currentUnifiedTemplateKey, editableUnifiedText);
    setTemplateSavedToast(true);
    setTimeout(() => setTemplateSavedToast(false), 3000);
  };

  const handleSaveManagementTemplate = async () => {
    if (!editableManagementText.trim()) {
      alert("저장할 메시지 내용이 비어 있습니다.");
      return;
    }
    await saveTelegramCustomTemplate(currentManagementTemplateKey, editableManagementText);
    setTemplateSavedToast(true);
    setTimeout(() => setTemplateSavedToast(false), 3000);
  };

  const handleResetUnifiedTemplate = async () => {
    if (isUnifiedTemplateCustom) {
      await deleteTelegramCustomTemplate(currentUnifiedTemplateKey);
      setSavedTemplates((prev) => {
        const next = { ...prev };
        delete next[currentUnifiedTemplateKey];
        return next;
      });
    }

    if (unifiedMsgType === "briefing") {
      setLoadingLiveBriefing(true);
      try {
        const liveText = await buildDailyMorningBriefingText(null, null);
        setEditableUnifiedText(liveText);
      } catch (e) {
        setEditableUnifiedText(getGeneratedUnifiedText());
      } finally {
        setLoadingLiveBriefing(false);
      }
    } else {
      setEditableUnifiedText(getGeneratedUnifiedText());
    }

    setTemplateResetToast(true);
    setTimeout(() => setTemplateResetToast(false), 3000);
  };

  const handleRefreshLiveBriefing = async () => {
    if (isUnifiedTemplateCustom) {
      await deleteTelegramCustomTemplate(currentUnifiedTemplateKey);
      setSavedTemplates((prev) => {
        const next = { ...prev };
        delete next[currentUnifiedTemplateKey];
        return next;
      });
    }

    if (unifiedMsgType === "briefing") {
      setLoadingLiveBriefing(true);
      try {
        const liveText = await buildDailyMorningBriefingText(null, null);
        setEditableUnifiedText(liveText);
        setTemplateResetToast(true);
        setTimeout(() => setTemplateResetToast(false), 3000);
      } catch (e) {
        alert("실시간 취합 오류: " + e.message);
      } finally {
        setLoadingLiveBriefing(false);
      }
    } else {
      setEditableUnifiedText(getGeneratedUnifiedText());
      setTemplateResetToast(true);
      setTimeout(() => setTemplateResetToast(false), 3000);
    }
  };

  const handleResetManagementTemplate = async () => {
    if (isManagementTemplateCustom) {
      await deleteTelegramCustomTemplate(currentManagementTemplateKey);
      setSavedTemplates((prev) => {
        const next = { ...prev };
        delete next[currentManagementTemplateKey];
        return next;
      });
    }
    setEditableManagementText(getGeneratedManagementText());
    setTemplateResetToast(true);
    setTimeout(() => setTemplateResetToast(false), 3000);
  };

  const handleSendUnifiedMessage = async () => {
    if (!editableUnifiedText.trim()) {
      alert("발송할 메시지 내용이 비어 있습니다.");
      return;
    }
    setSendingUnified(true);
    try {
      const targetChat = (!telegramConfig.chatId || telegramConfig.chatId === "-4186792536") ? "-1004367600406" : telegramConfig.chatId;
      const res = await sendTelegramMessage(editableUnifiedText, {
        ...telegramConfig,
        chatId: targetChat
      });

      if (res?.success) {
        setUnifiedToast(true);
        setTimeout(() => setUnifiedToast(false), 3500);
      } else {
        alert("전송 실패: " + (res?.error || "설정을 확인해주세요."));
      }
    } catch (err) {
      alert("오류 발생: " + err.message);
    } finally {
      setSendingUnified(false);
    }
  };

  const handleSendManagementMessage = async () => {
    if (!editableManagementText.trim()) {
      alert("발송할 메시지 내용이 비어 있습니다.");
      return;
    }
    setSendingDailyPnL(true);
    try {
      const targetChat = selectedPnLChannel || telegramConfig.pnlChatId || "-1003939516875";
      const res = await sendTelegramMessage(editableManagementText, {
        ...telegramConfig,
        chatId: targetChat
      });

      if (res?.success) {
        setDailyPnLToast(true);
        setTimeout(() => setDailyPnLToast(false), 3500);
      } else {
        alert("전송 실패: " + (res?.error || "설정을 확인해주세요."));
      }
    } catch (err) {
      alert("오류 발생: " + err.message);
    } finally {
      setSendingDailyPnL(false);
    }
  };

  const handleCopyText = (text) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopyToast(true);
      setTimeout(() => setCopyToast(false), 2000);
    }
  };

  return {
    isAdmin,
    todayDateStr,
    dayName,
    activeMainTab,
    setActiveMainTab,
    telegramConfig,
    setTelegramConfig,
    unifiedMsgType,
    setUnifiedMsgType,
    qualityStage,
    setQualityStage,
    noticeMeetingType,
    setNoticeMeetingType,
    approvalType,
    setApprovalType,
    managementMsgType,
    setManagementMsgType,
    unifiedViewMode,
    setUnifiedViewMode,
    managementViewMode,
    setManagementViewMode,
    isUnifiedTemplateCustom,
    isManagementTemplateCustom,
    editableUnifiedText,
    setEditableUnifiedText,
    editableManagementText,
    setEditableManagementText,
    loadingLiveBriefing,
    handleRefreshLiveBriefing,
    handleResetUnifiedTemplate,
    handleCopyText,
    copyToast,
    templateSavedToast,
    templateResetToast,
    unifiedToast,
    handleSaveUnifiedTemplate,
    sendingUnified,
    handleSendUnifiedMessage,
    selectedPnLChannel,
    setSelectedPnLChannel,
    todayCommonSchedules,
    handleResetManagementTemplate,
    dailyPnLToast,
    handleSaveManagementTemplate,
    sendingDailyPnL,
    handleSendManagementMessage,
    testingTelegram,
    testResult,
    savedConfigToast,
    handleSaveTelegramConfig,
    handleTestTelegram
  };
};
