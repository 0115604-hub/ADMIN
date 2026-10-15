import React from "react";
import { AlertTriangle, RefreshCw, Home, RotateCcw, Copy, Check } from "lucide-react";
import { OryukLogo } from "./OryukLogo";
import { db } from "../firebase";
import { collection, addDoc } from "firebase/firestore";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null, copied: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    if (!this.state.errorInfo) {
      this.setState({ errorInfo });
    }

    // Safely record error details to Firestore for live diagnosis
    try {
      let userProfile = null;
      try {
        const saved = localStorage.getItem("admin_user_profile");
        if (saved) userProfile = JSON.parse(saved);
      } catch (e) {}

      const errorPayload = {
        title: this.props.title || "Global System Error",
        message: String(error?.message || error || "Unknown Error"),
        stack: String(error?.stack || "").slice(0, 2000),
        componentStack: String(errorInfo?.componentStack || "").slice(0, 2000),
        url: typeof window !== "undefined" ? window.location.href : "",
        userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
        isMobile: typeof navigator !== "undefined" ? /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) : false,
        userName: userProfile?.name || "미로그인",
        userId: userProfile?.id || "-",
        plant: userProfile?.plant || "-",
        role: userProfile?.role || "-",
        timestamp: new Date().toISOString()
      };

      addDoc(collection(db, "system_runtime_errors"), errorPayload).catch((err) => {
        console.warn("Failed to log error to Firestore:", err);
      });
    } catch (e) {
      console.warn("ErrorBoundary report failed:", e);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  handleClearCacheAndReload = () => {
    try {
      localStorage.removeItem("admin_user_profile");
      localStorage.removeItem("admin_selected_month_v4");
      localStorage.removeItem("admin_multi_month_store_v4_firestore");
    } catch (e) {
      console.warn("Storage clear error:", e);
    }
    this.setState({ hasError: false, error: null });
    window.location.href = window.location.origin + window.location.pathname;
  };

  handleCopyError = () => {
    const errorDetails = `[오륙 시스템 오류 보고]\n메뉴: ${this.props.title || "전체 시스템"}\n내용: ${this.state.error?.message || this.state.error}\n스택:\n${this.state.error?.stack || ""}\n컴포넌트:\n${this.state.errorInfo?.componentStack || ""}`;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(errorDetails);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = errorDetails;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 3000);
    } catch (e) {
      console.warn("Copy error failed:", e);
    }
  };

  render() {
    if (this.state.hasError) {
      // 1. Inline / Sectional Error Display (Specific Tab or Modal)
      if (this.props.inline || this.props.title) {
        return (
          <div className="p-4 sm:p-6 my-3 sm:my-4 bg-slate-900/95 border border-slate-700/80 rounded-2xl text-slate-100 shadow-xl flex flex-col items-center text-center">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center mb-2.5">
              <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <h3 className="font-bold text-sm sm:text-base text-white mb-1">
              {this.props.title ? `${this.props.title} 화면 일시 오류` : "화면 표시 일시 오류"}
            </h3>
            <p className="text-xs text-slate-400 max-w-md mb-3.5">
              해당 메뉴를 불러오는 도중 일시적인 문제가 감지되었습니다. 아래 버튼을 눌러 다시 시도해 주세요.
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              <button
                type="button"
                onClick={this.handleReset}
                className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>해당 메뉴 다시 불러오기</span>
              </button>
              <button
                type="button"
                onClick={this.handleReload}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>전체 새로고침</span>
              </button>
              <button
                type="button"
                onClick={this.handleCopyError}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer border border-amber-500/30"
              >
                {this.state.copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{this.state.copied ? "오류 복사됨" : "오류 내용 복사"}</span>
              </button>
              <button
                type="button"
                onClick={this.handleClearCacheAndReload}
                className="px-3 py-2 rounded-xl bg-rose-950/80 hover:bg-rose-900 text-rose-300 font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer border border-rose-800/50"
              >
                <Home className="w-3.5 h-3.5" />
                <span>로그인 화면으로</span>
              </button>
            </div>
            {this.state.error && (
              <div className="mt-3.5 text-left w-full max-w-lg">
                <div className="text-[11px] font-bold text-slate-400 mb-1">오류 상세 내용:</div>
                <pre className="p-2.5 rounded-xl bg-slate-950 text-[10.5px] text-rose-400 overflow-x-auto font-mono border border-rose-900/50 whitespace-pre-wrap max-h-40">
                  {String(this.state.error?.message || this.state.error)}
                  {this.state.error?.stack && `\n\n${this.state.error.stack}`}
                </pre>
              </div>
            )}
          </div>
        );
      }

      // 2. Full-Page Global Error Fallback
      return (
        <div className="min-h-screen w-full flex items-center justify-center bg-slate-900 text-slate-100 p-4">
          <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-3xl p-6 sm:p-8 shadow-2xl text-center flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-700/60 p-2.5 mb-4 border border-slate-600 flex items-center justify-center">
              <OryukLogo className="w-10 h-10 drop-shadow-md" />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold mb-3">
              <AlertTriangle className="w-4 h-4" />
              <span>화면 표시 중 일시적인 오류 감지</span>
            </div>

            <h2 className="text-xl font-black text-white mb-2">
              시스템 안전 보호 모드
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mb-5 leading-relaxed">
              화면을 안전하게 복구할 수 있습니다. 아래 버튼을 눌러 다시 불러오기를 실행해 주세요.
            </p>

            <div className="flex flex-col sm:flex-row gap-2.5 w-full">
              <button
                type="button"
                onClick={this.handleReload}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-sm shadow-lg shadow-blue-500/30 transition-all cursor-pointer active:scale-95"
              >
                <RefreshCw className="w-4 h-4" />
                <span>화면 다시 불러오기</span>
              </button>
              <button
                type="button"
                onClick={this.handleClearCacheAndReload}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold text-sm transition-all cursor-pointer active:scale-95"
              >
                <Home className="w-4 h-4" />
                <span>첫 화면으로 이동</span>
              </button>
            </div>

            <div className="mt-3 w-full">
              <button
                type="button"
                onClick={this.handleCopyError}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-950 text-amber-300 text-xs font-bold border border-amber-500/30 transition-all active:scale-95 cursor-pointer"
              >
                {this.state.copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{this.state.copied ? "오류 내용이 클립보드에 복사되었습니다" : "오류 내용 복사하여 공유하기"}</span>
              </button>
            </div>

            {this.state.error && (
              <details open className="mt-5 text-left w-full">
                <summary className="text-[11px] text-slate-400 font-bold cursor-pointer hover:text-slate-300 mb-1">
                  오류 내용 및 상세 스택 (디버깅)
                </summary>
                <pre className="mt-1 p-2.5 rounded-lg bg-slate-950 text-[10px] text-rose-400 overflow-x-auto font-mono max-h-48 border border-rose-900/50 whitespace-pre-wrap">
                  {String(this.state.error?.stack || this.state.error?.message || this.state.error)}
                  {this.state.errorInfo?.componentStack && `\n\nComponent Stack:\n${this.state.errorInfo.componentStack}`}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
