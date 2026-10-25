import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  CheckCircle2,
  Camera,
  Image as ImageIcon,
  Check,
  Edit3,
  X,
  Calendar,
  Clock,
  MapPin,
  Users,
  RotateCcw,
  Sparkles
} from "lucide-react";

export const IssueActionModal = ({
  actionModalData,
  setActionModalData,
  onClose,
  onSaveActionResult,
  onSaveIssueEdit,
  onOpenLedger,
  allWorkers,
  isProcessingActionImages,
  onActionImageFiles,
  onRemoveActionImage,
  onPreviewImage,
  isSaving = false
}) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editExpireDate, setEditExpireDate] = useState("");
  const [editMeetingTime, setEditMeetingTime] = useState("14:00");
  const [editMeetingLocation, setEditMeetingLocation] = useState("");

  const issue = actionModalData?.issue;

  useEffect(() => {
    if (issue) {
      setEditTitle(issue.title || issue.content || "");
      setEditContent(issue.content || "");
      setEditExpireDate(issue.expireDate || issue.targetDate || "");
      setEditMeetingTime(issue.meetingTime || "14:00");
      setEditMeetingLocation(issue.meetingLocation || "");
      setIsEditMode(false);
    }
  }, [issue]);

  const lastSubmitTimeRef = useRef(0);

  if (!actionModalData?.isOpen || !issue || typeof document === "undefined") {
    return null;
  }

  const isMeetingAction = issue.category === "회의일정" || String(issue.category || "").includes("회의");
  const isNotice = issue.category === "공지사항" || issue.category === "사내공지" || issue.category === "공유사항" || String(issue.category || "").includes("공지");
  const isQualityAlert = issue.category === "품질경보" || issue.category === "부적합경보" || String(issue.category || "").includes("경보");
  const isOpenIssue = !isMeetingAction && !isNotice && !isQualityAlert;

  const originalImages = Array.isArray(issue.images) && issue.images.length > 0
    ? issue.images
    : Array.isArray(issue.causeImages) && issue.causeImages.length > 0
    ? issue.causeImages
    : [];

  const getEffectiveSubmissionData = () => {
    return {
      title: isEditMode && editTitle.trim() ? editTitle.trim() : (issue.title || issue.content || ""),
      content: isEditMode ? editContent.trim() : (issue.content || ""),
      expireDate: editExpireDate || issue.expireDate || "",
      meetingTime: editMeetingTime || issue.meetingTime || "14:00",
      meetingLocation: editMeetingLocation || issue.meetingLocation || "",
      actionResult: (actionModalData.actionResult || "").trim(),
      actionAuthor: (actionModalData.actionAuthor || "").trim() || issue.actionAuthor || issue.author || "현장담당자",
      actionImages: actionModalData.actionImages || []
    };
  };

  const safeSubmit = (fn, e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (isSaving) return;
    const now = Date.now();
    if (now - lastSubmitTimeRef.current < 600) return;
    lastSubmitTimeRef.current = now;
    if (document.activeElement && typeof document.activeElement.blur === "function") {
      document.activeElement.blur();
    }
    fn(e);
  };

  const handleEditSubmit = (e) => {
    // 조치결과가 입력되어 있거나, 이미 수정모드인 경우 즉시 통합 저장 등록
    const hasActionResult = Boolean(
      (actionModalData.actionResult || "").trim() ||
      (actionModalData.actionImages && actionModalData.actionImages.length > 0)
    );
    
    if (!isEditMode && !hasActionResult) {
      setIsEditMode(true);
      return;
    }

    const subData = getEffectiveSubmissionData();
    if (isEditMode && !subData.title) {
      alert("제목을 입력해 주세요.");
      return;
    }

    if (onSaveActionResult) {
      onSaveActionResult(subData, e);
    } else if (onSaveIssueEdit) {
      onSaveIssueEdit(subData);
    }
  };

  const handleActionCompleteSubmit = (e) => {
    const subData = getEffectiveSubmissionData();
    const hasActionResult = Boolean(
      subData.actionResult ||
      (subData.actionImages && subData.actionImages.length > 0)
    );
    if (!hasActionResult) {
      alert(isMeetingAction ? "회의 결과 내용을 입력해 주세요." : "조치결과 내용 또는 조치 후 사진을 등록해 주세요.");
      return;
    }
    if (onSaveActionResult) {
      onSaveActionResult(subData, e);
    }
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
        className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl max-w-xl w-full p-4 sm:p-6 border-2 border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 my-auto animate-scaleUp cursor-default"
      >
        {/* Modal Top Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 min-w-0">
            <div className={`p-2 rounded-xl text-white shadow-xs shrink-0 ${
              isMeetingAction
                ? "bg-purple-600"
                : isNotice
                ? "bg-emerald-600"
                : isQualityAlert
                ? "bg-rose-600"
                : "bg-blue-600"
            }`}>
              {isMeetingAction ? (
                <Calendar className="w-4 h-4" />
              ) : isQualityAlert ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
            </div>
            <div className="min-w-0">
              <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-white truncate">
                {isMeetingAction
                  ? "📅 회의일정 상세 및 간편 종결"
                  : isNotice
                  ? "📢 사내공지 상세 및 수정·관리"
                  : isQualityAlert
                  ? "🚨 부적합경보 상세내용 & 조치"
                  : "📌 오픈이슈 상세내용 & 조치"}
              </h3>
              <p className="text-[11px] text-slate-400 truncate">
                조치결과 입력 및 원문 내용 수정·재등록
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center font-bold text-sm transition-all cursor-pointer shrink-0 ml-2"
            title="닫기"
          >
            ✕
          </button>
        </div>

        {/* 1. Target Issue Reference & Edit Box */}
        <div className={`rounded-2xl border-2 transition-all p-3 sm:p-4 space-y-2.5 text-xs ${
          isEditMode
            ? "bg-amber-50/70 dark:bg-amber-950/30 border-amber-400 ring-2 ring-amber-400/30"
            : isQualityAlert
            ? "bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60"
            : isMeetingAction
            ? "bg-purple-50/40 dark:bg-purple-950/20 border-purple-200 dark:border-purple-900/60"
            : isNotice
            ? "bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/60"
            : "bg-blue-50/40 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/60"
        }`}>
          {/* Header Line: Badges + Switch to Edit Mode */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className={`px-2 py-0.5 rounded text-[11px] font-black shrink-0 ${
                isMeetingAction
                  ? "bg-purple-600 text-white"
                  : isNotice
                  ? "bg-emerald-600 text-white"
                  : isQualityAlert
                  ? "bg-rose-600 text-white"
                  : "bg-blue-600 text-white"
              }`}>
                {isMeetingAction ? "📅 회의일정" : isNotice ? "📢 사내공지" : isQualityAlert ? "🚨 부적합경보" : "📌 오픈이슈"}
              </span>

              <span className="px-1.5 py-0.5 rounded text-[10.5px] font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shrink-0">
                {issue.plant || "삼랑진공장"}
              </span>

              {issue.author && (
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium shrink-0">
                  작성: <strong className="text-slate-800 dark:text-slate-200">{issue.author}</strong> {issue.authorTitle || ""}
                </span>
              )}

              {Boolean(issue.date || issue.startDate || issue.createdAt) && (
                <span className="text-[10.5px] font-mono text-slate-400 dark:text-slate-500 shrink-0">
                  ({(issue.date || issue.startDate || (issue.createdAt ? issue.createdAt.slice(0, 10) : "")).slice(0, 10)})
                </span>
              )}
            </div>

            {/* Quick Toggle for Edit Mode */}
            <button
              type="button"
              onClick={() => setIsEditMode((prev) => !prev)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition-all flex items-center gap-1 cursor-pointer shrink-0 ${
                isEditMode
                  ? "bg-amber-500 text-slate-950 shadow-xs ring-1 ring-amber-600"
                  : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:bg-slate-100"
              }`}
              title={isEditMode ? "조회 모드로 복귀" : "원문 제목/내용 직접 수정"}
            >
              <Edit3 className="w-3 h-3" />
              <span>{isEditMode ? "✏️ 수정 모드 켜짐" : "원문 수정"}</span>
            </button>
          </div>

          {/* Body: View Mode vs Edit Mode */}
          {!isEditMode ? (
            <div className="space-y-2">
              <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-white leading-snug break-words">
                {issue.title || issue.content}
              </h4>

              {issue.title && issue.content && (
                <p className="text-slate-700 dark:text-slate-300 text-xs leading-relaxed whitespace-pre-wrap break-words bg-white/70 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800">
                  {issue.content}
                </p>
              )}

              {/* Extra Meeting Info */}
              {isMeetingAction && (
                <div className="flex flex-wrap gap-3 pt-1 text-[11px] font-medium text-purple-900 dark:text-purple-300">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-purple-600" />
                    시간: {issue.meetingTime || "14:00"}
                  </span>
                  {issue.meetingLocation && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-purple-600" />
                      장소: {issue.meetingLocation}
                    </span>
                  )}
                  {Array.isArray(issue.attendees) && issue.attendees.length > 0 && (
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-purple-600" />
                      참석: {issue.attendees.join(", ")}
                    </span>
                  )}
                </div>
              )}

              {/* Extra Notice Info */}
              {isNotice && issue.expireDate && (
                <div className="text-[11px] text-emerald-800 dark:text-emerald-300 font-bold flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>공지 만료일자: ~{issue.expireDate} (이후 자동 만료 종결)</span>
                </div>
              )}

              {/* Original Cause Photos Thumbnails */}
              {originalImages.length > 0 && (
                <div className="pt-1.5 space-y-1">
                  <span className="text-[10.5px] font-bold text-slate-500 dark:text-slate-400">
                    📷 원문 등록 사진 ({originalImages.length}장)
                  </span>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {originalImages.map((img, idx) => {
                      const imgUrl = typeof img === "object" ? (img.dataUrl || img.url) : img;
                      const imgName = typeof img === "object" ? (img.name || `사진 ${idx + 1}`) : `사진 ${idx + 1}`;
                      if (!imgUrl) return null;
                      return (
                        <div
                          key={idx}
                          onClick={() => onPreviewImage && onPreviewImage({ url: imgUrl, name: imgName })}
                          className="w-16 h-16 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 shrink-0 cursor-pointer hover:scale-105 transition-transform shadow-xs"
                          title="클릭하여 원본 확대 보기"
                        >
                          <img src={imgUrl} alt={imgName} className="w-full h-full object-cover" />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Edit Mode Inputs */
            <div className="space-y-2.5 pt-1">
              <div>
                <label className="block text-[11px] font-black text-amber-900 dark:text-amber-300 mb-1">
                  제목 수정
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border-2 border-amber-400 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="제목을 입력하세요..."
                />
              </div>

              <div>
                <label className="block text-[11px] font-black text-amber-900 dark:text-amber-300 mb-1">
                  상세 본문 내용 수정
                </label>
                <textarea
                  rows="3"
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full p-2.5 rounded-xl border-2 border-amber-400 bg-white dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 leading-relaxed"
                  placeholder="상세 내용을 입력하세요..."
                ></textarea>
              </div>

              {isMeetingAction && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10.5px] font-bold text-slate-600 dark:text-slate-400 mb-0.5">회의 시간</label>
                    <input
                      type="text"
                      value={editMeetingTime}
                      onChange={(e) => setEditMeetingTime(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-amber-300 bg-white dark:bg-slate-800 text-xs font-bold"
                      placeholder="14:00"
                    />
                  </div>
                  <div>
                    <label className="block text-[10.5px] font-bold text-slate-600 dark:text-slate-400 mb-0.5">회의 장소</label>
                    <input
                      type="text"
                      value={editMeetingLocation}
                      onChange={(e) => setEditMeetingLocation(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-amber-300 bg-white dark:bg-slate-800 text-xs font-bold"
                      placeholder="회의 장소 입력"
                    />
                  </div>
                </div>
              )}

              {isNotice && (
                <div>
                  <label className="block text-[10.5px] font-bold text-slate-600 dark:text-slate-400 mb-0.5">공지 만료일자</label>
                  <input
                    type="date"
                    value={editExpireDate}
                    onChange={(e) => setEditExpireDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-amber-300 bg-white dark:bg-slate-800 text-xs font-bold"
                  />
                </div>
              )}

              <div className="flex items-center justify-between text-[11px] text-amber-800 dark:text-amber-300 pt-1">
                <span>※ 내용 수정 후 아래 <strong>[수정등록]</strong> 뱃지를 누르면 첫 화면에 즉시 재등록됩니다.</span>
                <button
                  type="button"
                  onClick={() => setIsEditMode(false)}
                  className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold hover:bg-slate-300"
                >
                  수정 취소
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 2. Quick Action Input Form */}
        <div className="space-y-3 sm:space-y-4 text-xs">
          <div className="bg-gradient-to-br from-emerald-50/70 to-teal-50/40 dark:from-emerald-950/30 dark:to-teal-950/20 border-2 border-emerald-300 dark:border-emerald-800/60 rounded-2xl p-3.5 sm:p-4 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between border-b border-emerald-200/80 dark:border-emerald-800/60 pb-2">
              <div className="flex items-center gap-1.5 text-emerald-900 dark:text-emerald-200 font-black text-xs sm:text-sm">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">✓</span>
                <span>{isMeetingAction ? "회의결과 및 결정사항 입력" : "조치결과입력"}</span>
              </div>
              <span className="text-[10.5px] font-bold text-emerald-700 dark:text-emerald-400 bg-white/80 dark:bg-slate-900/60 px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800">
                조치완료 시 첫 화면에서 완료 종결
              </span>
            </div>

            {/* 조치자 / 작성자 선택 (자동 기본값 지정 + 원터치 변경 및 직접 입력 지원) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  {isMeetingAction ? "작성자 / 보고자" : "조치자"}
                </label>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                  (기본값 자동지정 • 직접 변경 가능)
                </span>
              </div>
              <div className="flex gap-1.5">
                <select
                  value={actionModalData.actionAuthor || ""}
                  onChange={(e) => setActionModalData((prev) => ({ ...prev, actionAuthor: e.target.value }))}
                  className="flex-1 px-3 py-2 rounded-xl border-2 text-xs font-bold transition-all bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-slate-200 dark:border-slate-700"
                >
                  <option value={issue.actionAuthor || issue.author || "현장담당자"}>
                    👤 기본: {issue.actionAuthor || issue.author || "현장담당자"}
                  </option>
                  {actionModalData.actionAuthor &&
                    actionModalData.actionAuthor !== (issue.actionAuthor || issue.author || "현장담당자") &&
                    !allWorkers?.some((w) => w.name === actionModalData.actionAuthor) && (
                      <option value={actionModalData.actionAuthor}>
                        ⭐ {actionModalData.actionAuthor} (직접 입력/선택)
                      </option>
                  )}
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
                <input
                  type="text"
                  placeholder="직접입력"
                  value={actionModalData.actionAuthor || ""}
                  onChange={(e) => setActionModalData((prev) => ({ ...prev, actionAuthor: e.target.value }))}
                  className="w-24 sm:w-28 px-2.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200"
                  title="조치자 이름을 직접 입력할 수도 있습니다"
                />
              </div>
            </div>

            {/* 결과 상세 내용 */}
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                {isMeetingAction ? "회의 결과 및 결정 사항" : "조치결과 내용 (1~2줄 요약)"}
              </label>
              <textarea
                rows="3"
                placeholder={
                  isMeetingAction
                    ? "예: 1. 품질 개선 프로세스 표준화 방안 확정\n2. 담당자별 후속 조치 업무 분장 완료"
                    : "예: 센서 커넥터 재체결 및 롤러 속도 보정 완료. 정상 치수 복귀 확인."
                }
                value={actionModalData.actionResult || ""}
                onChange={(e) => setActionModalData((prev) => ({ ...prev, actionResult: e.target.value }))}
                className="w-full p-2.5 rounded-xl border-2 border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-800 font-semibold leading-relaxed text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              ></textarea>
            </div>

            {/* 조치 사진 첨부 */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Camera className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>{isMeetingAction ? "회의록/결과 사진 첨부 (선택)" : "조치 후 사진 첨부 (선택)"}</span>
                </label>
                <span className="text-[10px] text-slate-400 font-mono">
                  {actionModalData.actionImages?.length || 0}/3장
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <input
                    type="file"
                    id="action-issue-camera-input"
                    accept="image/*"
                    capture="environment"
                    disabled={isProcessingActionImages || (actionModalData.actionImages?.length || 0) >= 3}
                    onChange={(e) => {
                      if (e.target.files) {
                        onActionImageFiles(e.target.files);
                        e.target.value = "";
                      }
                    }}
                    className="hidden"
                  />
                  <label
                    htmlFor="action-issue-camera-input"
                    className={`w-full py-2 px-2 rounded-xl border-2 flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-xs active:scale-95 ${
                      (actionModalData.actionImages?.length || 0) >= 3
                        ? "border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed"
                        : "border-emerald-500 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-200 ring-1 ring-emerald-500/30 font-black"
                    }`}
                  >
                    <Camera className="w-3.5 h-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-[11px] font-black truncate">
                      {isProcessingActionImages ? "압축 중..." : "📸 즉시 촬영"}
                    </span>
                  </label>
                </div>

                <div>
                  <input
                    type="file"
                    id="action-issue-gallery-input"
                    accept="image/*"
                    multiple
                    disabled={isProcessingActionImages || (actionModalData.actionImages?.length || 0) >= 3}
                    onChange={(e) => {
                      if (e.target.files) {
                        onActionImageFiles(e.target.files);
                        e.target.value = "";
                      }
                    }}
                    className="hidden"
                  />
                  <label
                    htmlFor="action-issue-gallery-input"
                    className={`w-full py-2 px-2 rounded-xl border-2 border-dashed flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95 ${
                      (actionModalData.actionImages?.length || 0) >= 3
                        ? "border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed"
                        : "border-slate-300 dark:border-slate-700 hover:border-slate-400 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold"
                    }`}
                  >
                    <ImageIcon className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="text-[11px] font-bold truncate">📁 앨범/파일 선택</span>
                  </label>
                </div>
              </div>

              {actionModalData.actionImages && actionModalData.actionImages.length > 0 && (
                <div className="grid grid-cols-3 gap-2 pt-1">
                  {actionModalData.actionImages.map((img, idx) => (
                    <div
                      key={img.id || idx}
                      className="group relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 aspect-square shadow-xs"
                    >
                      <img
                        src={img.dataUrl}
                        alt={img.name}
                        onClick={() => onPreviewImage && onPreviewImage({ url: img.dataUrl, name: img.name })}
                        className="w-full h-full object-cover cursor-pointer group-hover:scale-105 transition-transform"
                      />
                      <button
                        type="button"
                        onClick={() => onRemoveActionImage(idx)}
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

          {/* 3. Footer Action Buttons: [닫기] [수정등록] [조치완료] */}
          <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-100 dark:border-slate-800">
            {/* Left: 지난 대장 이력 이동 링크 */}
            <button
              type="button"
              onClick={onOpenLedger}
              className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 font-bold underline flex items-center gap-1 cursor-pointer"
            >
              <span>📁 지난 이력 전체대장</span>
            </button>

            {/* Right: [닫기] -> [수정등록] -> [조치완료] (정확한 뱃지 배치 및 모바일 터치 최적화) */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* 1. 닫기 */}
              <button
                type="button"
                onClick={onClose}
                className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 text-xs transition-all cursor-pointer"
              >
                닫기
              </button>

              {/* 2. 수정등록 (닫기와 조치완료 사이에 위치 • 원문 수정 및 조치결과 동시 등록) */}
              <button
                type="button"
                disabled={isSaving}
                onTouchEnd={(e) => safeSubmit(handleEditSubmit, e)}
                onClick={(e) => safeSubmit(handleEditSubmit, e)}
                className={`px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-black shadow-sm flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer ${
                  isSaving ? "opacity-60 cursor-not-allowed" : ""
                } ${
                  isEditMode
                    ? "bg-amber-500 hover:bg-amber-600 text-slate-950 ring-2 ring-amber-400 font-black animate-pulse"
                    : "bg-amber-500 hover:bg-amber-600 text-slate-950 font-black"
                }`}
                title="원문 수정 및 조치결과 저장 재등록"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{isEditMode ? "수정내용 재등록" : "수정등록"}</span>
              </button>

              {/* 3. 조치완료 (모바일 터치 즉각 반응 + 저장 중 스피너 표시) */}
              <button
                type="button"
                disabled={isSaving}
                onTouchEnd={(e) => safeSubmit(handleActionCompleteSubmit, e)}
                onClick={(e) => safeSubmit(handleActionCompleteSubmit, e)}
                className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-white font-black text-xs shadow-md active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer ${
                  isSaving ? "opacity-60 cursor-not-allowed" : ""
                } ${
                  isMeetingAction
                    ? "bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 shadow-purple-500/25"
                    : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-emerald-500/25"
                }`}
              >
                {isSaving ? (
                  <span className="inline-block animate-spin mr-0.5">⏳</span>
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                <span>
                  {isSaving
                    ? "저장 중..."
                    : isMeetingAction
                    ? "회의결과 저장 및 종결"
                    : "조치완료"}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
