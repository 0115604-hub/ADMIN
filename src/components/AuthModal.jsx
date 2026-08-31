import React, { useState } from "react";
import {
  KeyRound,
  ChevronRight,
  Shield,
  Factory,
  ArrowRight
} from "lucide-react";
import { useAuth, ADMIN_USERS, PLANTS } from "../context/AuthContext";
import { OryukLogo } from "./OryukLogo";

export const AuthModal = () => {
  const { loginWithProfile } = useAuth();
  const [selectedUser, setSelectedUser] = useState(null);
  const [pin, setPin] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleUserClick = (user) => {
    setSelectedUser(user);
    setPin("");
    setErrorMsg("");
  };

  const handlePinSubmit = (e) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);
    try {
      loginWithProfile(selectedUser.id, pin || "1234");
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fadeIn overflow-y-auto relative">
      {/* ========================================================================= */}
      {/* ⭐ [사용자 요청] (주)오륙 공식 로고 전체 배경 워터마크 & 앰비언트 글로우 */}
      {/* ========================================================================= */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none flex items-center justify-center">
        {/* Soft Ambient Radial Glows */}
        <div className="absolute w-[600px] h-[600px] rounded-full bg-blue-600/15 blur-[120px] -top-24 -left-24 animate-pulse"></div>
        <div className="absolute w-[500px] h-[500px] rounded-full bg-indigo-600/15 blur-[100px] -bottom-20 -right-20 animate-pulse"></div>
        <div className="absolute w-[400px] h-[400px] rounded-full bg-sky-500/10 blur-[80px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>

        {/* Giant Watermark Official Oryuk Logo */}
        <div className="opacity-[0.14] dark:opacity-[0.18] w-[750px] h-[750px] max-w-[90vw] max-h-[90vh] transform rotate-[-6deg] transition-all duration-1000">
          <OryukLogo className="w-full h-full" />
        </div>
      </div>

      {/* Main Glassmorphism Login Card */}
      <div className="bg-white/95 dark:bg-slate-900/90 backdrop-blur-xl w-full max-w-lg rounded-3xl shadow-2xl border border-white/40 dark:border-slate-800 overflow-hidden p-6 sm:p-8 my-8 relative z-10">
        {/* Brand Header with Official Logo */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-800/80 border border-blue-100 dark:border-slate-700 shadow-md shadow-blue-500/10 mb-3">
            <OryukLogo className="w-9 h-9" />
          </div>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            (주)오륙 생산관리현황
          </h3>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            접속하실 작업자 또는 관리자를 선택해 주세요.
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-2 animate-shake">
            <span>⚠️</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {!selectedUser ? (
          <div className="space-y-6">
            {/* 1. FACTORY 1: 삼랑진공장 */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between px-1">
                <div className="text-xs font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Factory className="w-4 h-4" />
                  <span>삼랑진공장</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                {PLANTS[0].workers.map((worker) => (
                  <button
                    key={worker.id}
                    onClick={() => handleUserClick(worker)}
                    className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 hover:border-amber-400 hover:bg-amber-50/50 dark:hover:bg-amber-950/20 cursor-pointer transition-all flex flex-col items-center justify-center gap-1 group shadow-sm hover:shadow active:scale-95 text-center"
                  >
                    <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black text-xs shadow-sm">
                      {worker.avatar}
                    </div>
                    <span className="font-black text-xs text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400">
                      {worker.name}
                    </span>
                    <span className="text-[9.5px] font-extrabold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 truncate max-w-full">
                      {worker.assignedProcess}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* 2. FACTORY 2: 한림공장 */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between px-1">
                <div className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Factory className="w-4 h-4" />
                  <span>한림공장</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                {PLANTS[1].workers.map((worker) => (
                  <button
                    key={worker.id}
                    onClick={() => handleUserClick(worker)}
                    className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 hover:border-emerald-400 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 cursor-pointer transition-all flex flex-col items-center justify-center gap-1 group shadow-sm hover:shadow active:scale-95 text-center"
                  >
                    <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-xs shadow-sm">
                      {worker.avatar}
                    </div>
                    <span className="font-black text-xs text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                      {worker.name}
                    </span>
                    <span className="text-[9.5px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 truncate max-w-full">
                      {worker.assignedProcess}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* 3. BOTTOM: ADMIN */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-center">
              {ADMIN_USERS.map((admin) => (
                <button
                  key={admin.id}
                  onClick={() => handleUserClick(admin)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:border-blue-300 text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-300 text-xs font-black transition-all shadow-sm group"
                >
                  <Shield className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-500" />
                  <span>ADMIN</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-transform" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* PIN Input View */
          <form onSubmit={handlePinSubmit} className="space-y-5 animate-fadeIn">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-2xl text-white flex items-center justify-center font-black text-base shadow-sm ${
                  selectedUser.role === "ADMIN"
                    ? "bg-slate-800"
                    : selectedUser.plant === "한림공장"
                    ? "bg-emerald-600"
                    : "bg-amber-500"
                }`}>
                  {selectedUser.avatar}
                </div>
                <div>
                  <h4 className="font-black text-base text-slate-900 dark:text-white">
                    {selectedUser.name}
                  </h4>
                  <span className="text-[11px] font-bold text-slate-500">
                    {selectedUser.role === "ADMIN" ? "관리자 모드" : selectedUser.plant}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="text-xs text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-bold underline"
              >
                다른 사용자 선택
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-blue-500" />
                <span>
                  {selectedUser.role === "ADMIN"
                    ? "관리자 비밀번호 입력"
                    : "비밀번호(PIN) 입력 (기본: 1234)"}
                </span>
              </label>
              <input
                type="password"
                autoFocus
                placeholder={
                  selectedUser.role === "ADMIN"
                    ? "관리자 비밀번호 입력"
                    : "PIN 4자리 입력 (기본: 1234)"
                }
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-base font-bold text-center tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 text-white font-black text-sm shadow-lg shadow-blue-500/25 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <span>{selectedUser.name} 접속하기</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
