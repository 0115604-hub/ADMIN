import { Pin, Check, Camera, Image as ImageIcon, FileSpreadsheet, Calendar, MessageSquare } from "lucide-react";

export const getOpenIssueFormCalendarDays = (startDateStr, targetDateStr, replies = [], todayDateStr = new Date().toISOString().slice(0, 10)) => {
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

export default function OpenIssueFields({
  newIssueForm,
  setNewIssueForm,
  editingIssue,
  isProcessingIssueImages,
  onIssueFiles,
  onIssueImageFiles,
  onRemoveIssueImage,
  onPreviewImage,
  todayDateStr,
  actionOpinionForm,
  setActionOpinionForm,
  allWorkers,
  onModalAddOpinion,
  onModalDeleteOpinion,
  onOpinionFiles,
  onRemoveOpinionFile
}) {
  return (
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
            상세 전달 내용 (문제 상황 및 작업자 전달 사항)
          </label>
          <textarea
            rows="6"
            required
            placeholder="구체적인 상황, 문제점 및 작업자 전달 사항을 상세히 입력해 주세요."
            value={newIssueForm.content}
            onChange={(e) => setNewIssueForm({ ...newIssueForm, content: e.target.value })}
            className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium leading-relaxed text-slate-900 dark:text-white text-xs sm:text-sm min-h-[140px]"
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
            newIssueForm.replies || [],
            todayDateStr
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
                {actionOpinionForm.author && !(allWorkers || []).some((w) => w.name === actionOpinionForm.author) && (
                  <option value={actionOpinionForm.author}>현장 • {actionOpinionForm.author}</option>
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
            </div>
          </div>

          {/* Multi-line textarea for opinions */}
          <div>
            <textarea
              rows="3"
              placeholder="조치 의견 및 진행 상황을 입력해 주세요. (첨부파일 없이 텍스트만 작성하여 등록 가능)"
              value={actionOpinionForm.content}
              onChange={(e) => setActionOpinionForm({ ...actionOpinionForm, content: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-blue-300 dark:border-blue-700 bg-white dark:bg-slate-900 text-xs font-medium leading-relaxed text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-400 focus:outline-hidden min-h-[70px]"
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
  );
}
