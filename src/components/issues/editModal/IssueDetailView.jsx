import {
  CheckCircle2,
  Edit3,
  Users,
  FileSpreadsheet,
  Download,
  MessageSquare,
  Calendar,
  Camera,
  Image as ImageIcon
} from "lucide-react";

/**
 * IssueDetailView
 * Detailed read-only view with status toggle, opinion thread, and action result for existing issue.
 */
export const IssueDetailView = ({
  editingIssue,
  newIssueForm,
  allWorkers,
  todayDateStr,
  setIsIssueDetailMode,
  onToggleResolvedStatus,
  onOpenActionModal,
  onPreviewImage,
  actionOpinionForm,
  setActionOpinionForm,
  onOpinionFiles,
  onRemoveOpinionFile,
  onModalAddOpinion,
  onModalDeleteOpinion,
  onClose,
  opinionCount = 0
}) => {
  return (
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
                💬 {opinionCount}
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

        {/* 회의 참석자 목록 (회의일정인 경우) */}
        {editingIssue.category === "회의일정" && editingIssue.attendees && editingIssue.attendees.length > 0 && (
          <div className="p-2.5 rounded-xl bg-purple-50/80 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 space-y-1">
            <span className="font-bold text-[11px] text-purple-900 dark:text-purple-200 flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-purple-600" />
              <span>회의 참석자 ({editingIssue.attendees.length}명):</span>
            </span>
            <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
              {editingIssue.attendees.map((att, idx) => (
                <span key={idx} className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 text-purple-950 dark:text-purple-100 text-[10.5px] font-bold border border-purple-200 dark:border-purple-700 shadow-2xs">
                  {att.name || att} {att.title || ""}
                </span>
              ))}
            </div>
          </div>
        )}

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

      {/* 3) 💬 의견 스레드 & 입력창 */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-br from-blue-50/70 via-indigo-50/30 to-slate-50 dark:from-blue-950/40 dark:via-indigo-950/20 dark:to-slate-900 border-2 border-blue-200 dark:border-blue-900/80 space-y-3 shadow-xs">
        <div className="flex items-center justify-between gap-1 flex-wrap">
          <span className="font-black text-xs sm:text-sm text-blue-950 dark:text-blue-200 flex items-center gap-1.5">
            <MessageSquare className="w-4 h-4 text-blue-600" />
            <span>{(newIssueForm.category === "품질경보" || newIssueForm.category === "부적합경보") ? "조치결과 및 의견" : "의견"} ({editingIssue.replies?.length || 0}건)</span>
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

                <div className="p-2 rounded-lg bg-white/95 dark:bg-slate-900/95 border border-blue-100 dark:border-blue-900/50 text-xs sm:text-[13px] font-bold text-slate-950 dark:text-white leading-relaxed whitespace-pre-wrap break-words shadow-2xs">
                  {rep.content}
                </div>

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

          <div>
            <textarea
              rows="3"
              placeholder={
                newIssueForm.category === "품질경보" || newIssueForm.category === "부적합경보"
                  ? "부적합경보 조치결과 및 개선 내용을 입력해 주세요. (등록 시 조치완료 텔레그램 실시간 1회 발송)"
                  : "조치 의견 및 진행 상황을 입력해 주세요. (첨부파일 없이 텍스트만 작성하여 등록 가능)"
              }
              value={actionOpinionForm.content}
              onChange={(e) => setActionOpinionForm({ ...actionOpinionForm, content: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-blue-300 dark:border-blue-700 bg-white dark:bg-slate-800 text-xs font-medium leading-relaxed text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-400 focus:outline-hidden min-h-[70px]"
            ></textarea>
          </div>

          {/* Buttons Bar: [📸 촬영] [📁 앨범] [📊 엑셀] ──── [조치결과 등록 / 의견등록] */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 flex-wrap">
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

            <button
              type="button"
              onClick={onModalAddOpinion}
              className={`px-4 py-2 rounded-xl text-white font-black text-xs shadow-md active:scale-95 flex items-center justify-center cursor-pointer shrink-0 transition-all ${
                newIssueForm.category === "품질경보" || newIssueForm.category === "부적합경보"
                  ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-emerald-500/25"
                  : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-blue-500/25"
              }`}
            >
              <span>{newIssueForm.category === "품질경보" || newIssueForm.category === "부적합경보" ? "조치결과 등록 🟢" : "의견등록"}</span>
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
  );
};

export default IssueDetailView;
