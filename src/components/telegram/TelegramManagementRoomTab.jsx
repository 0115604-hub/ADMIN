import React from "react";
import {
  TrendingUp,
  Bell,
  RotateCw,
  Edit3,
  Eye,
  Copy,
  Check,
  BookmarkCheck,
  CheckCircle2,
  Send
} from "lucide-react";

export const TelegramManagementRoomTab = ({
  isManagementTemplateCustom,
  selectedPnLChannel,
  setSelectedPnLChannel,
  managementMsgType,
  setManagementMsgType,
  todayCommonSchedules,
  editableManagementText,
  setEditableManagementText,
  managementViewMode,
  setManagementViewMode,
  handleResetManagementTemplate,
  handleCopyText,
  copyToast,
  templateSavedToast,
  templateResetToast,
  dailyPnLToast,
  handleSaveManagementTemplate,
  sendingDailyPnL,
  handleSendManagementMessage
}) => {
  return (
    <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-purple-500/40 dark:border-purple-600/40 shadow-xl space-y-5 animate-fadeIn">
      {/* Channel Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-purple-500 animate-pulse"></span>
            <h4 className="font-black text-slate-900 dark:text-white text-base">
              👑 경영총괄 발송 메시지 관리
            </h4>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
              경영방: -1003939516875
            </span>
            {isManagementTemplateCustom && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                📌 사용자 지정 서식 적용 중
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            매출 & 일정공유 브리핑 문구를 예시창에서 수정한 후 <strong>[위 예시내용을 앞으로도 계속 적용]</strong>을 누르면 저장되어 매일 07:40 발송 시 계속 적용됩니다.
          </p>
        </div>

        {/* Destination Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-600 dark:text-slate-400">수신처:</span>
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-0.5 border border-slate-200 dark:border-slate-700">
            {[
              { id: "-1003939516875", label: "👑 경영방" },
              { id: "290615483", label: "👤 대표님 1:1" }
            ].map((ch) => (
              <button
                key={ch.id}
                type="button"
                onClick={() => setSelectedPnLChannel(ch.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedPnLChannel === ch.id
                    ? "bg-purple-600 text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {ch.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Sub-tabs for 경영총괄: [📊 매출 & 일정공유] vs [🔔 당일 공통일정 리마인드] */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-1.5 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/60 dark:border-purple-900/40">
        <button
          type="button"
          onClick={() => setManagementMsgType("pnl")}
          className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl font-black text-xs sm:text-sm transition-all cursor-pointer ${
            managementMsgType === "pnl"
              ? "bg-white dark:bg-slate-900 text-purple-700 dark:text-purple-300 shadow-sm border border-purple-200 dark:border-purple-800"
              : "text-slate-600 dark:text-slate-400 hover:text-purple-600"
          }`}
        >
          <TrendingUp className="w-4 h-4 text-purple-500" />
          <span>📊 1. 매출 & 일정공유 브리핑 (매일 07:40)</span>
        </button>

        <button
          type="button"
          onClick={() => setManagementMsgType("today_schedule")}
          className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl font-black text-xs sm:text-sm transition-all cursor-pointer ${
            managementMsgType === "today_schedule"
              ? "bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-300 shadow-sm border border-amber-200 dark:border-amber-800"
              : "text-slate-600 dark:text-slate-400 hover:text-amber-600"
          }`}
        >
          <Bell className="w-4 h-4 text-amber-500" />
          <span>🔔 2. 당일 공통일정 리마인드 알림 ({todayCommonSchedules.length}건)</span>
        </button>
      </div>

      {/* 스마트폰 프레임 (직접 편집 가능한 텍스트 상자 & 렌더링 미리보기 탭) */}
      <div className="bg-slate-950 text-slate-100 rounded-3xl p-5 border border-slate-800 shadow-2xl space-y-3 font-sans">
        {/* Top Toolbar in Smartphone frame */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800 text-xs">
          <div className="flex items-center gap-2 font-bold text-purple-400">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>
              {selectedPnLChannel === "-1003939516875"
                ? "👑 경영방 (대표·전무 전용 채널: -1003939516875)"
                : "👤 권태형 대표님 1:1 개인톡 (290615483)"}
            </span>
            {isManagementTemplateCustom ? (
              <button
                type="button"
                onClick={handleResetManagementTemplate}
                className="group flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black bg-gradient-to-r from-amber-500/25 to-orange-500/25 hover:from-amber-500/40 hover:to-orange-500/40 text-amber-300 border border-amber-500/60 shadow-md hover:shadow-amber-500/20 active:scale-95 transition-all cursor-pointer animate-pulse"
                title="저장된 고정 서식을 삭제하고 최신 데이터로 리셋합니다 (F5 기능)"
              >
                <RotateCw className="w-3.5 h-3.5 text-amber-400 group-hover:rotate-180 transition-transform duration-500" />
                <span>🔄 F5 실시간 리셋 (커스텀 해제)</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleResetManagementTemplate}
                className="group flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black bg-gradient-to-r from-purple-500/20 to-indigo-500/20 hover:from-purple-500/35 hover:to-indigo-500/35 text-purple-300 border border-purple-500/50 shadow-md hover:shadow-purple-500/20 active:scale-95 transition-all cursor-pointer"
                title="클릭 시 CTRL+F5와 동일하게 최신 데이터로 문구를 즉시 다시 불러옵니다."
              >
                <RotateCw className="w-3.5 h-3.5 text-purple-400 group-hover:rotate-180 transition-transform duration-500" />
                <span>⚡ F5 실시간 데이터 갱신</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            {/* Mode Switcher: Edit vs Preview */}
            <div className="flex items-center bg-slate-900 rounded-xl p-0.5 border border-slate-800">
              <button
                type="button"
                onClick={() => setManagementViewMode("edit")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  managementViewMode === "edit"
                    ? "bg-purple-600 text-white shadow-xs"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>✏️ 텍스트 직접 수정</span>
              </button>

              <button
                type="button"
                onClick={() => setManagementViewMode("preview")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  managementViewMode === "preview"
                    ? "bg-purple-600 text-white shadow-xs"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>👁️ 수신 화면 뷰</span>
              </button>
            </div>

            {/* Reset to system default button */}
            <button
              type="button"
              onClick={handleResetManagementTemplate}
              className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-bold transition-all cursor-pointer"
              title="저장된 고정 서식을 삭제하고 시스템 실시간 데이터 기본 서식으로 초기화"
            >
              <RotateCw className="w-3.5 h-3.5 text-purple-400" />
              <span>기본서식 리셋</span>
            </button>

            {/* Copy button */}
            <button
              type="button"
              onClick={() => handleCopyText(editableManagementText)}
              className="flex items-center gap-1 px-2 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 text-xs font-bold transition-all cursor-pointer"
              title="클립보드에 복사"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* In-Place Editable Message Box */}
        {managementViewMode === "edit" ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
              <span>
                💡 <strong>{managementMsgType === "today_schedule" ? "당일 공통일정 리마인드" : "매출 & 일정공유"} 텍스트 수정:</strong> 원하는 내용을 자유롭게 수정한 후, <strong>[위 예시내용을 앞으로도 계속 적용]</strong>을 누르면 저장됩니다.
              </span>
              <span className="font-mono text-slate-500">{editableManagementText.length}자</span>
            </div>
            <textarea
              rows="14"
              value={editableManagementText}
              onChange={(e) => setEditableManagementText(e.target.value)}
              className="w-full p-4 rounded-2xl bg-slate-900/95 border border-purple-500/50 font-mono text-xs sm:text-sm text-slate-100 leading-relaxed focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-inner"
              placeholder={
                managementMsgType === "today_schedule"
                  ? "발송할 당일 공통일정 리마인드 메시지 내용을 입력하세요..."
                  : "발송할 매출 & 일정공유 브리핑 메시지 내용을 입력하세요..."
              }
            ></textarea>
          </div>
        ) : (
          /* Rendered HTML Telegram Bubble */
          <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-700/80 space-y-3.5 text-xs sm:text-sm leading-relaxed shadow-lg">
            <div
              className="whitespace-pre-wrap text-slate-100 font-sans"
              dangerouslySetInnerHTML={{ __html: editableManagementText.replace(/\n/g, "<br/>") }}
            />
          </div>
        )}

        {/* Bottom Action Footer with [위 예시내용을 앞으로도 계속 적용] + [즉시 발송] */}
        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-800/80">
          <div className="text-[11px] text-slate-400">
            수신처: <strong>{selectedPnLChannel === "-1003939516875" ? "경영방" : "대표님 1:1"}</strong> ({selectedPnLChannel})
          </div>

          <div className="flex items-center gap-2.5 flex-wrap justify-end">
            {copyToast && (
              <span className="text-xs font-bold text-purple-400 flex items-center gap-1 animate-fadeIn">
                <Check className="w-3.5 h-3.5" /> 복사 완료!
              </span>
            )}
            {templateSavedToast && (
              <span className="text-xs font-bold text-amber-400 flex items-center gap-1 animate-fadeIn">
                <BookmarkCheck className="w-4 h-4 text-amber-400" /> 앞으로도 계속 적용 저장 완료!
              </span>
            )}
            {templateResetToast && (
              <span className="text-xs font-bold text-purple-400 flex items-center gap-1 animate-fadeIn">
                <CheckCircle2 className="w-4 h-4 text-purple-400" /> 기본서식 리셋 완료!
              </span>
            )}
            {dailyPnLToast && (
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1 animate-fadeIn">
                <CheckCircle2 className="w-4 h-4" /> 전송 완료!
              </span>
            )}

            {/* 1. [위 예시내용을 앞으로도 계속 적용] 확인/저장 탭 */}
            <button
              type="button"
              onClick={handleSaveManagementTemplate}
              className="flex items-center gap-1.5 px-4 sm:px-5 py-3 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/50 font-black text-xs sm:text-sm shadow-md active:scale-95 transition-all cursor-pointer"
              title="현재 수정된 텍스트를 기본 서식으로 저장하여 계속 적용합니다."
            >
              <BookmarkCheck className="w-4 h-4 text-amber-400" />
              <span>💾 위 예시내용을 앞으로도 계속 적용</span>
            </button>

            {/* 2. [내용 즉시 발송] 버튼 */}
            <button
              type="button"
              disabled={sendingDailyPnL}
              onClick={handleSendManagementMessage}
              className="flex items-center gap-2 px-5 sm:px-6 py-3 rounded-2xl bg-gradient-to-r from-slate-900 via-purple-900 to-indigo-900 hover:from-black hover:to-purple-950 text-white font-black text-xs sm:text-sm shadow-xl shadow-purple-500/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              <Send className="w-4 h-4 text-purple-300" />
              <span>
                {sendingDailyPnL
                  ? "발송 중..."
                  : `🚀 [경영방]으로 ${managementMsgType === "today_schedule" ? "당일 공통일정 리마인드" : "매출 & 일정공유"} 즉시 발송`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
