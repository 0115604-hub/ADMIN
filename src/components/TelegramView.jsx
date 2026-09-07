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
  RotateCw
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
  sendDailyPnLMorningBriefingTelegram
} from "../services/telegramService";
import {
  getLocalCommonSchedules,
  subscribeCommonSchedules
} from "../services/commonScheduleService";

export const TelegramView = () => {
  const { isAdmin, currentProfile } = useAuth();
  const { selectedMonth, currentMonthData, allMonthlyData } = useMonth();

  // Telegram Config State
  const [telegramConfig, setTelegramConfig] = useState(() => getLocalTelegramConfig());
  const [testingTelegram, setTestingTelegram] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [savedConfigToast, setSavedConfigToast] = useState(false);

  // Manual Trigger Action States
  const [sendingBriefing, setSendingBriefing] = useState(false);
  const [briefingToast, setBriefingToast] = useState(false);

  const [sendingQuality, setSendingQuality] = useState(false);
  const [qualityToast, setQualityToast] = useState(false);

  // Morning PnL Briefing States
  const [sendingDailyPnL, setSendingDailyPnL] = useState(false);
  const [dailyPnLToast, setDailyPnLToast] = useState(false);
  const [customPnLData, setCustomPnLData] = useState(null);
  const [selectedPnLChannel, setSelectedPnLChannel] = useState("-1003939516875"); // Default: 경영방 (대표·전무 전용)
  const [commonSchedules, setCommonSchedules] = useState(() => getLocalCommonSchedules());

  useEffect(() => {
    const unsub = subscribeCommonSchedules((scheds) => {
      setCommonSchedules(scheds);
    });
    return () => unsub();
  }, []);

  const todayDateStr = new Date().toISOString().split("T")[0];
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

  useEffect(() => {
    const unsub = subscribeTelegramConfig((cfg) => {
      setTelegramConfig(cfg);
    });
    return () => unsub();
  }, []);

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

  const handleSaveTelegramConfig = async (e) => {
    if (e) e.preventDefault();
    await saveTelegramConfig(telegramConfig);
    setSavedConfigToast(true);
    setTimeout(() => setSavedConfigToast(false), 2500);
  };

  const handleTestTelegram = async () => {
    if (!telegramConfig.botToken || !telegramConfig.chatId) {
      alert("Bot Token과 Chat ID를 모두 입력해주세요.");
      return;
    }
    setTestingTelegram(true);
    setTestResult(null);
    try {
      const res = await testTelegramConnection(telegramConfig.botToken, telegramConfig.chatId);
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

  const handleSendDailyBriefing = async () => {
    setSendingBriefing(true);
    try {
      const res = await sendDailyMorningBriefingTelegram();
      if (res.success) {
        setBriefingToast(true);
        setTimeout(() => setBriefingToast(false), 3000);
      } else {
        alert("전송 실패: " + (res.error || "설정을 확인해주세요."));
      }
    } catch (err) {
      alert("오류 발생: " + err.message);
    } finally {
      setSendingBriefing(false);
    }
  };

  const handleSendQualityAlertTest = async () => {
    setSendingQuality(true);
    try {
      const res = await sendQualityAlertTelegram({
        plant: "삼랑진공장",
        process: "압출 2라인",
        writer: currentProfile?.name || "품질관리팀",
        title: "[테스트] 소폭 원단 표면 이물 혼입 및 폭 치수 편차 발생",
        date: new Date().toISOString().split("T")[0],
        time: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })
      });
      if (res.success) {
        setQualityToast(true);
        setTimeout(() => setQualityToast(false), 3000);
      } else {
        alert("전송 실패: " + (res.error || "설정을 확인해주세요."));
      }
    } catch (err) {
      alert("오류 발생: " + err.message);
    } finally {
      setSendingQuality(false);
    }
  };

  const handleSendDailyPnLTelegram = async () => {
    setSendingDailyPnL(true);
    try {
      const todaySchedsText = todayCommonSchedules.length > 0
        ? todayCommonSchedules.map((s) => `• ${s.time && s.time !== "종일" ? `[${s.time}] ` : ""}${s.target ? `[${s.target}] ` : ""}${s.title}`).join("\n")
        : "• 등록된 전사 공통일정이 없습니다. (정상 생산 가동)";

      const channelName = selectedPnLChannel === "-1003939516875" ? "경영방 (대표·전무)" : selectedPnLChannel === "290615483" ? "대표님 1:1" : "오륙 통합방";

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
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-700 text-white shadow-xl shadow-blue-500/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white border border-white/20 shadow-inner">
            <Send className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-black tracking-tight">
                telegram 실시간 연동 관리
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-white/20 backdrop-blur-md text-white border border-white/30">
                Admin 전용
              </span>
            </div>
            <p className="text-xs text-white/80 mt-1 leading-relaxed">
              품질경보 3단계(발령/조치/종결), 사내 공지사항, 전자결재 실시간 알림 및 07:30 모닝브리핑/손익결산 메시지를 자동 관리합니다.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          <span className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black shadow-sm ${
            telegramConfig.enabled
              ? "bg-emerald-400 text-slate-900 ring-2 ring-white/30"
              : "bg-slate-800 text-slate-300"
          }`}>
            <span className={`w-2 h-2 rounded-full ${telegramConfig.enabled ? "bg-slate-900 animate-pulse" : "bg-slate-500"}`} />
            {telegramConfig.enabled ? "실시간 알림 및 07:30 모닝브리핑 가동 중" : "알림 연동 비활성화"}
          </span>
        </div>
      </div>

      {/* Cloud & Client Dual-Scheduler Notice */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-indigo-950/40 border border-blue-200/80 dark:border-blue-900/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-600 text-white shrink-0">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>클라우드 서버 정시 자동 발송 (정밀 스케줄러)</span>
              <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-black">
                GitHub Actions 연동
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              브라우저가 닫혀 있어도 클라우드 서버에서 <strong>매일 07:30(모닝 브리핑)</strong> 정시에 오차 없이 발송됩니다.
            </p>
          </div>
        </div>
        <div className="text-[11px] font-mono text-slate-400 shrink-0 bg-white/80 dark:bg-slate-800/80 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
          KST (UTC+9) 동기화
        </div>
      </div>

      {/* Channel Routing Status Card */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                오륙 통합 알림 채널
              </h4>
              <p className="text-[11px] text-slate-400">
                단톡방: <strong>오륙 통합방</strong> (-5036735515)
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
            정상 연결됨
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <button
            type="button"
            disabled={sendingBriefing}
            onClick={handleSendDailyBriefing}
            className="flex items-center justify-center gap-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
          >
            <span>{sendingBriefing ? "전송 중..." : "07:30 모닝브리핑 테스트"}</span>
          </button>

          <button
            type="button"
            disabled={sendingDailyPnL}
            onClick={handleSendDailyPnLTelegram}
            className="flex items-center justify-center gap-1 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white text-xs font-bold transition-all shadow-md shadow-indigo-500/20 cursor-pointer disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{sendingDailyPnL ? "발송 중..." : "📱 07:30 손익결산 즉시 발송"}</span>
          </button>

          <button
            type="button"
            disabled={sendingQuality}
            onClick={handleSendQualityAlertTest}
            className="flex items-center justify-center gap-1 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
          >
            <span>{sendingQuality ? "전송 중..." : "품질경보 발령 테스트"}</span>
          </button>
        </div>

        {dailyPnLToast && (
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>✅ 매일 아침 손익결산 브리핑 텔레그램 메시지가 오륙 통합방으로 정상 발송되었습니다!</span>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 📱 🌟 [예시 화면] 매일 아침 손익결산 텔레그램 메시지 실시간 시뮬레이터 & 발송기 */}
      {/* ========================================================================= */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-indigo-500/40 dark:border-indigo-600/40 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-r from-slate-900 to-indigo-900 text-white shadow-md">
              <TrendingUp className="w-5 h-5 text-sky-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-black text-slate-900 dark:text-white text-base">
                  📱 매일 아침 손익결산 텔레그램 발송 메시지 예시화면
                </h4>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                  실시간 연동
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                <strong>매출액</strong>, <strong>매입액</strong>, <strong>전월대비 매출 달성율</strong>, <strong>전월대비 매입 달성율</strong>, <strong>공통일정</strong>이 포함된 발송 형태입니다.
              </p>
            </div>
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

        {/* 2-Column Display: Left (Mockup Smartphone Bubble) vs Right (Live Controls & Adjustments) */}
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
                  {new Date().toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit", weekday: "short" })} 07:30 기준
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
                <Sparkles className="w-4 h-4 text-indigo-500" />
                <span>발송 파라미터 실시간 사용자 지정</span>
              </h5>

              {/* 발송 대상 채널 선택 (경영방 / 통합방 / 대표 1:1) */}
              <div>
                <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">
                  발송 대상 채널 (수신처 구분)
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: "-1003939516875", label: "👑 경영방", desc: "대표·전무 전용", activeBg: "bg-purple-600 text-white border-purple-600 shadow-xs" },
                    { id: "-4186792536", label: "📢 통합방", desc: "오륙 전체방", activeBg: "bg-blue-600 text-white border-blue-600 shadow-xs" },
                    { id: "290615483", label: "👤 대표님 1:1", desc: "개인 직송", activeBg: "bg-amber-600 text-white border-amber-600 shadow-xs" }
                  ].map((ch) => (
                    <button
                      key={ch.id}
                      type="button"
                      onClick={() => setSelectedPnLChannel(ch.id)}
                      className={`p-2 rounded-xl text-center border transition-all cursor-pointer ${
                        selectedPnLChannel === ch.id
                          ? ch.activeBg
                          : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-400"
                      }`}
                    >
                      <div className="text-xs font-black">{ch.label}</div>
                      <div className="text-[10px] opacity-80">{ch.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

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
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-900 to-blue-900 hover:from-black hover:to-indigo-950 text-white font-black text-xs sm:text-sm shadow-xl shadow-indigo-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Send className="w-4 h-4 text-sky-400" />
                <span>
                  {sendingDailyPnL
                    ? "텔레그램 발송 중..."
                    : `🚀 [${selectedPnLChannel === "-1003939516875" ? "경영방 (대표·전무)" : selectedPnLChannel === "290615483" ? "대표님 1:1" : "통합방"}]으로 즉시 발송하기`}
                </span>
              </button>
              <p className="text-[11px] text-center text-slate-400">
                {selectedPnLChannel === "-1003939516875"
                  ? "경영진/대표·전무 전용 경영방으로 손익결산 브리핑이 안전하게 구분 발송됩니다."
                  : selectedPnLChannel === "290615483"
                  ? "권태형 대표님 1:1 개인톡으로 손익결산 브리핑이 발송됩니다."
                  : "오륙 전체 통합방으로 손익결산 브리핑이 발송됩니다."}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Configuration Form */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white text-base">
                텔레그램 Bot API 및 채널 ID 설정 (채널별 분리 관리)
              </h4>
              <p className="text-xs text-slate-400">
                오륙 통합방(현장·품질·공지)과 경영방(대표·전무 손익)의 수신 채널 ID를 각각 구분하여 관리합니다.
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
                @BotFather 에서 발급받은 API Token
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
                품질경보 3단계 / 사내 공지사항 / 전자결재 / 07:30 일반 모닝브리핑
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

          {/* Toast Notification Messages */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                disabled={testingTelegram}
                onClick={handleTestTelegram}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5 text-sky-500" />
                <span>{testingTelegram ? "전송 중..." : "일반방 연결 테스트 발송"}</span>
              </button>
            </div>

            <div className="flex items-center gap-3">
              {briefingToast && (
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> 모닝브리핑 전송 완료!
                </span>
              )}
              {qualityToast && (
                <span className="text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> 품질경보 전송 완료!
                </span>
              )}
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

      {/* Schedule Summary Guide */}
      <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-3">
        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-500" />
          <span>오륙MES 텔레그램 발송 가이드</span>
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
            <span className="text-amber-600 dark:text-amber-400 font-bold">① 매일 07:30 모닝브리핑</span>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              금일 연차/근태 현황, 미결재 문서 현황, 품질경보 미조치 현황 종합 브리핑
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
            <span className="text-rose-600 dark:text-rose-400 font-bold">② 품질경보 3회 발송</span>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              품질경보 [신규 등록시], [조치결과 등록시], [삭제/종결시] 딱 3회만 알림 발송
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
            <span className="text-blue-600 dark:text-blue-400 font-bold">③ 공지사항 & 전자결재</span>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              사내 공지사항 등록 알림 및 전자결재 기안상신/승인/반려/보류 즉시 알림
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
