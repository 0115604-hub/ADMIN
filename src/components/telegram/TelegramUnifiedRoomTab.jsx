import React from "react";
import {
  Edit3,
  Eye,
  RotateCw,
  Copy,
  Check,
  BookmarkCheck,
  CheckCircle2,
  Send
} from "lucide-react";

export const TelegramUnifiedRoomTab = ({
  isUnifiedTemplateCustom,
  todayDateStr,
  dayName,
  unifiedMsgType,
  setUnifiedMsgType,
  qualityStage,
  setQualityStage,
  noticeMeetingType,
  setNoticeMeetingType,
  editableUnifiedText,
  setEditableUnifiedText,
  unifiedViewMode,
  setUnifiedViewMode,
  loadingLiveBriefing,
  handleRefreshLiveBriefing,
  handleResetUnifiedTemplate,
  handleCopyText,
  copyToast,
  templateSavedToast,
  templateResetToast,
  unifiedToast,
  handleSaveUnifiedTemplate,
  sendingUnified,
  handleSendUnifiedMessage
}) => {
  return (
    <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-blue-500/40 dark:border-blue-600/40 shadow-xl space-y-5 animate-fadeIn">
      {/* Channel Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-500 animate-pulse"></span>
            <h4 className="font-black text-slate-900 dark:text-white text-base">
              📢 오륙통합방 발송 메시지 관리
            </h4>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
              단톡방: -4186792536
            </span>
            {isUnifiedTemplateCustom && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                📌 사용자 지정 서식 적용 중
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            모바일 가독성에 최적화된 <strong>간략 요약형</strong>으로 실시간 자동 취합되어 발송됩니다.
          </p>
        </div>

        <span className="px-3 py-1 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-black">
          {todayDateStr} ({dayName})
        </span>
      </div>

      {/* Sub Message Type Selector */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {[
          { id: "briefing", label: "📋 07:40 모닝브리핑", desc: "근태 • 전자결재 • 업무일지 • 오픈이슈 (간략 요약)" },
          { id: "quality", label: "🚨 품질경보 서식", desc: "신규 발령 및 조치완료 알림" },
          { id: "notice_meeting", label: "📢 사내공지 & 회의", desc: "공지사항 및 회의 일정" }
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setUnifiedMsgType(t.id)}
            className={`p-3 rounded-2xl text-center border transition-all cursor-pointer ${
              unifiedMsgType === t.id
                ? "bg-blue-600 text-white border-blue-600 shadow-md font-black"
                : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-400"
            }`}
          >
            <div className="text-xs sm:text-sm font-black">{t.label}</div>
            <div className="text-[10.5px] opacity-80 mt-0.5">{t.desc}</div>
          </button>
        ))}
      </div>

      {/* Sub-level selectors based on unifiedMsgType */}
      {unifiedMsgType === "quality" && (
        <div className="p-3 rounded-2xl bg-rose-50/50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 flex items-center justify-between gap-2 flex-wrap">
          <span className="text-xs font-bold text-rose-800 dark:text-rose-300">품질경보 알림 단계 서식:</span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              { key: "1", label: "1단계 (신규 발령) [발송중]" },
              { key: "2", label: "2단계 (조치완료) [발송중]" },
              { key: "3", label: "3단계 (종결/삭제) [6번 발송중지]" }
            ].map((st) => (
              <button
                key={st.key}
                type="button"
                onClick={() => setQualityStage(st.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  qualityStage === st.key
                    ? "bg-rose-600 text-white border-rose-600 shadow-xs"
                    : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {unifiedMsgType === "notice_meeting" && (
        <div className="p-3 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 flex items-center justify-between gap-2 flex-wrap">
          <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">공지/회의 서식:</span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              { key: "notice", label: "🟩 사내 공지사항 [발송중]" },
              { key: "meeting", label: "🟪 사내 회의일정 [발송중]" },
              { key: "meeting_result", label: "🟪 회의결과 보고" },
              { key: "meeting_reply", label: "🟪 회의회신 [10번 발송중지]" }
            ].map((nt) => (
              <button
                key={nt.key}
                type="button"
                onClick={() => setNoticeMeetingType(nt.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  noticeMeetingType === nt.key
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                    : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                }`}
              >
                {nt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 스마트폰 프레임 (직접 편집 가능한 텍스트 상자 & 렌더링 미리보기 탭) */}
      <div className="bg-slate-950 text-slate-100 rounded-3xl p-5 border border-slate-800 shadow-2xl space-y-3 font-sans">
        {/* Top Toolbar in Smartphone frame */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-800 text-xs">
          <div className="flex items-center gap-2 font-bold text-sky-400">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>📢 오륙 통합방 (-4186792536)</span>
            <span className="text-[11px] font-mono text-slate-400 font-normal">
              ({editableUnifiedText.length}자)
            </span>
            {isUnifiedTemplateCustom && (
              <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40">
                고정 서식
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center flex-wrap">
            {/* 1. 보기 모드 전환: 직접 수정 vs 수신 화면 */}
            <div className="flex items-center bg-slate-900 rounded-xl p-0.5 border border-slate-800">
              <button
                type="button"
                onClick={() => setUnifiedViewMode("edit")}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  unifiedViewMode === "edit"
                    ? "bg-blue-600 text-white shadow-xs font-black"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>직접 수정</span>
              </button>

              <button
                type="button"
                onClick={() => setUnifiedViewMode("preview")}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  unifiedViewMode === "preview"
                    ? "bg-blue-600 text-white shadow-xs font-black"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>수신 화면</span>
              </button>
            </div>

            {/* 2. 단일 F5 실시간 최신 갱신 버튼 */}
            <button
              type="button"
              disabled={loadingLiveBriefing}
              onClick={handleRefreshLiveBriefing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/50 text-xs font-black shadow-sm active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              title="최신 Firestore 원천 데이터로 즉시 새로고침 (F5 동기화)"
            >
              <RotateCw className={`w-3.5 h-3.5 text-emerald-400 ${loadingLiveBriefing ? "animate-spin" : ""}`} />
              <span>{loadingLiveBriefing ? "취합 중..." : "⚡ F5 실시간 갱신"}</span>
            </button>

            {/* 3. 커스텀 템플릿 사용 중일 때만 기본값 복원 버튼 노출 */}
            {isUnifiedTemplateCustom && (
              <button
                type="button"
                disabled={loadingLiveBriefing}
                onClick={handleResetUnifiedTemplate}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                title="저장된 고정 서식을 삭제하고 실시간 취합 기본 서식으로 복원"
              >
                <RotateCw className={`w-3.5 h-3.5 text-amber-400 ${loadingLiveBriefing ? "animate-spin" : ""}`} />
                <span>기본값 복원</span>
              </button>
            )}

            {/* 4. 복사 버튼 */}
            <button
              type="button"
              onClick={() => handleCopyText(editableUnifiedText)}
              className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 text-xs font-bold transition-all cursor-pointer"
              title="클립보드에 복사"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* In-Place Editable Message Box */}
        {unifiedViewMode === "edit" ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
              <span>💡 <strong>간략 요약형 서식:</strong> 원하는 내용을 자유롭게 수정한 후, <strong>[위 예시내용을 앞으로도 계속 적용]</strong>을 누르면 고정 저장됩니다.</span>
              <span className="font-mono text-slate-500">{editableUnifiedText.length}자</span>
            </div>
            <textarea
              rows="12"
              value={editableUnifiedText}
              onChange={(e) => setEditableUnifiedText(e.target.value)}
              className="w-full p-4 rounded-2xl bg-slate-900/95 border border-blue-500/50 font-mono text-xs sm:text-sm text-slate-100 leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-inner"
              placeholder="발송할 텔레그램 메시지 내용을 입력하세요..."
            ></textarea>
          </div>
        ) : (
          /* Rendered HTML Telegram Bubble */
          <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-700/80 space-y-3.5 text-xs sm:text-sm leading-relaxed shadow-lg">
            <div
              className="whitespace-pre-wrap text-slate-100 font-sans"
              dangerouslySetInnerHTML={{ __html: editableUnifiedText.replace(/\n/g, "<br/>") }}
            />
          </div>
        )}

        {/* Bottom Action Footer with [위 예시내용을 앞으로도 계속 적용] + [즉시 발송] */}
        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-800/80">
          <div className="text-[11px] text-slate-400">
            수신처: <strong>오륙 통합방</strong> (-4186792536)
          </div>

          <div className="flex items-center gap-2.5 flex-wrap justify-end">
            {copyToast && (
              <span className="text-xs font-bold text-sky-400 flex items-center gap-1 animate-fadeIn">
                <Check className="w-3.5 h-3.5" /> 복사 완료!
              </span>
            )}
            {templateSavedToast && (
              <span className="text-xs font-bold text-amber-400 flex items-center gap-1 animate-fadeIn">
                <BookmarkCheck className="w-4 h-4 text-amber-400" /> 앞으로도 계속 적용 저장 완료!
              </span>
            )}
            {templateResetToast && (
              <span className="text-xs font-bold text-sky-400 flex items-center gap-1 animate-fadeIn">
                <CheckCircle2 className="w-4 h-4 text-sky-400" /> [F5 동기화] Firestore 최신 원천 데이터로 문구가 갱신되었습니다!
              </span>
            )}
            {unifiedToast && (
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1 animate-fadeIn">
                <CheckCircle2 className="w-4 h-4" /> 오륙통합방 전송 완료!
              </span>
            )}

            {/* 1. [위 예시내용을 앞으로도 계속 적용] 확인/저장 탭 */}
            <button
              type="button"
              onClick={handleSaveUnifiedTemplate}
              className="flex items-center gap-1.5 px-4 sm:px-5 py-3 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/50 font-black text-xs sm:text-sm shadow-md active:scale-95 transition-all cursor-pointer"
              title="현재 수정된 텍스트를 기본 서식으로 저장하여 앞으로 자동/수동 발송 시 계속 적용합니다."
            >
              <BookmarkCheck className="w-4 h-4 text-amber-400" />
              <span>💾 위 예시내용을 앞으로도 계속 적용</span>
            </button>

            {/* 2. [내용 즉시 발송] 버튼 */}
            <button
              type="button"
              disabled={sendingUnified}
              onClick={handleSendUnifiedMessage}
              className="flex items-center gap-2 px-5 sm:px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-xs sm:text-sm shadow-xl shadow-blue-500/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              <Send className="w-4 h-4 text-sky-200" />
              <span>{sendingUnified ? "발송 중..." : "🚀 [오륙통합방]으로 예시 내용 즉시 발송"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
