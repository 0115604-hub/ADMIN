import React, { useState } from "react";
import {
  Lock,
  UserCheck,
  ShieldCheck,
  UploadCloud,
  ArrowRight,
  Building2,
  KeyRound,
  CheckCircle2,
  Sparkles,
  ChevronRight
} from "lucide-react";
import { useAuth, DESIGNATED_USERS } from "../context/AuthContext";

export const AuthModal = () => {
  const { loginWithProfile, loginWithGoogle, loginWithEmail } = useAuth();
  const [selectedUser, setSelectedUser] = useState(null);
  const [pin, setPin] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [showEmailTab, setShowEmailTab] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleProfileSelect = (user) => {
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

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);
    try {
      await loginWithEmail(email, password);
    } catch (err) {
      setErrorMsg("이메일 또는 비밀번호가 올바르지 않습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMsg("");
    setLoading(true);
    try {
      await loginWithGoogle();
    } catch (err) {
      setErrorMsg("Google 로그인 오류: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden p-6 sm:p-8 relative">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-xl shadow-blue-500/25 mb-3">
            <Building2 className="w-7 h-7" />
          </div>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            매입·매출 손익 관리 시스템
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            사용자 권한에 맞는 프로필을 선택하여 로그인해 주세요.
          </p>
        </div>

        {errorMsg && (
          <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2">
            <span>⚠️</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {!showEmailTab ? (
          /* Profile Selection Mode */
          <div className="space-y-4">
            {!selectedUser ? (
              <div className="space-y-2.5">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
                  접속자 프로필 선택
                </div>

                {DESIGNATED_USERS.map((user) => {
                  const isOp = user.role === "OPERATOR";
                  return (
                    <div
                      key={user.id}
                      onClick={() => handleProfileSelect(user)}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between group ${
                        isOp
                          ? "bg-amber-50/40 dark:bg-amber-950/20 border-amber-200/80 dark:border-amber-900/50 hover:border-amber-400 hover:shadow-md"
                          : "bg-blue-50/40 dark:bg-blue-950/20 border-blue-200/80 dark:border-blue-900/50 hover:border-blue-400 hover:shadow-md"
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <div
                          className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-base shadow-sm ${
                            isOp
                              ? "bg-amber-500 text-white shadow-amber-500/30"
                              : "bg-blue-600 text-white shadow-blue-500/30"
                          }`}
                        >
                          {user.avatar}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-extrabold text-base text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                              {user.name}
                            </h4>
                            <span
                              className={`text-[11px] font-extrabold px-2 py-0.5 rounded-full ${user.badgeColor}`}
                            >
                              {user.roleLabel}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {user.description}
                          </p>
                        </div>
                      </div>

                      <div className="p-2 rounded-xl text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 group-hover:translate-x-0.5 transition-all">
                        <ChevronRight className="w-5 h-5" />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* PIN Input View for Selected User */
              <form onSubmit={handlePinSubmit} className="space-y-4 animate-fadeIn">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-base">
                      {selectedUser.avatar}
                    </div>
                    <div>
                      <h4 className="font-black text-base text-slate-900 dark:text-white">
                        {selectedUser.name}
                      </h4>
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${selectedUser.badgeColor}`}>
                        {selectedUser.roleLabel}
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
                    placeholder="4자리 PIN 입력 (기본 1234)"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-base font-bold text-center tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 text-white font-black text-sm shadow-lg shadow-blue-500/25 active:scale-95 transition-all"
                >
                  {selectedUser.name} 님으로 접속하기 →
                </button>
              </form>
            )}

            {/* Switch to Email login */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
              <button
                onClick={() => setShowEmailTab(true)}
                className="text-xs font-semibold text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
              >
                이메일 계정 또는 Google로 로그인 →
              </button>
            </div>
          </div>
        ) : (
          /* Email / Google Login Mode */
          <div className="space-y-4 animate-fadeIn">
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-200 text-xs font-bold shadow-sm transition-all"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24z"/>
                <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
              </svg>
              <span>Google 계정으로 로그인</span>
            </button>

            <div className="flex items-center gap-3">
              <div className="flex-1 border-t border-slate-200 dark:border-slate-800"></div>
              <span className="text-[10px] font-bold text-slate-400">또는 이메일</span>
              <div className="flex-1 border-t border-slate-200 dark:border-slate-800"></div>
            </div>

            <form onSubmit={handleEmailAuth} className="space-y-3">
              <input
                type="email"
                required
                placeholder="이메일 (injoo@company.com / miyoung@...)"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="password"
                required
                placeholder="비밀번호"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md transition-all"
              >
                이메일 로그인
              </button>
            </form>

            <div className="pt-2 text-center">
              <button
                onClick={() => setShowEmailTab(false)}
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
              >
                ← 간편 프로필 선택 화면으로 돌아가기
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
