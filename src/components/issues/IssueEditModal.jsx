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
  Save,
  FileSpreadsheet,
  Download,
  Paperclip,
  X
} from "lucide-react";

export const getIssueOpinionCount = (item) => {
  if (!item) return 0;
  const replyCount = Array.isArray(item.replies) ? item.replies.length : 0;
  if (item.category === "품질경보" || item.category === "오픈이슈" || item.category === "품질이슈") {
    return replyCount;
  }
  const hasAction = typeof item.actionResult === "string" && item.actionResult.trim().length > 0;
  return replyCount + (hasAction ? 1 : 0);
};

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
  onIssueFiles,
  onIssueImageFiles,
  onRemoveIssueImage,
  onOpinionFiles,
  onRemoveOpinionFile,
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
                <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-black shrink-0 bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-300" title="조치결과 및 의견 수">
                  💬 {getIssueOpinionCount(editingIssue || newIssueForm)}건
                </span>
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
                  editingIssue?.isResolved
                    ? "bg-emerald-600 text-white hover:bg-emerald-700"
                    : "bg-amber-500 text-slate-950 hover:bg-amber-600"
                }`}
                title="클릭 시 조치완료 / 진행중 상태 즉시 전환"
              >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{editingIssue?.isResolved ? "조치완료 ✓" : "진행중 (완료처리 ➜)"}</span>
                </button>
            </div>

            {/* 2) 제목 & 상세 전달 내용 */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 space-y-2.5 shadow-xs">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                  <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse shrink-0"></div>
                  <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-white leading-snug break-words flex items-center gap-1.5 flex-wrap">
                    <span>{editingIssue?.title || "제목 없음"}</span>
                    <span className="px-1.5 py-0.2 rounded-md text-[10.5px] font-mono font-black bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-300 dark:border-blue-800 shadow-2xs">
                      💬 {getIssueOpinionCount(editingIssue || newIssueForm)}
                    </span>
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setIsIssueDetailMode(false)}
                  className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs flex items-center gap-1 cursor-pointer transition-all active:scale-95 shadow-2xs shrink-0"
                  title="제목 및 본문 내용 수정"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>본문 수정</span>
                </button>
              </div>
              <div className="text-xs sm:text-[13px] font-medium text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800/80">
                {editingIssue.content || "상세 전달 내용이 없습니다."}
              </div>

              {/* 조치 결과 내용 (회의일정, 품질경보, 사내공지 등) */}
              {editingIssue.actionResult && newIssueForm.category !== "오픈이슈" ? (
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

              {/* 첨부 사진 및 엑셀 파일 목록 */}
              {((editingIssue.images && editingIssue.images.length > 0) || (editingIssue.actionImages && editingIssue.actionImages.length > 0)) && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                  <label className="font-bold text-[11px] text-slate-500 dark:text-slate-400 block">
                    📎 첨부 파일 및 증빙 자료 ({((editingIssue.images?.length || 0) + (editingIssue.actionImages?.length || 0))}건)
                  </label>
                  <div className="flex items-center gap-2 flex-wrap">
                    {editingIssue.images?.map((file, idx) => {
                      const isImg = file.fileType === "image" || file.dataUrl?.startsWith("data:image/") || (!file.fileType && !file.name?.match(/\.(xlsx|xls|csv)$/i));
                      return isImg ? (
                        <img
                          key={`img_${idx}`}
                          src={file.dataUrl}
                          alt={file.name || `첨부사진_${idx + 1}`}
                          onClick={() => onPreviewImage({ url: file.dataUrl, name: file.name || `첨부사진_${idx + 1}` })}
                          className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover border-2 border-slate-200 dark:border-slate-700 cursor-pointer hover:scale-105 transition-all shadow-xs"
                          title="클릭하여 원본 보기"
                        />
                      ) : (
                        <a
                          key={`file_${idx}`}
                          href={file.dataUrl}
                          download={file.name || "첨부파일.xlsx"}
                          className="flex items-center gap-2 px-3 py-2 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-900 dark:text-emerald-200 text-xs font-bold shadow-xs cursor-pointer transition-all active:scale-95 group"
                          title="클릭하여 엑셀 파일 다운로드"
                        >
                          <FileSpreadsheet className="w-5 h-5 text-emerald-600 shrink-0 group-hover:scale-110 transition-transform" />
                          <div className="flex flex-col text-left min-w-0">
                            <span className="truncate max-w-[160px] font-bold text-xs">{file.name || "엑셀파일.xlsx"}</span>
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono flex items-center gap-0.5 font-medium">
                              <Download className="w-2.5 h-2.5" /> 다운로드 ({file.size || ""})
                            </span>
                          </div>
                        </a>
                      );
                    })}
                    {editingIssue.actionImages?.map((img, idx) => (
                      <img
                        key={`act_${idx}`}
                        src={img.dataUrl}
                        alt={img.name || `조치사진_${idx + 1}`}
                        onClick={() => onPreviewImage({ url: img.dataUrl, name: img.name || `조치사진_${idx + 1}` })}
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover border-2 border-emerald-300 dark:border-emerald-700 cursor-pointer hover:scale-105 transition-all shadow-xs"
                        title="클릭하여 원본 보기 (조치결과)"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 3) 💬 의견 */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-blue-50/70 via-indigo-50/30 to-slate-50 dark:from-blue-950/40 dark:via-indigo-950/20 dark:to-slate-900 border-2 border-blue-200 dark:border-blue-900/80 space-y-3 shadow-xs">
              <div className="flex items-center justify-between gap-1 flex-wrap">
                <span className="font-black text-xs sm:text-sm text-blue-950 dark:text-blue-200 flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-blue-600" />
                  <span>{newIssueForm.category === "품질경보" ? "조치결과 및 의견" : "의견"} ({editingIssue.replies?.length || 0}건)</span>
                </span>
                <span className="text-[10.5px] text-blue-600 dark:text-blue-400 font-semibold">
                  * 첨부파일 없이 텍스트만 작성하거나 사진/엑셀을 함께 등록할 수 있습니다.
                </span>
              </div>

              {/* Opinions List Display */}
              {editingIssue.replies && editingIssue.replies.length > 0 ? (
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {editingIssue.replies.map((rep) => (
                    <div
                      key={rep.id}
                      className="p-2.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/80 space-y-1.5 shadow-2xs"
                    >
                      {/* 상단 메타데이터: 날짜, 작성자(은은하게), 시간, 삭제 */}
                      <div className="flex items-center justify-between gap-1.5 flex-wrap">
                        <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                          <span className="px-1.5 py-0.5 rounded text-[9.5px] font-mono font-bold bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800 shrink-0 flex items-center gap-0.5">
                            <Calendar className="w-2.5 h-2.5" />
                            <span>{rep.actionDate || rep.createdAt?.slice(0, 10)}</span>
                          </span>
                          <span className="text-[10.5px] text-slate-500 dark:text-slate-400 font-medium truncate">
                            작성자: {rep.author} {rep.authorTitle || ""}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0 ml-auto">
                          <span className="text-[9.5px] text-slate-400 font-mono">
                            {rep.createdAt?.slice(11, 16) || ""}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => onModalDeleteOpinion(rep.id, e)}
                            className="text-slate-400 hover:text-rose-600 p-0.5 rounded hover:bg-rose-50 dark:hover:bg-rose-950/50 cursor-pointer transition-colors"
                            title="의견 삭제"
                          >
                            ✕
                          </button>
                        </div>
                      </div>

                      {/* 본문 내용: 작업자 이름보다 훨씬 더 크고 굵게 도드라지게 표현 */}
                      <div className="p-2 rounded-lg bg-white/95 dark:bg-slate-900/95 border border-blue-100 dark:border-blue-900/50 text-xs sm:text-[13px] font-bold text-slate-950 dark:text-white leading-relaxed whitespace-pre-wrap break-words shadow-2xs">
                        {rep.content}
                      </div>

                      {/* Opinion attached files/images */}
                      {rep.files && rep.files.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                          {rep.files.map((f, fIdx) => {
                            const isImg = f.fileType === "image" || f.dataUrl?.startsWith("data:image/") || (!f.fileType && !f.name?.match(/\.(xlsx|xls|csv)$/i));
                            return isImg ? (
                              <img
                                key={`rep_f_${fIdx}`}
                                src={f.dataUrl}
                                alt={f.name || `의견사진_${fIdx + 1}`}
                                onClick={() => onPreviewImage({ url: f.dataUrl, name: f.name || `의견사진_${fIdx + 1}` })}
                                className="w-10 h-10 rounded-lg object-cover border border-blue-300 dark:border-blue-700 cursor-pointer hover:scale-105 transition-all shadow-2xs"
                                title="클릭하여 사진 보기"
                              />
                            ) : (
                              <a
                                key={`rep_f_${fIdx}`}
                                href={f.dataUrl}
                                download={f.name || "의견첨부.xlsx"}
                                className="flex items-center gap-1 px-2 py-1 rounded-lg border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-800 dark:text-emerald-200 text-[10.5px] font-bold shadow-2xs"
                                title="클릭하여 엑셀 다운로드"
                              >
                                <FileSpreadsheet className="w-3 h-3 text-emerald-600 shrink-0" />
                                <span className="truncate max-w-[120px]">{f.name || "엑셀파일.xlsx"}</span>
                              </a>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 text-center text-xs font-semibold text-slate-400 bg-white/70 dark:bg-slate-900/70 rounded-xl border border-dashed border-blue-200 dark:border-blue-900">
                  등록된 의견이 없습니다. 아래에서 새로운 의견을 남겨주세요.
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

                {/* Multi-line textarea for opinions (No enter-submit, allows line breaks, text-only supported) */}
                <div>
                  <textarea
                    rows="2"
                    placeholder={
                      newIssueForm.category === "품질경보"
                        ? "품질경보 조치결과 및 개선 내용을 입력해 주세요. (등록 시 조치완료 텔레그램 실시간 1회 발송)"
                        : "조치 의견 및 진행 상황을 입력해 주세요. (첨부파일 없이 텍스트만 작성하여 등록 가능)"
                    }
                    value={actionOpinionForm.content}
                    onChange={(e) => setActionOpinionForm({ ...actionOpinionForm, content: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-blue-300 dark:border-blue-700 bg-white dark:bg-slate-800 text-xs font-medium leading-relaxed text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-400 focus:outline-hidden"
                  ></textarea>
                </div>

                {/* Buttons Bar: [📸 촬영] [📁 앨범] [📊 엑셀] ──── [조치결과 등록 / 의견등록] */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {/* 📸 촬영 */}
                    <label className="px-2.5 py-1.5 rounded-xl border border-rose-300 dark:border-rose-700 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 font-bold text-xs flex items-center gap-1 cursor-pointer transition-all active:scale-95 shadow-2xs hover:bg-rose-100 shrink-0" title="카메라로 즉시 촬영">
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={(e) => {
                          if (e.target.files && e.target.files.length > 0) {
                            onOpinionFiles(e.target.files);
                            e.target.value = "";
                          }
                        }}
                        className="hidden"
                      />
                      <Camera className="w-3.5 h-3.5 text-rose-600" />
                      <span>📸 촬영</span>
                    </label>

                    {/* 📁 앨범 */}
                    <label className="px-2.5 py-1.5 rounded-xl border border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center gap-1 cursor-pointer transition-all active:scale-95 shadow-2xs hover:bg-blue-100 shrink-0" title="갤러리/앨범에서 사진 선택">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => {
                          if (e.target.files && e.target.files.length > 0) {
                            onOpinionFiles(e.target.files);
                            e.target.value = "";
                          }
                        }}
                        className="hidden"
                      />
                      <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                      <span>📁 앨범</span>
                    </label>

                    {/* 📊 엑셀 */}
                    <label className="px-2.5 py-1.5 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-bold text-xs flex items-center gap-1 cursor-pointer transition-all active:scale-95 shadow-2xs hover:bg-emerald-100 shrink-0" title="엑셀 파일 첨부">
                      <input
                        type="file"
                        accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
                        multiple
                        onChange={(e) => {
                          if (e.target.files && e.target.files.length > 0) {
                            onOpinionFiles(e.target.files);
                            e.target.value = "";
                          }
                        }}
                        className="hidden"
                      />
                      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                      <span>📊 엑셀</span>
                    </label>
                  </div>

                  {/* 전용 의견 / 조치결과 등록 뱃지 버튼 */}
                  <button
                    type="button"
                    onClick={onModalAddOpinion}
                    className={`px-4 py-2 rounded-xl text-white font-black text-xs shadow-md active:scale-95 flex items-center justify-center cursor-pointer shrink-0 transition-all ${
                      newIssueForm.category === "품질경보"
                        ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-emerald-500/25"
                        : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-blue-500/25"
                    }`}
                  >
                    <span>{newIssueForm.category === "품질경보" ? "조치결과 등록 🟢" : "의견등록"}</span>
                  </button>
                </div>

                {/* Preview of pending opinion files */}
                {actionOpinionForm.files && actionOpinionForm.files.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-blue-100 dark:border-blue-900/60">
                    <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400">첨부 예정:</span>
                    {actionOpinionForm.files.map((f, idx) => {
                      const isImg = f.fileType === "image" || f.dataUrl?.startsWith("data:image/") || (!f.fileType && !f.name?.match(/\.(xlsx|xls|csv)$/i));
                      return isImg ? (
                        <div key={idx} className="relative group w-8 h-8 rounded-lg overflow-hidden border border-slate-300 dark:border-slate-700 shrink-0">
                          <img src={f.dataUrl} alt={f.name} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => onRemoveOpinionFile(idx)}
                            className="absolute inset-0 bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 text-[10px] font-bold cursor-pointer"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <div key={idx} className="flex items-center gap-1 px-2 py-0.5 rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-800 text-[10px] font-bold">
                          <FileSpreadsheet className="w-3 h-3 text-emerald-600" />
                          <span className="truncate max-w-[100px]">{f.name}</span>
                          <button
                            type="button"
                            onClick={() => onRemoveOpinionFile(idx)}
                            className="text-slate-400 hover:text-rose-600 ml-0.5 cursor-pointer font-bold"
                          >
                            ✕
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
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
                      <span>{editingIssue ? "최종등록" : "등록"}</span>
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

                    {/* Photo & Excel Attachments under 상세 전달 내용 */}
                    <div className="pt-1.5 space-y-1.5">
                      <div className="flex items-center justify-between gap-1 flex-wrap">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {/* 📸 즉시 촬영 */}
                          <label className="px-2.5 py-1.5 rounded-xl border border-rose-300 dark:border-rose-700 bg-rose-50/80 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 font-bold text-xs flex items-center gap-1 cursor-pointer transition-all active:scale-95 shadow-2xs" title="카메라로 즉시 촬영">
                            <input
                              type="file"
                              accept="image/*"
                              capture="environment"
                              disabled={isProcessingIssueImages}
                              onChange={(e) => {
                                if (e.target.files && e.target.files.length > 0) {
                                  (onIssueFiles || onIssueImageFiles)(e.target.files);
                                  e.target.value = "";
                                }
                              }}
                              className="hidden"
                            />
                            <Camera className="w-3.5 h-3.5 text-rose-600" />
                            <span>📸 촬영</span>
                          </label>

                          {/* 📁 앨범 선택 */}
                          <label className="px-2.5 py-1.5 rounded-xl border border-blue-300 dark:border-blue-700 bg-blue-50/80 hover:bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center gap-1 cursor-pointer transition-all active:scale-95 shadow-2xs" title="갤러리/앨범에서 사진 선택">
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              disabled={isProcessingIssueImages}
                              onChange={(e) => {
                                if (e.target.files && e.target.files.length > 0) {
                                  (onIssueFiles || onIssueImageFiles)(e.target.files);
                                  e.target.value = "";
                                }
                              }}
                              className="hidden"
                            />
                            <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                            <span>📁 앨범</span>
                          </label>

                          {/* 📊 엑셀 첨부 */}
                          <label className="px-2.5 py-1.5 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-emerald-50/80 hover:bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-bold text-xs flex items-center gap-1 cursor-pointer transition-all active:scale-95 shadow-2xs" title="엑셀/스프레드시트 첨부">
                            <input
                              type="file"
                              accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
                              multiple
                              disabled={isProcessingIssueImages}
                              onChange={(e) => {
                                if (e.target.files && e.target.files.length > 0) {
                                  (onIssueFiles || onIssueImageFiles)(e.target.files);
                                  e.target.value = "";
                                }
                              }}
                              className="hidden"
                            />
                            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                            <span>📊 엑셀</span>
                          </label>
                        </div>
                        <span className="text-[10.5px] text-slate-400 font-medium">
                          {newIssueForm.images?.length || 0}개 파일 첨부됨
                        </span>
                      </div>

                      {/* Previews of attached files in newIssueForm */}
                      {newIssueForm.images && newIssueForm.images.length > 0 && (
                        <div className="flex items-center gap-2 flex-wrap pt-1">
                          {newIssueForm.images.map((file, idx) => {
                            const isImg = file.fileType === "image" || file.dataUrl?.startsWith("data:image/") || (!file.fileType && !file.name?.match(/\.(xlsx|xls|csv)$/i));
                            return isImg ? (
                              <div key={file.id || idx} className="relative group rounded-xl overflow-hidden border-2 border-slate-200 dark:border-slate-700 w-14 h-14 bg-slate-100 dark:bg-slate-800 shrink-0 shadow-xs">
                                <img
                                  src={file.dataUrl}
                                  alt={file.name}
                                  onClick={() => onPreviewImage({ url: file.dataUrl, name: file.name })}
                                  className="w-full h-full object-cover cursor-pointer group-hover:scale-105 transition-transform"
                                />
                                <button
                                  type="button"
                                  onClick={() => onRemoveIssueImage(idx)}
                                  className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-slate-900/80 hover:bg-rose-600 text-white flex items-center justify-center text-[10px] font-bold shadow-xs cursor-pointer"
                                  title="삭제"
                                >
                                  ✕
                                </button>
                              </div>
                            ) : (
                              <div key={file.id || idx} className="relative group flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 text-xs font-bold shadow-2xs">
                                <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                                <span className="max-w-[130px] truncate text-[11px]" title={file.name}>
                                  {file.name || "엑셀파일.xlsx"}
                                </span>
                                <span className="text-[9.5px] text-emerald-600 dark:text-emerald-400 font-mono">({file.size})</span>
                                <button
                                  type="button"
                                  onClick={() => onRemoveIssueImage(idx)}
                                  className="text-slate-400 hover:text-rose-600 ml-1 p-0.5 rounded cursor-pointer font-bold"
                                  title="삭제"
                                >
                                  ✕
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 달력 형식 타임라인 (최소화 컴팩트형) */}
                <div className="p-2 sm:p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-black text-slate-800 dark:text-slate-200 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-blue-600" />
                      <span>타임라인 캘린더</span>
                    </span>
                    <span className="text-[10.5px] font-mono font-bold text-blue-600 dark:text-blue-400">
                      🚩 D-DAY: {newIssueForm.expireDate ? newIssueForm.expireDate.slice(5) : todayDateStr.slice(5)}
                    </span>
                  </div>

                  <div className="grid grid-cols-7 gap-1 pt-0.5">
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
                          className={`py-1 px-0.5 rounded-lg border text-center transition-all cursor-pointer flex flex-col items-center justify-between min-h-[38px] relative ${
                            isSelectedForAction || day.isTarget
                              ? "bg-blue-600 text-white border-blue-500 shadow-xs ring-1 ring-blue-400 font-black"
                              : day.hasOpinions
                              ? "bg-indigo-600 text-white border-indigo-500 shadow-xs font-black ring-1 ring-indigo-400/60"
                              : day.isToday
                              ? "bg-amber-100 dark:bg-amber-950/60 border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 font-bold"
                              : "bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                          }`}
                          title={`일자: ${day.dateStr} (의견 ${day.opinionCount}건)`}
                        >
                          <div className="text-[9px] font-mono font-bold leading-none">
                            <span className={day.dayIndex === 0 && !day.hasOpinions && !day.isTarget ? "text-rose-500" : day.dayIndex === 6 && !day.hasOpinions && !day.isTarget ? "text-blue-500" : ""}>
                              {day.monthDay}
                            </span>
                            <span className="text-[7.5px] opacity-75 ml-0.5">({day.dayName})</span>
                          </div>

                          <div className="mt-0.5">
                            {day.hasOpinions ? (
                              <span className="px-1 py-0.2 rounded text-[7.5px] font-black bg-cyan-300 text-slate-950 flex items-center gap-0.5 shadow-2xs">
                                💬{day.opinionCount}
                              </span>
                            ) : day.isTarget ? (
                              <span className="text-[7px] font-black opacity-90">
                                🚩D-DAY
                              </span>
                            ) : day.isToday ? (
                              <span className="text-[7px] font-black text-amber-800 dark:text-amber-300">
                                오늘
                              </span>
                            ) : (
                              <span className="text-[7px] text-transparent leading-none">-</span>
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
                      <span>의견 ({newIssueForm.replies?.length || 0}건)</span>
                    </span>
                    <span className="text-[10.5px] text-blue-600 dark:text-blue-400 font-semibold">
                      * 첨부파일 없이 텍스트만 작성하거나 사진/엑셀을 함께 등록할 수 있습니다.
                    </span>
                  </div>

                  {newIssueForm.replies && newIssueForm.replies.length > 0 && (
                    <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                      {newIssueForm.replies.map((rep) => (
                        <div
                          key={rep.id}
                          className="p-2.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/80 space-y-1.5 shadow-2xs"
                        >
                          {/* 상단 메타데이터: 날짜, 작성자(은은하게), 시간, 삭제 */}
                          <div className="flex items-center justify-between gap-1.5 flex-wrap">
                            <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                              <span className="px-1.5 py-0.5 rounded text-[9.5px] font-mono font-bold bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800 shrink-0 flex items-center gap-0.5">
                                <Calendar className="w-2.5 h-2.5" />
                                <span>{rep.actionDate || rep.createdAt?.slice(0, 10)}</span>
                              </span>
                              <span className="text-[10.5px] text-slate-500 dark:text-slate-400 font-medium truncate">
                                작성자: {rep.author} {rep.authorTitle || ""}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 shrink-0 ml-auto">
                              <span className="text-[9.5px] text-slate-400 font-mono">
                                {rep.createdAt?.slice(11, 16) || ""}
                              </span>
                              <button
                                type="button"
                                onClick={(e) => onModalDeleteOpinion(rep.id, e)}
                                className="text-slate-400 hover:text-rose-600 p-0.5 rounded hover:bg-rose-50 dark:hover:bg-rose-950/50 cursor-pointer transition-colors"
                                title="의견 삭제"
                              >
                                ✕
                              </button>
                            </div>
                          </div>

                          {/* 본문 내용: 작업자 이름보다 훨씬 더 크고 굵게 도드라지게 표현 */}
                          <div className="p-2 rounded-lg bg-white/95 dark:bg-slate-900/95 border border-blue-100 dark:border-blue-900/50 text-xs sm:text-[13px] font-bold text-slate-950 dark:text-white leading-relaxed whitespace-pre-wrap break-words shadow-2xs">
                            {rep.content}
                          </div>

                          {/* Opinion attached files/images */}
                          {rep.files && rep.files.length > 0 && (
                            <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                              {rep.files.map((f, fIdx) => {
                                const isImg = f.fileType === "image" || f.dataUrl?.startsWith("data:image/") || (!f.fileType && !f.name?.match(/\.(xlsx|xls|csv)$/i));
                                return isImg ? (
                                  <img
                                    key={`rep_f_${fIdx}`}
                                    src={f.dataUrl}
                                    alt={f.name || `의견사진_${fIdx + 1}`}
                                    onClick={() => onPreviewImage({ url: f.dataUrl, name: f.name || `의견사진_${fIdx + 1}` })}
                                    className="w-8 h-8 rounded-lg object-cover border border-blue-300 dark:border-blue-700 cursor-pointer hover:scale-105 transition-all shadow-2xs"
                                    title="클릭하여 사진 보기"
                                  />
                                ) : (
                                  <a
                                    key={`rep_f_${fIdx}`}
                                    href={f.dataUrl}
                                    download={f.name || "의견첨부.xlsx"}
                                    className="flex items-center gap-1 px-2 py-0.5 rounded-lg border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-800 dark:text-emerald-200 text-[10.5px] font-bold shadow-2xs"
                                    title="클릭하여 엑셀 다운로드"
                                  >
                                    <FileSpreadsheet className="w-3 h-3 text-emerald-600 shrink-0" />
                                    <span className="truncate max-w-[100px]">{f.name || "엑셀파일.xlsx"}</span>
                                  </a>
                                );
                              })}
                            </div>
                          )}
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

                    {/* Multi-line textarea for opinions (No enter-submit, allows line breaks, text-only supported) */}
                    <div>
                      <textarea
                        rows="2"
                        placeholder="조치 의견 및 진행 상황을 입력해 주세요. (첨부파일 없이 텍스트만 작성하여 등록 가능)"
                        value={actionOpinionForm.content}
                        onChange={(e) => setActionOpinionForm({ ...actionOpinionForm, content: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-blue-300 dark:border-blue-700 bg-white dark:bg-slate-900 text-xs font-medium leading-relaxed text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-400 focus:outline-hidden"
                      ></textarea>
                    </div>

                    {/* Buttons Bar: [📸 촬영] [📁 앨범] [📊 엑셀] ──── [의견등록] */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {/* 📸 촬영 */}
                        <label className="px-2.5 py-1.5 rounded-xl border border-rose-300 dark:border-rose-700 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 font-bold text-xs flex items-center gap-1 cursor-pointer transition-all active:scale-95 shadow-2xs hover:bg-rose-100 shrink-0" title="카메라로 즉시 촬영">
                          <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            onChange={(e) => {
                              if (e.target.files && e.target.files.length > 0) {
                                onOpinionFiles(e.target.files);
                                e.target.value = "";
                              }
                            }}
                            className="hidden"
                          />
                          <Camera className="w-3.5 h-3.5 text-rose-600" />
                          <span>📸 촬영</span>
                        </label>

                        {/* 📁 앨범 */}
                        <label className="px-2.5 py-1.5 rounded-xl border border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center gap-1 cursor-pointer transition-all active:scale-95 shadow-2xs hover:bg-blue-100 shrink-0" title="갤러리/앨범에서 사진 선택">
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={(e) => {
                              if (e.target.files && e.target.files.length > 0) {
                                onOpinionFiles(e.target.files);
                                e.target.value = "";
                              }
                            }}
                            className="hidden"
                          />
                          <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                          <span>📁 앨범</span>
                        </label>

                        {/* 📊 엑셀 */}
                        <label className="px-2.5 py-1.5 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-bold text-xs flex items-center gap-1 cursor-pointer transition-all active:scale-95 shadow-2xs hover:bg-emerald-100 shrink-0" title="엑셀 파일 첨부">
                          <input
                            type="file"
                            accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
                            multiple
                            onChange={(e) => {
                              if (e.target.files && e.target.files.length > 0) {
                                onOpinionFiles(e.target.files);
                                e.target.value = "";
                              }
                            }}
                            className="hidden"
                          />
                          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                          <span>📊 엑셀</span>
                        </label>
                      </div>

                      {/* 전용 의견 등록 뱃지 버튼 */}
                      <button
                        type="button"
                        onClick={onModalAddOpinion}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-xs shadow-md active:scale-95 flex items-center justify-center cursor-pointer shrink-0 transition-all"
                      >
                        <span>의견등록</span>
                      </button>
                    </div>

                    {/* Preview of pending opinion files */}
                    {actionOpinionForm.files && actionOpinionForm.files.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-blue-100 dark:border-blue-900/60">
                        <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400">첨부 예정:</span>
                        {actionOpinionForm.files.map((f, idx) => {
                          const isImg = f.fileType === "image" || f.dataUrl?.startsWith("data:image/") || (!f.fileType && !f.name?.match(/\.(xlsx|xls|csv)$/i));
                          return isImg ? (
                            <div key={idx} className="relative group w-8 h-8 rounded-lg overflow-hidden border border-slate-300 dark:border-slate-700 shrink-0">
                              <img src={f.dataUrl} alt={f.name} className="w-full h-full object-cover" />
                              <button
                                type="button"
                                onClick={() => onRemoveOpinionFile(idx)}
                                className="absolute inset-0 bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 text-[10px] font-bold cursor-pointer"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <div key={idx} className="flex items-center gap-1 px-2 py-0.5 rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-800 text-[10px] font-bold">
                              <FileSpreadsheet className="w-3 h-3 text-emerald-600" />
                              <span className="truncate max-w-[100px]">{f.name}</span>
                              <button
                                type="button"
                                onClick={() => onRemoveOpinionFile(idx)}
                                className="text-slate-400 hover:text-rose-600 ml-0.5 cursor-pointer font-bold"
                              >
                                ✕
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
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

                  {/* Photo & Excel Attachments under 상세 전달 내용 */}
                  <div className="pt-1.5 space-y-1.5">
                    <div className="flex items-center justify-between gap-1 flex-wrap">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {/* 📸 즉시 촬영 */}
                        <label className="px-2.5 py-1.5 rounded-xl border border-rose-300 dark:border-rose-700 bg-rose-50/80 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 font-bold text-xs flex items-center gap-1 cursor-pointer transition-all active:scale-95 shadow-2xs" title="카메라로 즉시 촬영">
                          <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            disabled={isProcessingIssueImages}
                            onChange={(e) => {
                              if (e.target.files && e.target.files.length > 0) {
                                (onIssueFiles || onIssueImageFiles)(e.target.files);
                                e.target.value = "";
                              }
                            }}
                            className="hidden"
                          />
                          <Camera className="w-3.5 h-3.5 text-rose-600" />
                          <span>📸 촬영</span>
                        </label>

                        {/* 📁 앨범 선택 */}
                        <label className="px-2.5 py-1.5 rounded-xl border border-blue-300 dark:border-blue-700 bg-blue-50/80 hover:bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center gap-1 cursor-pointer transition-all active:scale-95 shadow-2xs" title="갤러리/앨범에서 사진 선택">
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            disabled={isProcessingIssueImages}
                            onChange={(e) => {
                              if (e.target.files && e.target.files.length > 0) {
                                (onIssueFiles || onIssueImageFiles)(e.target.files);
                                e.target.value = "";
                              }
                            }}
                            className="hidden"
                          />
                          <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                          <span>📁 앨범</span>
                        </label>

                        {/* 📊 엑셀 첨부 */}
                        <label className="px-2.5 py-1.5 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-emerald-50/80 hover:bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-bold text-xs flex items-center gap-1 cursor-pointer transition-all active:scale-95 shadow-2xs" title="엑셀 파일 첨부">
                          <input
                            type="file"
                            accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
                            multiple
                            disabled={isProcessingIssueImages}
                            onChange={(e) => {
                              if (e.target.files && e.target.files.length > 0) {
                                (onIssueFiles || onIssueImageFiles)(e.target.files);
                                e.target.value = "";
                              }
                            }}
                            className="hidden"
                          />
                          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                          <span>📊 엑셀</span>
                        </label>
                      </div>
                      <span className="text-[10.5px] text-slate-400 font-medium">
                        {newIssueForm.images?.length || 0}개 파일 첨부됨
                      </span>
                    </div>

                    {/* Previews of attached files in newIssueForm */}
                    {newIssueForm.images && newIssueForm.images.length > 0 && (
                      <div className="flex items-center gap-2 flex-wrap pt-1">
                        {newIssueForm.images.map((file, idx) => {
                          const isImg = file.fileType === "image" || file.dataUrl?.startsWith("data:image/") || (!file.fileType && !file.name?.match(/\.(xlsx|xls|csv)$/i));
                          return isImg ? (
                            <div key={file.id || idx} className="relative group rounded-xl overflow-hidden border-2 border-slate-200 dark:border-slate-700 w-14 h-14 bg-slate-100 dark:bg-slate-800 shrink-0 shadow-xs">
                              <img
                                src={file.dataUrl}
                                alt={file.name}
                                onClick={() => onPreviewImage({ url: file.dataUrl, name: file.name })}
                                className="w-full h-full object-cover cursor-pointer group-hover:scale-105 transition-transform"
                              />
                              <button
                                type="button"
                                onClick={() => onRemoveIssueImage(idx)}
                                className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-slate-900/80 hover:bg-rose-600 text-white flex items-center justify-center text-[10px] font-bold shadow-xs cursor-pointer"
                                title="삭제"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <div key={file.id || idx} className="relative group flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 text-xs font-bold shadow-2xs">
                              <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                              <span className="max-w-[130px] truncate text-[11px]" title={file.name}>
                                {file.name || "엑셀파일.xlsx"}
                              </span>
                              <span className="text-[9.5px] text-emerald-600 dark:text-emerald-400 font-mono">({file.size})</span>
                              <button
                                type="button"
                                onClick={() => onRemoveIssueImage(idx)}
                                className="text-slate-400 hover:text-rose-600 ml-1 p-0.5 rounded cursor-pointer font-bold"
                                title="삭제"
                              >
                                ✕
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 5. 품질경보 조치결과 등록 및 이력 패널 */}
            {newIssueForm.category === "품질경보" && (
              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-rose-50/70 via-amber-50/30 to-slate-50 dark:from-rose-950/40 dark:via-amber-950/20 dark:to-slate-900 border-2 border-rose-200 dark:border-rose-900/80 space-y-3 shadow-xs">
                <div className="flex items-center justify-between gap-1 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <div className="p-1 rounded-lg bg-rose-600 text-white shadow-2xs">
                      <MessageSquare className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-black text-xs sm:text-sm text-rose-950 dark:text-rose-200">
                      품질경보 조치결과 ({newIssueForm.replies?.length || 0}건)
                    </span>
                  </div>
                </div>

                <p className="text-[10.5px] text-rose-600 dark:text-rose-400 font-semibold">
                  * 품질경보에 대한 조치결과를 등록할 수 있습니다. (첨부파일 없이 텍스트만 또는 사진/엑셀과 함께 등록 가능)
                </p>

                {/* Registered Action Results List */}
                {newIssueForm.replies && newIssueForm.replies.length > 0 ? (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {newIssueForm.replies.map((rep) => (
                      <div
                        key={rep.id}
                        className="p-2.5 rounded-xl bg-rose-50/70 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-900/80 space-y-1.5 shadow-2xs"
                      >
                        {/* 상단 메타데이터 */}
                        <div className="flex items-center justify-between gap-1.5 flex-wrap">
                          <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                            <span className="px-1.5 py-0.5 rounded text-[9.5px] font-mono font-bold bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800 shrink-0 flex items-center gap-0.5">
                              <Calendar className="w-2.5 h-2.5" />
                              <span>{rep.actionDate || rep.createdAt?.slice(0, 10)}</span>
                            </span>
                            <span className="text-[10.5px] text-slate-500 dark:text-slate-400 font-medium truncate">
                              조치자: {rep.author} {rep.authorTitle || ""}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 shrink-0 ml-auto">
                            <span className="text-[9.5px] text-slate-400 font-mono">
                              {rep.createdAt?.slice(11, 16) || ""}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => onModalDeleteOpinion(rep.id, e)}
                              className="text-slate-400 hover:text-rose-600 p-0.5 rounded hover:bg-rose-50 dark:hover:bg-rose-950/50 cursor-pointer transition-colors"
                              title="조치결과 삭제"
                            >
                              ✕
                            </button>
                          </div>
                        </div>

                        {/* 본문 내용 */}
                        <div className="p-2 rounded-lg bg-white/95 dark:bg-slate-900/95 border border-rose-100 dark:border-rose-900/50 text-xs sm:text-[13px] font-bold text-slate-950 dark:text-white leading-relaxed whitespace-pre-wrap break-words shadow-2xs">
                          {rep.content}
                        </div>

                        {/* Attached files/images */}
                        {rep.files && rep.files.length > 0 && (
                          <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                            {rep.files.map((f, fIdx) => {
                              const isImg = f.fileType === "image" || f.dataUrl?.startsWith("data:image/") || (!f.fileType && !f.name?.match(/\.(xlsx|xls|csv)$/i));
                              return isImg ? (
                                <img
                                  key={`rep_f_${fIdx}`}
                                  src={f.dataUrl}
                                  alt={f.name || `조치사진_${fIdx + 1}`}
                                  onClick={() => onPreviewImage({ url: f.dataUrl, name: f.name || `조치사진_${fIdx + 1}` })}
                                  className="w-10 h-10 rounded-lg object-cover border border-rose-300 dark:border-rose-700 cursor-pointer hover:scale-105 transition-all shadow-2xs"
                                  title="클릭하여 사진 보기"
                                />
                              ) : (
                                <a
                                  key={`rep_f_${fIdx}`}
                                  href={f.dataUrl}
                                  download={f.name || "조치첨부.xlsx"}
                                  className="flex items-center gap-1 px-2 py-1 rounded-lg border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-800 dark:text-emerald-200 text-[10.5px] font-bold shadow-2xs"
                                  title="클릭하여 엑셀 다운로드"
                                >
                                  <FileSpreadsheet className="w-3 h-3 text-emerald-600 shrink-0" />
                                  <span className="truncate max-w-[120px]">{f.name || "엑셀파일.xlsx"}</span>
                                </a>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 text-center text-xs font-semibold text-slate-400 bg-white/70 dark:bg-slate-900/70 rounded-xl border border-dashed border-rose-200 dark:border-rose-900">
                    등록된 조치결과가 없습니다. 아래에서 조치결과를 등록해 주세요.
                  </div>
                )}

                {/* Quick Action Result Input Box */}
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-800 space-y-2">
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
                        👤 조치자 (직접 선택)
                      </label>
                      <select
                        value={actionOpinionForm.author || ""}
                        onChange={(e) => setActionOpinionForm({ ...actionOpinionForm, author: e.target.value })}
                        className={`w-full px-2.5 py-1.5 rounded-lg border-2 text-xs font-bold transition-all ${
                          !actionOpinionForm.author
                            ? "border-rose-400 bg-rose-50/60 dark:bg-rose-950/60 text-rose-900 dark:text-rose-200 ring-1 ring-rose-400/40"
                            : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        }`}
                      >
                        <option value="">-- 조치자 선택 --</option>
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

                  {/* Multi-line textarea */}
                  <div>
                    <textarea
                      rows="2"
                      placeholder="품질경보 조치결과 내용을 입력해 주세요. (첨부파일 없이 텍스트만 작성하여 등록 가능)"
                      value={actionOpinionForm.content}
                      onChange={(e) => setActionOpinionForm({ ...actionOpinionForm, content: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-rose-300 dark:border-rose-700 bg-white dark:bg-slate-800 text-xs font-medium leading-relaxed text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-rose-400 focus:outline-hidden"
                    ></textarea>
                  </div>

                  {/* Buttons Bar: [📸 촬영] [📁 앨범] [📊 엑셀] ──── [조치결과 등록] */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {/* 📸 촬영 */}
                      <label className="px-2.5 py-1.5 rounded-xl border border-rose-300 dark:border-rose-700 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 font-bold text-xs flex items-center gap-1 cursor-pointer transition-all active:scale-95 shadow-2xs hover:bg-rose-100 shrink-0" title="카메라로 즉시 촬영">
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          onChange={(e) => {
                            if (e.target.files && e.target.files.length > 0) {
                              onOpinionFiles(e.target.files);
                              e.target.value = "";
                            }
                          }}
                          className="hidden"
                        />
                        <Camera className="w-3.5 h-3.5 text-rose-600" />
                        <span>📸 촬영</span>
                      </label>

                      {/* 📁 앨범 */}
                      <label className="px-2.5 py-1.5 rounded-xl border border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center gap-1 cursor-pointer transition-all active:scale-95 shadow-2xs hover:bg-blue-100 shrink-0" title="갤러리/앨범에서 사진 선택">
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={(e) => {
                            if (e.target.files && e.target.files.length > 0) {
                              onOpinionFiles(e.target.files);
                              e.target.value = "";
                            }
                          }}
                          className="hidden"
                        />
                        <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                        <span>📁 앨범</span>
                      </label>

                      {/* 📊 엑셀 */}
                      <label className="px-2.5 py-1.5 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-bold text-xs flex items-center gap-1 cursor-pointer transition-all active:scale-95 shadow-2xs hover:bg-emerald-100 shrink-0" title="엑셀 파일 첨부">
                        <input
                          type="file"
                          accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
                          multiple
                          onChange={(e) => {
                            if (e.target.files && e.target.files.length > 0) {
                              onOpinionFiles(e.target.files);
                              e.target.value = "";
                            }
                          }}
                          className="hidden"
                        />
                        <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                        <span>📊 엑셀</span>
                      </label>
                    </div>

                    {/* 전용 조치결과 등록 뱃지 버튼 */}
                    <button
                      type="button"
                      onClick={onModalAddOpinion}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white font-black text-xs shadow-md active:scale-95 flex items-center justify-center cursor-pointer shrink-0 transition-all"
                    >
                      <span>조치결과 등록</span>
                    </button>
                  </div>

                  {/* Preview of pending opinion files */}
                  {actionOpinionForm.files && actionOpinionForm.files.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-rose-100 dark:border-rose-900/60">
                      <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400">첨부 예정:</span>
                      {actionOpinionForm.files.map((f, idx) => {
                        const isImg = f.fileType === "image" || f.dataUrl?.startsWith("data:image/") || (!f.fileType && !f.name?.match(/\.(xlsx|xls|csv)$/i));
                        return isImg ? (
                          <div key={idx} className="relative group w-8 h-8 rounded-lg overflow-hidden border border-slate-300 dark:border-slate-700 shrink-0">
                            <img src={f.dataUrl} alt={f.name} className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => onRemoveOpinionFile(idx)}
                              className="absolute inset-0 bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 text-[10px] font-bold cursor-pointer"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <div key={idx} className="flex items-center gap-1 px-2 py-0.5 rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-800 text-[10px] font-bold">
                            <FileSpreadsheet className="w-3 h-3 text-emerald-600" />
                            <span className="truncate max-w-[100px]">{f.name}</span>
                            <button
                              type="button"
                              onClick={() => onRemoveOpinionFile(idx)}
                              className="text-slate-400 hover:text-rose-600 ml-0.5 cursor-pointer font-bold"
                            >
                              ✕
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 6. 회의 결과 / 조치 결과 입력 섹션 (오픈이슈 제외, 품질경보 및 기타 카테고리 포함) */}
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

            {/* 7. 회신 및 참석 현황 (기존 항목 수정 시 노출 - 회의일정 및 사내공지 전용) */}
            {editingIssue && newIssueForm.category !== "오픈이슈" && newIssueForm.category !== "품질경보" && (
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
                        className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 space-y-1 shadow-2xs"
                      >
                        <div className="flex items-center justify-between gap-1.5 flex-wrap">
                          <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                            <span className={`px-1.5 py-0.2 rounded text-[9.5px] font-black shrink-0 ${
                              rep.attendanceStatus === "참석"
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                            }`}>
                              {rep.attendanceStatus || "확인"}
                            </span>
                            <span className="text-[10.5px] text-slate-500 dark:text-slate-400 font-medium truncate">
                              {rep.author}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 shrink-0 ml-auto">
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
                        <div className="text-xs sm:text-[13px] font-bold text-slate-900 dark:text-white break-words whitespace-pre-wrap leading-relaxed">
                          {rep.content}
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
                    ? "최종등록"
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
