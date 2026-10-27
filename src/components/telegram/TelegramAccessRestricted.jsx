import React from "react";
import { Lock } from "lucide-react";

export const TelegramAccessRestricted = () => {
  return (
    <div className="p-8 max-w-xl mx-auto my-12 bg-white dark:bg-slate-900 rounded-3xl border border-rose-200 dark:border-rose-900/50 text-center space-y-4 shadow-xl animate-fadeIn">
      <div className="w-16 h-16 rounded-3xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto shadow-inner">
        <Lock className="w-8 h-8" />
      </div>
      <h3 className="text-lg font-black text-slate-900 dark:text-white">
        접근 권한이 제한되었습니다
      </h3>
      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
        텔레그램 연동 관리(telegram) 메뉴는 <strong>관리자(Admin)</strong> 전용 설정입니다.<br />
        일반 작업자 계정으로는 접근할 수 없습니다.
      </p>
    </div>
  );
};
