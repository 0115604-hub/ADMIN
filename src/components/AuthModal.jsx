import React, { useState } from "react";
import {
  Building2,
  KeyRound,
  ChevronRight,
  Crown,
  Factory,
  ArrowRight
} from "lucide-react";
import { useAuth, ADMIN_USERS, PLANTS } from "../context/AuthContext";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden p-6 sm:p-8 my-8 relative">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25 mb-2.5">
            <Building2 className="w-6 h-6" />
          </div>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            매입·매출 관리 시스템
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            접속하실 사용자(관리자 또는 작업자)를 선택해 주세요.
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-2">
            <span>⚠️</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {!selectedUser ? (
          <div className="space-y-6">
            {/* 1. TOP: 총괄 관리자 (주석 및 이름 삭제하고 심플하게 유지) */}
            <div>
              {ADMIN_USERS.map((admin) => (
                <div
                  key={admin.id}
                  onClick={() => handleUserClick(admin)}
                  className="p-4 rounded-2xl border-2 border-blue-200 dark:border-blue-800 bg-gradient-to-r from-blue-50/70 to-indigo-50/50 dark:from-blue-950/30 dark:to-indigo-950/20 hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/10 cursor-pointer transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-base shadow-md shadow-blue-500/30">
                      <Crown className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-black text-base text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                        {admin.name}
                      </h4>
                    </div>
                  </div>

                  <div className="p-2 rounded-xl text-blue-500 group-hover:translate-x-1 transition-transform">
                    <ChevronRight className="w-5 h-5" />
                  </div>
                </div>
              ))}
            </div>

            {/* 2. FACTORY 1: 삼랑진공장 (6명) */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between px-1">
                <div className="text-[11px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Factory className="w-3.5 h-3.5" />
                  <span>삼랑진공장</span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {PLANTS[0].workers.map((worker) => (
                  <div
                    key={worker.id}
                    onClick={() => handleUserClick(worker)}
                    className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:border-amber-400 hover:bg-amber-50/40 dark:hover:bg-amber-950/20 cursor-pointer transition-all flex items-center gap-2.5 group shadow-sm hover:shadow"
                  >
                    <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black text-xs shadow-sm shrink-0">
                      {worker.avatar}
                    </div>
                    <div className="min-w-0">
                      <p className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 truncate">
                        {worker.name}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. FACTORY 2: 한림공장 (3명) */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between px-1">
                <div className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Factory className="w-3.5 h-3.5" />
                  <span>한림공장</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                {PLANTS[1].workers.map((worker) => (
                  <div
                    key={worker.id}
                    onClick={() => handleUserClick(worker)}
                    className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:border-emerald-400 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20 cursor-pointer transition-all flex items-center gap-2.5 group shadow-sm hover:shadow"
                  >
                    <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-xs shadow-sm shrink-0">
                      {worker.avatar}
                    </div>
                    <div className="min-w-0">
                      <p className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 truncate">
                        {worker.name}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* PIN Input View for Selected User */
          <form onSubmit={handlePinSubmit} className="space-y-5 animate-fadeIn">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-2xl text-white flex items-center justify-center font-black text-base shadow-sm ${
                  selectedUser.role === "ADMIN"
                    ? "bg-blue-600"
                    : selectedUser.plant === "한림공장"
                    ? "bg-emerald-600"
                    : "bg-amber-500"
                }`}>
                  {selectedUser.avatar || "관"}
                </div>
                <div>
                  <h4 className="font-black text-base text-slate-900 dark:text-white">
                    {selectedUser.name}
                  </h4>
                  <span className="text-[11px] font-bold text-slate-500">
                    {selectedUser.role === "ADMIN" ? "총괄 관리자 모드" : selectedUser.plant}
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
                <span>비밀번호(PIN) 입력 (기본: 1234)</span>
              </label>
              <input
                type="password"
                autoFocus
                placeholder="PIN 4자리 입력 (기본: 1234)"
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
              <span>{selectedUser.name} 으로 접속하기</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
