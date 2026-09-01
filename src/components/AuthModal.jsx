import React, { useState } from "react";
import {
  Building2,
  KeyRound,
  ChevronRight,
  Shield,
  Factory,
  ArrowRight,
  QrCode,
  X,
  Sparkles,
  Crown,
  Lock,
  ArrowLeft,
  Smartphone,
  Cpu
} from "lucide-react";
import { useAuth, ADMIN_USERS, PLANTS } from "../context/AuthContext";
import {
  getAnnualLeaves,
  subscribeAnnualLeaves,
  getUserLeaveStatus
} from "../services/annualLeaveService";

export const AuthModal = () => {
  const { loginWithProfile } = useAuth();
  const [selectedUser, setSelectedUser] = useState(null);
  const [pin, setPin] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [annualLeaves, setAnnualLeaves] = useState(() => getAnnualLeaves());

  // Real-time Cloud Synchronization for Annual Leaves
  useEffect(() => {
    const unsub = subscribeAnnualLeaves((leaves) => {
      setAnnualLeaves(leaves);
    });
    return () => unsub();
  }, []);

  const handleUserClick = (user) => {
    setSelectedUser(user);
    setPin("");
    setErrorMsg("");
  };

  const handlePinSubmit = (e) => {
    e.preventDefault();
    if (!selectedUser) {
      setErrorMsg("작업자를 먼저 선택해 주세요.");
      return;
    }
    if (!pin) {
      setErrorMsg("비밀번호(PIN)를 입력해 주세요.");
      return;
    }
    setErrorMsg("");
    setLoading(true);
    try {
      loginWithProfile(selectedUser.id, pin);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-xl animate-fadeIn overflow-y-auto">
      {/* Background Ambient Glow Orbs */}
      <div className="absolute w-96 h-96 -top-20 -left-20 bg-blue-600/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute w-96 h-96 -bottom-20 -right-20 bg-amber-500/15 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute w-80 h-80 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Main Container Card with Glassmorphism */}
      <div className="bg-white/95 dark:bg-slate-900/90 w-full max-w-xl rounded-3xl shadow-[0_25px_70px_-15px_rgba(0,0,0,0.5)] border border-slate-200/80 dark:border-slate-800 backdrop-blur-2xl overflow-hidden my-6 relative animate-scaleUp">
        {/* Top Glowing Accent Line */}
        <div className="h-1.5 w-full bg-gradient-to-r from-amber-500 via-blue-600 to-emerald-500"></div>

        <div className="p-5 sm:p-7">
          {/* Header Brand */}
          <div className="text-center mb-5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200/60 dark:border-blue-800/80 text-blue-600 dark:text-blue-400 text-[11px] font-black mb-2 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>ORYUK SMART MES PORTAL</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center justify-center gap-2">
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-amber-500 bg-clip-text text-transparent">
                (주)오륙
              </span>
              <span>생산관리 통합시스템</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
              작업자 또는 관리자를 선택하여 안전하게 접속해 주세요.
            </p>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-2 animate-shake">
              <span className="p-1 rounded-full bg-rose-200 dark:bg-rose-800 text-rose-800 dark:text-rose-200 text-[10px] font-black">!</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {!selectedUser ? (
            <div className="space-y-4">
              {/* ========================================================================= */}
              {/* 1. FACTORY 1: 삼랑진공장 */}
              {/* ========================================================================= */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800/80 space-y-2.5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-black text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                    <div className="p-1 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400">
                      <Factory className="w-3.5 h-3.5" />
                    </div>
                    <span className="tracking-wide">삼랑진공장</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                    {PLANTS[0].workers.length}명
                  </span>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {PLANTS[0].workers.map((worker) => {
                    const isChief = worker.name === "이명재" || worker.assignedProcess === "총괄관리";
                    const isPartner = worker.isPartner || worker.title === "협력업체";
                    const leaveStatus = getUserLeaveStatus(worker.id, worker.name, annualLeaves);
                    const isOnLeave = leaveStatus?.status === "ACTIVE";

                    return (
                      <button
                        key={worker.id}
                        onClick={() => handleUserClick(worker)}
                        className={`p-2.5 sm:p-3 rounded-xl border transition-all flex flex-col items-center justify-center gap-1 group cursor-pointer shadow-sm hover:shadow-md hover:-translate-y-0.5 active:scale-95 text-center min-h-[74px] ${
                          isOnLeave
                            ? "bg-rose-50/90 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 ring-2 ring-rose-400/40 hover:border-rose-500"
                            : isChief
                            ? "bg-gradient-to-b from-amber-50/90 to-amber-100/50 dark:from-amber-950/40 dark:to-amber-900/30 border-amber-300 dark:border-amber-700/80 hover:border-amber-500 ring-1 ring-amber-400/20"
                            : isPartner
                            ? "bg-white dark:bg-slate-800/80 border-purple-200 dark:border-purple-800/60 hover:border-purple-400 hover:bg-purple-50/30 dark:hover:bg-purple-950/20"
                            : "bg-white dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-700/80 hover:border-amber-400 hover:bg-amber-50/30 dark:hover:bg-amber-950/20"
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shadow-sm transition-transform group-hover:scale-105 ${
                          isOnLeave
                            ? "bg-gradient-to-tr from-rose-500 to-rose-600 text-white"
                            : isChief
                            ? "bg-gradient-to-tr from-amber-500 to-amber-600 text-slate-950 ring-2 ring-amber-400/50"
                            : isPartner
                            ? "bg-gradient-to-tr from-purple-600 to-indigo-600 text-white"
                            : "bg-gradient-to-tr from-slate-700 to-slate-800 dark:from-slate-600 dark:to-slate-700 text-white"
                        }`}>
                          {isOnLeave ? "🌴" : worker.avatar}
                        </div>
                        <span className="font-black text-xs text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 truncate w-full">
                          {worker.name}
                        </span>

                        {/* Leave Status & Role Badges */}
                        {leaveStatus?.status === "ACTIVE" ? (
                          <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-rose-500 text-white shadow-xs flex items-center gap-0.5 animate-pulse">
                            <span>연차사용중</span>
                          </span>
                        ) : leaveStatus?.status === "SCHEDULED" ? (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                            {leaveStatus.label}
                          </span>
                        ) : isChief ? (
                          <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-amber-500 text-slate-950 shadow-sm flex items-center gap-0.5">
                            <Crown className="w-2.5 h-2.5" />
                            <span>총괄관리</span>
                          </span>
                        ) : isPartner ? (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300">
                            협력업체
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ========================================================================= */}
              {/* 2. FACTORY 2: 한림공장 */}
              {/* ========================================================================= */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800/80 space-y-2.5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <div className="p-1 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                      <Factory className="w-3.5 h-3.5" />
                    </div>
                    <span className="tracking-wide">한림공장</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                    {PLANTS[1].workers.length}명
                  </span>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {PLANTS[1].workers.map((worker) => {
                    const isChief = worker.name === "김동욱" || worker.assignedProcess === "총괄관리";
                    const isPartner = worker.isPartner || worker.title === "협력업체";
                    const leaveStatus = getUserLeaveStatus(worker.id, worker.name, annualLeaves);
                    const isOnLeave = leaveStatus?.status === "ACTIVE";

                    return (
                      <button
                        key={worker.id}
                        onClick={() => handleUserClick(worker)}
                        className={`p-2.5 sm:p-3 rounded-xl border transition-all flex flex-col items-center justify-center gap-1 group cursor-pointer shadow-sm hover:shadow-md hover:-translate-y-0.5 active:scale-95 text-center min-h-[74px] ${
                          isOnLeave
                            ? "bg-rose-50/90 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 ring-2 ring-rose-400/40 hover:border-rose-500"
                            : isChief
                            ? "bg-gradient-to-b from-emerald-50/90 to-emerald-100/50 dark:from-emerald-950/40 dark:to-emerald-900/30 border-emerald-300 dark:border-emerald-700/80 hover:border-emerald-500 ring-1 ring-emerald-400/20"
                            : isPartner
                            ? "bg-white dark:bg-slate-800/80 border-purple-200 dark:border-purple-800/60 hover:border-purple-400 hover:bg-purple-50/30 dark:hover:bg-purple-950/20"
                            : "bg-white dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-700/80 hover:border-emerald-400 hover:bg-emerald-50/30 dark:hover:bg-emerald-950/20"
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shadow-sm transition-transform group-hover:scale-105 ${
                          isOnLeave
                            ? "bg-gradient-to-tr from-rose-500 to-rose-600 text-white"
                            : isChief
                            ? "bg-gradient-to-tr from-emerald-500 to-emerald-600 text-white ring-2 ring-emerald-400/50"
                            : isPartner
                            ? "bg-gradient-to-tr from-purple-600 to-indigo-600 text-white"
                            : "bg-gradient-to-tr from-slate-700 to-slate-800 dark:from-slate-600 dark:to-slate-700 text-white"
                        }`}>
                          {isOnLeave ? "🌴" : worker.avatar}
                        </div>
                        <span className="font-black text-xs text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 truncate w-full">
                          {worker.name}
                        </span>

                        {/* Leave Status & Role Badges */}
                        {leaveStatus?.status === "ACTIVE" ? (
                          <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-rose-500 text-white shadow-xs flex items-center gap-0.5 animate-pulse">
                            <span>연차사용중</span>
                          </span>
                        ) : leaveStatus?.status === "SCHEDULED" ? (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                            {leaveStatus.label}
                          </span>
                        ) : isChief ? (
                          <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-emerald-600 text-white shadow-sm flex items-center gap-0.5">
                            <Crown className="w-2.5 h-2.5" />
                            <span>총괄관리</span>
                          </span>
                        ) : isPartner ? (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300">
                            협력업체
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ========================================================================= */}
              {/* 3. BOTTOM ACTIONS: Mobile QR & ADMIN */}
              {/* ========================================================================= */}
              <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowQr(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-blue-200 dark:border-blue-800/80 bg-blue-50/80 dark:bg-blue-950/40 hover:bg-blue-100 text-blue-700 dark:text-blue-300 text-xs font-black transition-all shadow-sm group active:scale-95"
                >
                  <Smartphone className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>스마트폰 QR 접속</span>
                </button>

                {ADMIN_USERS.map((admin) => (
                  <button
                    key={admin.id}
                    onClick={() => handleUserClick(admin)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-black transition-all shadow-sm group active:scale-95"
                  >
                    <Shield className="w-3.5 h-3.5 text-indigo-500" />
                    <span>ADMIN 관리자</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                ))}
              </div>
            </div>
          ) : showQr ? (
            /* ========================================================================= */
            /* Mobile QR Code View */
            /* ========================================================================= */
            <div className="space-y-4 text-center animate-fadeIn py-2">
              <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xl inline-block">
                <img
                  src="/oryuk_app_qr.png"
                  alt="(주)오륙 모바일 접속 QR코드"
                  className="w-44 h-44 mx-auto object-contain"
                />
              </div>
              <div>
                <h4 className="font-black text-base text-slate-900 dark:text-white">
                  스마트폰 카메라로 스캔하세요
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  현장 작업자 및 임직원 누구나 QR코드를 비추면 즉시 접속됩니다.
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-mono text-slate-600 dark:text-slate-300 break-all select-all font-bold">
                https://profit-and-loss-7d09b.web.app
              </div>
              <button
                type="button"
                onClick={() => setShowQr(false)}
                className="w-full py-3 rounded-xl bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white font-black text-xs shadow-md active:scale-95 transition-all"
              >
                ← 사용자 선택으로 돌아가기
              </button>
            </div>
          ) : (
            /* ========================================================================= */
            /* PIN Input Form View */
            /* ========================================================================= */
            <form onSubmit={handlePinSubmit} className="space-y-4 animate-fadeIn">
              {/* Hero Spotlight Profile Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-50 to-blue-50/30 dark:from-slate-800/80 dark:to-blue-950/30 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-2xl text-white flex items-center justify-center font-black text-lg shadow-md ${
                    selectedUser.role === "ADMIN"
                      ? "bg-slate-800 ring-2 ring-indigo-500/40"
                      : selectedUser.plant === "한림공장"
                      ? "bg-emerald-600 ring-2 ring-emerald-400/40"
                      : "bg-amber-500 ring-2 ring-amber-400/40"
                  }`}>
                    {selectedUser.avatar}
                  </div>
                  <div>
                    <h4 className="font-black text-lg text-slate-900 dark:text-white">
                      {selectedUser.name}
                    </h4>
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                      {selectedUser.role === "ADMIN" ? "최고 관리자 모드" : `${selectedUser.plant} • ${selectedUser.title || "작업자"}`}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedUser(null)}
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-bold hover:underline"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>변경</span>
                </button>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-blue-500" />
                  <span>
                    {selectedUser.role === "ADMIN"
                      ? "관리자 비밀번호 입력"
                      : "비밀번호(PIN) 입력"}
                  </span>
                </label>
                <input
                  type="password"
                  autoFocus
                  placeholder={
                    selectedUser.role === "ADMIN"
                      ? "관리자 비밀번호"
                      : "비밀번호 입력"
                  }
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-lg font-black text-center tracking-widest focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-black text-sm shadow-xl shadow-indigo-500/25 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <span>시스템 접속</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
