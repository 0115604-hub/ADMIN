import React from "react";
import { AlertTriangle, RefreshCw, Home, RotateCcw } from "lucide-react";
import { OryukLogo } from "./OryukLogo";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
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

  render() {
    if (this.state.hasError) {
      // 1. Inline / Sectional Error Display (Specific Tab or Modal)
      if (this.props.inline || this.props.title) {
        return (
          <div className="p-6 my-4 bg-slate-900/90 border border-slate-700/80 rounded-2xl text-slate-100 shadow-xl flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-white mb-1">
              {this.props.title ? `${this.props.title} 화면 일시 오류` : "화면 표시 일시 오류"}
            </h3>
            <p className="text-xs text-slate-400 max-w-md mb-4">
              해당 메뉴를 불러오는 도중 일시적인 문제가 감지되었습니다. 아래 버튼을 눌러 다시 시도해 주세요.
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              <button
                onClick={this.handleReset}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>해당 메뉴 다시 불러오기</span>
              </button>
              <button
                onClick={this.handleReload}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>전체 새로고침</span>
              </button>
              <button
                onClick={() => {
                  try {
                    localStorage.removeItem("factory_extrusion_active_subtab");
                    localStorage.removeItem("factory_extrusion_selected_line");
                    localStorage.removeItem("factory_extrusion_selected_week");
                  } catch (e) {}
                  this.handleReload();
                }}
                className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
              >
                <span>압출 캐시 초기화</span>
              </button>
            </div>
            {this.state.error && (
              <div className="mt-4 text-left w-full max-w-lg">
                <div className="text-[11px] font-bold text-slate-400 mb-1">오류 상세 내용:</div>
                <pre className="p-2.5 rounded-xl bg-slate-950 text-[11px] text-rose-400 overflow-x-auto font-mono border border-rose-900/50">
                  {String(this.state.error?.message || this.state.error)}
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
            <p className="text-xs sm:text-sm text-slate-400 mb-6 leading-relaxed">
              화면을 안전하게 복구할 수 있습니다. 아래 버튼을 눌러 다시 불러오기를 실행해 주세요.
            </p>

            <div className="flex flex-col sm:flex-row gap-2.5 w-full">
              <button
                onClick={this.handleReload}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-sm shadow-lg shadow-blue-500/30 transition-all cursor-pointer active:scale-95"
              >
                <RefreshCw className="w-4 h-4" />
                <span>화면 다시 불러오기</span>
              </button>
              <button
                onClick={this.handleClearCacheAndReload}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold text-sm transition-all cursor-pointer active:scale-95"
              >
                <Home className="w-4 h-4" />
                <span>첫 화면으로 이동</span>
              </button>
            </div>

            {this.state.error && (
              <details className="mt-6 text-left w-full">
                <summary className="text-[11px] text-slate-500 cursor-pointer hover:text-slate-400">
                  오류 내용 확인
                </summary>
                <pre className="mt-2 p-2.5 rounded-lg bg-slate-950 text-[10px] text-rose-400 overflow-x-auto font-mono max-h-32">
                  {String(this.state.error?.message || this.state.error)}
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
