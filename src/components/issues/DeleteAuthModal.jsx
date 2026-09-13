import React from "react";
import { createPortal } from "react-dom";
import { Shield, Trash2, Crown, AlertTriangle } from "lucide-react";

export const DeleteAuthModal = ({
  deleteModalData,
  setDeleteModalData,
  onConfirmDelete
}) => {
  if (!deleteModalData?.isOpen || !deleteModalData?.issue || typeof document === "undefined") {
    return null;
  }

  const { issue, isHardDelete, pinInput, errorMsg, isDeleting } = deleteModalData;

  const handleClose = () => {
    setDeleteModalData({
      isOpen: false,
      issue: null,
      pinInput: "",
      errorMsg: "",
      isHardDelete: false,
      isDeleting: false
    });
  };

  return createPortal(
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
      className="fixed inset-0 z-[90] bg-slate-950/80 backdrop-blur-md overflow-y-auto p-2 sm:p-4 py-2 sm:py-8 flex justify-center items-start sm:items-center animate-fadeIn cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl max-w-md w-full p-3.5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-3 sm:space-y-4 my-auto animate-scaleUp cursor-default"
      >
        <div className="flex items-center justify-between pb-2.5 sm:pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-xl text-white shadow-xs ${isHardDelete ? "bg-rose-700 ring-2 ring-rose-500/40" : "bg-rose-600"}`}>
              {isHardDelete ? <Trash2 className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>{isHardDelete ? "관리대장 영구 삭제" : "품질경보 및 공지사항 삭제"}</span>
                {isHardDelete && (
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-black bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200 border border-rose-300">
                    Admin 전용
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-slate-400">
                {isHardDelete
                  ? "데이터베이스(DB)에서 영구 파기되어 복구할 수 없습니다."
                  : "첫화면/카테고리에서 내리고 [종결삭제관리]로 이동 보존합니다."}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-sm font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Target Issue Info Card */}
        <div className="p-3 rounded-2xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-900/60 space-y-1 text-xs">
          <div className="flex items-center justify-between">
            <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
              issue.plant === "한림공장"
                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                : "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300"
            }`}>
              {issue.plant}
            </span>
            <span className="text-[10.5px] text-slate-500 dark:text-slate-400">
              작성자: {issue.author} ({issue.createdAt})
            </span>
          </div>
          <div className="font-black text-slate-900 dark:text-white truncate pt-1">
            {issue.title || issue.content}
          </div>
        </div>

        {/* Authority Notice */}
        <div className={`p-3 rounded-2xl border text-xs space-y-1 ${
          isHardDelete
            ? "bg-rose-100/70 dark:bg-rose-950/50 border-rose-300 dark:border-rose-800 text-rose-950 dark:text-rose-200"
            : "bg-slate-50 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700/80 text-slate-700 dark:text-slate-200"
        }`}>
          <div className="flex items-center gap-1.5 font-black">
            <Crown className="w-3.5 h-3.5 text-amber-500" />
            <span>
              {isHardDelete
                ? "영구 삭제 권한: 본사 최고관리자(Admin) 전용"
                : "삭제 권한: 총괄관리자 (이명재 이사 • 김동욱 책임) / 본사 Admin"}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            {isHardDelete
              ? "⚠️ DB에서 완전히 영구 삭제(파기)됩니다. 최고관리자 확인 PIN을 입력해 주세요."
              : "삭제를 진행하려면 총괄관리자 또는 본사 관리자 확인 PIN을 입력해 주세요."}
          </p>
        </div>

        {/* PIN Input Form */}
        <form onSubmit={onConfirmDelete} className="space-y-3 pt-1">
          <div>
            <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1.5 text-xs">
              <span>{isHardDelete ? "본사 최고관리자(Admin) 확인 PIN" : "총괄관리자 / 관리자 확인 PIN"}</span>
            </label>
            <input
              type="password"
              maxLength={6}
              required
              autoFocus
              inputMode="numeric"
              autoComplete="off"
              placeholder="보안 PIN 번호 입력"
              value={pinInput}
              onChange={(e) => setDeleteModalData((prev) => ({ ...prev, pinInput: e.target.value, errorMsg: "" }))}
              className="w-full text-center tracking-widest text-lg font-mono font-black px-4 py-2.5 rounded-2xl border-2 border-rose-400 dark:border-rose-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-rose-600 shadow-xs"
            />
          </div>

          {errorMsg && (
            <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 text-xs font-bold text-center animate-shake flex items-center justify-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 font-bold hover:bg-slate-100 text-xs cursor-pointer"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isDeleting}
              className={`px-5 py-2.5 rounded-xl text-white font-black text-xs shadow-md active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${
                isHardDelete
                  ? "bg-rose-700 hover:bg-rose-800 shadow-rose-700/30 ring-2 ring-rose-500/40"
                  : "bg-rose-600 hover:bg-rose-700 shadow-rose-500/25"
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>
                {isDeleting
                  ? isHardDelete ? "영구 삭제 중..." : "삭제 처리 중..."
                  : isHardDelete ? "영구 삭제 (완전 파기)" : "권한 인증 후 삭제"}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
