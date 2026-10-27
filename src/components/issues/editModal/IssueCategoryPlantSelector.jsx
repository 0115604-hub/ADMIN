import { Pin } from "lucide-react";

export default function IssueCategoryPlantSelector({
  newIssueForm,
  setNewIssueForm,
  onSwitchCategory,
  allWorkers = []
}) {
  return (
    <>
      {/* 1. 구분 (4대 분류) */}
      <div>
        <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">
          구분 (4대 분류)
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          {/* 1) 부적합경보 */}
          <button
            type="button"
            onClick={() => onSwitchCategory("품질경보")}
            className={`py-2 px-1 rounded-xl border-2 flex items-center justify-center gap-1 transition-all cursor-pointer text-xs font-black ${
              newIssueForm.category === "품질경보" || newIssueForm.category === "부적합경보"
                ? "bg-rose-50 dark:bg-rose-950/70 border-rose-500 text-rose-700 dark:text-rose-300 shadow-xs ring-1 ring-rose-500/30"
                : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-700 hover:border-slate-300"
            }`}
          >
            <span>🚨 부적합경보</span>
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
            {newIssueForm.author && !(allWorkers || []).some((w) => w.name === newIssueForm.author) && (
              <option value={newIssueForm.author}>현장 • {newIssueForm.author}</option>
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
    </>
  );
}
