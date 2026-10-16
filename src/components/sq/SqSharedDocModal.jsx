import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  X,
  FolderOpen,
  Globe,
  Copy,
  Check,
  ExternalLink,
  Eye,
  EyeOff,
  Sparkles,
  ShieldCheck
} from "lucide-react";

export const SqSharedDocModal = ({ isOpen, onClose }) => {
  const [copiedField, setCopiedField] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;
  if (typeof document === "undefined") return null;

  const FTP_SERVER = "5604.ipdisk.co.kr";
  const FTP_USER = "5604system";
  const FTP_PW = "oneTop@!";
  // 관리페이지(mgmt) 대신 URL서비스(dirlist)가 자동 선택되고 username이 채워진 직접 접속 주소
  const DIRECT_LOGIN_URL = "http://5604.ipdisk.co.kr/login.cgi?access=dirlist&username=5604system";

  const copyToClipboard = async (text, fieldName) => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        throw new Error("No clipboard API");
      }
    } catch (err) {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      try {
        document.execCommand("copy");
      } catch (e) {}
      document.body.removeChild(textarea);
    }
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2500);
  };

  // URL서비스(dirlist)로 자동 로그인 폼 전송
  const handleAutoLogin = () => {
    const form = document.createElement("form");
    form.method = "POST";
    form.action = "http://5604.ipdisk.co.kr/login_handler.cgi";
    form.target = "_blank";

    const fields = {
      access: "dirlist", // 관리 페이지 말고 'URL서비스' 선택
      username: FTP_USER,
      password: FTP_PW,
      language: "kr_utf8",
      init_status: "0",
      captcha_on: "off",
      captcha_file: "",
      init_alert_msg: "",
      redirect_dirlogin: "0",
      relogin: "0",
      logout: "0",
      username_str: "",
      register_on: "off",
      my_url: "http://5604.ipdisk.co.kr/login.cgi"
    };

    Object.entries(fields).forEach(([key, val]) => {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = key;
      input.value = val;
      form.appendChild(input);
    });

    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-[99999] bg-black/80 flex items-center justify-center p-3 sm:p-4 backdrop-blur-sm animate-fadeIn"
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
    >
      <div
        className="relative max-w-lg w-full bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-scaleUp text-slate-800 dark:text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white flex items-center justify-between border-b border-indigo-500/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center shadow-inner shrink-0">
              <FolderOpen className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2">
                <span>📁 SQ 공용문서함 바로가기</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-400/40">
                  웹 브라우저
                </span>
              </h3>
              <p className="text-xs text-indigo-200/80 mt-0.5">
                ipDISK NAS 공용 서버의 SQ 및 품질 문서를 웹에서 즉시 열람합니다.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/15 transition-colors cursor-pointer"
            title="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: 웹 브라우저에서 즉시 열기 단일 옵션 */}
        <div className="p-5 space-y-4">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-500/10 via-sky-500/5 to-transparent border-2 border-cyan-500/50 shadow-xs">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0 font-bold">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100">
                      웹 브라우저에서 즉시 열기 (URL 서비스)
                    </h4>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      추천
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    관리 페이지 대신 <b>URL 서비스(공용 문서함)</b>로 자동 선택 및 로그인되어 파일 목록이 즉시 열립니다.
                  </p>
                </div>
              </div>
            </div>

            {/* 메인 자동 로그인 실행 버튼 */}
            <div className="mt-4 pt-4 border-t border-cyan-500/20 flex flex-col sm:flex-row gap-2.5">
              <button
                type="button"
                onClick={handleAutoLogin}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/30 transition-all active:scale-98 cursor-pointer"
                title="URL 서비스로 자동 로그인하여 새 창 열기"
              >
                <Sparkles className="w-4 h-4 text-cyan-200" />
                <span>⚡ URL 서비스 자동 로그인으로 열기</span>
                <ExternalLink className="w-4 h-4 text-cyan-100" />
              </button>
            </div>

            {/* Fallback Direct Link Button */}
            <div className="mt-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
              <span>수동 접속 링크:</span>
              <a
                href={DIRECT_LOGIN_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-600 dark:text-cyan-400 font-bold hover:underline flex items-center gap-1"
                title="URL서비스가 자동 선택된 로그인 페이지 열기"
              >
                <span>URL 서비스 기본 접속 페이지</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Connection Credentials Grid (ID / PW 복사) */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2.5">
            <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-300">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>ipDISK 접속 계정 정보</span>
              </span>
              <span className="text-[11px] text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/60 px-2 py-0.5 rounded-md border border-cyan-300/40">
                접속 모드: URL 서비스
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              {/* ID Box */}
              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-1">
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">아이디 (ID)</span>
                  <span className="font-mono font-black text-slate-900 dark:text-slate-100">{FTP_USER}</span>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(FTP_USER, "user")}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                  title="아이디 복사"
                >
                  {copiedField === "user" ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              {/* PW Box */}
              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-1">
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">비밀번호 (PW)</span>
                  <span className="font-mono font-black text-slate-900 dark:text-slate-100">
                    {showPassword ? FTP_PW : "••••••••"}
                  </span>
                </div>
                <div className="flex items-center gap-0.5">
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                    title={showPassword ? "비번 숨기기" : "비번 보기"}
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(FTP_PW, "pw")}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                    title="비밀번호 복사"
                  >
                    {copiedField === "pw" ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-100 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
          <span className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">
            서버: {FTP_SERVER}
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="px-5 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold cursor-pointer transition-colors shadow-sm active:scale-95"
          >
            창 닫기
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default SqSharedDocModal;
