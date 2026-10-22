import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  X,
  QrCode,
  Printer,
  Download,
  Copy,
  Check,
  ExternalLink,
  Smartphone,
  Sparkles,
  Info
} from "lucide-react";

export const MobileQrModal = ({ isOpen, onClose }) => {
  const [selectedTarget, setSelectedTarget] = useState("prod"); // 'prod' | 'test' | 'k5604'
  const [copied, setCopied] = useState(false);

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

  const targets = {
    prod: {
      title: "공식 본 서버 (운영용)",
      badge: "현장 작업자 권장",
      url: "https://profit-and-loss-7d09b.web.app",
      qrImg: "./qr_prod_web_app.png",
      desc: "현장 작업일보 등록, 연고무 입출고, SQ 현황 등 공식 운영 주소입니다."
    },
    test: {
      title: "단독 테스트 서버",
      badge: "테스트 / 개발용",
      url: "https://oryuk-2991a.web.app",
      qrImg: "./qr_test_web_app.png",
      desc: "본 서버와 분리되어 데이터 수정 충돌 없이 안전하게 테스트할 수 있는 주소입니다."
    },
    k5604: {
      title: "k5604.kr 본 서버",
      badge: "도메인 주소",
      url: "http://k5604.kr/",
      qrImg: "./qr_k5604_domain.png",
      desc: "(주)오륙 공식 대표 도메인 웹 서버 주소입니다."
    }
  };

  const current = targets[selectedTarget] || targets.prod;

  const handleCopyUrl = async () => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(current.url);
      } else {
        throw new Error("fallback");
      }
    } catch (e) {
      const ta = document.createElement("textarea");
      ta.value = current.url;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      try {
        document.execCommand("copy");
      } catch (err) {}
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-[99999] bg-black/80 flex items-center justify-center p-3 sm:p-4 backdrop-blur-sm animate-fadeIn print:static print:bg-white print:p-0 print:block"
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
    >
      <div
        className="relative max-w-lg w-full bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-scaleUp text-slate-800 dark:text-slate-100 print:shadow-none print:border-none print:max-w-none print:w-full print:bg-white print:text-black"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between border-b border-blue-500/30 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/20 border border-blue-400/40 flex items-center justify-center shadow-inner shrink-0">
              <QrCode className="w-5 h-5 text-blue-300" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2">
                <span>📱 모바일 접속 QR코드</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-400/40">
                  스마트폰 간편 접속
                </span>
              </h3>
              <p className="text-xs text-blue-200/80 mt-0.5">
                스마트폰 카메라로 QR코드를 비추면 주소 입력 없이 즉시 접속됩니다.
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

        {/* Server Target Tabs */}
        <div className="p-3 bg-slate-100 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700/60 flex items-center justify-center gap-1.5 print:hidden">
          <button
            type="button"
            onClick={() => setSelectedTarget("prod")}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
              selectedTarget === "prod"
                ? "bg-blue-600 text-white shadow-sm ring-2 ring-blue-400/30"
                : "text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-700"
            }`}
          >
            ⭐ 공식 본 서버
          </button>
          <button
            type="button"
            onClick={() => setSelectedTarget("test")}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
              selectedTarget === "test"
                ? "bg-purple-600 text-white shadow-sm ring-2 ring-purple-400/30"
                : "text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-700"
            }`}
          >
            🧪 단독 테스트 서버
          </button>
          <button
            type="button"
            onClick={() => setSelectedTarget("k5604")}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
              selectedTarget === "k5604"
                ? "bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-400/30"
                : "text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-700"
            }`}
          >
            🌐 k5604.kr
          </button>
        </div>

        {/* Modal Body / Printable Area */}
        <div className="p-5 flex flex-col items-center text-center space-y-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              <Sparkles className="w-3.5 h-3.5 text-blue-500" />
              <span>{current.title}</span>
              <span className="text-[10px] text-slate-400">• {current.badge}</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm pt-1">
              {current.desc}
            </p>
          </div>

          {/* High-Res QR Code Card */}
          <div className="relative p-4 rounded-3xl bg-white shadow-lg border-2 border-slate-200 dark:border-slate-700 flex flex-col items-center">
            <img
              src={current.qrImg}
              alt={`${current.title} QR Code`}
              className="w-56 h-56 sm:w-64 sm:h-64 object-contain rounded-xl"
            />
            <div className="mt-2.5 flex items-center gap-1.5 text-xs text-slate-600 font-bold">
              <Smartphone className="w-4 h-4 text-blue-600" />
              <span>스마트폰 기본 카메라로 비추세요</span>
            </div>
          </div>

          {/* URL Box & One-Click Copy */}
          <div className="w-full p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2 text-xs">
            <span className="font-mono text-xs text-blue-700 dark:text-blue-300 font-bold truncate pl-2 select-all">
              {current.url}
            </span>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleCopyUrl}
                className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center gap-1 transition-all cursor-pointer shadow-xs active:scale-95"
                title="URL 주소 복사"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-200" />
                    <span>복사완료!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>주소 복사</span>
                  </>
                )}
              </button>
              <a
                href={current.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                title="새 창에서 열기"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Notice Tip */}
          <div className="w-full p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-left text-[11px] text-amber-900 dark:text-amber-200 flex items-start gap-2">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-bold">현장 부착 및 공유 팁:</p>
              <p className="text-amber-800 dark:text-amber-300">
                아래 <b>[A4 인쇄]</b>를 눌러 출력 후 작업장 벽면, 게시판, 또는 설비 옆에 붙여두시면 작업자들이 언제든 카메라로 편리하게 접속할 수 있습니다.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer / Actions */}
        <div className="p-4 bg-slate-100 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs print:hidden">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-all active:scale-95"
              title="A4 포스터 인쇄하기"
            >
              <Printer className="w-4 h-4 text-slate-300" />
              <span>🖨️ A4 인쇄하기</span>
            </button>
            <a
              href={current.qrImg}
              download={`oryuk_${selectedTarget}_qr.png`}
              className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-700 hover:bg-slate-50 text-slate-700 dark:text-slate-200 font-bold border border-slate-300 dark:border-slate-600 flex items-center gap-1.5 cursor-pointer shadow-xs transition-all no-underline"
              title="QR 이미지 파일 다운로드"
            >
              <Download className="w-4 h-4" />
              <span>QR 다운로드</span>
            </a>
          </div>

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

export default MobileQrModal;
