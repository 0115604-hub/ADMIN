import React, { useState, useEffect } from "react";
import {
  Settings,
  Flame,
  Database,
  ShieldCheck,
  Download,
  Upload,
  RefreshCw,
  Copy,
  Check,
  Send,
  Bell,
  AlertTriangle,
  MessageSquare,
  CheckCircle2,
  ExternalLink
} from "lucide-react";
import { firebaseConfig } from "../firebase";
import {
  getLocalTelegramConfig,
  saveTelegramConfig,
  subscribeTelegramConfig,
  testTelegramConnection,
  sendDailyLeaveBriefingTelegram,
  sendDailyPnLBriefingTelegram
} from "../services/telegramService";

export const SettingsView = ({ transactions, onRefresh, dataSource }) => {
  const [copied, setCopied] = useState(false);

  // Telegram Config State
  const [telegramConfig, setTelegramConfig] = useState(() => getLocalTelegramConfig());
  const [testingTelegram, setTestingTelegram] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [savedConfigToast, setSavedConfigToast] = useState(false);

  useEffect(() => {
    const unsub = subscribeTelegramConfig((cfg) => {
      setTelegramConfig(cfg);
    });
    return () => unsub();
  }, []);

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
        // Auto-save on successful test
        await saveTelegramConfig(telegramConfig);
      }
    } catch (err) {
      setTestResult({ success: false, error: err.message });
    } finally {
      setTestingTelegram(false);
    }
  };

  const [sendingBriefing, setSendingBriefing] = useState(false);
  const [briefingToast, setBriefingToast] = useState(false);

  const [sendingPnL, setSendingPnL] = useState(false);
  const [pnlToast, setPnlToast] = useState(false);

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

  const handleSendDailyLeaveBriefing = async () => {
    setSendingBriefing(true);
    try {
      const res = await sendDailyLeaveBriefingTelegram();
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

  const handleCopyConfig = () => {
    navigator.clipboard.writeText(JSON.stringify(firebaseConfig, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportJSON = () => {
    const dataStr = JSON.stringify(transactions, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `pnl_backup_${new Date().toISOString().split("T")[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span>시스템 & 텔레그램 연동 설정</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            품질경보 텔레그램 실시간 알림 봇, Firebase 백엔드 및 로컬 데이터 저장소 관리
          </p>
        </div>
      </div>

      {/* 🚀 Telegram Bot Integration Settings */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border-2 border-blue-500/30 dark:border-blue-500/20 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-sky-50 dark:bg-sky-500/10 text-sky-500">
              <Send className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-slate-900 dark:text-white text-base">
                  텔레그램(Telegram) 실시간 알림 연동
                </h4>
                <span className="px-2 py-0.5 rounded-full text-[10.5px] font-black bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                  품질경보 즉시 발송
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                품질경보 즉시발송(등록/조치/삭제), 전자결재 실시간 알림, 매일 아침 07:30 통합 모닝브리핑을 전송합니다.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
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
        </div>

        {/* Inputs */}
        <form onSubmit={handleSaveTelegramConfig} className="space-y-3.5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
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
                ① 일반 알림 단톡방 Chat ID (필수)
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
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span>② 경영/손익(P&L) 전용 Chat ID</span>
                <span className="text-[10px] text-blue-600 font-normal">선택사항</span>
              </label>
              <input
                type="text"
                placeholder="미입력 시 ①번 방으로 통합 발송"
                value={telegramConfig.pnlChatId || ""}
                onChange={(e) => setTelegramConfig({ ...telegramConfig, pnlChatId: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/40 dark:bg-blue-950/20 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              />
              <p className="text-[10px] text-slate-400">
                07:00 월간 손익 결산 전용방 (경영진방/1:1)
              </p>
            </div>
          </div>

          {/* Guide Box */}
          <div className="p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/60 text-xs space-y-1 text-slate-700 dark:text-slate-300">
            <p className="font-bold text-blue-900 dark:text-blue-300 flex items-center gap-1">
              <span>💡 텔레그램 봇 및 그룹방 연동 가이드:</span>
            </p>
            <ol className="list-decimal list-inside space-y-0.5 text-[11px] text-slate-600 dark:text-slate-400 pl-1">
              <li>현재 <strong>@oryuk_alert_bot (오륙MES알림)</strong>이 설정되어 있습니다.</li>
              <li><strong>매일 아침 07:00</strong>: 📊 <strong>월간 손익(P&L) 결산 브리핑(스타일 A)</strong> 자동 발송 (경영/손익 전용방 또는 기본방)</li>
              <li><strong>매일 아침 07:30</strong>: 🌅 <strong>일일 근태/미결재/품질경보 모닝브리핑</strong> 자동 발송 (오륙 통합방)</li>
              <li><strong>실시간 알림</strong>: 🚨 품질경보 발생/조치/삭제, 📑 전자결재 상신/승인/반려/보류 즉시 전송</li>
            </ol>
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
                  <span>✅ 텔레그램 테스트 메시지가 성공적으로 전송되었습니다!</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>❌ 전송 실패: {testResult.error || "Token 또는 Chat ID를 다시 확인해주세요."}</span>
                </>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                disabled={testingTelegram}
                onClick={handleTestTelegram}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5 text-sky-500" />
                <span>{testingTelegram ? "전송 중..." : "테스트 발송"}</span>
              </button>

              <button
                type="button"
                disabled={sendingBriefing}
                onClick={handleSendDailyLeaveBriefing}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                title="매일 아침 7시 30분에 자동 전송되는 금일 모닝 브리핑(연차+미결재+품질경보)을 지금 즉시 전송합니다"
              >
                <span>🌅</span>
                <span>{sendingBriefing ? "전송 중..." : "07:30 모닝브리핑 발송"}</span>
              </button>

              <button
                type="button"
                disabled={sendingPnL}
                onClick={handleSendDailyPnL}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-700 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                title="매일 아침 7시에 자동 전송되는 월간 손익 결산 요약(스타일 A)을 지금 즉시 전송합니다"
              >
                <span>📊</span>
                <span>{sendingPnL ? "전송 중..." : "07:00 손익결산 발송"}</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              {pnlToast && (
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> 손익 결산 전송됨!
                </span>
              )}
              {briefingToast && (
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> 모닝브리핑 전송됨!
                </span>
              )}
              {savedConfigToast && (
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> 저장 완료!
                </span>
              )}
              <button
                type="submit"
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 active:scale-95 transition-all cursor-pointer"
              >
                <span>설정 저장하기</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Firebase Status Card */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-orange-50 dark:bg-orange-500/10 text-orange-500">
              <Flame className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white text-base">
                Firebase Project 정보
              </h4>
              <p className="text-xs text-slate-400">
                연결된 Firebase App / Firestore / Analytics
              </p>
            </div>
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
            연결 상태: {dataSource === "firestore" ? "Firestore 실시간 연동" : "동기화 대기/캐시 모드"}
          </span>
        </div>

        {/* Config Properties */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <span className="text-slate-400 font-medium">Project ID</span>
            <p className="font-mono font-bold text-slate-800 dark:text-slate-200 mt-0.5">
              {firebaseConfig.projectId}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <span className="text-slate-400 font-medium">Auth Domain</span>
            <p className="font-mono font-bold text-slate-800 dark:text-slate-200 mt-0.5">
              {firebaseConfig.authDomain}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <span className="text-slate-400 font-medium">App ID</span>
            <p className="font-mono font-bold text-slate-800 dark:text-slate-200 mt-0.5 truncate">
              {firebaseConfig.appId}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <span className="text-slate-400 font-medium">Measurement ID (Analytics)</span>
            <p className="font-mono font-bold text-slate-800 dark:text-slate-200 mt-0.5">
              {firebaseConfig.measurementId}
            </p>
          </div>
        </div>

        {/* Code Snippet */}
        <div className="relative">
          <div className="flex items-center justify-between px-3 py-1.5 bg-slate-800 dark:bg-slate-950 rounded-t-xl text-slate-400 text-xs font-mono">
            <span>firebaseConfig.json</span>
            <button
              onClick={handleCopyConfig}
              className="flex items-center gap-1 hover:text-white transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "복사됨!" : "복사"}</span>
            </button>
          </div>
          <pre className="p-4 bg-slate-900 dark:bg-black rounded-b-xl text-slate-300 font-mono text-xs overflow-x-auto">
            {JSON.stringify(firebaseConfig, null, 2)}
          </pre>
        </div>
      </div>

      {/* Backup & Export */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 dark:text-white text-base">
              데이터 백업 및 내보내기
            </h4>
            <p className="text-xs text-slate-400">
              현재 저장된 {transactions.length}개의 손익 데이터를 JSON 파일로 백업합니다.
            </p>
          </div>
        </div>

        <div className="pt-2 flex flex-wrap items-center gap-3">
          <button
            onClick={handleExportJSON}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-all"
          >
            <Download className="w-4 h-4" />
            <span>전체 데이터 JSON 백업 다운로드</span>
          </button>
        </div>
      </div>
    </div>
  );
};
