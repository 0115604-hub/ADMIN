import React from "react";
import {
  Send,
  Users,
  Crown,
  ShieldCheck,
  Pause,
  Play
} from "lucide-react";
import {
  toggleTelegramEnabled,
  setTelegramEnabled
} from "../../services/telegramService";

export const TelegramViewHeader = ({
  activeMainTab,
  setActiveMainTab,
  telegramConfig,
  setTelegramConfig
}) => {
  return (
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
                실시간 연동 제어
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              예시창에서 문구를 수정한 후 <strong>[위 예시내용을 앞으로도 계속 적용]</strong>을 누르면 변경된 텍스트가 기본 서식으로 영구 저장되어 계속 발송됩니다.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* 텔레그램 연동 중단 / 재시작 버튼 */}
          <button
            type="button"
            onClick={async () => {
              const res = await toggleTelegramEnabled();
              setTelegramConfig(res);
            }}
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-2xl font-black text-xs sm:text-sm transition-all shadow-md active:scale-95 cursor-pointer border ${
              telegramConfig.enabled !== false
                ? "bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300 border-rose-300 dark:border-rose-800 hover:border-rose-400"
                : "bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-500 shadow-emerald-600/30 animate-pulse"
            }`}
            title={
              telegramConfig.enabled !== false
                ? "수정/테스트 작업 중 불필요한 알림 발송을 방지하기 위해 텔레그램 연동을 일시 중단합니다."
                : "현재 중단되어 있는 텔레그램 연동을 다시 켜서 실시간 알림을 정상 발송합니다."
            }
          >
            {telegramConfig.enabled !== false ? (
              <>
                <Pause className="w-4 h-4 text-rose-600 dark:text-rose-400 fill-rose-600 dark:fill-rose-400" />
                <span>텔레그램 연동 일시중단</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 text-white fill-white" />
                <span>텔레그램 연동 재시작 (가동)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 연동 중단 시 알림 배너 */}
      {telegramConfig.enabled === false && (
        <div className="p-3.5 rounded-2xl bg-amber-500/15 border-2 border-amber-500/50 text-amber-900 dark:text-amber-200 flex items-start sm:items-center justify-between gap-3 text-xs animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 rounded-xl bg-amber-500 text-white font-black shrink-0 text-sm">⏸️</span>
            <div>
              <p className="font-black text-xs sm:text-sm">
                텔레그램 실시간 발송이 일시 중단(PAUSED)되어 있습니다.
              </p>
              <p className="text-[11px] opacity-90 mt-0.5">
                데이터 등록/수정/삭제 중 불필요한 단톡방 알림이 발송되지 않습니다. 수정을 마친 후 위의 <strong>[텔레그램 연동 재시작]</strong> 버튼을 누르면 정상 발송됩니다.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={async () => {
              const res = await setTelegramEnabled(true);
              setTelegramConfig(res);
            }}
            className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs shrink-0 cursor-pointer shadow-xs active:scale-95"
          >
            즉시 재시작
          </button>
        </div>
      )}

      {/* 3대 메인 탭: [📢 오륙통합방] & [👑 경영총괄] & [⚙️ 텔레그램 연동 설정] */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-1.5 rounded-2xl bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80">
        <button
          type="button"
          onClick={() => setActiveMainTab("unified")}
          className={`flex items-center justify-center gap-2.5 py-3 px-3.5 rounded-xl font-black text-xs sm:text-sm transition-all cursor-pointer ${
            activeMainTab === "unified"
              ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-sky-400 shadow-md border border-slate-200/80 dark:border-slate-700"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Users className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 text-blue-500" />
          <div className="text-left">
            <div className="leading-tight font-black">오륙통합방</div>
            <div className="text-[10px] opacity-75 font-normal">현장•품질•공지•모닝브리핑</div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveMainTab("management")}
          className={`flex items-center justify-center gap-2.5 py-3 px-3.5 rounded-xl font-black text-xs sm:text-sm transition-all cursor-pointer ${
            activeMainTab === "management"
              ? "bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-md border border-slate-200/80 dark:border-slate-700"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Crown className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 text-purple-500" />
          <div className="text-left">
            <div className="leading-tight font-black">경영총괄</div>
            <div className="text-[10px] opacity-75 font-normal">매출 & 일정공유 (-1003939516875)</div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveMainTab("config")}
          className={`flex items-center justify-center gap-2.5 py-3 px-3.5 rounded-xl font-black text-xs sm:text-sm transition-all cursor-pointer ${
            activeMainTab === "config"
              ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-md border border-slate-200/80 dark:border-slate-700 ring-2 ring-emerald-500/20"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 text-emerald-500" />
          <div className="text-left">
            <div className="leading-tight font-black">텔레그램 연동 설정</div>
            <div className="text-[10px] opacity-75 font-normal">Bot Token & Chat ID & 테스트</div>
          </div>
        </button>
      </div>
    </div>
  );
};
