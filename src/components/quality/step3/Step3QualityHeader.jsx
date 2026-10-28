import React from "react";
import { ShieldAlert, Layers, UserCheck } from "lucide-react";

export const Step3QualityHeader = ({
  managerName,
  activeTab,
  setActiveTab,
  stats,
  customTitle,
  hideSubtitle = true,
  themeObj
}) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
      <div className="flex items-center gap-2.5">
        <div className={`p-2 rounded-xl bg-gradient-to-tr ${themeObj?.iconGradient || "from-indigo-600 to-rose-600"} text-white shadow-md shrink-0`}>
          <ShieldAlert className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5">
              <span>{customTitle || "📋 이창엽의 4M 정식대장"}</span>
            </h3>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${themeObj?.accentBadge || "bg-rose-500 text-white shadow-xs border border-rose-400/40"}`}>
              {managerName ? `${managerName} 책임 전용` : "품질관리자 전용"}
            </span>
          </div>
          {!hideSubtitle && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5 flex-wrap">
              <span>담당: <strong className="text-indigo-600 dark:text-indigo-400 font-black">{managerName} 책임</strong> (품질보증팀)</span>
              <span>•</span>
              <span>4M 변동점 결재라인: 이창엽 책임(상신) ➔ 이명재 이사(검토) ➔ 권태형 대표이사(최종승인)</span>
            </p>
          )}
        </div>
      </div>

      {/* Real-time KPI Counters */}
      <div className="flex items-center gap-2 flex-wrap text-xs font-bold">
        <button
          type="button"
          onClick={() => setActiveTab("INCOMING")}
          className={`px-3 py-1.5 rounded-xl border transition flex items-center gap-1.5 cursor-pointer ${
            activeTab === "INCOMING"
              ? "bg-amber-500 text-black border-amber-600 shadow-md font-black"
              : "bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800/60 hover:bg-amber-100"
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
          <span>이관 접수</span>
          <span className="font-mono font-black text-sm">{stats.incomingCount}건</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("4M_LEDGER")}
          className={`px-3 py-1.5 rounded-xl border transition flex items-center gap-1.5 cursor-pointer ${
            activeTab === "4M_LEDGER"
              ? "bg-indigo-600 text-white border-indigo-700 shadow-md font-black"
              : "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800/60 hover:bg-indigo-100"
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>4M 대장</span>
          <span className="font-mono font-black text-sm">{stats.officialCount}건</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("PENDING_APPROVAL")}
          className={`px-3 py-1.5 rounded-xl border transition flex items-center gap-1.5 cursor-pointer ${
            activeTab === "PENDING_APPROVAL"
              ? "bg-purple-600 text-white border-purple-700 shadow-md font-black"
              : "bg-purple-50 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300 border-purple-300 dark:border-purple-800/60 hover:bg-purple-100"
          }`}
        >
          <UserCheck className="w-3.5 h-3.5" />
          <span>경영진 승인대기</span>
          <span className="font-mono font-black text-sm">{stats.pendingApprovalCount}건</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("ALL")}
          className={`px-3 py-1.5 rounded-xl border transition flex items-center gap-1 cursor-pointer ${
            activeTab === "ALL"
              ? "bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900 font-black"
              : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700"
          }`}
        >
          <span>전체보기</span>
        </button>
      </div>
    </div>
  );
};

export default Step3QualityHeader;
