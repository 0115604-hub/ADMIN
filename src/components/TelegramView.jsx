import React, { useState, useEffect, useMemo } from "react";
import {
  Send,
  Check,
  CheckCircle2,
  AlertTriangle,
  Flame,
  ShieldCheck,
  Clock,
  Bell,
  MessageSquare,
  Lock,
  Building2,
  ExternalLink,
  Users,
  Briefcase,
  CalendarDays,
  DollarSign,
  TrendingUp,
  Sparkles,
  RotateCw,
  Layers,
  FileText,
  HelpCircle,
  FileCheck,
  Palmtree,
  CheckSquare,
  Crown,
  FileSpreadsheet,
  Megaphone,
  CheckCircle
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useMonth } from "../context/MonthContext";
import {
  getLocalTelegramConfig,
  saveTelegramConfig,
  subscribeTelegramConfig,
  testTelegramConnection,
  sendDailyMorningBriefingTelegram,
  sendQualityAlertTelegram,
  sendQualityActionTelegram,
  sendQualityDeleteTelegram,
  sendMeetingReplyTelegram,
  sendDailyPnLMorningBriefingTelegram
} from "../services/telegramService";
import {
  getLocalCommonSchedules,
  subscribeCommonSchedules
} from "../services/commonScheduleService";
import { getLocalAnnualLeaves } from "../services/annualLeaveService";
import { getLocalApprovalDocs } from "../services/approvalService";
import { getLocalWorkLogs } from "../services/workLogService";
import { getLocalUrgentIssues } from "../services/urgentIssueService";

