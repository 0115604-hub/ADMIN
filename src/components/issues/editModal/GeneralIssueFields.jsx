import { Megaphone, AlertTriangle, Camera, Image as ImageIcon, FileSpreadsheet } from "lucide-react";

export default function GeneralIssueFields({
  newIssueForm,
  setNewIssueForm,
  todayDateStr,
  isProcessingIssueImages,
  onIssueFiles,
  onIssueImageFiles,
  onRemoveIssueImage,
  onPreviewImage
}) {
  return (
    <div className="space-y-3">
      {/* 3. 날짜 설정 카드 */}
      <div className={`p-3 rounded-2xl border transition-all ${
        newIssueForm.category === "공지사항" || newIssueForm.category === "사내공지"
          ? "bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 ring-1 ring-emerald-400/30"
          : "bg-rose-50/80 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 ring-1 ring-rose-400/30"
      }`}>
        {newIssueForm.category === "공지사항" || newIssueForm.category === "사내공지" ? (
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
          /* 부적합경보 */
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <label className="font-black text-xs block text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                <span>부적합경보 등록일</span>
              </label>
              <p className="text-[10.5px] text-slate-500 dark:text-slate-400">
                * 부적합경보가 발행/등록된 일자입니다.
              </p>
            </div>
            <input
              type="date"
              required
              value={newIssueForm.date || newIssueForm.expireDate || todayDateStr}
              onChange={(e) => {
                const val = e.target.value;
                setNewIssueForm({ ...newIssueForm, expireDate: val, date: val, startDate: val });
              }}
              className="px-3 py-1.5 rounded-xl border border-rose-300 dark:border-rose-700 bg-white dark:bg-slate-800 font-mono font-black text-xs text-slate-900 dark:text-white shadow-xs cursor-pointer"
            />
          </div>
        )}
      </div>

      {/* 4. 제목 & 내용 */}
      <div className="space-y-2">
        <div>
          <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">
            제목
          </label>
          <input
            type="text"
            required
            placeholder={
              newIssueForm.category === "공지사항" || newIssueForm.category === "사내공지"
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
            상세 전달 내용 (문제 상황 및 작업자 전달 사항)
          </label>
          <textarea
            rows="6"
            required
            placeholder="구체적인 상황 및 작업자 전달 사항을 상세히 입력해 주세요."
            value={newIssueForm.content}
            onChange={(e) => setNewIssueForm({ ...newIssueForm, content: e.target.value })}
            className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium leading-relaxed text-slate-900 dark:text-white text-xs sm:text-sm min-h-[140px]"
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
    </div>
  );
}
