import React from "react";
import {
  FileSignature,
  Crown,
  ArrowLeft,
  Clock,
  PauseCircle,
  CheckCircle2,
  XCircle,
  FileText,
  Layers,
  ShieldCheck,
  Search
} from "lucide-react";

export const ApprovalKPIHeader = ({
  isAdmin,
  stats,
  selectedTab,
  setSelectedTab,
  docCategoryFilter,
  setDocCategoryFilter,
  selectedPlant,
  setSelectedPlant,
  searchQuery,
  setSearchQuery,
  onNavigateTab,
  onBack,
  handleOpenDraftModal,
  handleBatchApprovePending
}) => {
  return (
    <>
      {/* 1. Header Title & Quick Action Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-3 sm:p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-600 text-white shadow-md shadow-emerald-500/20 shrink-0">
              <FileSignature className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                  (주)오륙 스마트 전자결재 목록 현황
                </h1>
                {isAdmin && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-slate-950 flex items-center gap-1 shadow-xs">
                    <Crown className="w-3 h-3" />
                    <span>대표 결재 권한 활성</span>
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                담당(전작업자) ➔ 책임(직급별) ➔ 이사(이명재 / 한림공장: 최미영 전무) ➔ 대표(대표이사) 자동결재선 적용
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => {
                const returnTab = sessionStorage.getItem("approval_return_to_tab") || localStorage.getItem("approval_return_to_tab");
                sessionStorage.removeItem("approval_return_to_tab");
                localStorage.removeItem("approval_return_to_tab");
                if (typeof onNavigateTab === "function") {
                  onNavigateTab(returnTab || "worker_dashboard");
                } else if (typeof onBack === "function") {
                  onBack();
                }
              }}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 shrink-0 cursor-pointer border border-slate-300 dark:border-slate-700 transition shadow-2xs"
              title="전 화면(대시보드)으로 돌아가기"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>전 화면으로 돌아가기</span>
            </button>
            {isAdmin && stats.pending > 0 && (
              <button
                type="button"
                onClick={handleBatchApprovePending}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black text-xs shadow-md shadow-amber-500/25 active:scale-95 transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
                title="미결 문서 전체를 대표이사 최종 결재(전결)로 일괄 승인"
              >
                <Crown className="w-3.5 h-3.5" />
                <span>대표 최종 승인 ({stats.pending}건 일괄 결재)</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleOpenDraftModal}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs shadow-md shadow-emerald-500/25 active:scale-95 transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
            >
              <span>새 결재 기안서 작성</span>
            </button>
          </div>
        </div>

        {/* 5 KPI Summary Status Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 sm:gap-2">
          {/* 1. 미결 결재함 (삼분할 뱃지: 일반결재 / 4M변동점 / 특근보고서) */}
          <div
            onClick={() => {
              setSelectedTab("PENDING");
              setDocCategoryFilter("ALL");
              setSelectedPlant("ALL");
            }}
            className={`p-1.5 sm:p-2 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
              selectedTab === "PENDING" && docCategoryFilter === "ALL"
                ? "bg-rose-100 dark:bg-rose-950/60 border-rose-500 ring-2 ring-rose-500/40 shadow-xs"
                : "border-rose-300/80 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20 hover:bg-rose-100/60"
            }`}
          >
            <div className="flex items-center justify-between text-[11px] font-bold text-rose-600 dark:text-rose-400 mb-1 px-0.5">
              <span className="flex items-center gap-1 font-black">
                <Clock className="w-3.5 h-3.5" />
                <span>{isAdmin ? "대표 결재 대기" : "내 결재 대기"}</span>
              </span>
              <div className="flex items-center gap-1.5">
                <span className={`font-mono font-black text-xs ${stats.pending > 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                  {stats.pending}건
                </span>
                {stats.companyInProgress > 0 && (
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedTab("COMPANY_IN_PROGRESS");
                      setDocCategoryFilter("ALL");
                      setSelectedPlant("ALL");
                    }}
                    className="text-[9.5px] font-bold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white font-mono bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 cursor-pointer shadow-2xs hover:border-slate-400 transition-all"
                    title="클릭하여 전사 미결(진행중) 목록 전체 보기"
                  >
                    전사 {stats.companyInProgress}
                  </span>
                )}
              </div>
            </div>

            {/* 삼분할 뱃지 */}
            <div className="grid grid-cols-3 gap-1" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => {
                  setSelectedTab("PENDING");
                  setDocCategoryFilter("GENERAL");
                  setSelectedPlant("ALL");
                }}
                className={`py-1 px-0.5 rounded-lg border text-center transition-all cursor-pointer ${
                  selectedTab === "PENDING" && docCategoryFilter === "GENERAL"
                    ? "bg-teal-600 text-white border-teal-600 shadow-xs"
                    : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                }`}
              >
                <span className="block text-[9.5px] font-bold truncate">일반결재</span>
                <span className={`block text-xs font-black font-mono ${
                  selectedTab === "PENDING" && docCategoryFilter === "GENERAL" ? "text-white" : "text-teal-600 dark:text-teal-400"
                }`}>
                  {stats.generalPending}건
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedTab("PENDING");
                  setDocCategoryFilter("FOUR_M");
                  setSelectedPlant("ALL");
                }}
                className={`py-1 px-0.5 rounded-lg border text-center transition-all cursor-pointer ${
                  selectedTab === "PENDING" && docCategoryFilter === "FOUR_M"
                    ? "bg-rose-600 text-white border-rose-600 shadow-xs"
                    : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                }`}
              >
                <span className="block text-[9.5px] font-bold truncate">4M변동점</span>
                <span className={`block text-xs font-black font-mono ${
                  selectedTab === "PENDING" && docCategoryFilter === "FOUR_M" ? "text-white" : "text-rose-600 dark:text-rose-400"
                }`}>
                  {stats.fourMPending}건
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedTab("PENDING");
                  setDocCategoryFilter("OVERTIME");
                  setSelectedPlant("ALL");
                }}
                className={`py-1 px-0.5 rounded-lg border text-center transition-all cursor-pointer ${
                  selectedTab === "PENDING" && docCategoryFilter === "OVERTIME"
                    ? "bg-purple-600 text-white border-purple-600 shadow-xs"
                    : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                }`}
              >
                <span className="block text-[9.5px] font-bold truncate">특근보고서</span>
                <span className={`block text-xs font-black font-mono ${
                  selectedTab === "PENDING" && docCategoryFilter === "OVERTIME" ? "text-white" : "text-purple-600 dark:text-purple-400"
                }`}>
                  {stats.overtimePending}건
                </span>
              </button>
            </div>
          </div>

          {/* 2. 보류 문서 */}
          <div
            onClick={() => {
              setSelectedTab("HOLD");
              setDocCategoryFilter("ALL");
            }}
            className={`p-2 sm:p-2.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
              selectedTab === "HOLD" && docCategoryFilter === "ALL"
                ? "bg-amber-50 dark:bg-amber-950/40 border-amber-400 dark:border-amber-700 ring-2 ring-amber-500/30 shadow-xs"
                : "bg-slate-50/70 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800 hover:bg-slate-100"
            }`}
          >
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                <PauseCircle className="w-3.5 h-3.5" />
                <span>보류 문서</span>
              </span>
            </div>
            <div className="text-base sm:text-lg font-black text-amber-600 dark:text-amber-400 mt-0.5 font-mono">
              {stats.hold}건
            </div>
          </div>

          {/* 3. 승인 완료 */}
          <div
            onClick={() => {
              setSelectedTab("APPROVED");
              setDocCategoryFilter("ALL");
            }}
            className={`p-2 sm:p-2.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
              selectedTab === "APPROVED" && docCategoryFilter === "ALL"
                ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 dark:border-emerald-700 ring-2 ring-emerald-500/30 shadow-xs"
                : "bg-slate-50/70 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800 hover:bg-slate-100"
            }`}
          >
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>승인 완료</span>
              </span>
            </div>
            <div className="text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400 mt-0.5 font-mono">
              {stats.approved}건
            </div>
          </div>

          {/* 4. 반려 문서 */}
          <div
            onClick={() => {
              setSelectedTab("REJECTED");
              setDocCategoryFilter("ALL");
            }}
            className={`p-2 sm:p-2.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
              selectedTab === "REJECTED" && docCategoryFilter === "ALL"
                ? "bg-slate-200 dark:bg-slate-700 border-slate-400 ring-2 ring-slate-500/30 shadow-xs"
                : "bg-slate-50/70 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800 hover:bg-slate-100"
            }`}
          >
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span className="font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                <XCircle className="w-3.5 h-3.5" />
                <span>반려 문서</span>
              </span>
            </div>
            <div className="text-base sm:text-lg font-black text-slate-700 dark:text-slate-300 mt-0.5 font-mono">
              {stats.rejected}건
            </div>
          </div>

          {/* 5. 전체 문서 */}
          <div
            onClick={() => {
              setSelectedTab("ALL");
              setDocCategoryFilter("ALL");
            }}
            className={`p-2 sm:p-2.5 rounded-xl border transition-all cursor-pointer col-span-2 sm:col-span-1 flex flex-col justify-between ${
              selectedTab === "ALL" && docCategoryFilter === "ALL"
                ? "bg-blue-50 dark:bg-blue-950/40 border-blue-400 dark:border-blue-700 ring-2 ring-blue-500/30 shadow-xs"
                : "bg-slate-50/70 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800 hover:bg-slate-100"
            }`}
          >
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span className="font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5" />
                <span>전체 문서</span>
              </span>
            </div>
            <div className="text-base sm:text-lg font-black text-blue-600 dark:text-blue-400 mt-0.5 font-mono">
              {stats.total}건
            </div>
          </div>
        </div>
      </div>

      {/* 2. Category Switcher Tabs & Plant/Search Filters */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-2.5 sm:p-3 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-2.5">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800/80 overflow-x-auto">
          <button
            type="button"
            onClick={() => setDocCategoryFilter("ALL")}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
              docCategoryFilter === "ALL"
                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>전체 결재서류</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10.5px] font-mono font-black bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              {stats.total}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setDocCategoryFilter("FOUR_M")}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
              docCategoryFilter === "FOUR_M"
                ? "bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-rose-600"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>🛡️ 4M변동점</span>
            {stats.fourMPending > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white">
                미결 {stats.fourMPending}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setDocCategoryFilter("GENERAL")}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
              docCategoryFilter === "GENERAL"
                ? "bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-teal-600"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>📄 일반결재</span>
            {stats.generalPending > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-teal-500 text-white">
                미결 {stats.generalPending}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setDocCategoryFilter("OVERTIME")}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
              docCategoryFilter === "OVERTIME"
                ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-purple-600"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>🌙 특근보고서</span>
            {stats.overtimePending > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-purple-500 text-white">
                미결 {stats.overtimePending}
              </span>
            )}
          </button>
        </div>

        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <div className="flex items-center gap-1 p-0.5 bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
            {["ALL", "삼랑진공장", "한림공장"].map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setSelectedPlant(p)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedPlant === p
                    ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs font-black"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {p === "ALL" ? "전체공장" : p === "삼랑진공장" ? "삼랑진" : "한림"}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="문서명/기안자 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1 text-xs rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:border-cyan-400 w-36 sm:w-44 font-bold"
            />
          </div>
        </div>
      </div>

      {/* 3. Status Filter Tabs Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-2 sm:p-2.5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center overflow-x-auto">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full">
          {[
            { id: "ALL", label: `전체 (${stats.total})` },
            {
              id: "PENDING",
              label: stats.pending > 0
                ? `🔴 ${isAdmin ? "대표 결재 대기" : "내 결재 대기"} (${stats.pending})`
                : `${isAdmin ? "대표 결재 대기" : "내 결재 대기"} (0)`,
              highlight: stats.pending > 0
            },
            { id: "COMPANY_IN_PROGRESS", label: `📋 전사 미결 (${stats.companyInProgress})`, inProgressLight: stats.companyInProgress > 0 },
            { id: "APPROVED", label: `✓ 승인완료 (${stats.approved})` },
            { id: "MY_DRAFTS", label: `내 기안함 (${stats.myDrafts})` },
            { id: "HOLD", label: `⏸️ 보류 (${stats.hold})`, holdLight: stats.hold > 0 },
            { id: "REJECTED", label: `✕ 반려 (${stats.rejected})` }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setSelectedTab(tab.id);
                if (tab.id === "PENDING" || tab.id === "COMPANY_IN_PROGRESS") {
                  setSelectedPlant("ALL");
                }
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all shrink-0 active:scale-95 cursor-pointer ${
                selectedTab === tab.id
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-xs"
                  : tab.highlight
                  ? "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300"
                  : tab.inProgressLight
                  ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800"
                  : tab.holdLight
                  ? "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </>
  );
};
