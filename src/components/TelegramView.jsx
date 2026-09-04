import React, { useState, useEffect } from "react";
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
  Briefcase
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import {
  getLocalTelegramConfig,
  saveTelegramConfig,
  subscribeTelegramConfig,
  testTelegramConnection,
  sendDailyMorningBriefingTelegram,
  sendDailyPnLBriefingTelegram,
  sendQualityAlertTelegram
} from "../services/telegramService";

export const TelegramView = () => {
  const { isAdmin, currentProfile } = useAuth();

  // Telegram Config State
  const [telegramConfig, setTelegramConfig] = useState(() => getLocalTelegramConfig());
  const [testingTelegram, setTestingTelegram] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [savedConfigToast, setSavedConfigToast] = useState(false);

  // Manual Trigger Action States
  const [sendingBriefing, setSendingBriefing] = useState(false);
  const [briefingToast, setBriefingToast] = useState(false);

  const [sendingPnL, setSendingPnL] = useState(false);
  const [pnlToast, setPnlToast] = useState(false);

  const [sendingQuality, setSendingQuality] = useState(false);
  const [qualityToast, setQualityToast] = useState(false);

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

  const handleSendDailyPnL = async () => {
    setSendingPnL(true);
    try {
      const res = await sendDailyPnLBriefingTelegram();
      if (res.success) {
        setPnlToast(true);
        setTimeout(() => setPnlToast(false), 3000);
      } else {
        alert("전송 실패: " + (res.error || "설정을 확인해주세요."));
      }
    } catch (err) {
      alert("오류 발생: " + err.message);
    } finally {
      setSendingPnL(false);
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
              품질경보 즉시발송, 전자결재 승인알림, 07:00 경영손익 브리핑, 07:30 현장 모닝브리핑을 자동 관리합니다.
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
            {telegramConfig.enabled ? "알림 연동 가동 중" : "알림 연동 비활성화"}
          </span>
        </div>
      </div>

      {/* 2-Channel Routing Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Channel 1: 경영방 */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border-2 border-indigo-500/30 dark:border-indigo-500/40 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                <Briefcase className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                  👑 경영/손익 전용 채널
                </h4>
                <p className="text-[11px] text-slate-400">
                  단톡방: <strong>경영방</strong> (ID: <code>{telegramConfig.pnlChatId || "미설정"}</code>)
                </p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
              07:00 자동발송
            </span>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
            📊 <strong>월간 손익(P&L) 결산 리포트 (스타일 A)</strong>: 총매출, 원자재비, 제조경비, 당월 영업이익 및 마진율(%)을 경영진에게만 안전하게 발송합니다.
          </p>

          <button
            type="button"
            disabled={sendingPnL}
            onClick={handleSendDailyPnL}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{sendingPnL ? "경영방으로 전송 중..." : "경영방으로 07:00 손익결산 즉시 발송"}</span>
          </button>
        </div>

        {/* Channel 2: 오륙 통합방 */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                  일반 현장 알림 채널
                </h4>
                <p className="text-[11px] text-slate-400">
                  단톡방: <strong>오륙 통합방</strong> (ID: <code>{telegramConfig.chatId || "미설정"}</code>)
                </p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
              07:30 / 실시간
            </span>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
            <strong>일일 모닝브리핑</strong> (연차+미결재+품질경보미조치) 및 <strong>품질경보/전자결재 실시간 알림</strong>이 전 임직원 통합방으로 전송됩니다.
          </p>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={sendingBriefing}
              onClick={handleSendDailyBriefing}
              className="flex items-center justify-center gap-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
            >
              <span>{sendingBriefing ? "전송 중..." : "07:30 모닝브리핑"}</span>
            </button>

            <button
              type="button"
              disabled={sendingQuality}
              onClick={handleSendQualityAlertTest}
              className="flex items-center justify-center gap-1 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
            >
              <span>{sendingQuality ? "전송 중..." : "품질경보 테스트"}</span>
            </button>
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
                텔레그램 Bot API 및 채널 ID 설정
              </h4>
              <p className="text-xs text-slate-400">
                설정값 변경 후 [설정 저장하기]를 누르면 즉시 전체 시스템에 동기화됩니다.
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
                ① 일반 현장 단톡방 Chat ID
              </label>
              <input
                type="text"
                placeholder="예: -4186792536 (오륙 통합방)"
                value={telegramConfig.chatId || ""}
                onChange={(e) => setTelegramConfig({ ...telegramConfig, chatId: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              />
              <p className="text-[10px] text-slate-400">
                품질경보/전자결재/07:30 모닝브리핑 수신방
              </p>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                ② 경영/손익 전용 Chat ID
              </label>
              <input
                type="text"
                placeholder="예: -1003939516875 (경영방)"
                value={telegramConfig.pnlChatId || ""}
                onChange={(e) => setTelegramConfig({ ...telegramConfig, pnlChatId: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-indigo-200 dark:border-indigo-900 bg-indigo-50/40 dark:bg-indigo-950/20 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
              />
              <p className="text-[10px] text-slate-400">
                07:00 월간 손익 결산 전용방 (경영진방)
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
              {pnlToast && (
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> 경영방 손익 전송 완료!
                </span>
              )}
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
          <span>오륙MES 텔레그램 자동 발송 스케줄 가이드</span>
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
            <span className="text-indigo-600 dark:text-indigo-400 font-bold">① 매일 07:00 (경영방)</span>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              당월 매출, 비용, 영업이익 및 마진율(%) 요약 손익 결산 리포트 발송
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
            <span className="text-amber-600 dark:text-amber-400 font-bold">② 매일 07:30 (오륙 통합방)</span>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              금일 연차자 명단, 전일 미결재 문서, 미삭제 품질경보 종합 모닝브리핑
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
            <span className="text-rose-600 dark:text-rose-400 font-bold">③ 실시간 (오륙 통합방)</span>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              품질경보 발생/조치/삭제, 전자결재 기안상신/승인/반려/보류 즉시 발송
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
