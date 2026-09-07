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
  CheckSquare
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

  // Active Dispatch Management Tab: "morning" | "pnl" | "quality"
  const [activeDispatchTab, setActiveDispatchTab] = useState("morning");

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
  // 1. 모닝브리핑 실시간 데이터 파싱 (Morning Briefing Data)
  // ----------------------------------------------------
  const [selectedMorningChannel, setSelectedMorningChannel] = useState("-4186792536"); // Default: 오륙 통합방
  const [sendingMorning, setSendingMorning] = useState(false);
  const [morningToast, setMorningToast] = useState(false);

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

  // ----------------------------------------------------
  // 2. 경영정보 실시간 데이터 파싱 (PnL Financial Briefing Data)
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

  // ----------------------------------------------------
  // 3. 품질경보 / 공지사항 / 회의일정 3단계 테스트 데이터
  // ----------------------------------------------------
  const [selectedQualityChannel, setSelectedQualityChannel] = useState("-4186792536"); // Default: 오륙 통합방
  const [qualityCategory, setQualityCategory] = useState("품질경보"); // "품질경보" | "공지사항" | "회의일정"
  const [qualityStage, setQualityStage] = useState("1"); // "1": 발령/등록, "2": 조치/회신, "3": 종결/삭제
  const [qualityPlant, setQualityPlant] = useState("삼랑진공장");
  const [qualityWriter, setQualityWriter] = useState(currentProfile?.name || "이명재 이사");
  const [qualityTitle, setQualityTitle] = useState("[긴급] 소폭 원단 표면 이물 혼입 및 폭 치수 편차 발생");
  const [qualityContent, setQualityContent] = useState("압출 2라인 생산 중 폭 편차(±3mm 초과) 및 미세 흑점 이물 발견되어 즉시 점검 필요");
  const [qualityActionContent, setQualityActionContent] = useState("압출 2라인 다이스 클리닝 및 스크류 필터 80mesh 교체 완료, 치수 정상 범위 복구됨 (조치율 100%)");
  const [qualityDeleteReason, setQualityDeleteReason] = useState("현장 정상화 확인 및 최종 검사 통과로 종결 처리");
  const [sendingQuality, setSendingQuality] = useState(false);
  const [qualityToast, setQualityToast] = useState(false);

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

  // 1. 모닝브리핑 발송
  const handleSendMorningBriefing = async () => {
    setSendingMorning(true);
    try {
      const res = await sendDailyMorningBriefingTelegram(todayDateStr, selectedMorningChannel);
      if (res.success) {
        setMorningToast(true);
        setTimeout(() => setMorningToast(false), 3500);
      } else {
        alert("전송 실패: " + (res.error || "설정을 확인해주세요."));
      }
    } catch (err) {
      alert("오류 발생: " + err.message);
    } finally {
      setSendingMorning(false);
    }
  };

  // 2. 경영정보(손익결산) 발송
  const handleSendDailyPnLTelegram = async () => {
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

  // 3. 품질경보 / 공지 / 회의 발송
  const handleSendQualityAlertTest = async () => {
    setSendingQuality(true);
    try {
      let res;
      const issuePayload = {
        plant: qualityPlant,
        writer: qualityWriter,
        author: qualityWriter,
        title: qualityTitle,
        content: qualityContent,
        category: qualityCategory,
        date: todayDateStr,
        time: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false })
      };

      if (qualityStage === "1") {
        res = await sendQualityAlertTelegram(issuePayload, selectedQualityChannel);
      } else if (qualityStage === "2") {
        res = await sendQualityActionTelegram(issuePayload, {
          actionAuthor: qualityWriter,
          actionContent: qualityActionContent,
          actionRate: 100
        }, selectedQualityChannel);
      } else {
        res = await sendQualityDeleteTelegram({
          ...issuePayload,
          deleteReason: qualityDeleteReason
        }, currentProfile?.name || qualityWriter, selectedQualityChannel);
      }

      if (res.success) {
        setQualityToast(true);
        setTimeout(() => setQualityToast(false), 3500);
      } else {
        alert("전송 실패: " + (res.error || "설정을 확인해주세요."));
      }
    } catch (err) {
      alert("오류 발생: " + err.message);
    } finally {
      setSendingQuality(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 animate-fadeIn">
      {/* ========================================================================= */}
      {/* 🚀 발송관리 통합 메인 헤더 & 3-Tab 네비게이션 */}
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
                  발송관리
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                모닝브리핑 • 경영정보(손익) • 품질경보 3개 영역별 실시간 발송 및 채널 관리
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

        {/* 🌟 3대 발송관리 탭 (모닝브리핑 / 경영정보 / 품질경보) */}
        <div className="grid grid-cols-3 gap-2 p-1.5 rounded-2xl bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80">
          <button
            type="button"
            onClick={() => setActiveDispatchTab("morning")}
            className={`flex flex-col sm:flex-row items-center justify-center gap-2 py-3 px-3 rounded-xl font-black text-xs sm:text-sm transition-all cursor-pointer ${
              activeDispatchTab === "morning"
                ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-sky-400 shadow-md border border-slate-200/80 dark:border-slate-700"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <CalendarDays className="w-4 h-4 shrink-0" />
            <span>모닝브리핑</span>
            <span className="hidden md:inline-block text-[10px] opacity-75 font-normal">
              (07:30 일반)
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveDispatchTab("pnl")}
            className={`flex flex-col sm:flex-row items-center justify-center gap-2 py-3 px-3 rounded-xl font-black text-xs sm:text-sm transition-all cursor-pointer ${
              activeDispatchTab === "pnl"
                ? "bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-md border border-slate-200/80 dark:border-slate-700"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <TrendingUp className="w-4 h-4 shrink-0" />
            <span>경영정보</span>
            <span className="hidden md:inline-block text-[10px] opacity-75 font-normal">
              (07:30 손익결산)
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveDispatchTab("quality")}
            className={`flex flex-col sm:flex-row items-center justify-center gap-2 py-3 px-3 rounded-xl font-black text-xs sm:text-sm transition-all cursor-pointer ${
              activeDispatchTab === "quality"
                ? "bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-md border border-slate-200/80 dark:border-slate-700"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>품질경보</span>
            <span className="hidden md:inline-block text-[10px] opacity-75 font-normal">
              (품질•공지•회의)
            </span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 📋 TAB 1: 모닝브리핑 발송 관리 */}
      {/* ========================================================================= */}
      {activeDispatchTab === "morning" && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-blue-500/40 dark:border-blue-600/40 shadow-xl space-y-5 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-black text-slate-900 dark:text-white text-base">
                  📋 일일 모닝브리핑 발송 관리
                </h4>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                  매일 07:30 정시 발송
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                매일 아침 07:30 <strong>근태/휴가 현황</strong>, <strong>전자결재 미결재</strong>, <strong>조치대기 품질경보</strong> 현황을 통합 발송합니다.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-black">
                {todayDateStr} ({dayName})
              </span>
            </div>
          </div>

          {/* 발송 대상 채널 선택 (수신처 구분) */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
            <label className="font-bold text-slate-700 dark:text-slate-300 block text-xs">
              발송할 곳 (수신 채널 선택)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[
                { id: "-4186792536", label: "📢 오륙 통합방", desc: "오륙 전체방 (기본 채널)", activeBg: "bg-blue-600 text-white border-blue-600 shadow-sm" },
                { id: "-1003939516875", label: "👑 경영방", desc: "대표·전무 전용 채널", activeBg: "bg-purple-600 text-white border-purple-600 shadow-sm" },
                { id: "290615483", label: "👤 대표님 1:1", desc: "권태형 대표님 개인 직송", activeBg: "bg-amber-600 text-white border-amber-600 shadow-sm" }
              ].map((ch) => (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => setSelectedMorningChannel(ch.id)}
                  className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer flex items-center justify-between ${
                    selectedMorningChannel === ch.id
                      ? ch.activeBg
                      : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-400"
                  }`}
                >
                  <div>
                    <div className="text-xs font-black">{ch.label}</div>
                    <div className="text-[10px] opacity-80">{ch.desc}</div>
                  </div>
                  {selectedMorningChannel === ch.id && (
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* 2-Column: Left Telegram Smartphone Mockup vs Right Actions & Live Info */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Left: Smartphone Telegram Mockup (7 cols) */}
            <div className="lg:col-span-7 bg-slate-950 text-slate-100 rounded-3xl p-5 border border-slate-800 shadow-2xl space-y-3 font-sans">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 text-xs text-slate-400">
                <div className="flex items-center gap-2 font-bold">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>
                    {selectedMorningChannel === "-4186792536"
                      ? "📢 오륙 통합방 (전체 채널)"
                      : selectedMorningChannel === "-1003939516875"
                      ? "👑 경영방 (대표·전무 전용)"
                      : "👤 권태형 대표님 1:1 대화방"}
                  </span>
                </div>
                <span className="text-[11px] font-mono text-slate-400">매일 07:30 정시 발송</span>
              </div>

              {/* Telegram Message Mockup Bubble */}
              <div className="bg-slate-900/90 rounded-2xl p-4 sm:p-5 border border-slate-700/80 space-y-3.5 text-xs leading-relaxed shadow-lg">
                <div>
                  <div className="font-black text-sm sm:text-base text-white flex items-center gap-1.5">
                    <span>⬛ [오륙 생산관리] 일일 모닝 브리핑</span>
                  </div>
                  <div className="text-xs font-extrabold text-sky-400 mt-1">
                    {dateFormatted} 기준
                  </div>
                </div>

                <div className="border-t border-slate-800 pt-3 space-y-3">
                  {/* [1] 근태 / 휴가 현황 */}
                  <div>
                    <div className="font-black text-emerald-400 text-xs sm:text-[13px] mb-1.5 flex items-center gap-1">
                      <span>[1] 근태 / 휴가 현황</span>
                    </div>
                    <div className="pl-2 text-slate-200">
                      • {morningLeaveSummary}
                    </div>
                  </div>

                  {/* [2] 미결재 현황 */}
                  <div>
                    <div className="font-black text-amber-400 text-xs sm:text-[13px] mb-1.5 flex items-center gap-1">
                      <span>[2] 미결재 현황</span>
                    </div>
                    <div className="pl-2 text-slate-200">
                      • {morningApprovalSummary}
                    </div>
                  </div>

                  {/* [3] 품질경보 / 공지 현황 */}
                  <div>
                    <div className="font-black text-rose-400 text-xs sm:text-[13px] mb-1.5 flex items-center gap-1">
                      <span>[3] 품질경보 / 공지 현황</span>
                    </div>
                    <div className="pl-2 text-slate-200">
                      • {morningUrgentSummary}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                  <span className="text-blue-400 underline cursor-pointer hover:text-blue-300 font-bold">
                    생산관리시스템 바로가기
                  </span>
                  <span className="text-[11px] text-slate-500">오륙 텔레그램 알림봇</span>
                </div>
              </div>
            </div>

            {/* Right: Live Data Cards & Send Action (5 cols) */}
            <div className="lg:col-span-5 space-y-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                <h5 className="font-black text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-blue-500" />
                  <span>오늘의 모닝브리핑 집계 현황</span>
                </h5>

                <div className="space-y-2.5">
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Palmtree className="w-4 h-4 text-emerald-500" />
                      <span className="font-bold text-slate-700 dark:text-slate-300">오늘 휴가/근태</span>
                    </div>
                    <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm">
                      {morningLeaves.length}명
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileCheck className="w-4 h-4 text-amber-500" />
                      <span className="font-bold text-slate-700 dark:text-slate-300">미결재 결재/일지</span>
                    </div>
                    <span className="font-black text-amber-600 dark:text-amber-400 text-sm">
                      {morningApprovalDocs.length + morningWorkLogs.length}건
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-500" />
                      <span className="font-bold text-slate-700 dark:text-slate-300">조치 대기 품질경보</span>
                    </div>
                    <span className="font-black text-rose-600 dark:text-rose-400 text-sm">
                      {morningUrgentIssues.length}건
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 text-[11px] text-blue-900 dark:text-blue-300 leading-relaxed">
                  💡 클라우드 서버에서 매일 아침 07:30 정시에 최신 결재/근태/품질 데이터를 자동으로 취합하여 지정 채널로 발송합니다.
                </div>
              </div>

              {/* Direct Trigger Button */}
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  disabled={sendingMorning}
                  onClick={handleSendMorningBriefing}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-xs sm:text-sm shadow-xl shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-4 h-4 text-sky-200" />
                  <span>
                    {sendingMorning
                      ? "텔레그램 발송 중..."
                      : `🚀 [${selectedMorningChannel === "-4186792536" ? "오륙 통합방" : selectedMorningChannel === "-1003939516875" ? "경영방" : "대표님 1:1"}]으로 즉시 발송`}
                  </span>
                </button>

                {morningToast && (
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2 animate-fadeIn">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>✅ 일일 모닝브리핑 메시지가 정상적으로 발송되었습니다!</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 📈 TAB 2: 경영정보 (손익결산 브리핑) 발송 관리 */}
      {/* ========================================================================= */}
      {activeDispatchTab === "pnl" && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-purple-500/40 dark:border-purple-600/40 shadow-xl space-y-5 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-black text-slate-900 dark:text-white text-base">
                  📈 아침 손익결산 브리핑 발송 관리
                </h4>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                  경영진/임원 전용
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                매일 아침 07:30 <strong>매출/매입액</strong>, <strong>원가율</strong>, <strong>전월대비 달성율</strong>, <strong>전사 공통일정</strong>을 브리핑합니다.
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

          {/* 발송 대상 채널 선택 (수신처 구분) */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
            <label className="font-bold text-slate-700 dark:text-slate-300 block text-xs">
              발송할 곳 (수신 채널 선택)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[
                { id: "-1003939516875", label: "👑 경영방", desc: "대표·전무 전용 (기본 채널)", activeBg: "bg-purple-600 text-white border-purple-600 shadow-sm" },
                { id: "-4186792536", label: "📢 오륙 통합방", desc: "오륙 전체방", activeBg: "bg-blue-600 text-white border-blue-600 shadow-sm" },
                { id: "290615483", label: "👤 대표님 1:1", desc: "권태형 대표님 개인 직송", activeBg: "bg-amber-600 text-white border-amber-600 shadow-sm" }
              ].map((ch) => (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => setSelectedPnLChannel(ch.id)}
                  className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer flex items-center justify-between ${
                    selectedPnLChannel === ch.id
                      ? ch.activeBg
                      : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-400"
                  }`}
                >
                  <div>
                    <div className="text-xs font-black">{ch.label}</div>
                    <div className="text-[10px] opacity-80">{ch.desc}</div>
                  </div>
                  {selectedPnLChannel === ch.id && (
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* 2-Column Display: Left Mockup vs Right Inputs */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Left: Smartphone Telegram Mockup (7 cols) */}
            <div className="lg:col-span-7 bg-slate-950 text-slate-100 rounded-3xl p-5 border border-slate-800 shadow-2xl space-y-3 font-sans">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 text-xs text-slate-400">
                <div className="flex items-center gap-2 font-bold">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>
                    {selectedPnLChannel === "-1003939516875"
                      ? "👑 경영방 (대표·전무 전용 채널)"
                      : selectedPnLChannel === "290615483"
                      ? "👤 권태형 대표님 1:1 대화방"
                      : "📢 오륙 통합방 채널"}
                  </span>
                </div>
                <span className="text-[11px] font-mono text-slate-400">매일 07:30 정기 브리핑</span>
              </div>

              {/* Telegram Message Box */}
              <div className="bg-slate-900/90 rounded-2xl p-4 sm:p-5 border border-slate-700/80 space-y-3.5 text-xs leading-relaxed shadow-lg">
                <div>
                  <div className="font-black text-sm sm:text-base text-white flex items-center gap-1.5">
                    <span>⬛ [오륙 {selectedPnLChannel === "-1003939516875" || selectedPnLChannel === "290615483" ? "경영진/임원" : "경영정보"}] 일일 아침 손익결산 브리핑</span>
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

            {/* Right: Customization Controls (5 cols) */}
            <div className="lg:col-span-5 space-y-3.5 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                <h5 className="font-black text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-purple-500" />
                  <span>발송 파라미터 실시간 사용자 지정</span>
                </h5>

                {/* 매출액 */}
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

                {/* 매입액 */}
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

                {/* 매출 달성율 */}
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

                {/* 매입 달성율 */}
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

                {/* 공통일정 문구 */}
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

              {/* Direct Trigger Button */}
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  disabled={sendingDailyPnL}
                  onClick={handleSendDailyPnLTelegram}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-slate-900 via-purple-900 to-indigo-900 hover:from-black hover:to-purple-950 text-white font-black text-xs sm:text-sm shadow-xl shadow-purple-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-4 h-4 text-purple-300" />
                  <span>
                    {sendingDailyPnL
                      ? "텔레그램 발송 중..."
                      : `🚀 [${selectedPnLChannel === "-1003939516875" ? "경영방 (대표·전무)" : selectedPnLChannel === "290615483" ? "대표님 1:1" : "통합방"}]으로 즉시 발송`}
                  </span>
                </button>

                {dailyPnLToast && (
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2 animate-fadeIn">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>✅ 매일 아침 손익결산 브리핑 텔레그램 메시지가 정상 발송되었습니다!</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🚨 TAB 3: 품질경보 / 공지사항 / 회의일정 발송 관리 */}
      {/* ========================================================================= */}
      {activeDispatchTab === "quality" && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-rose-500/40 dark:border-rose-600/40 shadow-xl space-y-5 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-black text-slate-900 dark:text-white text-base">
                  🚨 품질경보 • 사내공지 • 회의일정 발송 관리
                </h4>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                  3단계 실시간 알림
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                현장 이슈 및 공지 등록 시 <strong>1단계(신규 발령)</strong>, <strong>2단계(조치완료/회신)</strong>, <strong>3단계(종결/삭제)</strong>의 실시간 메시지를 미리 확인하고 테스트합니다.
              </p>
            </div>
          </div>

          {/* 발송 대상 채널 선택 */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
            <label className="font-bold text-slate-700 dark:text-slate-300 block text-xs">
              발송할 곳 (수신 채널 선택)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[
                { id: "-4186792536", label: "📢 오륙 통합방", desc: "현장·품질 메인 채널 (기본)", activeBg: "bg-blue-600 text-white border-blue-600 shadow-sm" },
                { id: "-1003939516875", label: "👑 경영방", desc: "대표·전무 전용 채널", activeBg: "bg-purple-600 text-white border-purple-600 shadow-sm" },
                { id: "290615483", label: "👤 대표님 1:1", desc: "권태형 대표님 개인 직송", activeBg: "bg-amber-600 text-white border-amber-600 shadow-sm" }
              ].map((ch) => (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => setSelectedQualityChannel(ch.id)}
                  className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer flex items-center justify-between ${
                    selectedQualityChannel === ch.id
                      ? ch.activeBg
                      : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-400"
                  }`}
                >
                  <div>
                    <div className="text-xs font-black">{ch.label}</div>
                    <div className="text-[10px] opacity-80">{ch.desc}</div>
                  </div>
                  {selectedQualityChannel === ch.id && (
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* 분류 & 단계 선택 바 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 구분 (품질경보 / 사내공지 / 회의일정) */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 dark:text-slate-300 text-xs">
                항목 분류
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { key: "품질경보", label: "🟥 품질경보", activeCls: "bg-rose-600 text-white border-rose-600" },
                  { key: "공지사항", label: "🟩 사내공지", activeCls: "bg-emerald-600 text-white border-emerald-600" },
                  { key: "회의일정", label: "🟪 회의일정", activeCls: "bg-purple-600 text-white border-purple-600" }
                ].map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => {
                      setQualityCategory(item.key);
                      if (item.key === "품질경보") {
                        setQualityTitle("[긴급] 소폭 원단 표면 이물 혼입 및 폭 치수 편차 발생");
                      } else if (item.key === "공지사항") {
                        setQualityTitle("[공지] 현장 안전보호구 착용 및 정리정돈 협조 요청");
                      } else {
                        setQualityTitle("[회의] 2026년 9월 생산품질 향상 긴급 대책회의");
                      }
                    }}
                    className={`py-2 px-2 rounded-xl text-center text-xs font-black border transition-all cursor-pointer ${
                      qualityCategory === item.key
                        ? item.activeCls
                        : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-400"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 단계 (1단계 신규등록 / 2단계 조치보고 / 3단계 종결삭제) */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 dark:text-slate-300 text-xs">
                알림 단계 (라이프사이클)
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { key: "1", label: "1단계 (신규)", desc: "등록시", activeCls: "bg-slate-900 text-white dark:bg-white dark:text-slate-900" },
                  { key: "2", label: "2단계 (조치)", desc: "완료보고", activeCls: "bg-blue-600 text-white" },
                  { key: "3", label: "3단계 (종결)", desc: "삭제처리", activeCls: "bg-amber-600 text-white" }
                ].map((st) => (
                  <button
                    key={st.key}
                    type="button"
                    onClick={() => setQualityStage(st.key)}
                    className={`py-2 px-2 rounded-xl text-center text-xs font-black border transition-all cursor-pointer ${
                      qualityStage === st.key
                        ? st.activeCls
                        : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-400"
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 2-Column Display: Left Mockup vs Right Inputs */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Left: Smartphone Telegram Mockup (7 cols) */}
            <div className="lg:col-span-7 bg-slate-950 text-slate-100 rounded-3xl p-5 border border-slate-800 shadow-2xl space-y-3 font-sans">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 text-xs text-slate-400">
                <div className="flex items-center gap-2 font-bold">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>
                    {selectedQualityChannel === "-4186792536"
                      ? "📢 오륙 통합방 (현장 채널)"
                      : selectedQualityChannel === "-1003939516875"
                      ? "👑 경영방 (대표·전무 전용)"
                      : "👤 권태형 대표님 1:1 대화방"}
                  </span>
                </div>
                <span className="text-[11px] font-mono text-slate-400">
                  {qualityStage === "1" ? "1단계 신규 알림" : qualityStage === "2" ? "2단계 조치 알림" : "3단계 종결 알림"}
                </span>
              </div>

              {/* Telegram Message Box Rendered Preview */}
              <div className="bg-slate-900/90 rounded-2xl p-4 sm:p-5 border border-slate-700/80 space-y-3 text-xs leading-relaxed shadow-lg">
                {/* 1단계: 신규 등록 */}
                {qualityStage === "1" && (
                  <>
                    <div className="font-black text-sm sm:text-base text-white">
                      {qualityCategory === "품질경보" && <span className="text-rose-400">🟥 [품질경보] 긴급 확인 및 점검 요망</span>}
                      {qualityCategory === "공지사항" && <span className="text-emerald-400">🟩 [사내 공지사항] 업무 협조 안내</span>}
                      {qualityCategory === "회의일정" && <span className="text-purple-400">🟪 [사내 회의일정] 회의 및 일정 안내</span>}
                    </div>
                    <div className="border-t border-slate-800 pt-2.5 space-y-1 text-slate-200">
                      <div>• <strong>공장:</strong> {qualityPlant}</div>
                      <div>• <strong>{qualityCategory === "회의일정" ? "등록자" : qualityCategory === "공지사항" ? "공지자" : "작성자"}:</strong> <strong>{qualityWriter}</strong></div>
                      <div>• <strong>제목:</strong> <strong>{qualityTitle}</strong></div>
                      {qualityContent && (
                        <div className="pt-1.5 pb-1">
                          <span className="font-bold text-slate-400">[{qualityCategory === "회의일정" ? "회의 안건" : "전달 내용"}]</span>
                          <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-slate-300 mt-1 whitespace-pre-wrap">
                            {qualityContent}
                          </div>
                        </div>
                      )}
                      <div>• <strong>발령일시:</strong> {todayDateStr} {new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}</div>
                    </div>
                    {qualityCategory === "품질경보" && (
                      <div className="text-[11px] text-amber-300/90 bg-amber-950/30 p-2 rounded-lg border border-amber-900/50">
                        ※ 조치 완료 후 시스템에서 [조치결과]를 등록해 주세요.
                      </div>
                    )}
                  </>
                )}

                {/* 2단계: 조치완료 / 결과보고 */}
                {qualityStage === "2" && (
                  <>
                    <div className="font-black text-sm sm:text-base text-white">
                      {qualityCategory === "품질경보" && <span className="text-rose-400">🟥 [품질경보 조치완료 보고]</span>}
                      {qualityCategory === "공지사항" && <span className="text-emerald-400">🟩 [사내 공지 조치/진행 완료]</span>}
                      {qualityCategory === "회의일정" && <span className="text-purple-400">🟪 [사내 회의결과 보고]</span>}
                    </div>
                    <div className="border-t border-slate-800 pt-2.5 space-y-1 text-slate-200">
                      <div>• <strong>공장:</strong> {qualityPlant}</div>
                      <div>• <strong>대상:</strong> <strong>{qualityTitle}</strong></div>
                      <div>• <strong>조치자:</strong> <strong>{qualityWriter}</strong></div>
                      <div className="pt-1.5 pb-1">
                        <span className="font-bold text-slate-400">[조치 내용]</span>
                        <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-slate-300 mt-1 whitespace-pre-wrap">
                          {qualityActionContent}
                        </div>
                      </div>
                      <div>• <strong>완료일시:</strong> {todayDateStr} {new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}</div>
                    </div>
                  </>
                )}

                {/* 3단계: 종결 / 삭제 알림 */}
                {qualityStage === "3" && (
                  <>
                    <div className="font-black text-sm sm:text-base text-white">
                      {qualityCategory === "품질경보" && <span className="text-rose-400">🟥 [품질경보 종결/삭제 알림]</span>}
                      {qualityCategory === "공지사항" && <span className="text-emerald-400">🟩 [공지사항 종결/삭제 알림]</span>}
                      {qualityCategory === "회의일정" && <span className="text-purple-400">🟪 [회의일정 종결/삭제 알림]</span>}
                    </div>
                    <div className="border-t border-slate-800 pt-2.5 space-y-1 text-slate-200">
                      <div>• <strong>공장:</strong> {qualityPlant}</div>
                      <div>• <strong>대상:</strong> <strong>{qualityTitle}</strong></div>
                      <div>• <strong>삭제권한자:</strong> <strong>{qualityWriter}</strong></div>
                      <div>• <strong>종결사유:</strong> {qualityDeleteReason}</div>
                      <div>• <strong>삭제일시:</strong> {todayDateStr} {new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}</div>
                    </div>
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

            {/* Right: Customization Controls (5 cols) */}
            <div className="lg:col-span-5 space-y-3.5 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                <h5 className="font-black text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-rose-500" />
                  <span>테스트 파라미터 사용자 지정</span>
                </h5>

                {/* 공장 선택 */}
                <div>
                  <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">대상 공장</label>
                  <div className="grid grid-cols-2 gap-2">
                    {["삼랑진공장", "한림공장"].map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setQualityPlant(p)}
                        className={`py-1.5 px-3 rounded-xl border text-xs font-bold transition-all ${
                          qualityPlant === p
                            ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-slate-900 dark:border-white"
                            : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 작성자 / 권한자 */}
                <div>
                  <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    {qualityStage === "3" ? "삭제/종결 권한자" : qualityStage === "2" ? "조치자" : "작성자"}
                  </label>
                  <input
                    type="text"
                    value={qualityWriter}
                    onChange={(e) => setQualityWriter(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-white"
                  />
                </div>

                {/* 제목 */}
                <div>
                  <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">알림 제목</label>
                  <input
                    type="text"
                    value={qualityTitle}
                    onChange={(e) => setQualityTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-white"
                  />
                </div>

                {/* 세부 내용 (1단계) */}
                {qualityStage === "1" && (
                  <div>
                    <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">상세 내용 / 안건</label>
                    <textarea
                      rows="2"
                      value={qualityContent}
                      onChange={(e) => setQualityContent(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium text-slate-900 dark:text-white text-xs"
                    ></textarea>
                  </div>
                )}

                {/* 조치 내용 (2단계) */}
                {qualityStage === "2" && (
                  <div>
                    <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">조치 내용 / 결과</label>
                    <textarea
                      rows="2"
                      value={qualityActionContent}
                      onChange={(e) => setQualityActionContent(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium text-slate-900 dark:text-white text-xs"
                    ></textarea>
                  </div>
                )}

                {/* 종결 사유 (3단계) */}
                {qualityStage === "3" && (
                  <div>
                    <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">종결 / 삭제 사유</label>
                    <input
                      type="text"
                      value={qualityDeleteReason}
                      onChange={(e) => setQualityDeleteReason(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-white"
                    />
                  </div>
                )}
              </div>

              {/* Direct Trigger Button */}
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  disabled={sendingQuality}
                  onClick={handleSendQualityAlertTest}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-rose-600 via-pink-600 to-amber-600 hover:from-rose-700 hover:to-pink-700 text-white font-black text-xs sm:text-sm shadow-xl shadow-rose-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-4 h-4 text-rose-200" />
                  <span>
                    {sendingQuality
                      ? "텔레그램 발송 중..."
                      : `🚀 [${qualityCategory} ${qualityStage}단계] 테스트 발송`}
                  </span>
                </button>

                {qualityToast && (
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2 animate-fadeIn">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>✅ [${qualityCategory} ${qualityStage}단계] 텔레그램 메시지가 정상 발송되었습니다!</span>
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
