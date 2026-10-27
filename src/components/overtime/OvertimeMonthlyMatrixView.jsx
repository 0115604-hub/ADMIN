import React from "react";
import {
  Calendar,
  CalendarDays,
  ChevronDown,
  Factory,
  Download,
  Users,
  UserCheck,
  Zap,
  Sparkles,
  BarChart3,
  Eye,
  Clock
} from "lucide-react";

export const OvertimeMonthlyMatrixView = ({
  matrixViewMonth,
  setMatrixViewMonth,
  selectedMonth,
  prevYearMonth,
  currentMonthNum,
  currentYear,
  prevMonthNum,
  prevYear,
  smartData,
  prevMonthData,
  matrixCustomMonthData,
  getLocalSmartOvertimeData,
  lastSelectedPastMonth,
  setLastSelectedPastMonth,
  personnelCardsMap = {},
  getWorkerPersonnelCard,
  normalizeDept,
  matrixCompanyFilter,
  setMatrixCompanyFilter,
  COMPANIES = [],
  cleanCompanyName,
  matrixDaysInMonth,
  matrixYear,
  matrixMonthNum,
  calculateWorkerMonthlyTotals,
  pastMonthDropdownRef,
  isPastMonthDropdownOpen,
  setIsPastMonthDropdownOpen,
  triggerToast,
  handleExportExcel,
  selectedDay,
  setSelectedDay,
  getKoreanHolidayInfo,
  getMatrixDayLabel,
  COMPANY_THEMES,
  handleOpenPersonnelCard,
  isMatrixWeekendDay,
  setIsDayUnlockedForEdit,
  setActiveTab,
  calculateWorkerDailyHours
}) => {
  const isCurrentMonth = matrixViewMonth === (selectedMonth || "2026-10");
  const isPrevMonth = !isCurrentMonth;
  const activeDataset = isCurrentMonth
    ? (smartData || getLocalSmartOvertimeData(selectedMonth || "2026-10"))
    : matrixViewMonth === (prevYearMonth || "2026-09")
    ? (prevMonthData || getLocalSmartOvertimeData(prevYearMonth || "2026-09"))
    : (matrixCustomMonthData || getLocalSmartOvertimeData(matrixViewMonth));

  // 드롭다운에 표시할 월 목록 생성
  const selectablePastMonths = [];
  for (let m = currentMonthNum - 1; m >= 1; m--) {
    const ym = `${currentYear}-${String(m).padStart(2, "0")}`;
    selectablePastMonths.push({
      ym,
      year: currentYear,
      month: m,
      label: m === prevMonthNum ? `${currentYear}년 ${m}월 (지난달 실적)` : `${currentYear}년 ${m}월 (${m}월 실적)`
    });
  }
  if (selectablePastMonths.length === 0) {
    selectablePastMonths.push({
      ym: prevYearMonth || "2026-09",
      year: prevYear,
      month: prevMonthNum,
      label: `${prevYear}년 ${prevMonthNum}월 (지난달 실적)`
    });
  }

  const displayedPastMonthStr = isPrevMonth ? matrixViewMonth : (lastSelectedPastMonth || prevYearMonth || "2026-09");
  const [dispPastYear, dispPastMonthNum] = displayedPastMonthStr.split("-").map(Number);
  const displayedPastLabel = dispPastMonthNum === prevMonthNum
    ? `${dispPastYear || currentYear}년 ${dispPastMonthNum || prevMonthNum}월 (지난달 실적)`
    : `${dispPastYear || currentYear}년 ${dispPastMonthNum}월 (${dispPastMonthNum}월 실적)`;

  const compCounters = {};
  const matrixWithCompanyNo = (activeDataset.attendanceMatrix || []).map((w, originalIdx) => {
    const c = cleanCompanyName(w.company);
    compCounters[c] = (compCounters[c] || 0) + 1;
    const cardKey = `${c}_${w.name}`;
    const savedCard = personnelCardsMap[cardKey] || personnelCardsMap[`${w.company}_${w.name}`] || w.personnelCard;
    const card = savedCard
      ? getWorkerPersonnelCard({ ...w, personnelCard: savedCard }, compCounters[c])
      : getWorkerPersonnelCard(w, compCounters[c]);
    return {
      ...w,
      dept: card.dept || normalizeDept(w.dept),
      position: card.position || w.position || "사원",
      companyNo: compCounters[c],
      originalMatrixIndex: originalIdx,
      personnelCard: card,
      card
    };
  });

  const filteredMatrixList = matrixWithCompanyNo.filter((w) => {
    if (matrixCompanyFilter !== "전체" && cleanCompanyName(w.company) !== cleanCompanyName(matrixCompanyFilter)) return false;
    return true;
  }).sort((a, b) => {
    const orderA = COMPANIES.indexOf(cleanCompanyName(a.company));
    const orderB = COMPANIES.indexOf(cleanCompanyName(b.company));
    const compDiff = (orderA === -1 ? 99 : orderA) - (orderB === -1 ? 99 : orderB);
    if (compDiff !== 0) return compDiff;
    return (a.companyNo || 0) - (b.companyNo || 0);
  });

  // Calculate aggregated metrics
  let sumWorkDays = 0;
  let sumWeekdayOt = 0;
  let sumWeekendOt = 0;
  let sumTotalHours = 0;

  filteredMatrixList.forEach((w) => {
    const t = calculateWorkerMonthlyTotals(w, matrixDaysInMonth);
    sumWorkDays += t.workDays;
    sumWeekdayOt += t.weekdayOtHours;
    sumWeekendOt += t.weekendOtHours;
    sumTotalHours += t.totalHours;
  });

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden space-y-4 p-4 sm:p-5">
      {/* 🌟 월 선택 퀵 배너 & 타이틀 바 */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-purple-500/20 text-purple-600 dark:text-purple-300 ring-1 ring-purple-400/40">
              <CalendarDays className="w-5 h-5 text-purple-500" />
            </span>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-white">
                  {matrixYear}년 {matrixMonthNum}월 근태 및 특근·잔업 종합현황 대장
                </h3>
                <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold border ${
                  isPrevMonth
                    ? "bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-800"
                    : "bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800"
                }`}>
                  {isPrevMonth
                    ? `🗓️ ${matrixMonthNum}월 (${matrixMonthNum === prevMonthNum ? "지난달 마감 실적" : "월간 마감 실적"})`
                    : `⚡ ${matrixMonthNum}월 (당월 실시간)`}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {isPrevMonth
                  ? `${matrixYear}년 ${matrixMonthNum}월 [${matrixCompanyFilter}] 독립 근태 모듈의 출근, 평일잔업, 주말특근, 총공수 실적 대장입니다. (총 ${matrixDaysInMonth}일)`
                  : `당월(${currentYear}년 ${currentMonthNum}월) [${matrixCompanyFilter}] 독립 근태 모듈의 실시간 근태 및 투입공수 현황입니다. (총 ${matrixDaysInMonth}일)`}
              </p>
            </div>
          </div>
        </div>

        {/* 🗓️ 월 전환 컨트롤 바 */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-xl border border-slate-700 shadow-inner">
            {/* 1. 지난달/과거월 실적 월 선택 드롭다운 */}
            <div className="relative" ref={pastMonthDropdownRef}>
              <button
                type="button"
                onClick={() => setIsPastMonthDropdownOpen((prev) => !prev)}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                  isPrevMonth
                    ? "bg-purple-600 text-white shadow-md ring-1 ring-purple-300 font-black"
                    : "text-slate-300 hover:text-white hover:bg-slate-800 font-bold"
                }`}
                title="클릭하여 조회할 월(지난달 및 과거월 실적)을 드롭다운에서 선택하세요"
              >
                <Calendar className={`w-3.5 h-3.5 ${isPrevMonth ? "text-purple-200" : "text-purple-400"}`} />
                <span>🗓️ {displayedPastLabel}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-950 text-purple-200 border border-purple-700/60 font-bold">
                  마감
                </span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-150 ${isPastMonthDropdownOpen ? "rotate-180 text-white" : "text-purple-300"}`} />
              </button>

              {isPastMonthDropdownOpen && (
                <div className="absolute left-0 mt-1.5 w-64 rounded-xl bg-slate-900 border-2 border-purple-500/70 shadow-2xl py-1.5 z-50 divide-y divide-slate-800/80">
                  <div className="px-3 py-1 text-[10px] font-black text-purple-300 uppercase tracking-wider flex items-center justify-between">
                    <span>📅 월별 실적 대장 선택</span>
                    <span className="text-slate-400">{currentYear}년</span>
                  </div>
                  <div className="max-h-64 overflow-y-auto py-1">
                    {selectablePastMonths.map((item) => {
                      const isSelected = matrixViewMonth === item.ym;
                      return (
                        <button
                          key={item.ym}
                          type="button"
                          onClick={() => {
                            setLastSelectedPastMonth(item.ym);
                            setMatrixViewMonth(item.ym);
                            setIsPastMonthDropdownOpen(false);
                            triggerToast(`📅 ${item.year}년 ${item.month}월 종합현황 대장으로 전환되었습니다.`);
                          }}
                          className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between transition-colors cursor-pointer ${
                            isSelected
                              ? "bg-purple-600/30 text-white font-black"
                              : "text-slate-300 hover:bg-slate-800 hover:text-white font-bold"
                          }`}
                        >
                          <span className="flex items-center gap-1.5">
                            <span>🗓️</span>
                            <span>{item.label}</span>
                          </span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold border ${
                            isSelected
                              ? "bg-purple-600 text-white border-purple-400"
                              : "bg-purple-950/90 text-purple-300 border-purple-800"
                          }`}>
                            마감
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* 2. 로그인 당월 대장 */}
            <button
              type="button"
              onClick={() => {
                setIsPastMonthDropdownOpen(false);
                setMatrixViewMonth(selectedMonth || "2026-10");
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                isCurrentMonth
                  ? "bg-indigo-600 text-white shadow-md ring-1 ring-indigo-300 font-black"
                  : "text-slate-400 hover:text-white hover:bg-slate-800 font-bold"
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-indigo-300" />
              <span>🗓️ {currentYear}년 {currentMonthNum}월 (당월 대장)</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-200 border border-indigo-700/60 font-bold">진행</span>
            </button>
          </div>

          {/* Company Dropdown Select */}
          <div className="flex items-center gap-1.5">
            <select
              value={matrixCompanyFilter}
              onChange={(e) => setMatrixCompanyFilter(e.target.value)}
              className="bg-slate-950 text-white font-black text-xs sm:text-sm border-2 border-indigo-400 focus:border-indigo-300 rounded-xl px-3 py-1.5 cursor-pointer shadow-sm"
            >
              <optgroup label="🏭 삼랑진공장" className="bg-slate-950 text-amber-300 font-bold">
                <option value="오륙" className="bg-slate-900 text-white font-bold">오륙</option>
                <option value="유성" className="bg-slate-900 text-white font-bold">유성</option>
              </optgroup>
              <optgroup label="🏭 한림공장" className="bg-slate-950 text-emerald-300 font-bold">
                <option value="조영" className="bg-slate-900 text-white font-bold">조영</option>
                <option value="한울" className="bg-slate-900 text-white font-bold">한울</option>
                <option value="부림텍" className="bg-slate-900 text-white font-bold">부림텍</option>
              </optgroup>
            </select>
          </div>
        </div>
      </div>

      {/* Company Quick Filter Pills & Download */}
      <div className="flex items-center justify-between gap-2 flex-wrap pb-1">
        <div className="flex items-center gap-2 flex-wrap">
          {/* 삼랑진 그룹 */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-950 border border-amber-500/60 rounded-xl shadow-2xs">
            <span className="text-xs font-black text-amber-600 dark:text-amber-400 px-2 flex items-center gap-1">
              <Factory className="w-3.5 h-3.5" />
              <span>삼랑진:</span>
            </span>
            {["오륙", "유성"].map((comp) => (
              <button
                key={comp}
                type="button"
                onClick={() => setMatrixCompanyFilter(comp)}
                className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  matrixCompanyFilter === comp
                    ? "bg-amber-500 text-slate-950 shadow-sm ring-1 ring-amber-300"
                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800"
                }`}
              >
                {comp}
              </button>
            ))}
          </div>

          {/* 한림 그룹 */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-950 border border-emerald-500/60 rounded-xl shadow-2xs">
            <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 px-2 flex items-center gap-1">
              <Factory className="w-3.5 h-3.5" />
              <span>한림:</span>
            </span>
            {["조영", "한울", "부림텍"].map((comp) => (
              <button
                key={comp}
                type="button"
                onClick={() => setMatrixCompanyFilter(comp)}
                className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  matrixCompanyFilter === comp
                    ? "bg-emerald-500 text-slate-950 shadow-sm ring-1 ring-emerald-300"
                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800"
                }`}
              >
                {comp}
              </button>
            ))}
          </div>
        </div>

        {/* 엑셀 다운로드 버튼 */}
        <button
          type="button"
          onClick={handleExportExcel}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-md transition-all cursor-pointer active:scale-95"
        >
          <Download className="w-3.5 h-3.5" />
          <span>{matrixMonthNum}월 대장 엑셀 다운로드</span>
        </button>
      </div>

      {/* KPI 요약 카드 바 */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs">
        <div className="bg-slate-900/95 dark:bg-slate-950 p-3 rounded-2xl border-l-4 border-l-indigo-500 border border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 block font-bold">조회 대상 인원</span>
            <span className="font-mono font-black text-base sm:text-lg text-white">
              {filteredMatrixList.length}<span className="text-xs font-bold text-indigo-400 ml-0.5">명</span>
            </span>
          </div>
          <Users className="w-5 h-5 text-indigo-400/80" />
        </div>
        <div className="bg-slate-900/95 dark:bg-slate-950 p-3 rounded-2xl border-l-4 border-l-emerald-500 border border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 block font-bold">{matrixMonthNum}월 총 출근일수</span>
            <span className="font-mono font-black text-base sm:text-lg text-emerald-400">
              {sumWorkDays.toLocaleString()}<span className="text-xs font-bold text-emerald-300 ml-0.5">일</span>
            </span>
          </div>
          <UserCheck className="w-5 h-5 text-emerald-400/80" />
        </div>
        <div className="bg-slate-900/95 dark:bg-slate-950 p-3 rounded-2xl border-l-4 border-l-amber-500 border border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 block font-bold">평일 잔업 누계</span>
            <span className="font-mono font-black text-base sm:text-lg text-amber-400">
              +{sumWeekdayOt.toLocaleString()}<span className="text-xs font-bold text-amber-300 ml-0.5">H</span>
            </span>
          </div>
          <Zap className="w-5 h-5 text-amber-400/80" />
        </div>
        <div className="bg-slate-900/95 dark:bg-slate-950 p-3 rounded-2xl border-l-4 border-l-purple-500 border border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 block font-bold">주말/휴일 특근 누계</span>
            <span className="font-mono font-black text-base sm:text-lg text-purple-400">
              {sumWeekendOt.toLocaleString()}<span className="text-xs font-bold text-purple-300 ml-0.5">H</span>
            </span>
          </div>
          <Sparkles className="w-5 h-5 text-purple-400/80" />
        </div>
        <div className="bg-slate-900/95 dark:bg-slate-950 p-3 rounded-2xl border-l-4 border-l-cyan-400 border border-slate-800 shadow-sm col-span-2 sm:col-span-1 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 block font-bold">총 투입공수 (M/H)</span>
            <span className="font-mono font-black text-base sm:text-lg text-cyan-300">
              {sumTotalHours.toLocaleString()}<span className="text-xs font-bold text-cyan-400 ml-0.5">H</span>
            </span>
          </div>
          <BarChart3 className="w-5 h-5 text-cyan-400/80" />
        </div>
      </div>

      {/* 근태 기호 컬러 범례 바 */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-[11px]">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-black text-slate-300 mr-1 flex items-center gap-1">
            <Eye className="w-3.5 h-3.5 text-cyan-400" />
            <span>근태 범례:</span>
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 font-black">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span> 정시출근(8H)
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/25 text-amber-200 border border-amber-400/60 font-black">
            <span>19</span> <span className="text-amber-300/90 font-normal">잔업(+2H)</span>
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-orange-500/25 text-orange-200 border border-orange-400/60 font-black">
            <span>21</span> <span className="text-orange-300/90 font-normal">잔업(+4H)</span>
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-500/25 text-rose-200 border border-rose-400/60 font-black">
            <span>22</span> <span className="text-rose-300/90 font-normal">잔업(+5H)</span>
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-500/25 text-purple-200 border border-purple-400/60 font-black">
            <span>특근</span> <span className="text-purple-300/90 font-normal">휴일(8H)</span>
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-500/25 text-indigo-200 border border-indigo-400/60 font-black">
            <span>야간</span> <span className="text-indigo-300/90 font-normal">야간가산</span>
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-sky-500/25 text-sky-200 border border-sky-400/60 font-black">
            <span>연차/반차</span>
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-600 text-white border border-red-400 font-black">
            <span>결근</span>
          </span>
        </div>
        <span className="text-slate-400 font-bold text-[10.5px]">
          💡 셀을 클릭하면 해당 작업자·일자의 근태 수정 화면으로 즉시 이동합니다.
        </span>
      </div>

      {/* 전체현황대장 매트릭스 테이블 */}
      <div className="overflow-x-auto max-h-[680px] border-2 border-slate-700/90 rounded-2xl shadow-xl bg-slate-950">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="sticky top-0 z-30">
            <tr className="bg-slate-900 text-white border-b-2 border-slate-700">
              <th className="py-2.5 px-1.5 text-center w-9 sticky left-0 bg-slate-900 z-40 font-mono text-[11px] text-slate-300 border-r border-slate-700/80 whitespace-nowrap">
                No
              </th>
              <th className="hidden sm:table-cell py-2.5 px-2 w-16 sticky left-9 bg-slate-900 z-40 text-center text-[11px] font-black text-slate-200 border-r border-slate-700/80 whitespace-nowrap">
                업체
              </th>
              <th className="py-2.5 px-2.5 w-28 sticky left-9 sm:left-25 bg-slate-900 z-40 text-[11px] font-black text-cyan-300 border-r-2 border-slate-600 shadow-md whitespace-nowrap">
                성명 / 직위
              </th>
              {Array.from({ length: matrixDaysInMonth }, (_, i) => i + 1).map((d) => {
                const hInfo = getKoreanHolidayInfo(d, matrixYear, matrixMonthNum);
                const dow = hInfo.dayOfWeekStr || getMatrixDayLabel(d);
                const isHol = hInfo.isHoliday;
                const isTodayCol = isCurrentMonth && d === selectedDay;
                return (
                  <th
                    key={d}
                    onClick={() => {
                      if (isCurrentMonth) setSelectedDay(d);
                    }}
                    title={isHol ? `🔴 ${hInfo.holidayName} (대한민국 법정공휴일)` : hInfo.isWeekend ? `주말 (${dow}요일)` : `${matrixMonthNum}월 ${d}일 (${dow})`}
                    className={`py-1.5 px-0.5 text-center min-w-[36px] w-9 border-r border-slate-800 transition-colors select-none whitespace-nowrap ${
                      isTodayCol
                        ? "bg-cyan-950 text-cyan-200 border-b-2 border-b-cyan-400 ring-1 ring-inset ring-cyan-400/60 font-black cursor-pointer"
                        : isHol
                        ? "bg-rose-950 text-rose-200 border-b-2 border-b-rose-500 font-black cursor-help"
                        : dow === "일"
                        ? "bg-rose-950/75 text-rose-300 border-b-2 border-b-rose-700/70"
                        : dow === "토"
                        ? "bg-blue-950/75 text-blue-300 border-b-2 border-b-blue-700/70"
                        : "bg-slate-900 text-slate-200 hover:bg-slate-800 cursor-pointer"
                    }`}
                  >
                    <span className="text-[11px] font-mono font-black leading-tight flex items-center justify-center gap-0.5">
                      {d}
                      {isHol && <span className="text-[7px] text-rose-400">🔴</span>}
                    </span>
                    <span className={`block text-[9.5px] font-extrabold mt-0.5 ${
                      isHol || dow === "일"
                        ? "text-rose-300"
                        : dow === "토"
                        ? "text-blue-300"
                        : isTodayCol
                        ? "text-cyan-300"
                        : "text-slate-400"
                    }`}>
                      {isHol ? (hInfo.holidayName.length > 3 ? hInfo.holidayName.slice(0, 2) : hInfo.holidayName) : dow}
                    </span>
                  </th>
                );
              })}
              <th className="py-2 px-2 text-center w-14 bg-slate-950 text-emerald-300 font-black text-[11px] border-l-2 border-slate-600 border-r border-slate-800 whitespace-nowrap">
                출근일
              </th>
              <th className="py-2 px-2 text-center w-16 bg-slate-950 text-amber-300 font-black text-[11px] border-r border-slate-800 whitespace-nowrap">
                평일잔업
              </th>
              <th className="py-2 px-2 text-center w-14 bg-slate-950 text-purple-300 font-black text-[11px] border-r border-slate-800 whitespace-nowrap">
                특근(H)
              </th>
              <th className="py-2 px-2 text-center w-16 bg-slate-950 text-cyan-300 font-black text-[11px] whitespace-nowrap">
                총공수
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/90 text-xs">
            {filteredMatrixList.map((w, idx) => {
              const totals = calculateWorkerMonthlyTotals(w, matrixDaysInMonth);
              const cleanWorkerName = w.name ? w.name.split(" ")[0].replace(/\([^)]*\)/g, "").trim() : "";
              const cleanComp = cleanCompanyName(w.company);
              const companyTheme = COMPANY_THEMES[cleanComp] || COMPANY_THEMES["오륙"];
              const rowBgClass = idx % 2 === 0 ? "bg-slate-900/90" : "bg-slate-950/95";

              return (
                <tr
                  key={`${cleanComp}_${w.name}_${idx}`}
                  className={`${rowBgClass} hover:bg-cyan-950/40 transition-colors group`}
                >
                  {/* No */}
                  <td className={`py-2 px-1 text-center font-mono font-bold text-[11px] text-slate-400 sticky left-0 ${rowBgClass} group-hover:bg-slate-900 z-20 border-r border-slate-800`}>
                    {idx + 1}
                  </td>

                  {/* 업체 */}
                  <td className={`hidden sm:table-cell py-2 px-1.5 text-center sticky left-9 ${rowBgClass} group-hover:bg-slate-900 z-20 border-r border-slate-800`}>
                    <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-black border ${companyTheme.badge} whitespace-nowrap`}>
                      {cleanComp}
                    </span>
                  </td>

                  {/* 성명 / 직위 */}
                  <td className={`py-2 px-2 font-black sticky left-9 sm:left-25 ${rowBgClass} group-hover:bg-slate-900 z-20 border-r-2 border-slate-600 shadow-md whitespace-nowrap`}>
                    <div className="flex items-center justify-between gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenPersonnelCard(w, w.originalMatrixIndex)}
                        className="text-white hover:text-cyan-300 font-black text-xs flex items-center gap-1 cursor-pointer"
                        title={`[인사카드 조회] ${cleanComp} ${cleanWorkerName} ${w.position || "사원"}`}
                      >
                        <span>{cleanWorkerName}</span>
                      </button>
                      {w.position && (
                        <span className={`text-[9.5px] px-1.5 py-0.2 rounded font-bold border shrink-0 ${
                          w.position.includes("책임") || w.position.includes("팀장") || w.position.includes("대표")
                            ? "bg-purple-950 text-purple-200 border-purple-700"
                            : w.position.includes("선임") || w.position.includes("반장") || w.position.includes("조장")
                            ? "bg-blue-950 text-blue-200 border-blue-700"
                            : "bg-slate-800 text-slate-300 border-slate-700"
                        }`}>
                          {w.position}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* 1일 ~ 말일 셀 */}
                  {Array.from({ length: matrixDaysInMonth }, (_, i) => i + 1).map((d) => {
                    const hInfo = getKoreanHolidayInfo(d, matrixYear, matrixMonthNum);
                    const dow = hInfo.dayOfWeekStr || getMatrixDayLabel(d);
                    const isHol = hInfo.isHoliday;
                    const isWeekend = isMatrixWeekendDay(d);
                    const isTodayCol = isCurrentMonth && d === selectedDay;

                    let val = w.daily ? (w.daily[d] !== undefined ? w.daily[d] : w.daily[String(d)]) : "";
                    const rawStr = String(val || "").trim();
                    if (isWeekend && (rawStr === "결근" || !rawStr || rawStr === "미입력")) {
                      val = "-";
                    }

                    const strVal = String(val || "").trim();
                    let displayLabel = strVal || "-";
                    let badgeClass = "text-slate-600 font-normal";

                    if (strVal === "🟢" || strVal === "정시" || strVal === "출근" || strVal === "17") {
                      displayLabel = "출근";
                      badgeClass = "bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 font-black shadow-2xs";
                    } else if (strVal === "19" || strVal === "19시") {
                      displayLabel = "19";
                      badgeClass = "bg-amber-500/30 text-amber-200 border border-amber-400/70 font-black shadow-2xs";
                    } else if (strVal === "21" || strVal === "21시") {
                      displayLabel = "21";
                      badgeClass = "bg-orange-500/30 text-orange-200 border border-orange-400/70 font-black shadow-2xs";
                    } else if (strVal === "22" || strVal === "22시") {
                      displayLabel = "22";
                      badgeClass = "bg-rose-500/30 text-rose-200 border border-rose-400/70 font-black shadow-2xs";
                    } else if (strVal.includes("잔업")) {
                      const mOt = strVal.match(/([0-9.]+)/);
                      displayLabel = mOt ? `+${mOt[1]}` : "잔업";
                      badgeClass = "bg-amber-500/30 text-amber-200 border border-amber-400/70 font-black shadow-2xs";
                    } else if (strVal === "특근" || strVal === "주말특근" || strVal.includes("특근")) {
                      displayLabel = "특근";
                      badgeClass = "bg-purple-500/30 text-purple-200 border border-purple-400/70 font-black shadow-2xs";
                    } else if (strVal === "야간" || strVal.includes("야간")) {
                      displayLabel = "야간";
                      badgeClass = "bg-indigo-500/30 text-indigo-200 border border-indigo-400/70 font-black shadow-2xs";
                    } else if (strVal === "결근" || strVal.includes("결근") || strVal === "병결") {
                      displayLabel = "결근";
                      badgeClass = "bg-red-600 text-white border border-red-400 font-black shadow-sm";
                    } else if (strVal === "연차" || strVal === "휴가" || strVal.includes("연차")) {
                      displayLabel = "연차";
                      badgeClass = "bg-sky-500/30 text-sky-200 border border-sky-400/70 font-black";
                    } else if (strVal === "반차" || strVal.includes("반차")) {
                      displayLabel = "반차";
                      badgeClass = "bg-cyan-500/30 text-cyan-200 border border-cyan-400/70 font-black";
                    } else if (strVal === "-") {
                      displayLabel = "·";
                      badgeClass = "text-slate-600 font-bold";
                    }

                    const colBgClass = isTodayCol
                      ? "bg-cyan-500/[0.08]"
                      : isHol || dow === "일"
                      ? "bg-rose-950/25"
                      : dow === "토"
                      ? "bg-blue-950/25"
                      : "";

                    return (
                      <td
                        key={d}
                        onClick={() => {
                          setSelectedDay(d);
                          if (w.company && w.company !== "전체") {
                            setSelectedCompanyFilter(cleanCompanyName(w.company));
                          }
                          setIsDayUnlockedForEdit(true);
                          setActiveTab("daily_input");
                          triggerToast(`✏️ ${w.company} [${cleanWorkerName}] ${matrixMonthNum}월 ${d}일 근태 수정으로 이동했습니다.`);
                        }}
                        title={`${cleanWorkerName} (${cleanComp}) ${matrixMonthNum}월 ${d}일(${dow}): ${strVal || "미입력"} (클릭 시 근태 등록/수정 이동)`}
                        className={`py-1.5 px-0.5 text-center font-mono border-r border-slate-800/80 cursor-pointer hover:bg-cyan-500/20 transition-colors whitespace-nowrap ${colBgClass}`}
                      >
                        <span className={`inline-flex items-center justify-center min-w-[28px] px-1 py-0.5 rounded-md text-[10px] leading-tight whitespace-nowrap transition-transform group-hover:scale-102 ${badgeClass}`}>
                          {displayLabel}
                        </span>
                      </td>
                    );
                  })}

                  {/* 우측 개인별 월간 집계 */}
                  <td className="py-2 px-1.5 text-center font-mono font-black text-xs text-emerald-300 bg-slate-900/95 border-l-2 border-slate-600 border-r border-slate-800 whitespace-nowrap">
                    {totals.workDays}<span className="text-[10px] font-bold text-emerald-500 ml-0.5">일</span>
                  </td>
                  <td className={`py-2 px-1.5 text-center font-mono font-black text-xs bg-slate-900/95 border-r border-slate-800 whitespace-nowrap ${
                    totals.weekdayOtHours > 0 ? "text-amber-300" : "text-slate-600"
                  }`}>
                    {totals.weekdayOtHours > 0 ? `+${totals.weekdayOtHours}H` : "-"}
                  </td>
                  <td className={`py-2 px-1.5 text-center font-mono font-black text-xs bg-slate-900/95 border-r border-slate-800 whitespace-nowrap ${
                    totals.weekendOtHours > 0 ? "text-purple-300" : "text-slate-600"
                  }`}>
                    {totals.weekendOtHours > 0 ? `${totals.weekendOtHours}H` : "-"}
                  </td>
                  <td className="py-2 px-2 text-center font-mono font-black text-xs text-cyan-300 bg-slate-950 whitespace-nowrap">
                    {totals.totalHours}<span className="text-[10px] font-bold text-cyan-500 ml-0.5">H</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
          {/* 하단 일자별 출근인원 및 월간 총계 요약 행 */}
          {filteredMatrixList.length > 0 && (
            <tfoot className="sticky bottom-0 z-30 bg-slate-900 text-white border-t-2 border-cyan-500/60 shadow-lg">
              <tr>
                <td className="py-2.5 px-1 text-center font-mono text-[10px] text-cyan-300 font-black sticky left-0 bg-slate-900 z-40 border-r border-slate-700 whitespace-nowrap">
                  합계
                </td>
                <td className="hidden sm:table-cell py-2.5 px-1.5 text-center text-[10px] font-black text-slate-300 sticky left-9 bg-slate-900 z-40 border-r border-slate-700 whitespace-nowrap">
                  {matrixCompanyFilter}
                </td>
                <td className="py-2.5 px-2 text-xs font-black text-cyan-300 sticky left-9 sm:left-25 bg-slate-900 z-40 border-r-2 border-slate-600 whitespace-nowrap">
                  총 {filteredMatrixList.length}명 (일별출근)
                </td>
                {Array.from({ length: matrixDaysInMonth }, (_, i) => i + 1).map((d) => {
                  const dayAttendedCount = filteredMatrixList.reduce((acc, w) => {
                    const v = w.daily ? (w.daily[d] !== undefined ? w.daily[d] : w.daily[String(d)]) : "";
                    return acc + (calculateWorkerDailyHours(v).isAttended ? 1 : 0);
                  }, 0);
                  return (
                    <td
                      key={d}
                      className={`py-2 px-0.5 text-center font-mono text-[10.5px] font-black border-r border-slate-800 whitespace-nowrap ${
                        dayAttendedCount > 0 ? "text-emerald-300 bg-slate-900" : "text-slate-600 bg-slate-950"
                      }`}
                      title={`${matrixMonthNum}월 ${d}일 출근/투입 인원: ${dayAttendedCount}명`}
                    >
                      {dayAttendedCount > 0 ? dayAttendedCount : "-"}
                    </td>
                  );
                })}
                <td className="py-2 px-1.5 text-center font-mono font-black text-xs text-emerald-300 bg-slate-950 border-l-2 border-slate-600 border-r border-slate-800 whitespace-nowrap">
                  {sumWorkDays}일
                </td>
                <td className="py-2 px-1.5 text-center font-mono font-black text-xs text-amber-300 bg-slate-950 border-r border-slate-800 whitespace-nowrap">
                  +{sumWeekdayOt}H
                </td>
                <td className="py-2 px-1.5 text-center font-mono font-black text-xs text-purple-300 bg-slate-950 border-r border-slate-800 whitespace-nowrap">
                  {sumWeekendOt}H
                </td>
                <td className="py-2 px-2 text-center font-mono font-black text-xs text-cyan-300 bg-slate-950 whitespace-nowrap">
                  {sumTotalHours.toLocaleString()}H
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
};
