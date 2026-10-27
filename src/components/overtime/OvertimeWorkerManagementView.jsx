import React from "react";
import {
  Users,
  UserPlus,
  Star,
  Zap,
  CheckCircle2,
  X,
  Filter,
  Factory,
  Search,
  User,
  Award,
  Trash2
} from "lucide-react";

export const OvertimeWorkerManagementView = ({
  workerMgmtStats = { total: 0, masterCount: 0, multiSkillCount: 0 },
  showAddWorkerDrawer,
  setShowAddWorkerDrawer,
  handleQuickAddCompanyWorker,
  quickNewWorkerCompany,
  setQuickNewWorkerCompany,
  setWorkerMgmtCompanyFilter,
  COMPANIES = [],
  quickNewWorkerName,
  setQuickNewWorkerName,
  quickNewWorkerDept,
  setQuickNewWorkerDept,
  DEPARTMENTS_LIST = [],
  quickNewWorkerLine,
  setQuickNewWorkerLine,
  STANDARD_PROCESS_LIST = [],
  quickNewWorkerPos,
  setQuickNewWorkerPos,
  POSITIONS_LIST = [],
  workerMgmtCompanyFilter,
  workerMgmtSkillFilter,
  setWorkerMgmtSkillFilter,
  workerMgmtMultiSkillOnly,
  setWorkerMgmtMultiSkillOnly,
  workerMgmtSearch,
  setWorkerMgmtSearch,
  workerMgmtList = [],
  getWorkerPersonnelCard,
  COMPANY_THEMES = {},
  cleanCompanyName,
  getSkillMeta,
  getNationalityMeta,
  getInspectorGradeMeta,
  handleOpenPersonnelCard,
  handleOpenDeleteWorkerModal
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden space-y-4 p-4 sm:p-5">
      {/* 1. Header & Summary Stats */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <span className="p-2 rounded-xl bg-purple-500/20 text-purple-600 dark:text-purple-300 ring-1 ring-purple-400/40">
            <Users className="w-5 h-5 text-purple-500" />
          </span>
          <div>
            <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
              <span>제조현장 인원관리 및 인사카드 목록표</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-mono font-bold border border-purple-300 dark:border-purple-800">
                총 {workerMgmtStats.total}명 등록
              </span>
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              작업자별 제조경력, 주공정, 숙련등급(1~5성), 다기능공 여부를 등록하고 인사카드를 발급·관리합니다.
            </p>
          </div>
        </div>

        {/* Quick Add Worker Button */}
        <button
          type="button"
          onClick={() => setShowAddWorkerDrawer(!showAddWorkerDrawer)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs shadow-md shadow-purple-900/30 transition-all cursor-pointer active:scale-95 shrink-0 self-start lg:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>{showAddWorkerDrawer ? "등록 폼 닫기" : "➕ 신규 근로자 등록"}</span>
        </button>
      </div>

      {/* 2. Top KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
        <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 pb-1">
            <span className="text-[11px] font-bold">전체 등록 근로자</span>
            <Users className="w-3.5 h-3.5 text-purple-500" />
          </div>
          <div className="font-mono font-black text-lg sm:text-xl text-slate-900 dark:text-white">
            {workerMgmtStats.total}<span className="text-xs font-normal text-slate-400 ml-0.5">명</span>
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 pb-1">
            <span className="text-[11px] font-bold">숙련/마스터 (Lv.4~5)</span>
            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
          </div>
          <div className="font-mono font-black text-lg sm:text-xl text-amber-500 dark:text-amber-400">
            {workerMgmtStats.masterCount}<span className="text-xs font-normal text-slate-400 ml-0.5">명</span>
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 pb-1">
            <span className="text-[11px] font-bold">다기능공 (Multi-Skill)</span>
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="font-mono font-black text-lg sm:text-xl text-cyan-500 dark:text-cyan-400">
            {workerMgmtStats.multiSkillCount}<span className="text-xs font-normal text-slate-400 ml-0.5">명</span>
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 pb-1">
            <span className="text-[11px] font-bold">인사카드 완비율</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="font-mono font-black text-lg sm:text-xl text-emerald-500 dark:text-emerald-400">
            100<span className="text-xs font-normal text-slate-400 ml-0.5">%</span>
          </div>
        </div>
      </div>

      {/* 3. Expandable Quick Add Form Drawer */}
      {showAddWorkerDrawer && (
        <div className="p-3.5 sm:p-4 rounded-2xl bg-purple-950/20 border-2 border-purple-500/40 space-y-2.5 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-purple-300 flex items-center gap-1.5">
              <UserPlus className="w-4 h-4 text-purple-400" />
              <span>신규 근로자 간편 추가 (등록 후 즉시 인사카드 편집 가능)</span>
            </span>
            <button
              type="button"
              onClick={() => setShowAddWorkerDrawer(false)}
              className="text-slate-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleQuickAddCompanyWorker} className="grid grid-cols-1 sm:grid-cols-12 gap-2">
            <div className="sm:col-span-2">
              <select
                value={quickNewWorkerCompany || "오륙"}
                onChange={(e) => {
                  const nextComp = e.target.value;
                  setQuickNewWorkerCompany(nextComp);
                  setWorkerMgmtCompanyFilter(nextComp);
                }}
                className="w-full px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 focus:border-purple-400 text-white text-xs font-bold cursor-pointer"
              >
                {COMPANIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-3">
              <input
                type="text"
                required
                placeholder="성명 *"
                value={quickNewWorkerName}
                onChange={(e) => setQuickNewWorkerName(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 focus:border-purple-400 text-white text-xs font-bold placeholder:text-slate-500"
              />
            </div>
            <div className="sm:col-span-2">
              <select
                value={quickNewWorkerDept}
                onChange={(e) => setQuickNewWorkerDept(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 focus:border-purple-400 text-white text-xs font-bold"
              >
                {DEPARTMENTS_LIST.map((d) => (
                  <option key={d} value={d} className="bg-slate-900 text-white font-bold">{d}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <select
                value={quickNewWorkerLine || "압출"}
                onChange={(e) => setQuickNewWorkerLine(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 focus:border-purple-400 text-white text-xs font-bold"
              >
                {STANDARD_PROCESS_LIST.map((proc) => (
                  <option key={proc} value={proc}>{proc}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <select
                value={quickNewWorkerPos}
                onChange={(e) => setQuickNewWorkerPos(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 focus:border-purple-400 text-white text-xs font-bold"
              >
                {POSITIONS_LIST.map((pos) => (
                  <option key={pos} value={pos} className="bg-slate-900 text-white font-bold">{pos}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-1">
              <button
                type="submit"
                className="w-full py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs flex items-center justify-center cursor-pointer active:scale-95 transition-all shadow-sm"
              >
                추가
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 4. Filter Controls Bar */}
      <div className="p-2 sm:p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
        {/* Left: 5개사 독립 모듈 필터 */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1 shrink-0">
            <Filter className="w-3.5 h-3.5 text-purple-500" />
            <span>업체(5개사 독립):</span>
          </span>

          {/* 삼랑진 그룹 */}
          <div className="flex items-center gap-1 p-0.5 bg-white dark:bg-slate-900 border border-amber-600/50 rounded-xl">
            <span className="text-[11px] font-black px-2 py-0.5 rounded-lg bg-amber-950 text-amber-300 border border-amber-700/60 flex items-center gap-0.5">
              <Factory className="w-3.5 h-3.5 text-amber-400" />
              <span>삼랑진</span>
            </span>
            {["오륙", "유성"].map((comp) => (
              <button
                key={comp}
                type="button"
                onClick={() => {
                  setWorkerMgmtCompanyFilter(comp);
                  setQuickNewWorkerCompany(comp);
                }}
                className={`px-2 py-0.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  workerMgmtCompanyFilter === comp
                    ? "bg-amber-500 text-slate-950 shadow-xs ring-1 ring-amber-300"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                {comp}
              </button>
            ))}
          </div>

          {/* 한림 그룹 */}
          <div className="flex items-center gap-1 p-0.5 bg-white dark:bg-slate-900 border border-emerald-600/50 rounded-xl">
            <span className="text-[11px] font-black px-2 py-0.5 rounded-lg bg-emerald-950 text-emerald-300 border border-emerald-700/60 flex items-center gap-0.5">
              <Factory className="w-3.5 h-3.5 text-emerald-400" />
              <span>한림</span>
            </span>
            {["조영", "한울", "부림텍"].map((comp) => (
              <button
                key={comp}
                type="button"
                onClick={() => {
                  setWorkerMgmtCompanyFilter(comp);
                  setQuickNewWorkerCompany(comp);
                }}
                className={`px-2 py-0.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  workerMgmtCompanyFilter === comp
                    ? "bg-emerald-500 text-slate-950 shadow-xs ring-1 ring-emerald-300"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                {comp}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Skill Filter & Multi-skill Toggle & Search Bar */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* 숙련등급 필터 */}
          <select
            value={workerMgmtSkillFilter}
            onChange={(e) => setWorkerMgmtSkillFilter(e.target.value)}
            className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white font-bold text-xs border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1 cursor-pointer"
          >
            <option value="ALL">⭐ 전체 숙련등급</option>
            <option value="5">★★★★★ Lv.5 마스터</option>
            <option value="4">★★★★☆ Lv.4 숙련</option>
            <option value="3">★★★☆☆ Lv.3 능숙</option>
            <option value="2">★★☆☆☆ Lv.2 보통</option>
            <option value="1">★☆☆☆☆ Lv.1 기초</option>
          </select>

          {/* 다기능공 토글 필터 */}
          <button
            type="button"
            onClick={() => setWorkerMgmtMultiSkillOnly(!workerMgmtMultiSkillOnly)}
            className={`px-2.5 py-1 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1 border ${
              workerMgmtMultiSkillOnly
                ? "bg-cyan-600 text-white border-cyan-400 shadow-sm"
                : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-cyan-500"
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            <span>다기능공만</span>
          </button>

          {/* Search input */}
          <div className="relative w-44 sm:w-52">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="성명/사번/부서/공정..."
              value={workerMgmtSearch}
              onChange={(e) => setWorkerMgmtSearch(e.target.value)}
              className="w-full pl-8 pr-2.5 py-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold placeholder:text-slate-400 focus:border-purple-400"
            />
          </div>
        </div>
      </div>

      {/* 5. Main Worker List Table with Personnel Card Actions */}
      <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs bg-white dark:bg-slate-950">
        {workerMgmtList.length === 0 ? (
          <div className="py-12 text-center text-slate-400 font-bold text-xs space-y-1">
            <p>검색 및 필터 조건과 일치하는 근로자가 없습니다.</p>
            <button
              type="button"
              onClick={() => {
                setWorkerMgmtCompanyFilter("전체");
                setWorkerMgmtSkillFilter("ALL");
                setWorkerMgmtMultiSkillOnly(false);
                setWorkerMgmtSearch("");
              }}
              className="text-purple-400 hover:underline text-xs font-bold"
            >
              필터 초기화
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 bg-slate-900 text-white z-20 font-black text-[11px] uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-2 text-center w-10 font-mono text-slate-400">No</th>
                  <th className="py-2.5 px-2 w-20">소속</th>
                  <th className="hidden sm:table-cell py-2.5 px-2 w-24">부서</th>
                  <th className="py-2.5 px-2 w-16 text-center">직위</th>
                  <th className="py-2.5 px-2.5 w-32">성명 (사번)</th>
                  <th className="hidden md:table-cell py-2.5 px-2 w-32">입사일 / 근속</th>
                  <th className="py-2.5 px-2 w-28">주공정(년차)</th>
                  <th className="py-2.5 px-2 w-36 text-center">숙련등급 (별점)</th>
                  <th className="py-2.5 px-2 w-32 text-center">다기능공</th>
                  <th className="py-2.5 px-2 w-28 text-center bg-purple-950/80 text-purple-200">인사카드</th>
                  <th className="py-2.5 px-2 w-16 text-center">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 bg-white dark:bg-slate-900/40 text-xs">
                {workerMgmtList.map((worker, rowIdx) => {
                  const card = worker.card || getWorkerPersonnelCard(worker, rowIdx + 1);
                  const companyTheme = COMPANY_THEMES[cleanCompanyName(worker.company)] || COMPANY_THEMES["오륙"];
                  const skillMeta = getSkillMeta(card.skillLevel);

                  return (
                    <tr
                      key={`${worker.company}_${worker.name}_${worker.originalMatrixIndex}_${rowIdx}`}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors group"
                    >
                      {/* No */}
                      <td className="py-2 px-2 text-center font-mono text-slate-400 text-[11px]">
                        {worker.companyNo || rowIdx + 1}
                      </td>

                      {/* 소속 업체 */}
                      <td className="py-2 px-2">
                        <span className={`inline-block px-2 py-0.5 rounded-md text-[10.5px] font-black border ${companyTheme.badge} whitespace-nowrap`}>
                          {cleanCompanyName(worker.company)}
                        </span>
                      </td>

                      {/* 부서 */}
                      <td className="hidden sm:table-cell py-2 px-2">
                        <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                          {worker.dept}
                        </span>
                      </td>

                      {/* 직위 */}
                      <td className="py-2 px-2 text-center">
                        {(() => {
                          const pos = card.position || worker.position || "작업원";
                          const isExecutive = pos === "대표이사" || pos === "이사";
                          const isLead = pos === "책임";
                          const isSenior = pos === "선임";
                          const isStaff = pos === "사원";
                          return (
                            <span className={`px-1.5 py-0.5 rounded text-[10.5px] font-bold border ${
                              isExecutive
                                ? "bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-800 font-black"
                                : isLead
                                ? "bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800 font-black"
                                : isSenior
                                ? "bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 border-cyan-300 dark:border-cyan-800 font-black"
                                : isStaff
                                ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 font-bold"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                            }`}>
                              {pos}
                            </span>
                          );
                        })()}
                      </td>

                      {/* 성명 & 사번 & 프로필 사진 */}
                      <td className="py-2 px-2.5">
                        <div className="flex items-center gap-2">
                          {card.photoUrl ? (
                            <img
                              src={card.photoUrl}
                              alt={worker.name}
                              className="w-7 h-7 rounded-lg object-cover border border-purple-400 shrink-0 shadow-2xs"
                            />
                          ) : (
                            <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 shrink-0">
                              <User className="w-3.5 h-3.5 text-purple-400" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="font-black text-slate-900 dark:text-white text-xs flex items-center gap-1">
                              <span className="truncate">{worker.name}</span>
                              {card.isMultiSkill && (
                                <Zap className="w-3.5 h-3.5 text-cyan-400 shrink-0" title="다기능공" />
                              )}
                              {card.nationality && card.nationality !== "대한민국" && (
                                <span
                                  className="px-1 py-0.2 rounded text-[9.5px] font-bold bg-slate-100 dark:bg-slate-800 text-cyan-700 dark:text-cyan-300 border border-slate-300 dark:border-slate-700 shrink-0"
                                  title={`국적: ${card.nationality === "기타" ? (card.nationalityOther || "기타") : card.nationality}`}
                                >
                                  {getNationalityMeta(card.nationality).flag} {card.nationality === "기타" ? (card.nationalityOther || "기타") : card.nationality}
                                </span>
                              )}
                            </div>
                            <div className="font-mono text-[10px] text-slate-400">
                              {card.empNo || "250101"}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 입사일 / 근속기간 */}
                      <td className="hidden md:table-cell py-2 px-2">
                        <div className="font-mono text-[11px] text-slate-700 dark:text-slate-300">
                          {card.joinDate || "2022-03-15"}
                        </div>
                        <div className="text-[10.5px] font-bold text-emerald-600 dark:text-emerald-400">
                          {card.tenure || "2년 7개월"}
                        </div>
                      </td>

                      {/* 주공정 */}
                      <td className="py-2 px-2">
                        <div className="flex items-center gap-1 flex-wrap">
                          <span className={`text-xs truncate ${
                            card.mainProcess === "관리자"
                              ? "font-black px-1.5 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800"
                              : "font-black text-amber-600 dark:text-amber-300"
                          }`}>
                            {card.mainProcess || "압출"}
                          </span>
                          {card.mainProcess === "검사" && card.inspectorGrade && (() => {
                            const meta = getInspectorGradeMeta(card.inspectorGrade);
                            return (
                              <span className={`px-1 py-0.2 rounded text-[9.5px] font-black border ${meta.badgeClass}`}>
                                {meta.shortGrade || card.inspectorGrade.split(" ")[0]}
                              </span>
                            );
                          })()}
                        </div>
                        <span className="text-[10.5px] text-slate-400 font-bold block">
                          {card.processYear || "3년차"}
                        </span>
                      </td>

                      {/* 숙련등급 */}
                      <td className="py-2 px-2 text-center">
                        <div className="flex items-center justify-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-3 h-3 ${
                                s <= card.skillLevel
                                  ? "text-amber-400 fill-amber-400 drop-shadow-[0_0_2px_rgba(251,191,36,0.6)]"
                                  : "text-slate-300 dark:text-slate-700"
                              }`}
                            />
                          ))}
                        </div>
                        <div className="pt-0.5">
                          <span className={`px-1.5 py-0.2 rounded text-[10px] font-black border ${skillMeta.badgeClass}`}>
                            {skillMeta.shortGrade}
                          </span>
                        </div>
                      </td>

                      {/* 다기능공 여부 */}
                      <td className="py-2 px-2 text-center">
                        {card.isMultiSkill ? (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-black bg-cyan-950 text-cyan-300 border border-cyan-700/80 shadow-2xs">
                              <Zap className="w-2.5 h-2.5 text-cyan-400" />
                              <span>다기능공</span>
                            </span>
                            {(card.subProcesses || []).length > 0 && (
                              <div className="text-[9.5px] text-cyan-400/90 font-bold truncate max-w-[120px] mx-auto">
                                {card.subProcesses.join(", ")}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500">
                            단일공정
                          </span>
                        )}
                      </td>

                      {/* 인사카드 버튼 */}
                      <td className="py-2 px-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleOpenPersonnelCard(worker, worker.originalMatrixIndex)}
                          className="px-2.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs flex items-center justify-center gap-1 mx-auto cursor-pointer shadow-md shadow-purple-900/30 active:scale-95 transition-all"
                          title="제조현장 인사카드 작성 및 조회"
                        >
                          <Award className="w-3.5 h-3.5" />
                          <span>🪪 인사카드</span>
                        </button>
                      </td>

                      {/* 삭제 관리 */}
                      <td className="py-2 px-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleOpenDeleteWorkerModal(worker, worker.originalMatrixIndex)}
                          className="px-2 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/70 hover:bg-rose-600 text-rose-600 dark:text-rose-300 hover:text-white border border-rose-200 dark:border-rose-800/80 font-bold text-[10.5px] transition-all cursor-pointer flex items-center gap-1 mx-auto active:scale-95"
                          title="근로자 인원 영구 삭제"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>삭제</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
