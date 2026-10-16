import React, { useState } from "react";
import {
  X,
  FolderOpen,
  Globe,
  HardDrive,
  Copy,
  Check,
  ExternalLink,
  Lock,
  Eye,
  EyeOff,
  HelpCircle,
  FolderSync
} from "lucide-react";

export const SqSharedDocModal = ({ isOpen, onClose }) => {
  const [copiedField, setCopiedField] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  if (!isOpen) return null;

  const FTP_SERVER = "5604.ipdisk.co.kr";
  const FTP_PORT = "21915";
  const FTP_USER = "5604system";
  const FTP_PW = "oneTop@!";
  const WEB_URL = "http://5604.ipdisk.co.kr/";

  // 윈도우 탐색기 직접 붙여넣기용 주소 (Win + R 또는 파일탐색기 주소창)
  const EXPLORER_FTP_URL = `ftp://${FTP_USER}:${FTP_PW}@${FTP_SERVER}:${FTP_PORT}/`;
  // 브라우저 호출용 인코딩 주소
  const BROWSER_FTP_URL = `ftp://${FTP_USER}:${encodeURIComponent(FTP_PW)}@${FTP_SERVER}:${FTP_PORT}/`;

  const copyToClipboard = (text, fieldName) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2500);
  };

  const handleOpenWeb = () => {
    window.open(WEB_URL, "_blank", "noopener,noreferrer");
  };

  const handleOpenFtpApp = () => {
    window.location.href = BROWSER_FTP_URL;
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-3 sm:p-4 backdrop-blur-xs animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative max-w-xl w-full bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-scaleUp text-slate-800 dark:text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white flex items-center justify-between border-b border-indigo-500/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center shadow-inner">
              <FolderOpen className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2">
                <span>📁 SQ 공용문서함 바로가기</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-400/40">
                  ipDISK / FTP
                </span>
              </h3>
              <p className="text-xs text-indigo-200/80 mt-0.5">
                사내 ipDISK NAS 공용 서버에 저장된 SQ 심사 및 품질 표준 문서를 열람합니다.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Option 1: Web File Station (추천: 브라우저 새탭) */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-500/10 via-sky-500/5 to-transparent border-2 border-cyan-500/40 hover:border-cyan-500 transition-all shadow-xs group">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0 font-bold">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-black text-slate-900 dark:text-slate-100">
                      1. 웹 브라우저에서 즉시 열기 (추천)
                    </h4>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      가장 편리
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    크롬, 엣지, 스마트폰 브라우저에서 별도 프로그램 설치 없이 새 탭으로 접속하여 파일 열람 및 다운로드가 가능합니다.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-cyan-500/20 flex flex-wrap items-center justify-between gap-2">
              <span className="font-mono text-xs text-cyan-800 dark:text-cyan-300 font-semibold truncate">
                {WEB_URL}
              </span>
              <button
                type="button"
                onClick={handleOpenWeb}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-black text-xs flex items-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer"
              >
                <span>웹 문서함 새 탭에서 열기</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Option 2: Windows File Explorer (윈도우 탐색기) */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 shadow-xs">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                <HardDrive className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  2. 윈도우 파일 탐색기로 열기 (Win + R)
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  아래 주소를 복사하여 윈도우 파일 탐색기 주소창(또는 Win+R 실행창)에 붙여넣으면 일반 PC 폴더처럼 열립니다.
                </p>
              </div>
            </div>

            <div className="mt-2.5 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2">
              <span className="font-mono text-xs text-slate-700 dark:text-slate-300 truncate select-all">
                {EXPLORER_FTP_URL}
              </span>
              <button
                type="button"
                onClick={() => copyToClipboard(EXPLORER_FTP_URL, "explorer")}
                className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:hover:bg-indigo-900 dark:text-indigo-300 font-bold text-xs flex items-center gap-1 shrink-0 cursor-pointer transition-colors border border-indigo-200 dark:border-indigo-800"
              >
                {copiedField === "explorer" ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-emerald-600 dark:text-emerald-400 font-black">복사완료!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>주소 복사</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Option 3: Dedicated FTP Client */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 shadow-xs">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2.5">
                <FolderSync className="w-4 h-4 text-purple-500" />
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  3. FTP 전용 클라이언트 앱 (파일질라/알FTP)
                </h4>
              </div>
              <button
                type="button"
                onClick={handleOpenFtpApp}
                className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1 shrink-0 cursor-pointer transition-colors shadow-xs"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>FTP 연결 실행</span>
              </button>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
              PC에 FTP 기본 앱이 연결되어 있는 경우 버튼을 누르면 즉시 프로그램으로 연동됩니다.
            </p>

            {/* Connection Credentials Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-1">
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">아이디 (ID)</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{FTP_USER}</span>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(FTP_USER, "user")}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  title="아이디 복사"
                >
                  {copiedField === "user" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-1">
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">비밀번호 (PW)</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
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
                    className="p-1 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                    title="비밀번호 복사"
                  >
                    {copiedField === "pw" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Tip Box */}
          <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/60 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
            <HelpCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1 text-[11.5px]">
              <p className="font-bold">💡 윈도우 네트워크 드라이브 고정 팁:</p>
              <p className="text-amber-800 dark:text-amber-300">
                윈도우 탐색기에서 <b>[내 PC] ➔ 우클릭 ➔ [네트워크 위치 추가]</b>를 누른 후 위 주소를 한 번만 등록해 두시면, 언제든 내 컴퓨터의 로컬 드라이브처럼 클릭 한 번으로 공용문서함을 여실 수 있습니다.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-100 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
          <span className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">
            ipDISK 포트: {FTP_PORT}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold cursor-pointer transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};

export default SqSharedDocModal;