export const TelegramView = () => {
  const { isAdmin, currentProfile } = useAuth();
  const { selectedMonth, currentMonthData, allMonthlyData } = useMonth();

  // 🌟 Main 2 Tabs: "unified" (오륙통합방) | "management" (경영총괄)
  const [activeMainTab, setActiveMainTab] = useState("unified");

  // Sub-tab for 오륙통합방: "briefing" (모닝브리핑) | "quality" (품질경보) | "notice_meeting" (공지/회의) | "approval" (전자결재/업무일지)
  const [unifiedMsgType, setUnifiedMsgType] = useState("briefing");

  // Sub-stages for various message types
  const [qualityStage, setQualityStage] = useState("1"); // "1": 신규발령, "2": 조치완료, "3": 종결삭제
  const [noticeMeetingType, setNoticeMeetingType] = useState("notice"); // "notice" | "meeting" | "meeting_result" | "meeting_reply"
  const [approvalType, setApprovalType] = useState("draft"); // "draft" | "approve" | "reject" | "worklog"

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

  const todayDateStr = new Date().toISOString().split("T")[0];
  const dateObj = new Date();
  const daysOfWeek = ["일", "월", "화", "수", "목", "금", "토"];
  const dayName = daysOfWeek[dateObj.getDay()];
  const yyyy = dateObj.getFullYear();
  const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
  const dd = String(dateObj.getDate()).padStart(2, "0");
  const dateFormatted = `${yyyy}.${mm}.${dd}(${dayName}) 07:30`;

  // ----------------------------------------------------
  // 1. 오륙통합방 실시간 데이터 (Unified Room Live Data)
  // ----------------------------------------------------
  const [sendingUnified, setSendingUnified] = useState(false);
  const [unifiedToast, setUnifiedToast] = useState(false);

  // Live leaves
  const morningLeaves = useMemo(() => {
    const leaves = getLocalAnnualLeaves();
    return leaves.filter((l) => {
      if (!l.startDate) return false;
      const start = l.startDate;
      const end = l.endDate || l.startDate;
      return start <= todayDateStr && todayDateStr <= end;
    });
  }, [todayDateStr]);

  const morningLeaveSummary = useMemo(() => {
    if (morningLeaves.length === 0) return "없음 (전원 정상 출근)";
    return morningLeaves.map((l) => {
      const plantShort = l.plant?.includes("한림") ? "한림" : "삼랑진";
      const typeShort = l.leaveType || "연차";
      return `${l.userName} ${l.title || "선임"}(${plantShort}/${typeShort})`;
    }).join(", ");
  }, [morningLeaves]);

  // Live approvals
  const morningApprovalDocs = useMemo(() => {
    const docs = getLocalApprovalDocs();
    return docs.filter((d) => d.status === "IN_PROGRESS" || d.status === "HOLD");
  }, []);

  const morningWorkLogs = useMemo(() => {
    const logs = getLocalWorkLogs();
    return logs.filter((l) => l.approvalStatus !== "결재완료" && l.approvalStatus !== "반려");
  }, []);

  const morningApprovalSummary = useMemo(() => {
    const total = morningApprovalDocs.length + morningWorkLogs.length;
    if (total === 0) return "없음 (전건 결재완료)";
    const docTitles = morningApprovalDocs.map((d) => d.title).filter(Boolean);
    const logTitles = morningWorkLogs.map((l) => `${l.writer} 업무일지`).filter(Boolean);
    const previewList = [...docTitles, ...logTitles].slice(0, 3);
    const moreText = total > 3 ? ` 외 ${total - 3}건` : "";
    return `총 ${total}건 (${previewList.join(", ")}${moreText})`;
  }, [morningApprovalDocs, morningWorkLogs]);

  // Live urgent issues
  const morningUrgentIssues = useMemo(() => {
    return getLocalUrgentIssues();
  }, []);

  const morningUrgentSummary = useMemo(() => {
    if (morningUrgentIssues.length === 0) return "없음 (전건 종결완료)";
    const issueTitles = morningUrgentIssues.map((i) => i.title || i.content).filter(Boolean);
    const previewList = issueTitles.slice(0, 2);
    const moreText = morningUrgentIssues.length > 2 ? ` 외 ${morningUrgentIssues.length - 2}건` : "";
    return `미조치 ${morningUrgentIssues.length}건 (${previewList.join(", ")}${moreText})`;
  }, [morningUrgentIssues]);

  // Unified Test Custom Fields
  const [unifiedPlant, setUnifiedPlant] = useState("삼랑진공장");
  const [unifiedWriter, setUnifiedWriter] = useState(currentProfile?.name || "이명재 이사");
  const [unifiedTitle, setUnifiedTitle] = useState("[긴급] 소폭 원단 표면 이물 혼입 및 폭 치수 편차 발생");
  const [unifiedContent, setUnifiedContent] = useState("압출 2라인 생산 중 폭 편차(±3mm 초과) 및 미세 흑점 이물 발견되어 즉시 점검 요망");
  const [unifiedActionContent, setUnifiedActionContent] = useState("압출 2라인 다이스 클리닝 및 스크류 필터 80mesh 교체 완료, 치수 정상 범위 복구 (조치율 100%)");
  const [unifiedDeleteReason, setUnifiedDeleteReason] = useState("현장 정상화 확인 및 검사 합격으로 종결 처리");

  // ----------------------------------------------------
  // 2. 경영총괄 실시간 데이터 (Management Room Live Data)
  // ----------------------------------------------------
  const [selectedPnLChannel, setSelectedPnLChannel] = useState("-1003939516875"); // Default: 경영방
  const [sendingDailyPnL, setSendingDailyPnL] = useState(false);
  const [dailyPnLToast, setDailyPnLToast] = useState(false);
  const [customPnLData, setCustomPnLData] = useState(null);

  const todayCommonSchedules = useMemo(() => {
    if (!commonSchedules || !Array.isArray(commonSchedules)) return [];
    return commonSchedules.filter((s) => s.date === todayDateStr);
  }, [commonSchedules, todayDateStr]);

  const totalSales = currentMonthData?.salesSummary?.totalSales || 1756104735;
  const totalPurchases = currentMonthData?.purchaseSummary?.ledgerBenchmark || currentMonthData?.jajaeSummary?.totalAmount || 1248400884.5;

  const prevMonthKey = useMemo(() => {
    if (!selectedMonth) return "2026-08";
    const [y, m] = selectedMonth.split("-").map(Number);
    const prevD = new Date(y, m - 2, 1);
    const prevY = prevD.getFullYear();
    const prevM = String(prevD.getMonth() + 1).padStart(2, "0");
    return `${prevY}-${prevM}`;
  }, [selectedMonth]);

  const prevMonthData = useMemo(() => {
    return allMonthlyData?.[prevMonthKey] || null;
  }, [allMonthlyData, prevMonthKey]);

  const prevSales = prevMonthData?.salesSummary?.totalSales || 1714856000;
  const prevPurchases = prevMonthData?.purchaseSummary?.ledgerBenchmark || prevMonthData?.jajaeSummary?.totalAmount || 1264841000;

  const salesAchievementPct = prevSales > 0 ? ((totalSales / prevSales) * 100).toFixed(1) : "102.4";
  const purchaseAchievementPct = prevPurchases > 0 ? ((totalPurchases / prevPurchases) * 100).toFixed(1) : "98.7";

  // Access Control: Admin only
  if (!isAdmin) {
    return (
      <div className="p-8 max-w-xl mx-auto my-12 bg-white dark:bg-slate-900 rounded-3xl border border-rose-200 dark:border-rose-900/50 text-center space-y-4 shadow-xl animate-fadeIn">
        <div className="w-16 h-16 rounded-3xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto shadow-inner">
          <Lock className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-black text-slate-900 dark:text-white">
          접근 권한이 제한되었습니다
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          텔레그램 연동 관리(telegram) 메뉴는 <strong>관리자(Admin)</strong> 전용 설정입니다.<br />
          일반 작업자 계정으로는 접근할 수 없습니다.
        </p>
      </div>
    );
  }

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

  // 1. 오륙통합방 발송 핸들러
  const handleSendUnifiedMessage = async () => {
    setSendingUnified(true);
    try {
      let res;
      const targetChat = telegramConfig.chatId || "-4186792536";

      if (unifiedMsgType === "briefing") {
        res = await sendDailyMorningBriefingTelegram(todayDateStr, targetChat);
      } else if (unifiedMsgType === "quality") {
        const issuePayload = {
          plant: unifiedPlant,
          writer: unifiedWriter,
          author: unifiedWriter,
          title: unifiedTitle,
          content: unifiedContent,
          category: "품질경보",
          date: todayDateStr,
          time: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false })
        };
        if (qualityStage === "1") {
          res = await sendQualityAlertTelegram(issuePayload, targetChat);
        } else if (qualityStage === "2") {
          res = await sendQualityActionTelegram(issuePayload, {
            actionAuthor: unifiedWriter,
            actionContent: unifiedActionContent,
            actionRate: 100
          }, targetChat);
        } else {
          res = await sendQualityDeleteTelegram({
            ...issuePayload,
            deleteReason: unifiedDeleteReason
          }, currentProfile?.name || unifiedWriter, targetChat);
        }
      } else if (unifiedMsgType === "notice_meeting") {
        const cat = noticeMeetingType.startsWith("meeting") ? "회의일정" : "공지사항";
        const issuePayload = {
          plant: unifiedPlant,
          writer: unifiedWriter,
          author: unifiedWriter,
          title: noticeMeetingType.startsWith("meeting") ? "[회의] 2026년 9월 생산품질 향상 대책회의" : "[공지] 현장 안전보호구 착용 및 환경 정리 요청",
          content: noticeMeetingType.startsWith("meeting") ? "생산 라인별 수율 개선 및 9월 납품계획 논의" : "공장 내 안전화/보안경 착용 철저 및 작업 후 라인 청소",
          category: cat,
          date: todayDateStr,
          time: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false })
        };

        if (noticeMeetingType === "notice" || noticeMeetingType === "meeting") {
          res = await sendQualityAlertTelegram(issuePayload, targetChat);
        } else if (noticeMeetingType === "meeting_result") {
          res = await sendQualityActionTelegram(issuePayload, {
            actionAuthor: unifiedWriter,
            actionContent: "각 라인별 설비 점검 체크리스트 보완 및 불량 원인 일일 분석 실시키로 결정",
            actionRate: 100
          }, targetChat);
        } else {
          res = await sendMeetingReplyTelegram(issuePayload, {
            author: unifiedWriter,
            authorTitle: "이사",
            attendanceStatus: "참석",
            content: "회의 참석 및 관련 품질 이슈 자료 준비 완료"
          }, targetChat);
        }
      } else {
        // Electronic Approval / WorkLog
        alert("전자결재 및 업무일지 알림은 해당 메뉴에서 결재/상신 시 자동으로 즉시 발송됩니다.");
        setSendingUnified(false);
        return;
      }

      if (res?.success) {
        setUnifiedToast(true);
        setTimeout(() => setUnifiedToast(false), 3500);
      } else if (res?.error) {
        alert("전송 실패: " + res.error);
      }
    } catch (err) {
      alert("오류 발생: " + err.message);
    } finally {
      setSendingUnified(false);
    }
  };

  // 2. 경영총괄 발송 핸들러
  const handleSendManagementMessage = async () => {
    setSendingDailyPnL(true);
    try {
      const todaySchedsText = todayCommonSchedules.length > 0
        ? todayCommonSchedules.map((s) => `• ${s.time && s.time !== "종일" ? `[${s.time}] ` : ""}${s.target ? `[${s.target}] ` : ""}${s.title}`).join("\n")
        : "• 등록된 전사 공통일정이 없습니다. (정상 생산 가동)";

      const res = await sendDailyPnLMorningBriefingTelegram({
        salesAmount: customPnLData?.salesAmount ?? totalSales,
        purchaseAmount: customPnLData?.purchaseAmount ?? totalPurchases,
        salesAchievementRate: customPnLData?.salesAchievementRate || `${salesAchievementPct}% (${Number(salesAchievementPct) >= 100 ? `▲ +${(Number(salesAchievementPct) - 100).toFixed(1)}% 초과` : `▼ ${(Number(salesAchievementPct) - 100).toFixed(1)}%`})`,
        purchaseAchievementRate: customPnLData?.purchaseAchievementRate || `${purchaseAchievementPct}% (${Number(purchaseAchievementPct) <= 100 ? `▼ ${(100 - Number(purchaseAchievementPct)).toFixed(1)}% 절감` : `▲ +${(Number(purchaseAchievementPct) - 100).toFixed(1)}% 증가`})`,
        commonSchedules: customPnLData?.commonSchedules || todaySchedsText,
        targetChatId: selectedPnLChannel
      }, selectedPnLChannel);

      if (res.success) {
        setDailyPnLToast(true);
        setTimeout(() => setDailyPnLToast(false), 3500);
      } else {
        alert("전송 실패: " + (res.error || "설정을 확인해주세요."));
      }
    } catch (err) {
      alert("오류 발생: " + err.message);
    } finally {
      setSendingDailyPnL(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 animate-fadeIn">
      {/* ========================================================================= */}
      {/* 🚀 발송관리 통합 헤더 & [오륙통합방] vs [경영총괄] 2대 탭 */}
      {/* ========================================================================= */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-600 via-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Send className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                  텔레그램 발송 관리
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                  채널별 발송 관리
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                수신 대상에 따라 <strong>오륙통합방</strong>과 <strong>경영총괄</strong> 채널로 분리하여 메시지를 관리합니다.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black ${
              telegramConfig.enabled
                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800"
                : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
            }`}>
              <span className={`w-2 h-2 rounded-full ${telegramConfig.enabled ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
              {telegramConfig.enabled ? "텔레그램 연동 가동 중" : "알림 연동 꺼짐"}
            </span>
          </div>
        </div>

        {/* 🌟 2대 메인 탭: [📢 오륙통합방] & [👑 경영총괄] */}
        <div className="grid grid-cols-2 gap-3 p-1.5 rounded-2xl bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80">
          <button
            type="button"
            onClick={() => setActiveMainTab("unified")}
            className={`flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-xl font-black text-xs sm:text-base transition-all cursor-pointer ${
              activeMainTab === "unified"
                ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-sky-400 shadow-md border border-slate-200/80 dark:border-slate-700"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Users className="w-5 h-5 shrink-0 text-blue-500" />
            <div className="text-left">
              <div className="leading-tight">오륙통합방</div>
              <div className="text-[10px] opacity-75 font-normal">현장•품질•공지•모닝브리핑 (-4186792536)</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveMainTab("management")}
            className={`flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-xl font-black text-xs sm:text-base transition-all cursor-pointer ${
              activeMainTab === "management"
                ? "bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-md border border-slate-200/80 dark:border-slate-700"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Crown className="w-5 h-5 shrink-0 text-purple-500" />
            <div className="text-left">
              <div className="leading-tight">경영총괄</div>
              <div className="text-[10px] opacity-75 font-normal">대표·전무 손익결산 브리핑 (-1003939516875)</div>
            </div>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 📢 TAB 1: 오륙통합방 (현장/품질/공지/결재/07:30 일반 모닝브리핑) */}
      {/* ========================================================================= */}
      {activeMainTab === "unified" && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-blue-500/40 dark:border-blue-600/40 shadow-xl space-y-5 animate-fadeIn">
          {/* Channel Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-blue-500 animate-pulse"></span>
                <h4 className="font-black text-slate-900 dark:text-white text-base">
                  📢 오륙통합방 발송 메시지 예시 및 관리
                </h4>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                  단톡방: -4186792536
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                오륙 전 임직원 및 현장 작업자가 참여하는 <strong>오륙통합방</strong>으로 발송되는 모든 메시지 예시입니다.
              </p>
            </div>

            <span className="px-3 py-1 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-black">
              {todayDateStr} ({dayName})
            </span>
          </div>

          {/* Sub Message Type Selector */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: "briefing", label: "📋 07:30 모닝브리핑", desc: "근태/미결재/품질" },
              { id: "quality", label: "🟥 품질경보 3단계", desc: "발령/조치/종결" },
              { id: "notice_meeting", label: "🟩 공지 & 🟪 회의", desc: "사내공지/회의일정" },
              { id: "approval", label: "🟦 전자결재/일지", desc: "기안/승인/반려" }
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setUnifiedMsgType(t.id)}
                className={`p-3 rounded-2xl text-center border transition-all cursor-pointer ${
                  unifiedMsgType === t.id
                    ? "bg-blue-600 text-white border-blue-600 shadow-md font-black"
                    : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-400"
                }`}
              >
                <div className="text-xs">{t.label}</div>
                <div className="text-[10px] opacity-80 mt-0.5">{t.desc}</div>
              </button>
            ))}
          </div>

          {/* Sub-level selectors based on unifiedMsgType */}
          {unifiedMsgType === "quality" && (
            <div className="p-3 rounded-2xl bg-rose-50/50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 flex items-center justify-between gap-2 flex-wrap">
              <span className="text-xs font-bold text-rose-800 dark:text-rose-300">품질경보 알림 단계 선택:</span>
              <div className="flex items-center gap-1.5">
                {[
                  { key: "1", label: "1단계 (신규 발령)" },
                  { key: "2", label: "2단계 (조치완료 보고)" },
                  { key: "3", label: "3단계 (종결/삭제 알림)" }
                ].map((st) => (
                  <button
                    key={st.key}
                    type="button"
                    onClick={() => setQualityStage(st.key)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      qualityStage === st.key
                        ? "bg-rose-600 text-white border-rose-600 shadow-xs"
                        : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {unifiedMsgType === "notice_meeting" && (
            <div className="p-3 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 flex items-center justify-between gap-2 flex-wrap">
              <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">공지/회의 세부 유형:</span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {[
                  { key: "notice", label: "🟩 사내 공지사항" },
                  { key: "meeting", label: "🟪 사내 회의일정" },
                  { key: "meeting_result", label: "🟪 회의결과 보고" },
                  { key: "meeting_reply", label: "🟪 회의일정 회신" }
                ].map((nt) => (
                  <button
                    key={nt.key}
                    type="button"
                    onClick={() => setNoticeMeetingType(nt.key)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      noticeMeetingType === nt.key
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                        : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    {nt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {unifiedMsgType === "approval" && (
            <div className="p-3 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/50 flex items-center justify-between gap-2 flex-wrap">
              <span className="text-xs font-bold text-indigo-800 dark:text-indigo-300">전자결재/일지 세부 유형:</span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {[
                  { key: "draft", label: "🟦 기안 상신" },
                  { key: "approve", label: "🟦 최종 승인 완료" },
                  { key: "reject", label: "🟦 반려 알림" },
                  { key: "worklog", label: "⬛ 업무일지 결재 승인" }
                ].map((ap) => (
                  <button
                    key={ap.key}
                    type="button"
                    onClick={() => setApprovalType(ap.key)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      approvalType === ap.key
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                        : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    {ap.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 2-Column: Left Smartphone Bubble Preview vs Right Details & Action */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Left: Smartphone Telegram Mockup (7 cols) */}
            <div className="lg:col-span-7 bg-slate-950 text-slate-100 rounded-3xl p-5 border border-slate-800 shadow-2xl space-y-3 font-sans">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 text-xs text-slate-400">
                <div className="flex items-center gap-2 font-bold text-sky-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>📢 오륙 통합방 (단톡방)</span>
                </div>
                <span className="text-[11px] font-mono text-slate-400">실시간 발송 예시</span>
              </div>

              {/* Rendered Mockup Box */}
              <div className="bg-slate-900/90 rounded-2xl p-4 sm:p-5 border border-slate-700/80 space-y-3.5 text-xs leading-relaxed shadow-lg">
                {/* 1. 07:30 모닝브리핑 예시 */}
                {unifiedMsgType === "briefing" && (
                  <>
                    <div>
                      <div className="font-black text-sm sm:text-base text-white flex items-center gap-1.5">
                        <span>⬛ [오륙 생산관리] 일일 모닝 브리핑</span>
                      </div>
                      <div className="text-xs font-extrabold text-sky-400 mt-1">
                        {dateFormatted} 기준
                      </div>
                    </div>
                    <div className="border-t border-slate-800 pt-3 space-y-3">
                      <div>
                        <div className="font-black text-emerald-400 text-xs sm:text-[13px] mb-1.5 flex items-center gap-1">
                          <span>[1] 근태 / 휴가 현황</span>
                        </div>
                        <div className="pl-2 text-slate-200">• {morningLeaveSummary}</div>
                      </div>
                      <div>
                        <div className="font-black text-amber-400 text-xs sm:text-[13px] mb-1.5 flex items-center gap-1">
                          <span>[2] 미결재 현황</span>
                        </div>
                        <div className="pl-2 text-slate-200">• {morningApprovalSummary}</div>
                      </div>
                      <div>
                        <div className="font-black text-rose-400 text-xs sm:text-[13px] mb-1.5 flex items-center gap-1">
                          <span>[3] 품질경보 / 공지 현황</span>
                        </div>
                        <div className="pl-2 text-slate-200">• {morningUrgentSummary}</div>
                      </div>
                    </div>
                  </>
                )}

                {/* 2. 품질경보 3단계 예시 */}
                {unifiedMsgType === "quality" && (
                  <>
                    {qualityStage === "1" && (
                      <>
                        <div className="font-black text-sm sm:text-base text-rose-400">
                          🟥 [품질경보] 긴급 확인 및 점검 요망
                        </div>
                        <div className="border-t border-slate-800 pt-2.5 space-y-1 text-slate-200">
                          <div>• <strong>공장:</strong> {unifiedPlant}</div>
                          <div>• <strong>작성자:</strong> <strong>{unifiedWriter}</strong></div>
                          <div>• <strong>불량제목:</strong> <strong>{unifiedTitle}</strong></div>
                          <div className="pt-1.5 pb-1">
                            <span className="font-bold text-slate-400">[전달 내용]</span>
                            <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-slate-300 mt-1 whitespace-pre-wrap">
                              {unifiedContent}
                            </div>
                          </div>
                          <div>• <strong>발령일시:</strong> {todayDateStr} {new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}</div>
                        </div>
                        <div className="text-[11px] text-amber-300/90 bg-amber-950/30 p-2 rounded-lg border border-amber-900/50">
                          ※ 조치 완료 후 시스템에서 [조치결과]를 등록해 주세요.
                        </div>
                      </>
                    )}
                    {qualityStage === "2" && (
                      <>
                        <div className="font-black text-sm sm:text-base text-rose-400">
                          🟥 [품질경보 조치완료 보고]
                        </div>
                        <div className="border-t border-slate-800 pt-2.5 space-y-1 text-slate-200">
                          <div>• <strong>공장:</strong> {unifiedPlant}</div>
                          <div>• <strong>대상:</strong> <strong>{unifiedTitle}</strong></div>
                          <div>• <strong>조치자:</strong> <strong>{unifiedWriter}</strong></div>
                          <div className="pt-1.5 pb-1">
                            <span className="font-bold text-slate-400">[조치 내용]</span>
                            <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-slate-300 mt-1 whitespace-pre-wrap">
                              {unifiedActionContent}
                            </div>
                          </div>
                          <div>• <strong>완료일시:</strong> {todayDateStr} {new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}</div>
                        </div>
                      </>
                    )}
                    {qualityStage === "3" && (
                      <>
                        <div className="font-black text-sm sm:text-base text-rose-400">
                          🟥 [품질경보 종결/삭제 알림]
                        </div>
                        <div className="border-t border-slate-800 pt-2.5 space-y-1 text-slate-200">
                          <div>• <strong>공장:</strong> {unifiedPlant}</div>
                          <div>• <strong>대상:</strong> <strong>{unifiedTitle}</strong></div>
                          <div>• <strong>삭제권한자:</strong> <strong>{unifiedWriter}</strong></div>
                          <div>• <strong>종결사유:</strong> {unifiedDeleteReason}</div>
                          <div>• <strong>삭제일시:</strong> {todayDateStr} {new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}</div>
                        </div>
                      </>
                    )}
                  </>
                )}

                {/* 3. 사내공지 / 회의일정 예시 */}
                {unifiedMsgType === "notice_meeting" && (
                  <>
                    {noticeMeetingType === "notice" && (
                      <>
                        <div className="font-black text-sm sm:text-base text-emerald-400">
                          🟩 [사내 공지사항] 업무 협조 안내
                        </div>
                        <div className="border-t border-slate-800 pt-2.5 space-y-1 text-slate-200">
                          <div>• <strong>대상:</strong> 삼랑진 / 한림 전 공장</div>
                          <div>• <strong>공지자:</strong> <strong>이명재 이사</strong></div>
                          <div>• <strong>공지제목:</strong> <strong>현장 안전보호구 착용 및 정리정돈 협조 요청</strong></div>
                          <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-slate-300 mt-1.5 whitespace-pre-wrap">
                            [공지 내용]&#10;공장 내 안전화/보안경 착용 철저 및 작업 후 라인 청소 철저 협조 부탁드립니다.
                          </div>
                          <div>• <strong>등록일시:</strong> {todayDateStr} 08:30</div>
                        </div>
                      </>
                    )}
                    {noticeMeetingType === "meeting" && (
                      <>
                        <div className="font-black text-sm sm:text-base text-purple-400">
                          🟪 [사내 회의일정] 회의 및 일정 안내
                        </div>
                        <div className="border-t border-slate-800 pt-2.5 space-y-1 text-slate-200">
                          <div>• <strong>대상:</strong> 삼랑진공장</div>
                          <div>• <strong>등록자:</strong> <strong>김동욱 부장</strong></div>
                          <div>• <strong>회의제목:</strong> <strong>2026년 9월 생산품질 향상 대책회의</strong></div>
                          <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-slate-300 mt-1.5 whitespace-pre-wrap">
                            [회의 일정/안건]&#10;일시: 오늘 14:00 (대회의실)&#10;안건: 생산 라인별 수율 개선 및 9월 납품계획 논의
                          </div>
                          <div>• <strong>등록일시:</strong> {todayDateStr} 09:00</div>
                        </div>
                        <div className="text-[11px] text-purple-300/90 bg-purple-950/30 p-2 rounded-lg border border-purple-900/50">
                          ※ 관련 작업자분들은 시스템에서 [회신]을 등록해 주세요.
                        </div>
                      </>
                    )}
                    {noticeMeetingType === "meeting_result" && (
                      <>
                        <div className="font-black text-sm sm:text-base text-purple-400">
                          🟪 [사내 회의결과 보고]
                        </div>
                        <div className="border-t border-slate-800 pt-2.5 space-y-1 text-slate-200">
                          <div>• <strong>대상:</strong> 삼랑진공장</div>
                          <div>• <strong>회의제목:</strong> <strong>2026년 9월 생산품질 향상 대책회의</strong></div>
                          <div>• <strong>기록/작성자:</strong> <strong>김동욱 부장</strong></div>
                          <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-slate-300 mt-1.5 whitespace-pre-wrap">
                            [회의 결과 및 결정사항]&#10;1. 압출 라인 필터 교체 주기 2주 단축&#10;2. 불량 발생 시 즉시 생산 중단 및 알림 발령
                          </div>
                          <div>• <strong>완료일시:</strong> {todayDateStr} 15:30</div>
                        </div>
                      </>
                    )}
                    {noticeMeetingType === "meeting_reply" && (
                      <>
                        <div className="font-black text-sm sm:text-base text-purple-400">
                          🟪 [회의일정 회신 등록]
                        </div>
                        <div className="border-t border-slate-800 pt-2.5 space-y-1 text-slate-200">
                          <div>• <strong>회의:</strong> <strong>2026년 9월 생산품질 향상 대책회의</strong> (삼랑진공장)</div>
                          <div>• <strong>회신자:</strong> <strong>이명재 이사 [참석]</strong></div>
                          <div>• <strong>회신내용:</strong> 회의 참석 및 품질 분석 자료 준비 완료</div>
                          <div>• <strong>회신일시:</strong> {todayDateStr} 09:15</div>
                        </div>
                      </>
                    )}
                  </>
                )}

                {/* 4. 전자결재 & 업무일지 예시 */}
                {unifiedMsgType === "approval" && (
                  <>
                    {approvalType === "draft" && (
                      <>
                        <div className="font-black text-sm sm:text-base text-blue-400">
                          🟦 [전자결재 기안 상신]
                        </div>
                        <div className="border-t border-slate-800 pt-2.5 space-y-1 text-slate-200">
                          <div>• <strong>공장:</strong> 삼랑진공장</div>
                          <div>• <strong>기안자:</strong> 김동욱 부장</div>
                          <div>• <strong>결재제목:</strong> <strong>압출 2라인 다이스 및 스크류 보수 신청서</strong></div>
                          <div>• <strong>다음 결재자:</strong> <strong>이명재 이사</strong></div>
                          <div>• <strong>일시:</strong> {todayDateStr} 10:20</div>
                        </div>
                      </>
                    )}
                    {approvalType === "approve" && (
                      <>
                        <div className="font-black text-sm sm:text-base text-blue-400">
                          🟦 [전자결재 최종 승인 완료]
                        </div>
                        <div className="border-t border-slate-800 pt-2.5 space-y-1 text-slate-200">
                          <div>• <strong>공장:</strong> 삼랑진공장</div>
                          <div>• <strong>기안자:</strong> 김동욱 부장</div>
                          <div>• <strong>결재제목:</strong> <strong>압출 2라인 다이스 및 스크류 보수 신청서</strong></div>
                          <div>• <strong>승인자:</strong> <strong>권태형 대표이사</strong></div>
                          <div>• <strong>일시:</strong> {todayDateStr} 11:05</div>
                        </div>
                      </>
                    )}
                    {approvalType === "reject" && (
                      <>
                        <div className="font-black text-sm sm:text-base text-rose-400">
                          🟦 [전자결재 반려 알림]
                        </div>
                        <div className="border-t border-slate-800 pt-2.5 space-y-1 text-slate-200">
                          <div>• <strong>공장:</strong> 삼랑진공장</div>
                          <div>• <strong>기안자:</strong> 김동욱 부장</div>
                          <div>• <strong>결재제목:</strong> <strong>자재 추가 구매 품의서</strong></div>
                          <div>• <strong>반려자:</strong> <strong>최미영 전무</strong></div>
                          <div>• <strong>반려사유:</strong> 단가 재검토 및 대체 업체 견적 첨부 요망</div>
                          <div>• <strong>일시:</strong> {todayDateStr} 13:40</div>
                        </div>
                      </>
                    )}
                    {approvalType === "worklog" && (
                      <>
                        <div className="font-black text-sm sm:text-base text-white">
                          ⬛ [일일업무일지 결재 승인]
                        </div>
                        <div className="border-t border-slate-800 pt-2.5 space-y-1 text-slate-200">
                          <div>• <strong>공장:</strong> 삼랑진공장</div>
                          <div>• <strong>작성자:</strong> 김동욱 부장 (생산)</div>
                          <div>• <strong>결재자:</strong> <strong>이명재 이사</strong></div>
                          <div>• <strong>지시사항:</strong> 수고하셨습니다. 익일 야간조 인수인계 철저</div>
                          <div>• <strong>업무일자:</strong> {todayDateStr}</div>
                        </div>
                      </>
                    )}
                  </>
                )}

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                  <span className="text-blue-400 underline cursor-pointer hover:text-blue-300 font-bold">
                    생산관리시스템 바로가기
                  </span>
                  <span className="text-[11px] text-slate-500">오륙 텔레그램 알림봇</span>
                </div>
              </div>
            </div>

            {/* Right: Actions & Trigger Control (5 cols) */}
            <div className="lg:col-span-5 space-y-4 text-xs">
              {unifiedMsgType === "briefing" && (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                  <h5 className="font-black text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-blue-500" />
                    <span>오늘의 모닝브리핑 실시간 집계</span>
                  </h5>

                  <div className="space-y-2">
                    <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                      <span className="font-bold text-slate-600 dark:text-slate-400">오늘 휴가/근태</span>
                      <span className="font-black text-emerald-600 dark:text-emerald-400">{morningLeaves.length}명</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                      <span className="font-bold text-slate-600 dark:text-slate-400">미결재 문서</span>
                      <span className="font-black text-amber-600 dark:text-amber-400">{morningApprovalDocs.length + morningWorkLogs.length}건</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                      <span className="font-bold text-slate-600 dark:text-slate-400">조치 대기 품질경보</span>
                      <span className="font-black text-rose-600 dark:text-rose-400">{morningUrgentIssues.length}건</span>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    매일 아침 07:30 정시에 최신 데이터를 자동 집계하여 오륙통합방으로 브리핑이 발송됩니다.
                  </div>
                </div>
              )}

              {unifiedMsgType === "quality" && (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                  <h5 className="font-black text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-rose-500" />
                    <span>품질경보 파라미터 테스트</span>
                  </h5>

                  <div className="space-y-2">
                    <div>
                      <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">대상 공장</label>
                      <div className="grid grid-cols-2 gap-2">
                        {["삼랑진공장", "한림공장"].map((p) => (
                          <button
                            key={p}
                            type="button"
                            onClick={() => setUnifiedPlant(p)}
                            className={`py-1.5 rounded-xl border text-xs font-bold ${
                              unifiedPlant === p ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900" : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                            }`}
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">작성자 / 권한자</label>
                      <input
                        type="text"
                        value={unifiedWriter}
                        onChange={(e) => setUnifiedWriter(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">제목</label>
                      <input
                        type="text"
                        value={unifiedTitle}
                        onChange={(e) => setUnifiedTitle(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Action Button for Unified Room */}
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  disabled={sendingUnified}
                  onClick={handleSendUnifiedMessage}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-xs sm:text-sm shadow-xl shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-4 h-4 text-sky-200" />
                  <span>
                    {sendingUnified
                      ? "오륙통합방으로 발송 중..."
                      : `🚀 [오륙통합방]으로 현재 예시 메시지 즉시 발송`}
                  </span>
                </button>

                {unifiedToast && (
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2 animate-fadeIn">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>✅ 오륙통합방(-4186792536)으로 텔레그램 메시지가 정상 발송되었습니다!</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 👑 TAB 2: 경영총괄 (대표·전무 경영방 아침 손익결산 브리핑) */}
      {/* ========================================================================= */}
      {activeMainTab === "management" && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-purple-500/40 dark:border-purple-600/40 shadow-xl space-y-5 animate-fadeIn">
          {/* Channel Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-purple-500 animate-pulse"></span>
                <h4 className="font-black text-slate-900 dark:text-white text-base">
                  👑 경영총괄 발송 메시지 예시 및 관리
                </h4>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                  경영방: -1003939516875
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                권태형 대표이사, 최미영 전무 등 경영진 전용 <strong>경영방</strong>으로 매일 아침 07:30 발송되는 <strong>손익결산 브리핑</strong>입니다.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCustomPnLData(null)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 cursor-pointer flex items-center gap-1"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>실시간 수치 리셋</span>
              </button>
            </div>
          </div>

          {/* Destination Selector for Management */}
          <div className="p-3.5 rounded-2xl bg-purple-50/50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/50 flex items-center justify-between gap-2 flex-wrap">
            <span className="text-xs font-bold text-purple-900 dark:text-purple-300">경영총괄 수신 대상 선택:</span>
            <div className="flex items-center gap-2">
              {[
                { id: "-1003939516875", label: "👑 경영방 (대표·전무 전용)", desc: "기본 채널" },
                { id: "290615483", label: "👤 권태형 대표님 1:1", desc: "개인 직송" }
              ].map((ch) => (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => setSelectedPnLChannel(ch.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    selectedPnLChannel === ch.id
                      ? "bg-purple-600 text-white border-purple-600 shadow-xs"
                      : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                  }`}
                >
                  {ch.label}
                </button>
              ))}
            </div>
          </div>

          {/* 2-Column: Left Smartphone Bubble Preview vs Right Controls */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Left: Smartphone Telegram Mockup (7 cols) */}
            <div className="lg:col-span-7 bg-slate-950 text-slate-100 rounded-3xl p-5 border border-slate-800 shadow-2xl space-y-3 font-sans">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 text-xs text-slate-400">
                <div className="flex items-center gap-2 font-bold text-purple-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>
                    {selectedPnLChannel === "-1003939516875"
                      ? "👑 경영방 (대표·전무 전용 채널)"
                      : "👤 권태형 대표님 1:1 대화방"}
                  </span>
                </div>
                <span className="text-[11px] font-mono text-slate-400">매일 07:30 정시 발송</span>
              </div>

              {/* Rendered Mockup Box */}
              <div className="bg-slate-900/90 rounded-2xl p-4 sm:p-5 border border-slate-700/80 space-y-3.5 text-xs leading-relaxed shadow-lg">
                <div>
                  <div className="font-black text-sm sm:text-base text-white flex items-center gap-1.5">
                    <span>⬛ [오륙 경영진/임원] 일일 아침 손익결산 브리핑</span>
                  </div>
                  <div className="text-xs font-extrabold text-sky-400 mt-1">
                    {dateFormatted} 기준
                  </div>
                </div>

                <div className="border-t border-slate-800 pt-3 space-y-3">
                  {/* [1] 매입 / 매출 결산 */}
                  <div>
                    <div className="font-black text-amber-400 text-xs sm:text-[13px] mb-1.5 flex items-center gap-1">
                      <span>[1] 당월 매입 / 매출 결산 현황</span>
                    </div>
                    <div className="pl-2 space-y-1 text-slate-200">
                      <div>• <strong>매출액:</strong> <span className="font-black text-white text-sm">₩{Number(customPnLData?.salesAmount ?? totalSales).toLocaleString()}원</span></div>
                      <div>• <strong>매입액:</strong> <span className="font-black text-rose-300 text-sm">₩{Number(customPnLData?.purchaseAmount ?? totalPurchases).toLocaleString()}원</span></div>
                      <div>• <strong>매출대비 원가율:</strong> <span className="font-black text-indigo-300">{(((customPnLData?.purchaseAmount ?? totalPurchases) / ((customPnLData?.salesAmount ?? totalSales) || 1)) * 100).toFixed(1)}%</span></div>
                    </div>
                  </div>

                  {/* [2] 전월 실적 대비 달성율 */}
                  <div>
                    <div className="font-black text-emerald-400 text-xs sm:text-[13px] mb-1.5 flex items-center gap-1">
                      <span>[2] 전월 실적 대비 달성율 ({prevMonthKey?.split("-")[1] || "8"}월 실적 대비)</span>
                    </div>
                    <div className="pl-2 space-y-1 text-slate-200">
                      <div>• <strong>전월대비 매출 달성율:</strong> <strong className="text-emerald-300 font-black text-xs sm:text-sm">{customPnLData?.salesAchievementRate || `${salesAchievementPct}% (${Number(salesAchievementPct) >= 100 ? `▲ +${(Number(salesAchievementPct) - 100).toFixed(1)}% 초과` : `▼ ${(Number(salesAchievementPct) - 100).toFixed(1)}%`})`}</strong></div>
                      <div>• <strong>전월대비 매입 달성율:</strong> <strong className="text-sky-300 font-black text-xs sm:text-sm">{customPnLData?.purchaseAchievementRate || `${purchaseAchievementPct}% (${Number(purchaseAchievementPct) <= 100 ? `▼ ${(100 - Number(purchaseAchievementPct)).toFixed(1)}% 절감` : `▲ +${(Number(purchaseAchievementPct) - 100).toFixed(1)}%`})`}</strong></div>
                    </div>
                  </div>

                  {/* [3] 오늘의 전사 공통일정 */}
                  <div>
                    <div className="font-black text-purple-400 text-xs sm:text-[13px] mb-1.5 flex items-center gap-1">
                      <span>[3] 오늘의 전사 공통일정</span>
                    </div>
                    <div className="pl-2 whitespace-pre-wrap text-slate-200 text-xs leading-relaxed bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                      {customPnLData?.commonSchedules || (todayCommonSchedules.length > 0
                        ? todayCommonSchedules.map((s) => `• ${s.time && s.time !== "종일" ? `[${s.time}] ` : ""}${s.target ? `[${s.target}] ` : ""}${s.title}`).join("\n")
                        : "• 등록된 전사 공통일정이 없습니다. (정상 생산 가동)")}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                  <span className="text-blue-400 underline cursor-pointer hover:text-blue-300 font-bold">
                    손익관리시스템 바로가기
                  </span>
                  <span className="text-[11px] text-slate-500">오륙 텔레그램 알림봇</span>
                </div>
              </div>
            </div>

            {/* Right: Controls & Real-time adjustment (5 cols) */}
            <div className="lg:col-span-5 space-y-3.5 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                <h5 className="font-black text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-purple-500" />
                  <span>손익 브리핑 파라미터 실시간 조정</span>
                </h5>

                <div>
                  <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">매출액 (원)</label>
                  <input
                    type="number"
                    value={customPnLData?.salesAmount ?? totalSales}
                    onChange={(e) => setCustomPnLData({
                      ...(customPnLData || {}),
                      salesAmount: Number(e.target.value)
                    })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">매입액 (원)</label>
                  <input
                    type="number"
                    value={customPnLData?.purchaseAmount ?? totalPurchases}
                    onChange={(e) => setCustomPnLData({
                      ...(customPnLData || {}),
                      purchaseAmount: Number(e.target.value)
                    })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">전월대비 매출 달성율 문구</label>
                  <input
                    type="text"
                    placeholder="예: 102.4% (▲ 2.4% 초과)"
                    value={customPnLData?.salesAchievementRate ?? `${salesAchievementPct}% (${Number(salesAchievementPct) >= 100 ? `▲ +${(Number(salesAchievementPct) - 100).toFixed(1)}% 초과` : `▼ ${(Number(salesAchievementPct) - 100).toFixed(1)}%`})`}
                    onChange={(e) => setCustomPnLData({
                      ...(customPnLData || {}),
                      salesAchievementRate: e.target.value
                    })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">전월대비 매입 달성율 문구</label>
                  <input
                    type="text"
                    placeholder="예: 98.7% (▼ 1.3% 절감)"
                    value={customPnLData?.purchaseAchievementRate ?? `${purchaseAchievementPct}% (${Number(purchaseAchievementPct) <= 100 ? `▼ ${(100 - Number(purchaseAchievementPct)).toFixed(1)}% 절감` : `▲ +${(Number(purchaseAchievementPct) - 100).toFixed(1)}%`})`}
                    onChange={(e) => setCustomPnLData({
                      ...(customPnLData || {}),
                      purchaseAchievementRate: e.target.value
                    })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">공통일정 포함 내용</label>
                  <textarea
                    rows="3"
                    value={customPnLData?.commonSchedules ?? (todayCommonSchedules.length > 0
                      ? todayCommonSchedules.map((s) => `• ${s.time && s.time !== "종일" ? `[${s.time}] ` : ""}${s.target ? `[${s.target}] ` : ""}${s.title}`).join("\n")
                      : "• 등록된 전사 공통일정이 없습니다. (정상 생산 가동)")}
                    onChange={(e) => setCustomPnLData({
                      ...(customPnLData || {}),
                      commonSchedules: e.target.value
                    })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium text-slate-900 dark:text-white text-xs leading-relaxed"
                  ></textarea>
                </div>
              </div>

              {/* Action Button for Management */}
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  disabled={sendingDailyPnL}
                  onClick={handleSendManagementMessage}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-slate-900 via-purple-900 to-indigo-900 hover:from-black hover:to-purple-950 text-white font-black text-xs sm:text-sm shadow-xl shadow-purple-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-4 h-4 text-purple-300" />
                  <span>
                    {sendingDailyPnL
                      ? "경영방으로 발송 중..."
                      : `🚀 [${selectedPnLChannel === "-1003939516875" ? "경영방" : "대표님 1:1"}]으로 손익결산 즉시 발송`}
                  </span>
                </button>

                {dailyPnLToast && (
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2 animate-fadeIn">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>✅ 매일 아침 손익결산 브리핑 메시지가 경영방으로 정상 발송되었습니다!</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ⚙️ 하단: 텔레그램 Bot API 및 채널 ID 시스템 설정 */}
      {/* ========================================================================= */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white text-base">
                텔레그램 Bot API 및 채널 ID 설정
              </h4>
              <p className="text-xs text-slate-400">
                오륙 통합방(현장·품질·공지)과 경영방(대표·전무 손익)의 수신 채널 ID를 구분하여 관리합니다.
              </p>
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={telegramConfig.enabled}
              onChange={(e) => setTelegramConfig({ ...telegramConfig, enabled: e.target.checked })}
              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
            />
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {telegramConfig.enabled ? "알림 켜짐" : "알림 꺼짐"}
            </span>
          </label>
        </div>

        <form onSubmit={handleSaveTelegramConfig} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                텔레그램 Bot Token (API 토큰)
              </label>
              <input
                type="text"
                placeholder="예: 8544872588:AAFb..."
                value={telegramConfig.botToken || ""}
                onChange={(e) => setTelegramConfig({ ...telegramConfig, botToken: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              />
              <p className="text-[10px] text-slate-400">
                @BotFather 발급 API Token
              </p>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                오륙 통합방 Chat ID
              </label>
              <input
                type="text"
                placeholder="예: -4186792536 (오륙 통합방)"
                value={telegramConfig.chatId || ""}
                onChange={(e) => setTelegramConfig({ ...telegramConfig, chatId: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              />
              <p className="text-[10px] text-slate-400">
                품질경보 3단계 / 사내공지 / 회의일정 / 07:30 모닝브리핑
              </p>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                경영방 (대표·전무) Chat ID
              </label>
              <input
                type="text"
                placeholder="예: -1003939516875 (경영방)"
                value={telegramConfig.pnlChatId || ""}
                onChange={(e) => setTelegramConfig({ ...telegramConfig, pnlChatId: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              />
              <p className="text-[10px] text-slate-400">
                매일 아침 07:30 손익결산(매출/매입/달성율/공통일정) 브리핑
              </p>
            </div>
          </div>

          {/* Test Status Feedback */}
          {testResult && (
            <div className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
              testResult.success
                ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 text-emerald-800 dark:text-emerald-200"
                : "bg-rose-50 dark:bg-rose-950/40 border-rose-300 text-rose-800 dark:text-rose-200"
            }`}>
              {testResult.success ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>✅ 텔레그램 연결 테스트 메시지가 성공적으로 발송되었습니다!</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>❌ 전송 실패: {testResult.error || "Token 또는 Chat ID를 다시 확인해주세요."}</span>
                </>
              )}
            </div>
          )}

          {/* Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                disabled={testingTelegram}
                onClick={() => handleTestTelegram(telegramConfig.chatId)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5 text-sky-500" />
                <span>{testingTelegram ? "전송 중..." : "통합방 연결 테스트 발송"}</span>
              </button>

              <button
                type="button"
                disabled={testingTelegram}
                onClick={() => handleTestTelegram(telegramConfig.pnlChatId)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5 text-purple-500" />
                <span>{testingTelegram ? "전송 중..." : "경영방 연결 테스트 발송"}</span>
              </button>
            </div>

            <div className="flex items-center gap-3">
              {savedConfigToast && (
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> 설정 저장 완료!
                </span>
              )}
              <button
                type="submit"
                className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 active:scale-95 transition-all cursor-pointer"
              >
                <span>설정 저장하기</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
