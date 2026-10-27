import React from "react";
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Send,
  Check
} from "lucide-react";

export const TelegramConfigCard = ({
  activeMainTab,
  telegramConfig,
  setTelegramConfig,
  testingTelegram,
  testResult,
  savedConfigToast,
  handleSaveTelegramConfig,
  handleTestTelegram
}) => {
  return (
    <div
      className={`p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border transition-all space-y-5 ${
        activeMainTab === "config"
          ? "border-2 border-emerald-500 shadow-2xl ring-4 ring-emerald-500/10 animate-fadeIn"
          : "border-slate-200/80 dark:border-slate-800 shadow-sm"
      }`}
    >
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div
            className={`p-2.5 rounded-xl ${
              activeMainTab === "config"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
            }`}
          >
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-black text-slate-900 dark:text-white text-base sm:text-lg">
                텔레그램 Bot API 및 채널 ID 연동 설정
              </h4>
              {activeMainTab === "config" && (
                <span className="px-2 py-0.5 rounded-full text-[10.5px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  설정 모드
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              오륙 통합방(품질경보·모닝·마감브리핑)과 경영방(대표·임원 손익)의 수신 채널 ID 및 Bot Token을 설정하고 연결을 테스트합니다.
            </p>
          </div>
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={telegramConfig.enabled}
            onChange={(e) =>
              setTelegramConfig({ ...telegramConfig, enabled: e.target.checked })
            }
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
              onChange={(e) =>
                setTelegramConfig({ ...telegramConfig, botToken: e.target.value })
              }
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
              onChange={(e) =>
                setTelegramConfig({ ...telegramConfig, chatId: e.target.value })
              }
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
            />
            <p className="text-[10px] text-slate-400">
              품질경보(등록/의견/삭제) / 07:40 모닝 / 17:30 마감
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
              onChange={(e) =>
                setTelegramConfig({ ...telegramConfig, pnlChatId: e.target.value })
              }
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
            />
            <p className="text-[10px] text-slate-400">
              매일 아침 07:40 손익결산(매출/매입/달성율/공통일정) 브리핑
            </p>
          </div>
        </div>

        {/* Test Status Feedback */}
        {testResult && (
          <div
            className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
              testResult.success
                ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 text-emerald-800 dark:text-emerald-200"
                : "bg-rose-50 dark:bg-rose-950/40 border-rose-300 text-rose-800 dark:text-rose-200"
            }`}
          >
            {testResult.success ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>✅ 텔레그램 연결 테스트 메시지가 성공적으로 발송되었습니다!</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>
                  ❌ 전송 실패: {testResult.error || "Token 또는 Chat ID를 다시 확인해주세요."}
                </span>
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
  );
};
