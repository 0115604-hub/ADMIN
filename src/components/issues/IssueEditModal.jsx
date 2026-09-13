import React from "react";
import { createPortal } from "react-dom";
import {
  Calendar,
  Megaphone,
  Pin,
  AlertTriangle,
  CheckCircle2,
  Edit3,
  RotateCcw,
  Trash2,
  Check,
  Camera,
  Image as ImageIcon,
  MessageSquare,
  Plus,
  Save
} from "lucide-react";

export const IssueEditModal = ({
  isOpen,
  onClose,
  editingIssue,
  isIssueDetailMode,
  setIsIssueDetailMode,
  newIssueForm,
  setNewIssueForm,
  allWorkers,
  todayDateStr,
  onSwitchCategory,
  onSaveNewIssue,
  onOpenActionModal,
  onCancelRestore,
  onOpenDeleteModal,
  onPreviewImage,
  actionOpinionForm,
  setActionOpinionForm,
  onModalAddOpinion,
  onModalDeleteOpinion,
  replyForm,
  setReplyForm,
  isSubmittingReply,
  onModalAddReply,
  onModalDeleteReply,
  isProcessingIssueImages,
  onIssueImageFiles,
  onRemoveIssueImage,
  isProcessingActionImages,
  onNewIssueActionImageFiles,
  onRemoveNewIssueActionImage,
  onToggleResolvedStatus
}) => {
  if (!isOpen || typeof document === "undefined") return null;

  // 📅 오픈이슈 등록 모달용 14일 인터랙티브 타임라인 캘린더 생성기
  const getOpenIssueFormCalendarDays = (startDateStr, targetDateStr, replies = []) => {
    const days = [];
    const start = startDateStr ? new Date(startDateStr) : new Date();
    const base = new Date(start);
    base.setDate(base.getDate() - 1);
    const dayNames = ["일", "월", "화", "수", "목", "금", "토"];

    for (let i = 0; i < 14; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      const dateStr = `${yyyy}-${mm}-${dd}`;
      const dayName = dayNames[d.getDay()];
      const isToday = dateStr === todayDateStr;
      const isStart = dateStr === startDateStr;
      const isTarget = dateStr === targetDateStr;
      const isInRange = startDateStr && targetDateStr ? dateStr >= startDateStr && dateStr <= targetDateStr : false;

      const matchedReplies = (replies || []).filter((r) => {
        const rDate = r.actionDate || r.createdAt?.slice(0, 10);
        return rDate === dateStr;
      });
      const opinionCount = matchedReplies.length;
      const hasOpinions = opinionCount > 0;

      days.push({
        dateStr,
        dayName,
        monthDay: `${Number(mm)}/${Number(dd)}`,
        isToday,
        isStart,
        isTarget,
        isInRange,
        dayIndex: d.getDay(),
        opinionCount,
        hasOpinions,
        replies: matchedReplies
      });
    }
    return days;
  };

  return createPortal(
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      className="fixed inset-0 z-[80] bg-slate-950/80 backdrop-blur-md overflow-y-auto p-2 sm:p-4 py-2 sm:py-8 flex justify-center items-start sm:items-center animate-fadeIn cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl max-w-xl w-full p-3.5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-3.5 sm:space-y-4 my-auto animate-scaleUp max-h-[92vh] overflow-y-auto cursor-default"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-2.5 sm:pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className={`p-2 sm:p-2.5 rounded-xl sm:rounded-2xl text-white shadow-xs shrink-0 ${
              newIssueForm.category === "회의일정"
                ? "bg-purple-600"
                : newIssueForm.category === "공지사항"
                ? "bg-emerald-600"
                : newIssueForm.category === "오픈이슈"
                ? "bg-gradient-to-tr from-blue-600 to-indigo-600"
                : "bg-rose-600"
            }`}>
              {newIssueForm.category === "회의일정" ? (
                <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
              ) : newIssueForm.category === "공지사항" ? (
                <Megaphone className="w-4 h-4 sm:w-5 sm:h-5" />
              ) : newIssueForm.category === "오픈이슈" ? (
                <Pin className="w-4 h-4 sm:w-5 sm:h-5" />
              ) : (
                <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className={`px-2 py-0.5 rounded-md text-[10.5px] font-black text-white shrink-0 ${
                  newIssueForm.category === "회의일정"
                    ? "bg-purple-600"
                    : newIssueForm.category === "공지사항" || newIssueForm.category === "사내공지"
                    ? "bg-emerald-600"
                    : newIssueForm.category === "오픈이슈"
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600"
                    : "bg-rose-600"
                }`}>
                  {newIssueForm.category === "회의일정"
                    ? "📅 회의일정"
                    : (newIssueForm.category === "공지사항" || newIssueForm.category === "사내공지")
                    ? "📢 사내공지"
                    : newIssueForm.category === "오픈이슈"
                    ? "📌 오픈이슈"
                    : "🚨 품질경보"}
                </span>
                <span className="px-1.5 py-0.5 rounded-md text-[10.5px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  {newIssueForm.plant}
                </span>
                {newIssueForm.category === "오픈이슈" && (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-black shrink-0 bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-300">
                    💬 의견 {(newIssueForm.replies?.length || 0)}건
                  </span>
                )}
                {editingIssue && (
                  <span className={`px-2 py-0.5 rounded-md text-[10.5px] font-black shrink-0 ${
                    newIssueForm.isResolved
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300"
                      : "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 animate-pulse"
                  }`}>
                    {newIssueForm.isResolved ? "조치완료" : "조치대기"}
                  </span>
                )}
              </div>
              <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-white mt-0.5 truncate">
                {editingIssue
                  ? `${newIssueForm.plant} ${newIssueForm.category === "공지사항" ? "사내공지" : newIssueForm.category} 상세 및 처리`
                  : `신규 ${newIssueForm.category === "공지사항" ? "사내공지" : newIssueForm.category} 등록`}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-sm font-bold cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="닫기"
          >
            ✕
          </button>
        </div>

        {/* 🌟 1. 상세 보기 모드 */}
        {editingIssue && isIssueDetailMode ? (
          <div className="space-y-3.5 text-xs">
            {/* 1) 상단 등록 정보 & 일정 요약 바 */}
            <div className="p-3 rounded-2xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 flex items-center justify-between gap-2 flex-wrap">
              <div className="space-y-0.5 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
                  <span className="font-bold text-slate-500 dark:text-slate-400">등록자:</span>
                  <strong className="font-black text-slate-900 dark:text-white">
                    {editingIssue.author || "권태형"} {editingIssue.authorTitle || ""}
                  </strong>
                  <span className="text-slate-400 dark:text-slate-500">•</span>
                  <span className="font-mono text-slate-600 dark:text-slate-300">
                    {editingIssue.createdAt || editingIssue.date || todayDateStr}
                  </span>
                </div>
                {(editingIssue.startDate || editingIssue.expireDate) && (
                  <div className="flex items-center gap-1.5 text-[11px] text-blue-900 dark:text-blue-200 font-mono font-bold">
                    <span>🚩 일정: {editingIssue.startDate || "착수"} ~ {editingIssue.expireDate || "마감"}</span>
                    {editingIssue.expireDate && (
                      <span className={`px-1.5 py-0.2 rounded text-[9.5px] font-black ${
                        editingIssue.expireDate >= todayDateStr
                          ? "bg-blue-600 text-white"
                          : "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                      }`}>
                        {editingIssue.expireDate >= todayDateStr
                          ? `D-${Math.max(0, Math.ceil((new Date(editingIssue.expireDate) - new Date(todayDateStr)) / (1000 * 60 * 60 * 24)))}`
                          : "기한경과"}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Quick Status Toggle Button */}
              <button
                type="button"
                onClick={onToggleResolvedStatus}
                className={`px-3 py-1.5 rounded-xl font-black text-xs shadow-xs transition-all active:scale-95 cursor-pointer flex items-center gap-1 shrink-0 ${
                  editingIssue.isResolved
                    ? "bg-emerald-600 text-white hover:bg-emerald-700"
                    : "bg-amber-500 text-slate-950 hover:bg-amber-600"
                }`}
                title="클릭 시 조치완료 / 진행중 상태 즉시 전환"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{editingIssue.isResolved ? "조치완료 ✓" : "진행중 (완료처리 ➜)"}</span>
              </button>
            </div>

            {/* 2) 제목 & 상세 전달 내용 */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 space-y-2.5 shadow-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse shrink-0"></div>
                <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-white leading-snug break-words">
                  {editingIssue.title || "제목 없음"}
                </h4>
              </div>
              <div className="text-xs sm:text-[13px] font-medium text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800/80">
                {editingIssue.content || "상세 전달 내용이 없습니다."}
              </div>

              {/* 조치 결과 내용 */}
              {editingIssue.actionResult ? (
                <div className={`p-3 rounded-xl border space-y-1 ${
                  newIssueForm.category === "회의일정"
                    ? "bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800/80"
                    : "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/80"
                }`}>
                  <div className="flex items-center justify-between text-[11px] font-black">
                    <span className={`flex items-center gap-1 ${
                      newIssueForm.category === "회의일정" ? "text-purple-800 dark:text-purple-300" : "text-emerald-800 dark:text-emerald-300"
                    }`}>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{newIssueForm.category === "회의일정" ? "회의 결과 및 결정 사항" : "조치 완료 결과"}</span>
                    </span>
                    <div className="flex items-center gap-2">
                      {editingIssue.actionAuthor && (
                        <span className="font-medium text-slate-500 dark:text-slate-400">
                          {editingIssue.actionAuthor} • {editingIssue.actionAt}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => onOpenActionModal(editingIssue)}
                        className="px-2 py-0.5 rounded-lg bg-white dark:bg-slate-800 text-[10.5px] font-black text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 cursor-pointer shadow-2xs"
                      >
                        수정 ✏️
                      </button>
                    </div>
                  </div>
                  <div className="text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap font-medium leading-relaxed">
                    {editingIssue.actionResult}
                  </div>
                </div>
              ) : null}

              {/* 첨부 사진 갤러리 */}
              {((editingIssue.images && editingIssue.images.length > 0) || (editingIssue.actionImages && editingIssue.actionImages.length > 0)) && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <label className="font-bold text-[11px] text-slate-500 dark:text-slate-400 block mb-1.5">
                    📸 현장 첨부 사진 ({((editingIssue.images?.length || 0) + (editingIssue.actionImages?.length || 0))}장)
                  </label>
                  <div className="flex items-center gap-2 flex-wrap">
                    {editingIssue.images?.map((img, idx) => (
                      <img
                        key={`img_${idx}`}
                        src={img.dataUrl}
                        alt={`첨부사진_${idx + 1}`}
                        onClick={() => onPreviewImage({ url: img.dataUrl, name: img.name || `첨부사진_${idx + 1}` })}
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover border-2 border-slate-200 dark:border-slate-700 cursor-pointer hover:scale-105 transition-all shadow-xs"
                        title="클릭하여 원본 보기"
                      />
                    ))}
                    {editingIssue.actionImages?.map((img, idx) => (
                      <img
                        key={`act_${idx}`}
                        src={img.dataUrl}
                        alt={`조치사진_${idx + 1}`}
                        onClick={() => onPreviewImage({ url: img.dataUrl, name: img.name || `조치사진_${idx + 1}` })}
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover border-2 border-emerald-300 dark:border-emerald-700 cursor-pointer hover:scale-105 transition-all shadow-xs"
                        title="클릭하여 원본 보기"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 3) 💬 일자별 조치 의견 & 진행 일지 */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-blue-50/70 via-indigo-50/30 to-slate-50 dark:from-blue-950/40 dark:via-indigo-950/20 dark:to-slate-900 border-2 border-blue-200 dark:border-blue-900/80 space-y-3 shadow-xs">
              <div className="flex items-center justify-between gap-1 flex-wrap">
                <span className="font-black text-xs sm:text-sm text-blue-950 dark:text-blue-200 flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-blue-600" />
                  <span>조치 일자별 의견 및 진행 일지 ({editingIssue.replies?.length || 0}건)</span>
                </span>
                <span className="text-[10.5px] text-blue-600 dark:text-blue-400 font-semibold">
                  * 작업자 누구나 의견을 등록할 수 있습니다.
                </span>
              </div>

              {/* Opinions List Display */}
              {editingIssue.replies && editingIssue.replies.length > 0 ? (
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {editingIssue.replies.map((rep) => (
                    <div
                      key={rep.id}
                      className="p-2.5 rounded-xl bg-white dark:bg-slate-900/90 border border-blue-200/80 dark:border-blue-900/80 flex items-center justify-between gap-2 shadow-2xs"
                    >
                      <div className="flex items-center gap-1.5 min-w-0 flex-1 flex-wrap">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-black bg-blue-600 text-white shrink-0 shadow-2xs flex items-center gap-0.5">
                          <Calendar className="w-2.5 h-2.5" />
                          <span>{rep.actionDate || rep.createdAt?.slice(0, 10)}</span>
                        </span>
                        <strong className="text-slate-900 dark:text-white font-bold text-xs shrink-0">
                          {rep.author} {rep.authorTitle || ""}
                        </strong>
                        <span className="text-slate-700 dark:text-slate-200 text-xs break-words font-medium">
                          {rep.content}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-[9.5px] text-slate-400 font-mono">
                          {rep.createdAt?.slice(11, 16) || ""}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => onModalDeleteOpinion(rep.id, e)}
                          className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/50 cursor-pointer transition-colors"
                          title="의견 삭제"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 text-center text-xs font-semibold text-slate-400 bg-white/70 dark:bg-slate-900/70 rounded-xl border border-dashed border-blue-200 dark:border-blue-900">
                  등록된 조치 의견이 없습니다. 아래에서 새로운 의견을 남겨주세요.
                </div>
              )}

              {/* Quick Opinion Input Box */}
              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-800 space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="font-bold text-[10.5px] text-slate-600 dark:text-slate-400 block mb-1">
                      📅 조치일자
                    </label>
                    <input
                      type="date"
                      value={actionOpinionForm.actionDate || todayDateStr}
                      onChange={(e) => setActionOpinionForm({ ...actionOpinionForm, actionDate: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-[10.5px] text-slate-600 dark:text-slate-400 block mb-1">
                      👤 작성자 (직접 선택)
                    </label>
                    <select
                      value={actionOpinionForm.author || ""}
                      onChange={(e) => setActionOpinionForm({ ...actionOpinionForm, author: e.target.value })}
                      className={`w-full px-2.5 py-1.5 rounded-lg border-2 text-xs font-bold transition-all ${
                        !actionOpinionForm.author
                          ? "border-blue-400 bg-blue-50/60 dark:bg-blue-950/60 text-blue-900 dark:text-blue-200 ring-1 ring-blue-400/40"
                          : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      }`}
                    >
                      <option value="">-- 작성자 선택 --</option>
                      <optgroup label="👑 본사 임원진">
                        {allWorkers?.filter((w) => w.plantName === "본사").map((w) => (
                          <option key={w.id} value={w.name}>본사 • {w.name} {w.title || ""}</option>
                        ))}
                      </optgroup>
                      <optgroup label="🏢 삼랑진공장">
                        {allWorkers?.filter((w) => w.plantName === "삼랑진공장" && !w.isPartner).map((w) => (
                          <option key={w.id} value={w.name}>삼랑진 • {w.name} {w.title || ""}</option>
                        ))}
                      </optgroup>
                      <optgroup label="🏢 한림공장">
                        {allWorkers?.filter((w) => w.plantName === "한림공장" && !w.isPartner).map((w) => (
                          <option key={w.id} value={w.name}>한림 • {w.name} {w.title || ""}</option>
                        ))}
                      </optgroup>
                      <optgroup label="🤝 협력업체">
                        {allWorkers?.filter((w) => w.isPartner).map((w) => (
                          <option key={w.id} value={w.name}>협력 • {w.name} ({w.plantName})</option>
                        ))}
                      </optgroup>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    placeholder="조치 의견 및 진행 상황을 입력하세요 (엔터 시 추가)"
                    value={actionOpinionForm.content}
                    onChange={(e) => setActionOpinionForm({ ...actionOpinionForm, content: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        onModalAddOpinion(e);
                      }
                    }}
                    className="flex-1 px-3 py-2 rounded-xl border border-blue-300 dark:border-blue-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400"
                  />
                  <button
                    type="button"
                    onClick={onModalAddOpinion}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-xs shadow-md active:scale-95 flex items-center gap-1 cursor-pointer shrink-0 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ 의견 등록</span>
                  </button>
                </div>
              </div>
            </div>

            {/* 4) 하단 액션 버튼 바 */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setIsIssueDetailMode(false)}
                  className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 shadow-xs"
                  title="제목, 본문, 일정, 사진 등 내용 수정 모드로 전환"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>✏️ 내용 수정</span>
                </button>

              </div>

              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 font-black text-xs shadow-md active:scale-95 cursor-pointer transition-all"
              >
                닫기
              </button>
            </div>
          </div>
        ) : (
          /* 🌟 2. 신규 등록 및 수정 모드 폼 */
          <form onSubmit={onSaveNewIssue} className="space-y-3.5 text-xs">
            {editingIssue && (
              <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsIssueDetailMode(true)}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1 cursor-pointer"
                >
                  <span>← 정리된 상세 보기로 돌아가기</span>
                </button>
              </div>
            )}

            {/* 1. 구분 (4대 분류) */}
            <div>
              <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">
                구분 (4대 분류)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {/* 1) 품질경보 */}
                <button
                  type="button"
                  onClick={() => onSwitchCategory("품질경보")}
                  className={`py-2 px-1 rounded-xl border-2 flex items-center justify-center gap-1 transition-all cursor-pointer text-xs font-black ${
                    newIssueForm.category === "품질경보"
                      ? "bg-rose-50 dark:bg-rose-950/70 border-rose-500 text-rose-700 dark:text-rose-300 shadow-xs ring-1 ring-rose-500/30"
                      : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-700 hover:border-slate-300"
                  }`}
                >
                  <span>🚨 품질경보</span>
                </button>

                {/* 2) 회의일정 */}
                <button
                  type="button"
                  onClick={() => onSwitchCategory("회의일정")}
                  className={`py-2 px-1 rounded-xl border-2 flex items-center justify-center gap-1 transition-all cursor-pointer text-xs font-black ${
                    newIssueForm.category === "회의일정"
                      ? "bg-purple-50 dark:bg-purple-950/70 border-purple-500 text-purple-700 dark:text-purple-300 shadow-xs ring-1 ring-purple-500/30"
                      : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-700 hover:border-slate-300"
                  }`}
                >
                  <span>📅 회의일정</span>
                </button>

                {/* 3) 사내공지 */}
                <button
                  type="button"
                  onClick={() => onSwitchCategory("공지사항")}
                  className={`py-2 px-1 rounded-xl border-2 flex items-center justify-center gap-1 transition-all cursor-pointer text-xs font-black ${
                    newIssueForm.category === "공지사항" || newIssueForm.category === "사내공지"
                      ? "bg-emerald-50 dark:bg-emerald-950/70 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-xs ring-1 ring-emerald-500/30"
                      : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-700 hover:border-slate-300"
                  }`}
                >
                  <span>📢 사내공지</span>
                </button>

                {/* 4) 오픈이슈 */}
                <button
                  type="button"
                  onClick={() => onSwitchCategory("오픈이슈")}
                  className={`py-2 px-1 rounded-xl border-2 flex items-center justify-center gap-1 transition-all cursor-pointer text-xs font-black ${
                    newIssueForm.category === "오픈이슈"
                      ? "bg-blue-50 dark:bg-blue-950/70 border-blue-500 text-blue-700 dark:text-blue-300 shadow-xs ring-1 ring-blue-500/30"
                      : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-700 hover:border-slate-300"
                  }`}
                >
                  <Pin className="w-3.5 h-3.5 text-blue-500" />
                  <span>오픈이슈</span>
                </button>
              </div>
            </div>

            {/* 2. 공장 & 작성자 */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">
                  공장 / 구분
                </label>
                <select
                  value={newIssueForm.plant}
                  onChange={(e) => setNewIssueForm({ ...newIssueForm, plant: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-white"
                >
                  <option value="삼랑진공장">삼랑진공장</option>
                  <option value="한림공장">한림공장</option>
                  <option value="본사">본사</option>
                  <option value="화승 R&A">화승 R&A</option>
                  <option value="전체">전체</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">
                  작성자 (직접 선택)
                </label>
                <select
                  value={newIssueForm.author || ""}
                  required
                  onChange={(e) => {
                    const found = allWorkers?.find((w) => w.name === e.target.value);
                    setNewIssueForm({
                      ...newIssueForm,
                      author: e.target.value,
                      authorTitle: found?.title || "선임",
                      plant: found?.plantName === "본사" && newIssueForm.plant === "삼랑진공장" ? "본사" : newIssueForm.plant
                    });
                  }}
                  className={`w-full px-3 py-2 rounded-xl border-2 text-xs font-bold transition-all ${
                    !newIssueForm.author
                      ? "border-blue-400 bg-blue-50/60 dark:bg-blue-950/60 text-blue-900 dark:text-blue-200 ring-1 ring-blue-400/40"
                      : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  }`}
                >
                  <option value="">-- 작성자 직접 선택 (필수) --</option>
                  <optgroup label="👑 본사 임원진">
                    {allWorkers?.filter((w) => w.plantName === "본사").map((w) => (
                      <option key={w.id} value={w.name}>본사 • {w.name} {w.title || ""}</option>
                    ))}
                  </optgroup>
                  <optgroup label="🏢 삼랑진공장">
                    {allWorkers?.filter((w) => w.plantName === "삼랑진공장" && !w.isPartner).map((w) => (
                      <option key={w.id} value={w.name}>삼랑진 • {w.name} {w.title || ""}</option>
                    ))}
                  </optgroup>
                  <optgroup label="🏢 한림공장">
                    {allWorkers?.filter((w) => w.plantName === "한림공장" && !w.isPartner).map((w) => (
                      <option key={w.id} value={w.name}>한림 • {w.name} {w.title || ""}</option>
                    ))}
                  </optgroup>
                  <optgroup label="🤝 협력업체">
                    {allWorkers?.filter((w) => w.isPartner).map((w) => (
                      <option key={w.id} value={w.name}>협력 • {w.name} ({w.plantName})</option>
                    ))}
                  </optgroup>
                </select>
              </div>
            </div>

            {/* 3. 카테고리별 특화 영역 */}
            {newIssueForm.category === "오픈이슈" ? (
              /* 오픈이슈 전용 */
              <div className="p-3 sm:p-4 rounded-2xl bg-gradient-to-br from-blue-50/90 via-indigo-50/40 to-slate-50 dark:from-blue-950/40 dark:via-indigo-950/30 dark:to-slate-900 border-2 border-blue-300 dark:border-blue-800 space-y-3 shadow-sm">
                <div className="flex items-center justify-between flex-wrap gap-1.5 pb-2 border-b border-blue-200/70 dark:border-blue-900/60">
                  <div className="flex items-center gap-1.5">
                    <div className="p-1 rounded-lg bg-blue-600 text-white shadow-2xs">
                      <Pin className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-black text-xs sm:text-sm text-blue-950 dark:text-blue-200">
                      오픈이슈 일정관리
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="submit"
                      className="px-3.5 py-1 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-xs shadow-md active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
                      title="오픈이슈 등록 및 저장"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>등록</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-2 p-3 rounded-xl bg-white/90 dark:bg-slate-900/90 border border-blue-200 dark:border-blue-900">
                  <div>
                    <label className="font-bold text-[11px] text-slate-700 dark:text-slate-300 block mb-1">
                      제목
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="예: 압출 2호기 금형 히터 온도 점검 및 개선"
                      value={newIssueForm.title}
                      onChange={(e) => setNewIssueForm({ ...newIssueForm, title: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-black text-slate-900 dark:text-white text-xs sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-[11px] text-slate-700 dark:text-slate-300 block mb-1">
                      상세 전달 내용
                    </label>
                    <textarea
                      rows="2"
                      required
                      placeholder="구체적인 상황, 문제점 및 작업자 전달 사항을 입력해 주세요."
                      value={newIssueForm.content}
                      onChange={(e) => setNewIssueForm({ ...newIssueForm, content: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium leading-relaxed text-slate-900 dark:text-white text-xs"
                    ></textarea>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="font-bold text-[11px] text-slate-700 dark:text-slate-300 block mb-1">
                      🚩 착수/시작 일자
                    </label>
                    <input
                      type="date"
                      required
                      value={newIssueForm.startDate || todayDateStr}
                      onChange={(e) => setNewIssueForm({ ...newIssueForm, startDate: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold text-xs text-slate-900 dark:text-white shadow-xs cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-[11px] text-slate-700 dark:text-slate-300 block mb-1">
                      🎯 조치 목표/마감 일자 (직접 지정)
                    </label>
                    <input
                      type="date"
                      required
                      value={newIssueForm.expireDate || todayDateStr}
                      onChange={(e) => setNewIssueForm({ ...newIssueForm, expireDate: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-xl border border-blue-400 dark:border-blue-600 bg-white dark:bg-slate-800 font-mono font-black text-xs text-blue-700 dark:text-blue-300 shadow-xs cursor-pointer ring-1 ring-blue-400/30"
                    />
                  </div>
                </div>

                {/* 달력 형식 타임라인 */}
                <div className="p-2.5 sm:p-3 rounded-xl bg-white/90 dark:bg-slate-900/90 border border-blue-200 dark:border-blue-900 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-black text-slate-800 dark:text-slate-200 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-blue-600" />
                      <span>달력형 타임라인 & 일자별 의견 현황</span>
                    </span>
                    <span className="text-[9.5px] text-slate-400">
                      * 날짜 클릭 시 목표일 지정 및 해당 일자 의견 등록으로 지정
                    </span>
                  </div>

                  <div className="grid grid-cols-7 gap-1 sm:gap-1.5 pt-1">
                    {getOpenIssueFormCalendarDays(
                      newIssueForm.startDate || todayDateStr,
                      newIssueForm.expireDate || todayDateStr,
                      newIssueForm.replies || []
                    ).map((day) => {
                      const isSelectedForAction = actionOpinionForm.actionDate === day.dateStr;
                      return (
                        <button
                          key={day.dateStr}
                          type="button"
                          onClick={() => {
                            setNewIssueForm({ ...newIssueForm, expireDate: day.dateStr });
                            setActionOpinionForm((prev) => ({ ...prev, actionDate: day.dateStr }));
                          }}
                          className={`p-1 sm:p-1.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-between min-h-[58px] sm:min-h-[64px] relative group ${
                            isSelectedForAction || day.isTarget
                              ? "bg-blue-600 text-white border-blue-500 shadow-md ring-2 ring-blue-400/60 font-black scale-102"
                              : day.hasOpinions
                              ? "bg-blue-50/90 dark:bg-blue-950/70 border-blue-400 dark:border-blue-600 text-blue-950 dark:text-blue-100 font-bold ring-1 ring-blue-400/40"
                              : day.isStart
                              ? "bg-indigo-100 dark:bg-indigo-950 border-indigo-500 text-indigo-900 dark:text-indigo-200 font-black"
                              : day.isInRange
                              ? "bg-blue-50/60 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900 text-blue-900 dark:text-blue-200 font-medium"
                              : "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-100"
                          }`}
                          title={`일자: ${day.dateStr} (의견 ${day.opinionCount}건)`}
                        >
                          <div className="text-[9.5px] sm:text-[10px] font-mono leading-tight">
                            <span className={day.dayIndex === 0 ? "text-rose-500 font-bold" : day.dayIndex === 6 ? "text-blue-500 font-bold" : ""}>
                              {day.monthDay}
                            </span>
                            <span className="block text-[8px] opacity-75">({day.dayName})</span>
                          </div>

                          <div className="my-0.5">
                            {day.isTarget ? (
                              <span className="px-1 py-0.2 rounded text-[7.5px] font-black bg-white text-blue-700 shadow-2xs">
                                🎯목표
                              </span>
                            ) : day.isStart ? (
                              <span className="px-1 py-0.2 rounded text-[7.5px] font-black bg-indigo-600 text-white shadow-2xs">
                                🚩시작
                              </span>
                            ) : day.isToday ? (
                              <span className="px-1 py-0.2 rounded text-[7.5px] font-black bg-amber-500 text-slate-950 shadow-2xs animate-pulse">
                                오늘
                              </span>
                            ) : null}
                          </div>

                          <div className="w-full flex items-center justify-center">
                            {day.hasOpinions ? (
                              <span className={`px-1 py-0.5 rounded-md text-[8px] sm:text-[8.5px] font-black flex items-center justify-center gap-0.5 shadow-2xs ${
                                isSelectedForAction || day.isTarget
                                  ? "bg-cyan-300 text-slate-900"
                                  : "bg-blue-600 text-white animate-pulse"
                              }`}>
                                <MessageSquare className="w-2.5 h-2.5 shrink-0" />
                                <span>{day.opinionCount}건</span>
                              </span>
                            ) : (
                              <span className="text-[7.5px] text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                +의견
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 의견 실시간 추가란 */}
                <div className="p-3 rounded-2xl bg-white/95 dark:bg-slate-900/95 border-2 border-blue-300 dark:border-blue-800/80 shadow-xs space-y-2.5">
                  <div className="flex items-center justify-between gap-1 flex-wrap">
                    <span className="font-black text-xs text-blue-950 dark:text-blue-200 flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                      <span>조치 일자별 의견 및 진행 일지 ({newIssueForm.replies?.length || 0}건)</span>
                    </span>
                    <span className="text-[10.5px] text-blue-600 dark:text-blue-400 font-semibold">
                      * 날짜 지정 후 의견을 계속 추가할 수 있습니다.
                    </span>
                  </div>

                  {newIssueForm.replies && newIssueForm.replies.length > 0 && (
                    <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                      {newIssueForm.replies.map((rep) => (
                        <div
                          key={rep.id}
                          className="p-2.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/80 flex items-center justify-between gap-2 shadow-2xs"
                        >
                          <div className="flex items-center gap-1.5 min-w-0 flex-1 flex-wrap">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-black bg-blue-600 text-white shrink-0 shadow-2xs flex items-center gap-0.5">
                              <Calendar className="w-2.5 h-2.5" />
                              <span>{rep.actionDate || rep.createdAt?.slice(0, 10)}</span>
                            </span>
                            <strong className="text-slate-900 dark:text-white font-bold text-xs shrink-0">
                              {rep.author} {rep.authorTitle || ""}
                            </strong>
                            <span className="text-slate-700 dark:text-slate-200 text-xs break-words">
                              {rep.content}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <span className="text-[9.5px] text-slate-400 font-mono">
                              {rep.createdAt?.slice(11, 16) || ""}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => onModalDeleteOpinion(rep.id, e)}
                              className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/50 cursor-pointer transition-colors"
                              title="의견 삭제"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="font-bold text-[11px] text-slate-700 dark:text-slate-300 block mb-1">
                          📅 조치등록날짜
                        </label>
                        <input
                          type="date"
                          value={actionOpinionForm.actionDate || todayDateStr}
                          onChange={(e) => setActionOpinionForm({ ...actionOpinionForm, actionDate: e.target.value })}
                          className="w-full px-2.5 py-1.5 rounded-xl border border-blue-300 dark:border-blue-700 bg-white dark:bg-slate-900 font-mono font-bold text-xs text-blue-900 dark:text-blue-200 shadow-xs cursor-pointer"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-[11px] text-slate-700 dark:text-slate-300 block mb-1">
                          👤 작성자 (직접 선택)
                        </label>
                        <select
                          value={actionOpinionForm.author || ""}
                          onChange={(e) => setActionOpinionForm({ ...actionOpinionForm, author: e.target.value })}
                          className={`w-full px-2.5 py-1.5 rounded-xl border-2 text-xs font-bold transition-all ${
                            !actionOpinionForm.author
                              ? "border-blue-400 bg-blue-50/60 dark:bg-blue-950/60 text-blue-900 dark:text-blue-200 ring-1 ring-blue-400/40"
                              : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white cursor-pointer"
                          }`}
                        >
                          <option value="">-- 작성자 직접 선택 (필수) --</option>
                          <optgroup label="👑 본사 임원진">
                            {allWorkers?.filter((w) => w.plantName === "본사").map((w) => (
                              <option key={w.id} value={w.name}>본사 • {w.name} {w.title || ""}</option>
                            ))}
                          </optgroup>
                          <optgroup label="🏢 삼랑진공장">
                            {allWorkers?.filter((w) => w.plantName === "삼랑진공장" && !w.isPartner).map((w) => (
                              <option key={w.id} value={w.name}>삼랑진 • {w.name} {w.title || ""}</option>
                            ))}
                          </optgroup>
                          <optgroup label="🏢 한림공장">
                            {allWorkers?.filter((w) => w.plantName === "한림공장" && !w.isPartner).map((w) => (
                              <option key={w.id} value={w.name}>한림 • {w.name} {w.title || ""}</option>
                            ))}
                          </optgroup>
                          <optgroup label="🤝 협력업체">
                            {allWorkers?.filter((w) => w.isPartner).map((w) => (
                              <option key={w.id} value={w.name}>협력 • {w.name} ({w.plantName})</option>
                            ))}
                          </optgroup>
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        placeholder="조치 의견 및 진행 상황을 입력하세요 (엔터 시 추가)"
                        value={actionOpinionForm.content}
                        onChange={(e) => setActionOpinionForm({ ...actionOpinionForm, content: e.target.value })}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            onModalAddOpinion(e);
                          }
                        }}
                        className="flex-1 px-3 py-2 rounded-xl border border-blue-300 dark:border-blue-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-900 dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={onModalAddOpinion}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-xs shadow-md active:scale-95 flex items-center gap-1 cursor-pointer shrink-0 transition-all"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>+ 추가</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* 기타 카테고리 (회의일정 / 사내공지 / 품질경보) */
              <div className={`p-3 rounded-2xl border transition-all ${
                newIssueForm.category === "회의일정"
                  ? "bg-purple-50/80 dark:bg-purple-950/40 border-purple-300 dark:border-purple-800 ring-1 ring-purple-400/30"
                  : newIssueForm.category === "공지사항" || newIssueForm.category === "사내공지"
                  ? "bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 ring-1 ring-emerald-400/30"
                  : "bg-rose-50/80 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 ring-1 ring-rose-400/30"
              }`}>
                {newIssueForm.category === "회의일정" ? (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <label className="font-black text-xs text-slate-800 dark:text-slate-200 flex items-center gap-1.5 shrink-0">
                      <Calendar className="w-3.5 h-3.5 text-purple-600" />
                      <span>회의 진행 일시</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2 w-full sm:w-auto">
                      <input
                        type="date"
                        required
                        value={newIssueForm.expireDate || todayDateStr}
                        onChange={(e) => setNewIssueForm({ ...newIssueForm, expireDate: e.target.value })}
                        className="px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 font-mono font-black text-xs text-slate-900 dark:text-white shadow-xs text-center cursor-pointer"
                      />
                      <select
                        value={newIssueForm.meetingTime || "14:00"}
                        onChange={(e) => setNewIssueForm({ ...newIssueForm, meetingTime: e.target.value })}
                        className="px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 font-mono font-black text-xs text-purple-700 dark:text-purple-300 shadow-xs text-center cursor-pointer"
                      >
                        {[
                          "06:00", "06:30", "07:00", "07:30", "08:00", "08:30",
                          "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
                          "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
                          "15:00", "15:30", "16:00", "16:30", "17:00"
                        ].map((t) => (
                          <option key={t} value={t} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono font-bold">
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ) : newIssueForm.category === "공지사항" || newIssueForm.category === "사내공지" ? (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <label className="font-black text-xs block text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <Megaphone className="w-3.5 h-3.5 text-emerald-600" />
                        <span>공지 게시 만료일자</span>
                      </label>
                      <p className="text-[10.5px] text-slate-500 dark:text-slate-400">
                        * 만료일 경과 시 첫 화면에서 자동 정리됩니다.
                      </p>
                    </div>
                    <input
                      type="date"
                      required
                      value={newIssueForm.expireDate || todayDateStr}
                      onChange={(e) => setNewIssueForm({ ...newIssueForm, expireDate: e.target.value })}
                      className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 font-mono font-black text-xs text-slate-900 dark:text-white shadow-xs cursor-pointer"
                    />
                  </div>
                ) : (
                  /* 품질경보 */
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <label className="font-black text-xs block text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                        <span>품질경보 등록일</span>
                      </label>
                      <p className="text-[10.5px] text-slate-500 dark:text-slate-400">
                        * 품질경보가 발행/등록된 일자입니다.
                      </p>
                    </div>
                    <input
                      type="date"
                      required
                      value={newIssueForm.expireDate || todayDateStr}
                      onChange={(e) => setNewIssueForm({ ...newIssueForm, expireDate: e.target.value })}
                      className="px-3 py-1.5 rounded-xl border border-rose-300 dark:border-rose-700 bg-white dark:bg-slate-800 font-mono font-black text-xs text-slate-900 dark:text-white shadow-xs cursor-pointer"
                    />
                  </div>
                )}
              </div>
            )}

            {/* 4. 제목 & 내용 */}
            {newIssueForm.category !== "오픈이슈" && (
              <div className="space-y-2">
                <div>
                  <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    {newIssueForm.category === "회의일정" ? "회의 제목" : "제목"}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={
                      newIssueForm.category === "회의일정"
                        ? "예: 9월 2주차 생산성 향상 및 품질 개선 주간 회의"
                        : newIssueForm.category === "공지사항"
                        ? "예: 9월 정기 소방 안전점검 및 현장 정리정돈 안내"
                        : "예: 압출 2호기 금형 히터 온도 점검 요망"
                    }
                    value={newIssueForm.title}
                    onChange={(e) => setNewIssueForm({ ...newIssueForm, title: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-black text-slate-900 dark:text-white text-xs sm:text-sm"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    {newIssueForm.category === "회의일정" ? "회의 안건 및 상세 일정" : "상세 전달 내용"}
                  </label>
                  <textarea
                    rows="3"
                    required
                    placeholder={
                      newIssueForm.category === "회의일정"
                        ? "• 일시: 2026-09-08(화) 14:00\n• 장소: 삼랑진공장 2층 대회의실\n• 안건: 압출 라인 히터 개선 및 불량율 저감 대책"
                        : "구체적인 상황 및 작업자 전달 사항을 입력해 주세요."
                    }
                    value={newIssueForm.content}
                    onChange={(e) => setNewIssueForm({ ...newIssueForm, content: e.target.value })}
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium leading-relaxed text-slate-900 dark:text-white text-xs sm:text-sm"
                  ></textarea>
                </div>
              </div>
            )}

            {/* 5. 현장 첨부 사진 */}
            <div className="space-y-1.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Camera className="w-3.5 h-3.5 text-rose-500" />
                  <span>현장/안건 첨부 사진 (최대 3장)</span>
                </label>
                <span className="text-[10px] text-slate-400 font-mono">
                  {newIssueForm.images?.length || 0}/3장
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <label
                  htmlFor="modal-issue-camera-input"
                  className={`py-2 px-2 rounded-xl border-2 flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95 text-center ${
                    (newIssueForm.images?.length || 0) >= 3
                      ? "border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed"
                      : "border-rose-400 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 font-black"
                  }`}
                >
                  <input
                    type="file"
                    id="modal-issue-camera-input"
                    accept="image/*"
                    capture="environment"
                    disabled={isProcessingIssueImages || (newIssueForm.images?.length || 0) >= 3}
                    onChange={(e) => {
                      if (e.target.files) {
                        onIssueImageFiles(e.target.files);
                        e.target.value = "";
                      }
                    }}
                    className="hidden"
                  />
                  <Camera className="w-3.5 h-3.5" />
                  <span>📸 즉시 촬영</span>
                </label>

                <label
                  htmlFor="modal-issue-gallery-input"
                  className={`py-2 px-2 rounded-xl border-2 border-dashed flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95 text-center ${
                    (newIssueForm.images?.length || 0) >= 3
                      ? "border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed"
                      : "border-slate-300 dark:border-slate-700 hover:border-slate-400 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold"
                  }`}
                >
                  <input
                    type="file"
                    id="modal-issue-gallery-input"
                    accept="image/*"
                    multiple
                    disabled={isProcessingIssueImages || (newIssueForm.images?.length || 0) >= 3}
                    onChange={(e) => {
                      if (e.target.files) {
                        onIssueImageFiles(e.target.files);
                        e.target.value = "";
                      }
                    }}
                    className="hidden"
                  />
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>📁 앨범 선택</span>
                </label>
              </div>

              {newIssueForm.images && newIssueForm.images.length > 0 && (
                <div className="grid grid-cols-3 gap-2 pt-1">
                  {newIssueForm.images.map((img, idx) => (
                    <div
                      key={img.id || idx}
                      className="group relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 aspect-square shadow-xs"
                    >
                      <img
                        src={img.dataUrl}
                        alt={img.name}
                        onClick={() => onPreviewImage({ url: img.dataUrl, name: img.name })}
                        className="w-full h-full object-cover cursor-pointer group-hover:scale-105 transition-transform"
                      />
                      <button
                        type="button"
                        onClick={() => onRemoveIssueImage(idx)}
                        className="absolute top-1 right-1 w-4 h-4 rounded-full bg-slate-900/80 hover:bg-rose-600 text-white flex items-center justify-center text-[10px] font-bold shadow-xs transition-colors cursor-pointer"
                        title="삭제"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 6. 회의 결과 / 조치 결과 입력 섹션 (오픈이슈는 제외) */}
            {newIssueForm.category !== "오픈이슈" && (
              <div className={`p-3.5 rounded-2xl border-2 space-y-2.5 transition-all ${
                newIssueForm.category === "회의일정"
                  ? "bg-purple-50/70 dark:bg-purple-950/30 border-purple-400 dark:border-purple-800/80"
                  : "bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-400 dark:border-emerald-800/80"
              }`}>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className={`w-4 h-4 ${newIssueForm.category === "회의일정" ? "text-purple-600" : "text-emerald-600"}`} />
                    <strong className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                      {newIssueForm.category === "회의일정" ? "회의 결과 및 결정 사항" : "조치 결과 입력"}
                    </strong>
                  </div>

                  {/* Status Toggle Button */}
                  <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700">
                    <button
                      type="button"
                      onClick={() => setNewIssueForm({ ...newIssueForm, isResolved: false })}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
                        !newIssueForm.isResolved
                          ? "bg-amber-500 text-slate-950 shadow-xs"
                          : "text-slate-400 hover:text-slate-700"
                      }`}
                    >
                      조치대기
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewIssueForm({ ...newIssueForm, isResolved: true })}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
                        newIssueForm.isResolved
                          ? "bg-emerald-600 text-white shadow-xs"
                          : "text-slate-400 hover:text-slate-700"
                      }`}
                    >
                      조치완료
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">
                      {newIssueForm.category === "회의일정" ? "보고자 / 작성자" : "조치자"} (직접 선택)
                    </label>
                    <select
                      value={newIssueForm.actionAuthor || ""}
                      onChange={(e) => setNewIssueForm({ ...newIssueForm, actionAuthor: e.target.value })}
                      className={`w-full px-3 py-2 rounded-xl border-2 text-xs font-bold transition-all ${
                        !newIssueForm.actionAuthor
                          ? "border-blue-400 bg-blue-50/60 dark:bg-blue-950/60 text-blue-900 dark:text-blue-200 ring-1 ring-blue-400/40"
                          : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      }`}
                    >
                      <option value="">-- {newIssueForm.category === "회의일정" ? "작성자 / 보고자" : "조치자"} 직접 선택 --</option>
                      <optgroup label="👑 본사 임원진">
                        {allWorkers?.filter((w) => w.plantName === "본사").map((w) => (
                          <option key={w.id} value={w.name}>본사 • {w.name} {w.title || ""}</option>
                        ))}
                      </optgroup>
                      <optgroup label="🏢 삼랑진공장">
                        {allWorkers?.filter((w) => w.plantName === "삼랑진공장" && !w.isPartner).map((w) => (
                          <option key={w.id} value={w.name}>삼랑진 • {w.name} {w.title || ""}</option>
                        ))}
                      </optgroup>
                      <optgroup label="🏢 한림공장">
                        {allWorkers?.filter((w) => w.plantName === "한림공장" && !w.isPartner).map((w) => (
                          <option key={w.id} value={w.name}>한림 • {w.name} {w.title || ""}</option>
                        ))}
                      </optgroup>
                      <optgroup label="🤝 협력업체">
                        {allWorkers?.filter((w) => w.isPartner).map((w) => (
                          <option key={w.id} value={w.name}>협력 • {w.name} ({w.plantName})</option>
                        ))}
                      </optgroup>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">
                      조치/종결 상태
                    </label>
                    <div className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                      <span>{newIssueForm.isResolved ? "✅ 조치 완료 상태" : "⏳ 조치 진행/대기중"}</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {newIssueForm.category === "회의일정" ? "회의종결" : "완료처리"}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    {newIssueForm.category === "회의일정" ? "회의 결과 및 결정 안건 상세" : "조치결과 상세 내용"}
                  </label>
                  <textarea
                    rows="3"
                    placeholder={
                      newIssueForm.category === "회의일정"
                        ? "예:\n1. 불량 원인 규명 및 금형 히터 교체 일정 확정\n2. 다음 주부터 2공장 표준 점검표 적용 시행"
                        : "예: 센서 커넥터 재체결 및 예열 온도 정상치(180℃) 도달 확인 완료 (설비 정상 가동)"
                    }
                    value={newIssueForm.actionResult}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNewIssueForm({
                        ...newIssueForm,
                        actionResult: val,
                        isResolved: val.trim().length > 0 ? true : newIssueForm.isResolved
                      });
                    }}
                    className="w-full p-3 rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold leading-relaxed text-slate-900 dark:text-white"
                  ></textarea>
                </div>

                {/* 조치 완료 / 회의 결과 사진 첨부 */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                      <Camera className={`w-3.5 h-3.5 ${newIssueForm.category === "회의일정" ? "text-purple-600" : "text-emerald-600"}`} />
                      <span>{newIssueForm.category === "회의일정" ? "회의록/현장 결과 사진 (선택)" : "조치 완료 사진 첨부 (선택)"}</span>
                    </label>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {newIssueForm.actionImages?.length || 0}/3장
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <label
                      htmlFor="modal-action-camera-input"
                      className={`py-2 px-2 rounded-xl border-2 flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95 text-center ${
                        (newIssueForm.actionImages?.length || 0) >= 3
                          ? "border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed"
                          : newIssueForm.category === "회의일정"
                          ? "border-purple-400 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-black"
                          : "border-emerald-400 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-black"
                      }`}
                    >
                      <input
                        type="file"
                        id="modal-action-camera-input"
                        accept="image/*"
                        capture="environment"
                        disabled={isProcessingActionImages || (newIssueForm.actionImages?.length || 0) >= 3}
                        onChange={(e) => {
                          if (e.target.files) {
                            onNewIssueActionImageFiles(e.target.files);
                            e.target.value = "";
                          }
                        }}
                        className="hidden"
                      />
                      <Camera className="w-3.5 h-3.5" />
                      <span>📸 결과사진 촬영</span>
                    </label>

                    <label
                      htmlFor="modal-action-gallery-input"
                      className={`py-2 px-2 rounded-xl border-2 border-dashed flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95 text-center ${
                        (newIssueForm.actionImages?.length || 0) >= 3
                          ? "border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed"
                          : "border-slate-300 dark:border-slate-700 hover:border-slate-400 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold"
                      }`}
                    >
                      <input
                        type="file"
                        id="modal-action-gallery-input"
                        accept="image/*"
                        multiple
                        disabled={isProcessingActionImages || (newIssueForm.actionImages?.length || 0) >= 3}
                        onChange={(e) => {
                          if (e.target.files) {
                            onNewIssueActionImageFiles(e.target.files);
                            e.target.value = "";
                          }
                        }}
                        className="hidden"
                      />
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>📁 앨범 선택</span>
                    </label>
                  </div>

                  {newIssueForm.actionImages && newIssueForm.actionImages.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 pt-1">
                      {newIssueForm.actionImages.map((img, idx) => (
                        <div
                          key={img.id || idx}
                          className="group relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 aspect-square shadow-xs"
                        >
                          <img
                            src={img.dataUrl}
                            alt={img.name}
                            onClick={() => onPreviewImage({ url: img.dataUrl, name: img.name })}
                            className="w-full h-full object-cover cursor-pointer group-hover:scale-105 transition-transform"
                          />
                          <button
                            type="button"
                            onClick={() => onRemoveNewIssueActionImage(idx)}
                            className="absolute top-1 right-1 w-4 h-4 rounded-full bg-slate-900/80 hover:bg-rose-600 text-white flex items-center justify-center text-[10px] font-bold shadow-xs transition-colors cursor-pointer"
                            title="삭제"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 7. 회신 및 참석 현황 (기존 항목 수정 시 노출 - 오픈이슈 제외) */}
            {editingIssue && newIssueForm.category !== "오픈이슈" && (
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-purple-600" />
                    <span>회신 및 참석 코멘트 ({newIssueForm.replies?.length || 0}건)</span>
                  </span>
                </div>

                {newIssueForm.replies && newIssueForm.replies.length > 0 && (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {newIssueForm.replies.map((rep) => (
                      <div
                        key={rep.id}
                        className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-1.5 min-w-0 flex-1 flex-wrap">
                          <span className={`px-1.5 py-0.2 rounded text-[9.5px] font-black shrink-0 ${
                            rep.attendanceStatus === "참석"
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                              : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                          }`}>
                            {rep.attendanceStatus || "확인"}
                          </span>
                          <strong className="text-slate-900 dark:text-white font-bold shrink-0">
                            {rep.author}
                          </strong>
                          <span className="text-slate-700 dark:text-slate-300 break-words">
                            {rep.content}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <span className="text-[9.5px] text-slate-400 font-mono">
                            {rep.createdAt?.slice(5) || ""}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => onModalDeleteReply(rep.id, e)}
                            className="text-slate-400 hover:text-rose-600 p-0.5 cursor-pointer"
                            title="회신 삭제"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="pt-1 flex items-center gap-1.5 flex-wrap sm:flex-nowrap">
                  <select
                    value={replyForm.author || ""}
                    onChange={(e) => setReplyForm({ ...replyForm, author: e.target.value })}
                    className="px-2 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white shrink-0"
                  >
                    <option value="">-- 작성자 선택 --</option>
                    <optgroup label="👑 본사 임원진">
                      {allWorkers?.filter((w) => w.plantName === "본사").map((w) => (
                        <option key={w.id} value={w.name}>본사 • {w.name} {w.title || ""}</option>
                      ))}
                    </optgroup>
                    <optgroup label="🏢 삼랑진공장">
                      {allWorkers?.filter((w) => w.plantName === "삼랑진공장" && !w.isPartner).map((w) => (
                        <option key={w.id} value={w.name}>삼랑진 • {w.name} {w.title || ""}</option>
                      ))}
                    </optgroup>
                    <optgroup label="🏢 한림공장">
                      {allWorkers?.filter((w) => w.plantName === "한림공장" && !w.isPartner).map((w) => (
                        <option key={w.id} value={w.name}>한림 • {w.name} {w.title || ""}</option>
                      ))}
                    </optgroup>
                    <optgroup label="🤝 협력업체">
                      {allWorkers?.filter((w) => w.isPartner).map((w) => (
                        <option key={w.id} value={w.name}>협력 • {w.name} ({w.plantName})</option>
                      ))}
                    </optgroup>
                  </select>
                  {newIssueForm.category === "회의일정" && (
                    <select
                      value={replyForm.attendanceStatus}
                      onChange={(e) => setReplyForm({ ...replyForm, attendanceStatus: e.target.value })}
                      className="px-2 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white shrink-0"
                    >
                      <option value="참석">참석</option>
                      <option value="불참">불참</option>
                      <option value="확인">확인</option>
                    </select>
                  )}
                  <input
                    type="text"
                    placeholder="회신 또는 전달 내용을 입력해 주세요"
                    value={replyForm.content}
                    onChange={(e) => setReplyForm({ ...replyForm, content: e.target.value })}
                    className="flex-1 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-medium text-slate-900 dark:text-white min-w-[140px]"
                  />
                  <button
                    type="button"
                    disabled={isSubmittingReply}
                    onClick={onModalAddReply}
                    className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs shrink-0 cursor-pointer shadow-xs active:scale-95 disabled:opacity-50"
                  >
                    회신 등록
                  </button>
                </div>
              </div>
            )}

            {/* 8. 하단 버튼 바 */}
            <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-100 dark:border-slate-800 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer text-xs transition-all active:scale-95"
              >
                닫기
              </button>

              <button
                type="submit"
                className={`px-6 py-2.5 rounded-xl text-white font-black shadow-md active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer text-xs ${
                  newIssueForm.category === "회의일정"
                    ? "bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 shadow-purple-500/25"
                    : newIssueForm.category === "공지사항" || newIssueForm.category === "사내공지"
                    ? "bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 shadow-emerald-500/25"
                    : newIssueForm.category === "오픈이슈"
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-blue-500/25"
                    : "bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 shadow-rose-500/25"
                }`}
              >
                <Save className="w-4 h-4" />
                <span>
                  {editingIssue
                    ? "내용수정"
                    : newIssueForm.category === "회의일정"
                    ? "회의일정 등록"
                    : newIssueForm.category === "공지사항" || newIssueForm.category === "사내공지"
                    ? "사내공지 등록"
                    : newIssueForm.category === "오픈이슈"
                    ? "오픈이슈 등록"
                    : "품질경보 등록"}
                </span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
};
