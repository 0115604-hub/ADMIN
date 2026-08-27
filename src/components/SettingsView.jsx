import React, { useState } from "react";
import {
  Settings,
  Flame,
  Database,
  ShieldCheck,
  Download,
  Upload,
  RefreshCw,
  Copy,
  Check
} from "lucide-react";
import { firebaseConfig } from "../firebase";

export const SettingsView = ({ transactions, onRefresh, dataSource }) => {
  const [copied, setCopied] = useState(false);

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
            <span>시스템 & Firebase 연동 설정</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            연동된 Firebase 백엔드 및 로컬 데이터 저장소 관리
          </p>
        </div>
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
