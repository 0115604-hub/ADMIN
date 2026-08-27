import React, { useState } from "react";
import { Lock, Mail, UserCheck, Sparkles, ArrowRight, Flame } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export const AuthModal = () => {
  const { loginWithGoogle, loginWithEmail, signupWithEmail, loginAsGuest } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);
    try {
      if (isSignUp) {
        await signupWithEmail(email, password);
      } else {
        await loginWithEmail(email, password);
      }
    } catch (err) {
      setErrorMsg(
        err.code === "auth/invalid-credential"
          ? "이메일 또는 비밀번호가 올바르지 않습니다."
          : err.code === "auth/email-already-in-use"
          ? "이미 등록된 이메일 주소입니다."
          : err.code === "auth/weak-password"
          ? "비밀번호는 최소 6자 이상이어야 합니다."
          : err.message
      );
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
      setErrorMsg("Google 로그인 중 오류가 발생했습니다: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden p-8">
        {/* Brand Icon */}
        <div className="flex justify-center mb-5">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-xl shadow-blue-500/30">
            <Flame className="w-8 h-8 text-orange-300" />
          </div>
        </div>

        <div className="text-center mb-6">
          <h3 className="text-2xl font-black text-slate-900 dark:text-white">
            PROFIT & LOSS
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Firebase 연동 손익 관리자 어드민 시스템
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs font-medium">
            {errorMsg}
          </div>
        )}

        {/* Google Login */}
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-200 text-sm font-semibold shadow-sm transition-all"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
            />
          </svg>
          <span>Google 계정으로 로그인</span>
        </button>

        <div className="my-5 flex items-center gap-3">
          <div className="flex-1 border-t border-slate-200 dark:border-slate-800"></div>
          <span className="text-[11px] font-bold uppercase text-slate-400">또는 이메일</span>
          <div className="flex-1 border-t border-slate-200 dark:border-slate-800"></div>
        </div>

        {/* Email Form */}
        <form onSubmit={handleEmailAuth} className="space-y-3.5">
          <div>
            <input
              type="email"
              required
              placeholder="이메일 주소 (admin@example.com)"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <input
              type="password"
              required
              placeholder="비밀번호"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm shadow-md shadow-blue-500/25 active:scale-95 transition-all"
          >
            {isSignUp ? "새 계정 생성" : "이메일 로그인"}
          </button>
        </form>

        <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-blue-600 dark:text-blue-400 font-semibold hover:underline"
          >
            {isSignUp ? "기존 계정으로 로그인" : "새로운 계정 등록하기"}
          </button>

          <button
            onClick={loginAsGuest}
            className="flex items-center gap-1 text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 font-semibold transition-colors"
          >
            <span>게스트 모드로 바로 체험</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
