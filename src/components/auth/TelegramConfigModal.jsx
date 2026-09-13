import React from "react";
import { createPortal } from "react-dom";
import { Lock, AlertTriangle, CheckCircle2, Check, Pause, Play } from "lucide-react";
import { TelegramLogo } from "../TelegramLogo";
import { toggleTelegramEnabled } from "../../services/telegramService";

export const TelegramConfigModal = ({
  telegramAdminPinModal,
  setTelegramAdminPinModal,
  onVerifyTelegramAdmin,
  isTelegramModalOpen,
  setIsTelegramModalOpen,
  telegramConfig,
  setTelegramConfig,
  onSaveTelegramConfig,
  testingTelegram,
  onTestTelegram,
  sendingClosingBriefing,
  onSendDailyClosingBriefing,
  closingBriefingToast,
  telegramSavedToast,
  telegramTestResult
}) => {
  if (typeof document === "undefined") return null;

  return (
    <>
      {/* 1. 텔레그램 연동 관리자(Admin) 권한 인증 모달 */}
      {telegramAdminPinModal.isOpen && createPortal(
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setTelegramAdminPinModal({ isOpen: false, pinInput: "", errorMsg: "" });
            }
          }}
          className="fixed inset-0 z-[90] bg-slate-950/80 backdrop-blur-md overflow-y-auto p-3 sm:p-4 py-6 sm:py-10 flex justify-center items-center animate-fadeIn cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-5 sm:p-6 border-2 border-sky-400 dark:border-sky-600 shadow-2xl space-y-4 my-auto animate-scaleUp cursor-default"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-sky-500 text-white shadow-md shadow-sky-500/30 flex items-center justify-center">
                  <TelegramLogo className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>텔레그램 연동 관리</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                      Admin 전용
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    관리자 권한 인증 후 설정 화면으로 진입합니다.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setTelegramAdminPinModal({ isOpen: false, pinInput: "", errorMsg: "" })}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Authority Notice */}
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-xs space-y-1">
              <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-200 font-black">
                <Lock className="w-3.5 h-3.5 text-sky-500" />
                <span>접속 권한: ADMIN 관리자</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                봇 토큰 및 그룹 채널 설정을 위해 ADMIN 관리자 PIN을 입력해 주세요.
              </p>
            </div>

            {/* PIN Input Form */}
            <form onSubmit={onVerifyTelegramAdmin} className="space-y-3 pt-1">
              <div>
                <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1.5 text-xs text-center">
                  ADMIN 관리자 확인 PIN (4자리)
                </label>
                <input
                  type="password"
                  maxLength={6}
                  required
                  autoFocus
                  placeholder="PIN 번호 입력"
                  value={telegramAdminPinModal.pinInput}
                  onChange={(e) =>
                    setTelegramAdminPinModal((prev) => ({ ...prev, pinInput: e.target.value, errorMsg: "" }))
                  }
                  className="w-full text-center tracking-widest text-lg font-mono font-black px-4 py-2.5 rounded-2xl border-2 border-sky-300 dark:border-sky-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-sky-500 shadow-xs"
                />
              </div>

              {telegramAdminPinModal.errorMsg && (
                <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 text-xs font-bold text-center animate-shake flex items-center justify-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>{telegramAdminPinModal.errorMsg}</span>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setTelegramAdminPinModal({ isOpen: false, pinInput: "", errorMsg: "" })}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 font-bold hover:bg-slate-100 text-xs cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 active:scale-95 text-white font-black text-xs shadow-md shadow-sky-500/25 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>인증 후 이동</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* 2. 텔레그램 봇 실시간 알림 설정 본문 모달 */}
      {isTelegramModalOpen && createPortal(
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsTelegramModalOpen(false);
            }
          }}
          className="fixed inset-0 z-[90] bg-slate-950/80 backdrop-blur-md overflow-y-auto p-3 sm:p-4 py-6 sm:py-10 flex justify-center items-start sm:items-center animate-fadeIn cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-5 sm:p-6 border-2 border-sky-400 dark:border-sky-600 shadow-2xl space-y-4 my-auto animate-scaleUp cursor-default"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-sky-500 text-white shadow-md shadow-sky-500/30 flex items-center justify-center">
                  <TelegramLogo className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>텔레그램 실시간 알림 연동</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300">
                      Admin 전용
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    품질경보, 모닝브리핑, 월간 경영손익 텔레그램 발송 연동
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsTelegramModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <form onSubmit={onSaveTelegramConfig} className="space-y-3.5">
              {/* 실시간 알림 중단 / 재시작 제어 박스 */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${telegramConfig?.enabled !== false ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
                    <span>실시간 연동 상태: {telegramConfig?.enabled !== false ? "정상 가동 중" : "발송 일시 중단됨"}</span>
                  </span>
                  <button
                    type="button"
                    onClick={async () => {
                      const res = await toggleTelegramEnabled();
                      setTelegramConfig(res);
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-black text-xs transition-all shadow-xs cursor-pointer ${
                      telegramConfig?.enabled !== false
                        ? "bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 dark:border-rose-700"
                        : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/30 animate-pulse"
                    }`}
                  >
                    {telegramConfig?.enabled !== false ? (
                      <>
                        <Pause className="w-3.5 h-3.5 fill-rose-600 dark:fill-rose-400" />
                        <span>연동 일시중단</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-white" />
                        <span>연동 재시작 (ON)</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {telegramConfig?.enabled !== false
                    ? "🟢 현재 모든 실시간 알림이 단톡방에 정상 발송됩니다. 수정/점검 중 발송을 막으려면 [연동 일시중단]을 누르세요."
                    : "⏸️ 텔레그램 발송이 일시 중단되어 데이터 등록/수정/삭제 중 불필요한 알림이 발송되지 않습니다."}
                </p>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  텔레그램 Bot Token (API 토큰)
                </label>
                <input
                  type="text"
                  placeholder="예: 7812345678:AAHqK_..."
                  value={telegramConfig?.botToken || ""}
                  onChange={(e) => setTelegramConfig({ ...telegramConfig, botToken: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
                />
                <p className="text-[10.5px] text-slate-400">
                  @BotFather 에서 발급받은 공용 봇 토큰
                </p>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>📢 일반 알림 채널 ID (오륙 통합방)</span>
                  <span className="text-[10px] text-sky-600 dark:text-sky-400 font-bold">모닝/마감브리핑/품질경보</span>
                </label>
                <input
                  type="text"
                  placeholder="예: -4186792536 또는 -100..."
                  value={telegramConfig?.chatId || ""}
                  onChange={(e) => setTelegramConfig({ ...telegramConfig, chatId: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              {/* 브리핑 발송 옵션 */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70 space-y-2">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    🌅 07:30 모닝브리핑 자동 발송 (월~토)
                  </span>
                  <input
                    type="checkbox"
                    checked={telegramConfig?.sendDailyBriefing !== false}
                    onChange={(e) => setTelegramConfig({ ...telegramConfig, sendDailyBriefing: e.target.checked })}
                    className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400"
                  />
                </label>
                <label className="flex items-center justify-between cursor-pointer pt-1 border-t border-slate-200/50 dark:border-slate-700/50">
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    📢 17:00 일일마감브리핑 자동 발송 (월~토)
                  </span>
                  <input
                    type="checkbox"
                    checked={telegramConfig?.sendDailyClosingBriefing !== false}
                    onChange={(e) => setTelegramConfig({ ...telegramConfig, sendDailyClosingBriefing: e.target.checked })}
                    className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
                  />
                </label>
              </div>

              {/* Test Status Feedback */}
              {telegramTestResult && (
                <div className="p-3 rounded-xl border text-xs flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 text-emerald-800 dark:text-emerald-200">
                  {telegramTestResult.success ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>✅ 텔레그램 테스트 메시지가 성공적으로 전송되었습니다!</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>❌ 전송 실패: {telegramTestResult.error || "Token 또는 Chat ID를 다시 확인해주세요."}</span>
                    </>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex-wrap">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    disabled={testingTelegram}
                    onClick={onTestTelegram}
                    className="flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                    title="오륙 통합방으로 테스트 발송"
                  >
                    <TelegramLogo className="w-3.5 h-3.5" />
                    <span>{testingTelegram ? "발송 중..." : "연결 테스트"}</span>
                  </button>

                  <button
                    type="button"
                    disabled={sendingClosingBriefing}
                    onClick={onSendDailyClosingBriefing}
                    className="flex items-center gap-1 px-3 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/60 dark:hover:bg-purple-900/60 text-purple-800 dark:text-purple-300 border border-purple-300 dark:border-purple-700 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                    title="17:00 마감브리핑(품질경보+회의일정+사내공지+오픈이슈) 즉시 테스트 발송"
                  >
                    <span>📢</span>
                    <span>{sendingClosingBriefing ? "전송 중..." : "17:00 마감브리핑 발송"}</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {closingBriefingToast && (
                    <span className="text-xs font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> 마감브리핑 발송됨!
                    </span>
                  )}
                  {telegramSavedToast && (
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> 저장됨!
                    </span>
                  )}
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 active:scale-95 text-white text-xs font-black shadow-md shadow-sky-500/25 transition-all cursor-pointer"
                  >
                    <span>설정 저장하기</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};
