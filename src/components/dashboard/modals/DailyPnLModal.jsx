import React from "react";
import {
  Smartphone,
  Send
} from "lucide-react";
import { formatCommonSchedulesForTelegram } from "../../../services/commonScheduleService";

export default function DailyPnLModal({
  dailyPnLModalOpen,
  setDailyPnLModalOpen,
  selectedPnLChannel,
  setSelectedPnLChannel,
  sendingDailyPnL,
  handleSendDailyPnLTelegram,
  customPnLBriefing,
  setCustomPnLBriefing,
  totalSales,
  totalPurchases,
  salesAchievementPct,
  purchaseAchievementPct,
  prevMonthKey,
  uncompletedCommonSchedules,
  todayDateStr
}) {
  if (!dailyPnLModalOpen) return null;

  return (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setDailyPnLModalOpen(false);
          }}
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md overflow-y-auto p-2 sm:p-4 py-4 sm:py-8 flex justify-center items-start sm:items-center animate-fadeIn cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-4xl w-full p-4 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 my-auto animate-scaleUp cursor-default"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 text-white shadow-md">
                  <Send className="w-5 h-5 text-sky-400" />
                </div>
                <div>
                  <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
                    <span>📱 매일 아침 매출 & 일정공유 텔레그램 메시지 예시화면</span>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                      07:30 정기 브리핑
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    매출액, 매입액, 전월대비 매출/매입 달성율, 공통일정을 포함한 실시간 발송 템플릿입니다.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDailyPnLModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* 2-Column Layout: Left (Smartphone Mockup) vs Right (Live Form Controls) */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
              {/* Left Side: Smartphone / Telegram Bubble Mockup (7 cols) */}
              <div className="md:col-span-7 bg-slate-900 text-slate-100 rounded-2xl p-4 border border-slate-800 shadow-inner space-y-3 font-sans">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs text-slate-400">
                  <div className="flex items-center gap-1.5 font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>
                      {selectedPnLChannel === "-1003939516875"
                        ? "👑 경영방 (대표·전무 전용 채널)"
                        : selectedPnLChannel === "290615483"
                        ? "👤 권태형 대표님 1:1 대화방"
                        : "📢 오륙 통합방 채널"}
                    </span>
                  </div>
                  <span className="text-[10.5px] font-mono">07:30 AM</span>
                </div>

                {/* Telegram Message Bubble */}
                <div className="bg-slate-800/90 rounded-2xl p-4 border border-slate-700/80 space-y-3 text-xs leading-relaxed shadow-md">
                  {/* Header */}
                  <div>
                    <div className="font-black text-sm text-white flex items-center gap-1.5">
                      <span>⬛ [오륙] 매출 & 일정공유</span>
                    </div>
                    <div className="text-[11px] font-extrabold text-sky-400 mt-0.5">
                      {new Date().toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit", weekday: "short" })} 07:30 기준
                    </div>
                  </div>

                  <div className="border-t border-slate-700/60 pt-2 space-y-2">
                    {/* [1] 매입 / 매출 현황 */}
                    <div>
                      <div className="font-extrabold text-amber-400 text-xs mb-1">
                        [1] 당월 매입 / 매출 결산 현황
                      </div>
                      <div className="pl-2 space-y-0.5 text-slate-200">
                        <div>• <strong>매출액:</strong> <span className="font-bold text-white">₩{Number(customPnLBriefing?.salesAmount ?? totalSales).toLocaleString()}원</span></div>
                        <div>• <strong>매입액:</strong> <span className="font-bold text-rose-300">₩{Number(customPnLBriefing?.purchaseAmount ?? totalPurchases).toLocaleString()}원</span></div>
                        <div>• <strong>매출대비 원가율:</strong> <span className="font-bold text-indigo-300">{(((customPnLBriefing?.purchaseAmount ?? totalPurchases) / ((customPnLBriefing?.salesAmount ?? totalSales) || 1)) * 100).toFixed(1)}%</span></div>
                      </div>
                    </div>

                    {/* [2] 전월 실적 대비 달성율 */}
                    <div>
                      <div className="font-extrabold text-emerald-400 text-xs mb-1">
                        [2] 전월 실적 대비 달성율 ({prevMonthKey?.split("-")[1] || "8"}월 실적 대비)
                      </div>
                      <div className="pl-2 space-y-0.5 text-slate-200">
                        <div>• <strong>전월대비 매출 달성율:</strong> <strong className="text-emerald-300 font-bold">{customPnLBriefing?.salesAchievementRate || `${salesAchievementPct}% (${Number(salesAchievementPct) >= 100 ? `▲ +${(Number(salesAchievementPct) - 100).toFixed(1)}% 초과` : `▼ ${(Number(salesAchievementPct) - 100).toFixed(1)}%`})`}</strong></div>
                        <div>• <strong>전월대비 매입 달성율:</strong> <strong className="text-sky-300 font-bold">{customPnLBriefing?.purchaseAchievementRate || `${purchaseAchievementPct}% (${Number(purchaseAchievementPct) <= 100 ? `▼ ${(100 - Number(purchaseAchievementPct)).toFixed(1)}% 절감` : `▲ +${(Number(purchaseAchievementPct) - 100).toFixed(1)}%`})`}</strong></div>
                      </div>
                    </div>

                    {/* [3] 태형이랑 & 미영이랑 */}
                    <div>
                      <div className="font-extrabold text-purple-400 text-xs mb-1">
                        [3] 사내 공통일정
                      </div>
                      <div className="pl-2 whitespace-pre-wrap text-slate-200 text-[11px] leading-relaxed">
                        {customPnLBriefing?.commonSchedules || formatCommonSchedulesForTelegram(uncompletedCommonSchedules, todayDateStr)}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="text-blue-400 underline cursor-pointer hover:text-blue-300">
                      손익관리시스템 바로가기
                    </span>
                    <span className="text-[10px] text-slate-500">오륙 텔레그램 알림봇</span>
                  </div>
                </div>
              </div>

              {/* Right Side: Interactive Controls (5 cols) */}
              <div className="md:col-span-5 space-y-3 text-xs">
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-slate-900 dark:text-white text-xs">
                      📊 발송 수치 실시간 조정
                    </span>
                    <button
                      type="button"
                      onClick={() => setCustomPnLBriefing(null)}
                      className="text-[10.5px] font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                    >
                      실시간 값 리셋
                    </button>
                  </div>

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
                    <label className="font-bold text-slate-600 dark:text-slate-400 block mb-0.5">매출액 (원)</label>
                    <input
                      type="number"
                      value={customPnLBriefing?.salesAmount ?? totalSales}
                      onChange={(e) => setCustomPnLBriefing({
                        ...(customPnLBriefing || {}),
                        salesAmount: Number(e.target.value)
                      })}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-white"
                    />
                  </div>

                  {/* 매입액 */}
                  <div>
                    <label className="font-bold text-slate-600 dark:text-slate-400 block mb-0.5">매입액 (원)</label>
                    <input
                      type="number"
                      value={customPnLBriefing?.purchaseAmount ?? totalPurchases}
                      onChange={(e) => setCustomPnLBriefing({
                        ...(customPnLBriefing || {}),
                        purchaseAmount: Number(e.target.value)
                      })}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-white"
                    />
                  </div>

                  {/* 매출 달성율 */}
                  <div>
                    <label className="font-bold text-slate-600 dark:text-slate-400 block mb-0.5">전월대비 매출 달성율 문구</label>
                    <input
                      type="text"
                      placeholder="예: 102.4% (▲ 2.4% 초과)"
                      value={customPnLBriefing?.salesAchievementRate ?? `${salesAchievementPct}% (${Number(salesAchievementPct) >= 100 ? `▲ +${(Number(salesAchievementPct) - 100).toFixed(1)}% 초과` : `▼ ${(Number(salesAchievementPct) - 100).toFixed(1)}%`})`}
                      onChange={(e) => setCustomPnLBriefing({
                        ...(customPnLBriefing || {}),
                        salesAchievementRate: e.target.value
                      })}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-white"
                    />
                  </div>

                  {/* 매입 달성율 */}
                  <div>
                    <label className="font-bold text-slate-600 dark:text-slate-400 block mb-0.5">전월대비 매입 달성율 문구</label>
                    <input
                      type="text"
                      placeholder="예: 98.7% (▼ 1.3% 절감)"
                      value={customPnLBriefing?.purchaseAchievementRate ?? `${purchaseAchievementPct}% (${Number(purchaseAchievementPct) <= 100 ? `▼ ${(100 - Number(purchaseAchievementPct)).toFixed(1)}% 절감` : `▲ +${(Number(purchaseAchievementPct) - 100).toFixed(1)}%`})`}
                      onChange={(e) => setCustomPnLBriefing({
                        ...(customPnLBriefing || {}),
                        purchaseAchievementRate: e.target.value
                      })}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-white"
                    />
                  </div>

                  {/* 공통일정 문구 */}
                  <div>
                    <label className="font-bold text-slate-600 dark:text-slate-400 block mb-0.5">사내 공통일정 (미완료 전체)</label>
                    <textarea
                      rows="3"
                      value={customPnLBriefing?.commonSchedules ?? formatCommonSchedulesForTelegram(uncompletedCommonSchedules, todayDateStr)}
                      onChange={(e) => setCustomPnLBriefing({
                        ...(customPnLBriefing || {}),
                        commonSchedules: e.target.value
                      })}
                      className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium text-slate-900 dark:text-white text-[11px]"
                    ></textarea>
                  </div>
                </div>

                {/* Trigger Button */}
                <div className="pt-2 space-y-2">
                  <button
                    type="button"
                    disabled={sendingDailyPnL}
                    onClick={handleSendDailyPnLTelegram}
                    className="w-full py-3 rounded-2xl bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 hover:from-black hover:to-blue-950 text-white font-black text-xs shadow-lg shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-4 h-4 text-sky-400" />
                    <span>
                      {sendingDailyPnL
                        ? "텔레그램 발송 중..."
                        : `🚀 [${selectedPnLChannel === "-1003939516875" ? "경영방 (대표·전무)" : selectedPnLChannel === "290615483" ? "대표님 1:1" : "통합방"}]으로 즉시 발송하기`}
                    </span>
                  </button>
                  <p className="text-[10px] text-center text-slate-400">
                    {selectedPnLChannel === "-1003939516875"
                      ? "경영진/대표·전무 전용 경영방으로 매출 & 일정공유 브리핑이 안전하게 구분 발송됩니다."
                      : selectedPnLChannel === "290615483"
                      ? "권태형 대표님 1:1 개인톡으로 매출 & 일정공유 브리핑이 발송됩니다."
                      : "오륙 전체 통합방으로 매출 & 일정공유 브리핑이 발송됩니다."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
  );
}
