import React from "react";
import {
  Filter,
  Factory,
  CalendarDays,
  Search,
  FileText,
  Plus,
  Edit3,
  Trash2
} from "lucide-react";

export const OvertimeReportsTab = ({
  legacyReports = [],
  isWeekendByDate,
  reportListFilter,
  setReportListFilter,
  cleanCompanyName,
  reportListSearch,
  setReportListSearch,
  getReportDateSortKey,
  dateSortOrder,
  setDateSortOrder,
  COMPANIES = [],
  setActiveTab,
  formatShortMonthDay,
  getPlantForCompany,
  renderPlantBadge,
  renderCompanyBadge,
  handleOpenLegacyReport,
  handleEditReport,
  handleDeleteReport
}) => {
  const baseList = (legacyReports || []).filter(
    (r) => r && !r.isSynthesized && isWeekendByDate(r.workDate || r.title)
  );

  const filtered = baseList.filter((r) => {
    if (reportListFilter && reportListFilter !== "전체") {
      const rComp = cleanCompanyName(r.company || "");
      const fComp = cleanCompanyName(reportListFilter);
      if (rComp !== fComp) return false;
    }
    if (reportListSearch.trim()) {
      const q = reportListSearch.toLowerCase().trim();
      const matchText = [
        r.title,
        r.workDate,
        r.workDateFormatted,
        r.author,
        r.plant,
        r.company,
        ...(Array.isArray(r.reasons) ? r.reasons.map((rs) => (typeof rs === "string" ? rs : rs.text || "")) : [])
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!matchText.includes(q)) return false;
    }
    return true;
  });

  const sortedFiltered = [...filtered].sort((a, b) => {
    const dateA = getReportDateSortKey(a);
    const dateB = getReportDateSortKey(b);
    if (dateSortOrder === "ASC") {
      if (dateA !== dateB) return dateA.localeCompare(dateB);
    } else {
      if (dateB !== dateA) return dateB.localeCompare(dateA);
    }

    const orderA = COMPANIES.indexOf(cleanCompanyName(a.company));
    const orderB = COMPANIES.indexOf(cleanCompanyName(b.company));
    return (orderA === -1 ? 99 : orderA) - (orderB === -1 ? 99 : orderB);
  });

  // 날짜별 그룹화
  const dateGroups = [];
  const dateGroupMap = new Map();

  sortedFiltered.forEach((report) => {
    const dateKey = getReportDateSortKey(report);
    if (!dateGroupMap.has(dateKey)) {
      const groupObj = {
        dateKey,
        workDate: report.workDate || report.workDateFormatted || report.title,
        reports: []
      };
      dateGroupMap.set(dateKey, groupObj);
      dateGroups.push(groupObj);
    }
    dateGroupMap.get(dateKey).reports.push(report);
  });

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-3 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
      <div className="space-y-3">
        {/* 🧭 5개사 개별 필터 & 날짜정렬 & 검색창 */}
        <div className="p-2 sm:p-2.5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
          {/* Left: 5개사 개별 필터 버튼군 */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-slate-400 mr-0.5 flex items-center gap-1 shrink-0">
              <Filter className="w-3.5 h-3.5 text-cyan-400" />
              <span>5개사 개별 특근보고서:</span>
            </span>

            {/* 전체 버튼 추가 */}
            <button
              type="button"
              onClick={() => setReportListFilter("전체")}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                reportListFilter === "전체"
                  ? "bg-cyan-500 text-slate-950 font-black border-cyan-400 shadow-xs"
                  : "bg-slate-900 text-slate-300 border-slate-700 hover:text-white hover:bg-slate-800"
              }`}
            >
              전체
            </button>

            {/* 삼랑진 그룹 */}
            <div className="flex items-center gap-1 p-0.5 bg-slate-900 border border-amber-700/60 rounded-xl">
              <span className="px-2 py-0.5 rounded-lg bg-amber-950 text-amber-300 font-black text-xs border border-amber-700/60 flex items-center gap-1">
                <Factory className="w-3 h-3 text-amber-400" />
                <span>삼랑진</span>
              </span>
              {["오륙", "유성"].map((comp) => (
                <button
                  key={comp}
                  type="button"
                  onClick={() => setReportListFilter(comp)}
                  className={`px-2.5 py-0.5 rounded-lg text-[11.5px] font-bold transition-all cursor-pointer ${
                    reportListFilter === comp
                      ? "bg-amber-400 text-slate-950 font-black shadow-xs"
                      : "text-slate-300 hover:text-white hover:bg-slate-800"
                  }`}
                >
                  {comp}
                </button>
              ))}
            </div>

            {/* 한림 그룹 */}
            <div className="flex items-center gap-1 p-0.5 bg-slate-900 border border-emerald-700/60 rounded-xl">
              <span className="px-2 py-0.5 rounded-lg bg-emerald-950 text-emerald-300 font-black text-xs border border-emerald-700/60 flex items-center gap-1">
                <Factory className="w-3 h-3 text-emerald-400" />
                <span>한림</span>
              </span>
              {["조영", "한울", "부림텍"].map((comp) => (
                <button
                  key={comp}
                  type="button"
                  onClick={() => setReportListFilter(comp)}
                  className={`px-2.5 py-0.5 rounded-lg text-[11.5px] font-bold transition-all cursor-pointer ${
                    reportListFilter === comp
                      ? "bg-emerald-400 text-slate-950 font-black shadow-xs"
                      : "text-slate-300 hover:text-white hover:bg-slate-800"
                  }`}
                >
                  {comp}
                </button>
              ))}
            </div>
          </div>

          {/* Right: 날짜 정렬 버튼 + 검색창 */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <button
              type="button"
              onClick={() => setDateSortOrder((prev) => (prev === "ASC" ? "DESC" : "ASC"))}
              className="px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-700 text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shrink-0 active:scale-95 shadow-xs"
              title="날짜순서 정렬 전환"
            >
              <CalendarDays className="w-3.5 h-3.5 text-cyan-400" />
              <span>{dateSortOrder === "DESC" ? "📅 가까운 날순 (최신순) ▼" : "📅 과거순 (1일→30일) ▲"}</span>
            </button>

            <div className="relative w-full sm:w-52 shrink-0">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="특근보고서 검색 (일자/업체)..."
                value={reportListSearch}
                onChange={(e) => setReportListSearch(e.target.value)}
                className="w-full pl-7 pr-2.5 py-1 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-medium placeholder:text-slate-500 focus:border-purple-400 outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* 📋 5개사 개별 특근보고서 목록 */}
        {sortedFiltered.length === 0 ? (
          <div className="p-12 rounded-3xl bg-slate-950 border border-slate-800 text-center space-y-4">
            <FileText className="w-12 h-12 text-slate-600 mx-auto animate-pulse" />
            <div className="space-y-1">
              <h4 className="font-black text-base text-white">등록된 [{reportListFilter}] 개별 특근보고서가 없습니다</h4>
              <p className="text-xs text-slate-400">
                평일 근태는 작성자 전결로 처리되며, 특근일(주말/공휴일)에만 5개사 개별 특근보고서가 상신됩니다.
              </p>
            </div>
            <button
              onClick={() => setActiveTab("daily_input")}
              className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-black text-xs inline-flex items-center gap-2 cursor-pointer shadow-lg active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>특근 등록하러 가기</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {dateGroups.map((group, gIdx) => {
              const sampleDateStr = group.workDate;
              const formattedDate = formatShortMonthDay(sampleDateStr);

              return (
                <div
                  key={group.dateKey || gIdx}
                  className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-2 sm:p-2.5 rounded-xl bg-slate-950 border border-slate-800/90 shadow-xs"
                >
                  {/* 📅 Left: 특근 일자 뱃지 */}
                  <div className="shrink-0 flex items-center justify-start sm:justify-center">
                    <span className="px-2 py-1 rounded-lg text-xs font-mono font-black border tracking-tight flex items-center gap-1.5 shrink-0 bg-rose-950/80 text-rose-300 border-rose-700/80 shadow-2xs">
                      <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-rose-400" />
                      <span>{formattedDate}</span>
                    </span>
                  </div>

                  {/* 📋 Right: 개별 특근보고서 목록 */}
                  <div className="flex-1 min-w-0 space-y-1">
                    {group.reports.map((report, rIdx) => {
                      const companyName = cleanCompanyName(report.company || "오륙");
                      const plantName = getPlantForCompany(companyName);
                      const cost = report.cost || (report.totalHours ? report.totalHours * 15000 : 0);
                      const workersCount = report.totalWorkers || (report.items ? report.items.length : 0);

                      return (
                        <div
                          key={report.id || rIdx}
                          onClick={() => handleOpenLegacyReport(report)}
                          className="px-2.5 py-1.5 rounded-lg transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2 group cursor-pointer border border-slate-800 bg-slate-900/60 hover:border-rose-500/60 hover:bg-slate-900"
                        >
                          {/* Left: 특근보고서 뱃지 + 공장 뱃지 + 회사 뱃지 */}
                          <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap min-w-0">
                            <span className="px-2 py-0.5 rounded-md text-[11px] font-black shrink-0 border bg-rose-950 text-rose-300 border-rose-600/80">
                              특근보고서 (개별)
                            </span>
                            {renderPlantBadge(plantName)}
                            {renderCompanyBadge(companyName)}
                          </div>

                          {/* Right: 금액 + 수정/삭제 버튼 */}
                          <div
                            className="flex items-center gap-2 shrink-0 justify-between sm:justify-end"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <span className="text-xs font-mono font-black text-white shrink-0 tracking-tight">
                              ₩{cost.toLocaleString()} <span className="text-[10.5px] text-slate-400 font-normal">({workersCount}명)</span>
                            </span>

                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleEditReport(report)}
                                className="px-1.5 py-0.5 rounded-md bg-slate-800 hover:bg-cyan-950 text-slate-300 hover:text-cyan-300 border border-slate-700 hover:border-cyan-500 font-bold text-[10.5px] flex items-center gap-0.5 cursor-pointer active:scale-95 transition-all shadow-2xs"
                                title="해당 일자 및 업체 특근 수정 화면으로 이동"
                              >
                                <Edit3 className="w-2.5 h-2.5 text-cyan-400" />
                                <span>수정</span>
                              </button>
                              <button
                                type="button"
                                onClick={(e) => handleDeleteReport(report, e)}
                                className="px-1.5 py-0.5 rounded-md bg-slate-800 hover:bg-rose-950 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-600 font-bold text-[10.5px] flex items-center gap-0.5 cursor-pointer active:scale-95 transition-all shadow-2xs"
                                title="특근보고서 삭제"
                              >
                                <Trash2 className="w-2.5 h-2.5 text-rose-400" />
                                <span>삭제</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
