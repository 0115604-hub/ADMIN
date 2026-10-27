import React from "react";
import {
  Users,
  CalendarDays,
  FileSpreadsheet,
  ArrowLeft
} from "lucide-react";
import { OvertimeDailySummaryView } from "./OvertimeDailySummaryView.jsx";
import { OvertimeMonthlyMatrixView } from "./OvertimeMonthlyMatrixView.jsx";
import { OvertimeWorkerManagementView } from "./OvertimeWorkerManagementView.jsx";
import {
  COMPANIES,
  COMPANY_THEMES,
  cleanCompanyName,
  normalizeDept,
  getKoreanHolidayInfo,
  calculateWorkerMonthlyTotals,
  calculateWorkerDailyHours,
  getLocalSmartOvertimeData
} from "../../services/overtimeSmartService.js";
import {
  getWorkerPersonnelCard,
  getSkillMeta,
  getNationalityMeta,
  getInspectorGradeMeta,
  DEPARTMENTS_LIST,
  POSITIONS_LIST,
  STANDARD_PROCESS_LIST
} from "../../services/personnelCardService.js";

export const OvertimeDetailTabRouter = ({
  activeTab,
  setActiveTab,
  detailSubTab,
  setDetailSubTab,
  setMatrixViewMonth,
  selectedMonth,
  prevYearMonth,
  matrixMonthNum,
  matrixViewMonth,
  workerMgmtStats,
  currentMonthNum,
  selectedDay,
  setSelectedDay,
  daysInMonth,
  currentYear,
  getDayFullLabel,
  dailySummary,
  handleSelectCompanyAttendanceTable,
  prevMonthNum,
  prevYear,
  smartData,
  prevMonthData,
  matrixCustomMonthData,
  lastSelectedPastMonth,
  setLastSelectedPastMonth,
  personnelCardsMap,
  matrixCompanyFilter,
  setMatrixCompanyFilter,
  matrixDaysInMonth,
  matrixYear,
  pastMonthDropdownRef,
  isPastMonthDropdownOpen,
  setIsPastMonthDropdownOpen,
  triggerToast,
  handleExportExcel,
  getMatrixDayLabel,
  handleOpenPersonnelCard,
  isMatrixWeekendDay,
  setIsDayUnlockedForEdit,
  showAddWorkerDrawer,
  setShowAddWorkerDrawer,
  handleQuickAddCompanyWorker,
  quickNewWorkerCompany,
  setQuickNewWorkerCompany,
  setWorkerMgmtCompanyFilter,
  quickNewWorkerName,
  setQuickNewWorkerName,
  quickNewWorkerDept,
  setQuickNewWorkerDept,
  quickNewWorkerLine,
  setQuickNewWorkerLine,
  quickNewWorkerPos,
  setQuickNewWorkerPos,
  workerMgmtCompanyFilter,
  workerMgmtSkillFilter,
  setWorkerMgmtSkillFilter,
  workerMgmtMultiSkillOnly,
  setWorkerMgmtMultiSkillOnly,
  workerMgmtSearch,
  setWorkerMgmtSearch,
  workerMgmtList,
  handleOpenDeleteWorkerModal
}) => {
  if (activeTab !== "detail" && activeTab !== "monthly_matrix" && activeTab !== "daily_summary" && activeTab !== "worker_management") {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Sub-Tab Navigation Bar within Detail */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-900 dark:bg-slate-950 rounded-2xl border border-slate-700/80 w-fit flex-wrap shadow-sm">
        <button
          type="button"
          onClick={() => setActiveTab("daily_input")}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-black text-xs text-cyan-300 hover:text-white hover:bg-slate-800 transition-all cursor-pointer border border-cyan-500/30"
          title="당일 근태 등록 화면으로 이동합니다."
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>오늘 등록으로</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setDetailSubTab("monthly_matrix");
            setMatrixViewMonth(selectedMonth || "2026-10");
          }}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-black text-xs transition-all cursor-pointer ${
            detailSubTab === "monthly_matrix"
              ? "bg-purple-600 text-white shadow-md font-black ring-2 ring-purple-400/50"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <CalendarDays className="w-3.5 h-3.5" />
          <span>📅 월간 종합현황 대장</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-purple-950 text-purple-200 border border-purple-700/60 font-mono font-bold">
            {matrixMonthNum}월 ({matrixViewMonth === (selectedMonth || "2026-10") ? "당월" : matrixViewMonth === prevYearMonth ? "지난달 실적" : "마감 실적"})
          </span>
        </button>

        <button
          type="button"
          onClick={() => setDetailSubTab("daily_summary")}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-black text-xs transition-all cursor-pointer ${
            detailSubTab === "daily_summary"
              ? "bg-cyan-600 text-white shadow-md font-black"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          <span>📊 각사별 일일현황</span>
        </button>

        <button
          type="button"
          onClick={() => setDetailSubTab("worker_management")}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-black text-xs transition-all cursor-pointer ${
            detailSubTab === "worker_management"
              ? "bg-emerald-600 text-white shadow-md font-black"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>🪪 인원관리 및 인사카드</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-950 text-emerald-200 border border-emerald-700/60 font-mono font-bold">
            {workerMgmtStats.total}명
          </span>
        </button>
      </div>

      {/* Sub-tab 1: Daily Summary View */}
      {detailSubTab === "daily_summary" && (
        <OvertimeDailySummaryView
          currentMonthNum={currentMonthNum}
          selectedDay={selectedDay}
          setSelectedDay={setSelectedDay}
          daysInMonth={daysInMonth}
          getKoreanHolidayInfo={getKoreanHolidayInfo}
          currentYear={currentYear}
          getDayFullLabel={getDayFullLabel}
          dailySummary={dailySummary}
          handleSelectCompanyAttendanceTable={handleSelectCompanyAttendanceTable}
        />
      )}

      {/* Sub-tab 2: Monthly Matrix View */}
      {detailSubTab === "monthly_matrix" && (
        <OvertimeMonthlyMatrixView
          matrixViewMonth={matrixViewMonth}
          setMatrixViewMonth={setMatrixViewMonth}
          selectedMonth={selectedMonth}
          prevYearMonth={prevYearMonth}
          currentMonthNum={currentMonthNum}
          currentYear={currentYear}
          prevMonthNum={prevMonthNum}
          prevYear={prevYear}
          smartData={smartData}
          prevMonthData={prevMonthData}
          matrixCustomMonthData={matrixCustomMonthData}
          getLocalSmartOvertimeData={getLocalSmartOvertimeData}
          lastSelectedPastMonth={lastSelectedPastMonth}
          setLastSelectedPastMonth={setLastSelectedPastMonth}
          personnelCardsMap={personnelCardsMap}
          getWorkerPersonnelCard={getWorkerPersonnelCard}
          normalizeDept={normalizeDept}
          matrixCompanyFilter={matrixCompanyFilter}
          setMatrixCompanyFilter={setMatrixCompanyFilter}
          COMPANIES={COMPANIES}
          cleanCompanyName={cleanCompanyName}
          matrixDaysInMonth={matrixDaysInMonth}
          matrixYear={matrixYear}
          matrixMonthNum={matrixMonthNum}
          calculateWorkerMonthlyTotals={calculateWorkerMonthlyTotals}
          pastMonthDropdownRef={pastMonthDropdownRef}
          isPastMonthDropdownOpen={isPastMonthDropdownOpen}
          setIsPastMonthDropdownOpen={setIsPastMonthDropdownOpen}
          triggerToast={triggerToast}
          handleExportExcel={handleExportExcel}
          selectedDay={selectedDay}
          setSelectedDay={setSelectedDay}
          getKoreanHolidayInfo={getKoreanHolidayInfo}
          getMatrixDayLabel={getMatrixDayLabel}
          COMPANY_THEMES={COMPANY_THEMES}
          handleOpenPersonnelCard={handleOpenPersonnelCard}
          isMatrixWeekendDay={isMatrixWeekendDay}
          setIsDayUnlockedForEdit={setIsDayUnlockedForEdit}
          setActiveTab={setActiveTab}
          calculateWorkerDailyHours={calculateWorkerDailyHours}
        />
      )}

      {/* Sub-tab 3: Worker Management View */}
      {detailSubTab === "worker_management" && (
        <OvertimeWorkerManagementView
          workerMgmtStats={workerMgmtStats}
          showAddWorkerDrawer={showAddWorkerDrawer}
          setShowAddWorkerDrawer={setShowAddWorkerDrawer}
          handleQuickAddCompanyWorker={handleQuickAddCompanyWorker}
          quickNewWorkerCompany={quickNewWorkerCompany}
          setQuickNewWorkerCompany={setQuickNewWorkerCompany}
          setWorkerMgmtCompanyFilter={setWorkerMgmtCompanyFilter}
          COMPANIES={COMPANIES}
          quickNewWorkerName={quickNewWorkerName}
          setQuickNewWorkerName={setQuickNewWorkerName}
          quickNewWorkerDept={quickNewWorkerDept}
          setQuickNewWorkerDept={setQuickNewWorkerDept}
          DEPARTMENTS_LIST={DEPARTMENTS_LIST}
          quickNewWorkerLine={quickNewWorkerLine}
          setQuickNewWorkerLine={setQuickNewWorkerLine}
          STANDARD_PROCESS_LIST={STANDARD_PROCESS_LIST}
          quickNewWorkerPos={quickNewWorkerPos}
          setQuickNewWorkerPos={setQuickNewWorkerPos}
          POSITIONS_LIST={POSITIONS_LIST}
          workerMgmtCompanyFilter={workerMgmtCompanyFilter}
          workerMgmtSkillFilter={workerMgmtSkillFilter}
          setWorkerMgmtSkillFilter={setWorkerMgmtSkillFilter}
          workerMgmtMultiSkillOnly={workerMgmtMultiSkillOnly}
          setWorkerMgmtMultiSkillOnly={setWorkerMgmtMultiSkillOnly}
          workerMgmtSearch={workerMgmtSearch}
          setWorkerMgmtSearch={setWorkerMgmtSearch}
          workerMgmtList={workerMgmtList}
          getWorkerPersonnelCard={getWorkerPersonnelCard}
          COMPANY_THEMES={COMPANY_THEMES}
          cleanCompanyName={cleanCompanyName}
          getSkillMeta={getSkillMeta}
          getNationalityMeta={getNationalityMeta}
          getInspectorGradeMeta={getInspectorGradeMeta}
          handleOpenPersonnelCard={handleOpenPersonnelCard}
          handleOpenDeleteWorkerModal={handleOpenDeleteWorkerModal}
        />
      )}
    </div>
  );
};
