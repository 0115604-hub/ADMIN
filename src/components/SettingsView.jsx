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
  sendDailyClosingBriefingTelegram
} from "../services/telegramService";
import {
  getDailyMaintenanceStatus,
  runDailyMaintenance
} from "../services/dailyMaintenanceService";

export const SettingsView = ({ transactions, onRefresh, dataSource }) => {
  const [copied, setCopied] = useState(false);

  // Daily Maintenance State
  const [maintenanceStatus, setMaintenanceStatus] = useState(() => getDailyMaintenanceStatus());
  const [runningMaintenance, setRunningMaintenance] = useState(false);
  const [maintenanceToast, setMaintenanceToast] = useState("");

  useEffect(() => {
    const handleUpdate = (e) => {
      if (e.detail) setMaintenanceStatus(e.detail);
      else setMaintenanceStatus(getDailyMaintenanceStatus());
    };
    window.addEventListener("daily-maintenance-completed", handleUpdate);
    return () => window.removeEventListener("daily-maintenance-completed", handleUpdate);
  }, []);

  const handleRunMaintenanceNow = async () => {
    setRunningMaintenance(true);
    setMaintenanceToast("");
    try {
      const res = await runDailyMaintenance({ isManual: true });
      setMaintenanceStatus(res);
      setMaintenanceToast("✅ 데이터 무결성 점검 및 일일 백업이 완료되었습니다!");
      setTimeout(() => setMaintenanceToast(""), 4000);
      if (onRefresh) onRefresh();
    } catch (e) {
      setMaintenanceToast("❌ 점검 중 오류 발생: " + e.message);
      setTimeout(() => setMaintenanceToast(""), 4000);
    } finally {
      setRunningMaintenance(false);
    }
  };

  const handleDownloadDailyBackup = () => {
    try {
      const raw = localStorage.getItem("oryuk_daily_backup_latest_v1");
      if (!raw) {
        alert("저장된 일일 백업 파일이 없습니다. [지금 즉시 점검 & 백업 실행]을 먼저 눌러주세요.");
        return;
      }
      const parsed = JSON.parse(raw);
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(parsed, null, 2));
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `oryuk_factory_daily_backup_${parsed.backupDate || "latest"}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (e) {
      alert("백업 파일 다운로드 오류: " + e.message);
    }
  };

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
  const [sendingClosingBriefing, setSendingClosingBriefing] = useState(false);
  const [closingBriefingToast, setClosingBriefingToast] = useState(false);

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

  const handleSendDailyClosingBriefing = async () => {
    setSendingClosingBriefing(true);
    try {
      const res = await sendDailyClosingBriefingTelegram(null, null, true);
      if (res.success) {
        setClosingBriefingToast(true);
        setTimeout(() => setClosingBriefingToast(false), 3000);
      } else {
        alert("전송 실패: " + (res.error || "설정을 확인해주세요."));
      }
    } catch (err) {
      alert("오류 발생: " + err.message);
    } finally {
      setSendingClosingBriefing(false);
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
                품질경보 즉시발송(등록/의견/삭제), 매일 아침 07:40 통합 모닝브리핑, 17:30 일일마감브리핑을 전송합니다.
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
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
                오륙 통합방 Chat ID (필수)
              </label>
              <input
                type="text"
                placeholder="예: -4186792536 (오륙 통합방)"
                value={telegramConfig.chatId || ""}
                onChange={(e) => setTelegramConfig({ ...telegramConfig, chatId: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              />
              <p className="text-[10px] text-slate-400">
                품질경보(등록/의견/삭제) / 07:40 모닝브리핑 / 17:30 마감브리핑 수신방
              </p>
            </div>
          </div>

          {/* Guide Box */}
          <div className="p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/60 text-xs space-y-1 text-slate-700 dark:text-slate-300">
            <p className="font-bold text-blue-900 dark:text-blue-300 flex items-center gap-1">
              <span>💡 오륙통합방 텔레그램 발송 알림 (5가지 한정):</span>
            </p>
            <ol className="list-decimal list-inside space-y-0.5 text-[11px] text-slate-600 dark:text-slate-400 pl-1">
              <li><strong>품질경보 등록</strong>: 🟥 신규 품질경보 등록 즉시 발송 (사진 최대 3장)</li>
              <li><strong>품질경보 조치완료</strong>: 🟢 조치결과 등록 즉시 발송</li>
              <li><strong>품질경보 종결/삭제</strong>: 🟥 품질경보 확인 후 종결 및 삭제 시 즉시 발송</li>
              <li><strong>매일 아침 07:40</strong>: 🌅 <strong>일일 근태/미결재/오픈이슈 모닝브리핑</strong> 자동 발송 (오륙 통합방)</li>
              <li><strong>매일 오후 17:30</strong>: 📢 <strong>일일마감브리핑</strong> 자동 발송 (월~토)</li>
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
                title="매일 아침 07시 40분에 자동 전송되는 금일 모닝 브리핑(연차+미결재+품질경보)을 지금 즉시 전송합니다"
              >
                <span>🌅</span>
                <span>{sendingBriefing ? "전송 중..." : "07:40 모닝브리핑 발송"}</span>
              </button>

              <button
                type="button"
                disabled={sendingClosingBriefing}
                onClick={handleSendDailyClosingBriefing}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/60 dark:hover:bg-purple-900/60 text-purple-800 dark:text-purple-300 border border-purple-300 dark:border-purple-700 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                title="매일 오후 17:30(월~토)에 자동 전송되는 금일 일일마감브리핑(품질경보+회의결과+사내공지+오픈이슈)을 지금 즉시 전송합니다"
              >
                <span>📢</span>
                <span>{sendingClosingBriefing ? "전송 중..." : "17:30 마감브리핑 발송"}</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              {briefingToast && (
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> 모닝 브리핑 전송됨!
                </span>
              )}
              {closingBriefingToast && (
                <span className="text-xs font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> 마감 브리핑 전송됨!
                </span>
              )}
              {savedConfigToast && (
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> 저장 완료!
                </span>
              )}
              <button
                type="submit"
                className="flex items-center gap-1 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 active:scale-95 transition-all cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>설정 저장</span>
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

      {/* Daily Automated HealthCheck & Snapshot Backup Card */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-slate-900 dark:text-white text-base">
                  새벽 자동 헬스체크 및 일일 백업 모듈
                </h4>
                <span className="px-2 py-0.5 rounded-full text-[10.5px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300">
                  매일 새벽 자동 가동중
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                유령 데이터·빈 행 정제, 전자결재·업무일지 무결성 검증 및 Firestore 일일 스냅샷 백업을 자동으로 수행합니다.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              disabled={runningMaintenance}
              onClick={handleRunMaintenanceNow}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-black shadow-md shadow-teal-600/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${runningMaintenance ? "animate-spin" : ""}`} />
              <span>{runningMaintenance ? "무결성 점검 중..." : "지금 즉시 점검 & 백업 실행"}</span>
            </button>
          </div>
        </div>

        {/* Status Toast Alert */}
        {maintenanceToast && (
          <div className="p-3 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-teal-900 dark:text-teal-200 text-xs font-bold animate-fadeIn flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
            <span>{maintenanceToast}</span>
          </div>
        )}

        {/* Maintenance Status Info Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
            <span className="text-slate-400 font-bold">마지막 실행 일시</span>
            <div className="flex items-center gap-1.5 font-mono font-bold text-slate-800 dark:text-slate-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>{maintenanceStatus?.lastRunTime || "금일 새벽 자동 점검 완료"}</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
            <span className="text-slate-400 font-bold">상태 및 소요시간</span>
            <p className="font-bold text-teal-700 dark:text-teal-300">
              {maintenanceStatus?.summary || "정상 가동 중 (무결성 확보됨)"}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
            <span className="text-slate-400 font-bold">자동 백업 스냅샷</span>
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] font-bold text-slate-700 dark:text-slate-300">
                Firestore & Local 백업본
              </span>
              <button
                type="button"
                onClick={handleDownloadDailyBackup}
                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 font-bold text-xs flex items-center gap-1 underline cursor-pointer"
              >
                <Download className="w-3 h-3" />
                <span>백업 JSON 다운</span>
              </button>
            </div>
          </div>
        </div>

        {/* Detail Inspection Checklist */}
        <div className="p-3 bg-slate-50/80 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-700/60 text-[11.5px] text-slate-600 dark:text-slate-400 grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span><strong>압출 비가동 실적</strong>: 유령 행/합계행 제거 및 주차 순차 정렬 검증</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span><strong>전자결재 문서</strong>: 중복 ID 제거, 삭제 문서 필터링 및 승인 단계 무결성</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span><strong>업무일지 / 근태</strong>: null/undefined 정리 및 중복 작성 방지</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span><strong>클라우드 스냅샷</strong>: 일별 백업(system_daily_backups) 자동 저장 보관</span>
          </div>
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
              손익 거래 데이터 백업 및 내보내기
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
