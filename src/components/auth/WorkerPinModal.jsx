import React, { useEffect, useRef } from "react";
import { X, Lock, ArrowRight, Delete } from "lucide-react";
import { ADMIN_USERS } from "../../context/AuthContext";
import { getUserLeaveStatus } from "../../services/annualLeaveService";

export const WorkerPinModal = ({
  selectedUser,
  setSelectedUser,
  pin,
  setPin,
  rememberMe,
  setRememberMe,
  loading,
  errorMsg,
  annualLeaves,
  onPinSubmit
}) => {
  const inputRef = useRef(null);

  useEffect(() => {
    if (selectedUser) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [selectedUser]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setSelectedUser(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setSelectedUser]);

  if (!selectedUser) return null;

  const isAdmin = selectedUser.role === "ADMIN";
  const isMyeongjae = selectedUser.name === "이명재" || selectedUser.assignedProcess === "총괄관리";
  const leaveStatus = getUserLeaveStatus(selectedUser.id, selectedUser.name, annualLeaves, { excludeTodo: true });

  const handleKeypadPress = (num) => {
    setPin((prev) => (prev.length < 8 ? prev + num : prev));
  };

  const handleKeypadBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
  };

  const handleKeypadClear = () => {
    setPin("");
  };

  return (
    <div
      onClick={() => setSelectedUser(null)}
      className="fixed inset-0 z-[100] bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fadeIn"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.4)] overflow-hidden animate-scaleUp relative"
      >
        <div className={`h-1.5 w-full ${
          isAdmin
            ? "bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500"
            : selectedUser.plant === "한림공장"
            ? "bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600"
            : "bg-gradient-to-r from-amber-500 via-rose-500 to-amber-600"
        }`} />

        <div className="p-4 sm:p-5 pb-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded-xl text-white ${
                isAdmin
                  ? "bg-blue-600 shadow-xs"
                  : selectedUser.plant === "한림공장"
                  ? "bg-emerald-600 shadow-xs"
                  : "bg-amber-600 shadow-xs"
              }`}>
                <Lock className="w-3.5 h-3.5" />
              </div>
              <div>
                <h3 className="font-black text-sm text-slate-900 dark:text-white">
                  작업자 PIN 인증
                </h3>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSelectedUser(null)}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              title="닫기 (ESC)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {isAdmin && (
            <div className="mt-2.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 grid grid-cols-2 gap-1">
              {ADMIN_USERS.map((admin) => {
                const isSelected = selectedUser.name === admin.name;
                return (
                  <button
                    key={admin.id}
                    type="button"
                    onClick={() => {
                      setSelectedUser(admin);
                      setPin("");
                    }}
                    className={`py-1.5 px-2 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1 cursor-pointer ${
                      isSelected
                        ? "bg-blue-600 text-white shadow-xs"
                        : "text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                    }`}
                  >
                    <span>{admin.name === "권태형" ? "👑" : "💎"}</span>
                    <span>{admin.name} {admin.title}</span>
                  </button>
                );
              })}
            </div>
          )}

          <div className={`mt-3 p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${
            isAdmin
              ? "bg-blue-50/70 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/60"
              : isMyeongjae
              ? "bg-amber-50/80 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800/60"
              : selectedUser.plant === "한림공장"
              ? "bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60"
              : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700"
          }`}>
            <div className="flex items-center gap-3 min-w-0">
              <div className={`w-12 h-12 rounded-2xl text-white flex items-center justify-center font-black text-lg shadow-md shrink-0 ${
                isAdmin
                  ? selectedUser.name === "최미영" ? "bg-indigo-600 ring-2 ring-indigo-400/40" : "bg-blue-600 ring-2 ring-blue-400/40"
                  : selectedUser.plant === "한림공장"
                  ? "bg-emerald-600 ring-2 ring-emerald-400/40"
                  : "bg-amber-600 ring-2 ring-amber-400/40"
              }`}>
                {selectedUser.avatar || selectedUser.name?.charAt(0)}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h4 className="font-black text-base text-slate-900 dark:text-white truncate">
                    {selectedUser.name}
                  </h4>
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    {selectedUser.title || (isAdmin ? "대표이사" : "작업자")}
                  </span>
                </div>
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 truncate block mt-0.5">
                  {isAdmin
                    ? "본사 • 최고 관리자"
                    : `${selectedUser.plant || "삼랑진공장"} • ${selectedUser.assignedProcess || "작업자"}`}
                </span>
              </div>
            </div>

            {leaveStatus && (
              <span className="px-2 py-1 rounded-lg bg-rose-500 text-white text-[10px] font-black shrink-0 shadow-xs animate-pulse">
                {leaveStatus.displayBadge || "근태"}
              </span>
            )}
          </div>
        </div>

        <form onSubmit={onPinSubmit} className="p-4 sm:p-5 pt-0 space-y-3">
          {errorMsg && (
            <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-1.5 animate-shake">
              <span className="p-0.5 px-1.5 rounded-full bg-rose-200 dark:bg-rose-800 text-rose-800 dark:text-rose-200 text-[10px] font-black">!</span>
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="space-y-1">
            <label className="block text-xs font-black text-slate-700 dark:text-slate-300">
              PIN 번호 입력
            </label>
            <div className="relative">
              <input
                ref={inputRef}
                id="popup-worker-pin-input"
                type="password"
                inputMode="numeric"
                autoComplete="current-password"
                placeholder={isAdmin ? "0090" : "PIN 입력"}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border-2 border-blue-400 dark:border-blue-600 bg-slate-50 dark:bg-slate-800/90 text-slate-900 dark:text-white text-xl font-black text-center tracking-[0.35em] font-mono focus:outline-none focus:ring-4 focus:ring-blue-500/20 shadow-inner"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-1.5 pt-1">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handleKeypadPress(num)}
                className="py-2.5 sm:py-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:bg-blue-100 dark:active:bg-blue-900/60 text-slate-900 dark:text-white font-black text-base transition-all active:scale-95 cursor-pointer shadow-2xs select-none"
              >
                {num}
              </button>
            ))}
            <button
              type="button"
              onClick={handleKeypadClear}
              className="py-2.5 sm:py-3 rounded-xl bg-slate-200/80 dark:bg-slate-800/80 hover:bg-rose-100 dark:hover:bg-rose-950/60 text-slate-600 dark:text-slate-400 hover:text-rose-600 font-bold text-xs transition-all active:scale-95 cursor-pointer shadow-2xs select-none flex items-center justify-center"
            >
              전체삭제
            </button>
            <button
              type="button"
              onClick={() => handleKeypadPress("0")}
              className="py-2.5 sm:py-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:bg-blue-100 dark:active:bg-blue-900/60 text-slate-900 dark:text-white font-black text-base transition-all active:scale-95 cursor-pointer shadow-2xs select-none"
            >
              0
            </button>
            <button
              type="button"
              onClick={handleKeypadBackspace}
              className="py-2.5 sm:py-3 rounded-xl bg-slate-200/80 dark:bg-slate-800/80 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-all active:scale-95 cursor-pointer shadow-2xs select-none flex items-center justify-center"
              title="한 글자 지우기"
            >
              <Delete className="w-4 h-4" />
            </button>
          </div>

          <div className="pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-500 dark:text-slate-400 select-none px-1">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-700"
              />
              <span>로그인 상태 유지 (개인 기기 전용)</span>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2">
            <button
              type="button"
              onClick={() => setSelectedUser(null)}
              className="py-3 px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 font-bold text-xs shadow-2xs transition active:scale-95 cursor-pointer flex items-center justify-center"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={loading || !pin}
              className="py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-xs shadow-md shadow-blue-500/25 active:scale-95 transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <span>접속하기</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
