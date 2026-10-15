import React from "react";
import {
  User,
  FileSignature,
  Calendar,
  Camera,
  ImageIcon,
  Users,
  X,
  Building2,
  Factory,
  Sparkles,
  FileText,
  MessageCircle
} from "lucide-react";

export const WorkerScheduleCalendarSection = ({
  workerPlant,
  workerFullName,
  onNavigateTab,
  pendingCount = 0,
  holdCount = 0,
  officialTitle,
  isAdmin,
  isManagerRole,
  scheduleLeaveType,
  setScheduleLeaveType,
  scheduleSelectedDate,
  setScheduleSelectedDate,
  scheduleReasonInput,
  setScheduleReasonInput,
  handleRegisterSchedule,
  scheduleSaving,
  scheduleCameraInputRef,
  scheduleFileInputRef,
  handleScheduleFiles,
  scheduleAttachedFiles = [],
  isProcessingScheduleFiles,
  handleRemoveScheduleFile,
  setPreviewImageModal,
  shareDropdownRef,
  isShareDropdownOpen,
  setIsShareDropdownOpen,
  sharedWorkers = [],
  setSharedWorkers,
  toggleSharedWorker,
  togglePlantSharedWorkers,
  currentProfile,
  ADMIN_USERS = [],
  PLANTS = [],
  myActiveLeaves = [],
  todayDateStr,
  formatKSTDate,
  setScheduleDetailModal,
  handleRequestDismissOrDelete,
  showMiniCalendar,
  setShowMiniCalendar,
  scheduleWeekAnchor = "",
  handlePrevWeek,
  handleResetToToday,
  handleNextWeek,
  myWeeklyCalendarDays = []
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl p-2.5 sm:p-3.5 border-2 border-blue-500/40 dark:border-blue-500/30 shadow-sm space-y-2.5 min-w-0 max-w-full relative z-20">
      {/* Top Bar: Worker Profile & Quick Schedule Register Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5 items-center">
        {/* Left: Worker Name and Title with Embedded Mini Electronic Approval Panel */}
        <div className="lg:col-span-3 min-w-0">
          <div className="relative overflow-hidden rounded-xl sm:rounded-2xl px-3 py-2 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white border-2 border-indigo-500/40 dark:border-indigo-400/40 shadow-md shadow-indigo-950/40 ring-1 ring-white/10 group transition-all">
            {/* Ambient Soft Glow Highlights */}
            <div className="absolute -top-6 -right-6 w-20 h-20 bg-gradient-to-br from-blue-500/20 via-indigo-500/20 to-transparent rounded-full blur-xl pointer-events-none" />
            <div className="absolute -bottom-6 -left-6 w-16 h-16 bg-gradient-to-tr from-cyan-500/15 to-transparent rounded-full blur-lg pointer-events-none" />

            <div className="relative flex items-center justify-between gap-1.5 min-w-0">
              <div className="flex items-center gap-2 min-w-0 truncate">
                {/* Dynamic Glowing Avatar with Online Status Indicator */}
                <div className="relative shrink-0">
                  <div className="w-8 h-8 sm:w-8.5 sm:h-8.5 rounded-xl bg-gradient-to-tr from-cyan-400 via-blue-500 to-indigo-500 p-[1.5px] shadow-sm shadow-cyan-500/30">
                    <div className="w-full h-full rounded-[10px] bg-slate-900/90 backdrop-blur-xs flex items-center justify-center text-cyan-300">
                      <User className="w-4 h-4 text-cyan-300 drop-shadow-xs" />
                    </div>
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 border-2 border-slate-950 rounded-full shadow-xs ring-1 ring-emerald-400/50">
                    <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-75" />
                  </span>
                </div>

                {/* Worker Name with Sub-tag */}
                <div className="flex flex-col min-w-0 truncate leading-tight">
                  <span className="text-[9px] font-extrabold text-cyan-400/90 tracking-wider flex items-center gap-1 uppercase">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse inline-block" />
                    {(workerPlant || "본사").replace("공장", "")}
                  </span>
                  <span className="text-sm sm:text-base font-black text-white tracking-tight drop-shadow-xs truncate">
                    {workerFullName}
                  </span>
                </div>
              </div>

              {/* Right: Embedded Electronic Approval Mini Panel + Title Badge */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onNavigateTab) onNavigateTab("electronic_approval");
                  }}
                  className={`px-2 py-1 rounded-lg border text-[10.5px] font-black transition-all cursor-pointer shadow-xs active:scale-95 shrink-0 flex items-center gap-1 group/appr ${
                    pendingCount > 0
                      ? "bg-rose-500/25 hover:bg-rose-500/40 border-rose-400/70 text-rose-200 ring-1 ring-rose-500/40 animate-pulse"
                      : holdCount > 0
                      ? "bg-amber-500/25 hover:bg-amber-500/40 border-amber-400/70 text-amber-200"
                      : "bg-emerald-500/20 hover:bg-emerald-500/35 border-emerald-400/60 text-emerald-200"
                  }`}
                  title="클릭하여 전자결재함으로 바로 이동"
                >
                  <FileSignature className="w-3.5 h-3.5 text-emerald-400 shrink-0 group-hover/appr:scale-110 transition-transform" />
                  <span className="whitespace-nowrap font-black">전자결재</span>
                  {pendingCount > 0 ? (
                    <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[9px] font-black">
                      {pendingCount}
                    </span>
                  ) : (
                    <span className="px-1 py-0.2 rounded-full bg-emerald-600/80 text-white text-[9px] font-bold">
                      0
                    </span>
                  )}
                </button>

                <span className="px-2 py-1 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white border border-blue-400/40 text-xs font-black tracking-wide shadow-sm shadow-indigo-500/30 shrink-0">
                  {officialTitle || (isAdmin ? "대표이사" : (isManagerRole ? "반장" : "사원"))}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Quick Schedule Register Form (9 cols) */}
        <div className="lg:col-span-9 min-w-0">
          <form onSubmit={handleRegisterSchedule} className="space-y-1.5">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 items-center">
              {/* 1. Leave Type Selector (2 cols) */}
              <div className="sm:col-span-2 min-w-0">
                <select
                  value={scheduleLeaveType}
                  onChange={(e) => setScheduleLeaveType(e.target.value)}
                  className="w-full px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-black text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 cursor-pointer shadow-2xs"
                >
                  <option value="할일">📝 할일</option>
                  <option value="삼랑진방문">🏭 삼랑진방문</option>
                  <option value="한림방문">🏭 한림방문</option>
                  <option value="R&A회의">👔 R&A회의</option>
                  <option value="외출">🚶 외출</option>
                  <option value="연차(하루)">🌴 연차(하루)</option>
                  <option value="오전반차">🌤️ 오전반차</option>
                  <option value="오후반차">⛅ 오후반차</option>
                  <option value="출장/교육">🚄 출장/교육</option>
                </select>
              </div>

              {/* 2. Date Picker (2 cols) */}
              <div className="sm:col-span-2 min-w-0">
                <div className="flex items-center gap-1 px-2 py-1 rounded-lg border border-blue-400 bg-white dark:bg-slate-800 shadow-2xs">
                  <Calendar className="w-3 h-3 text-blue-600 shrink-0" />
                  <input
                    type="date"
                    required
                    value={scheduleSelectedDate}
                    onChange={(e) => setScheduleSelectedDate(e.target.value)}
                    className="w-full bg-transparent text-xs font-black text-slate-900 dark:text-white focus:outline-none cursor-pointer py-0.5"
                  />
                </div>
              </div>

              {/* 3. Reason/Memo Input (3 cols) */}
              <div className="sm:col-span-3 min-w-0">
                <input
                  type="text"
                  value={scheduleReasonInput}
                  onChange={(e) => setScheduleReasonInput(e.target.value)}
                  placeholder="내용 입력"
                  className="w-full px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 shadow-2xs placeholder:text-slate-400 placeholder:text-xs"
                />
              </div>

              {/* 4. 사진촬영 우선 & 파일/앨범 첨부 버튼 (2 cols) */}
              <div className="sm:col-span-2 min-w-0 flex items-center gap-1">
                {/* Hidden inputs for camera capture & file picker */}
                <input
                  type="file"
                  ref={scheduleCameraInputRef}
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleScheduleFiles}
                />
                <input
                  type="file"
                  ref={scheduleFileInputRef}
                  accept="image/*,.pdf,.xlsx,.xls,.docx,.doc,.hwp,.txt"
                  multiple
                  className="hidden"
                  onChange={handleScheduleFiles}
                />

                {/* 📸 Camera capture button (촬영 우선) */}
                <button
                  type="button"
                  onClick={() => scheduleCameraInputRef.current?.click()}
                  disabled={isProcessingScheduleFiles}
                  className="flex-1 px-1.5 py-1.5 rounded-lg border border-rose-300 dark:border-rose-800/80 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 text-[11px] font-black flex items-center justify-center gap-0.5 shadow-2xs cursor-pointer transition-all active:scale-95 shrink-0"
                  title="카메라 사진 촬영 (촬영 우선)"
                >
                  <Camera className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  <span className="truncate">촬영</span>
                </button>

                {/* 📁 File / Album attachment button */}
                <button
                  type="button"
                  onClick={() => scheduleFileInputRef.current?.click()}
                  disabled={isProcessingScheduleFiles}
                  className="flex-1 px-1.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-[11px] font-black flex items-center justify-center gap-0.5 shadow-2xs cursor-pointer transition-all active:scale-95 shrink-0"
                  title="앨범 사진 또는 파일 첨부"
                >
                  <ImageIcon className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  <span className="truncate">첨부</span>
                </button>
              </div>

              {/* 5. 전작업자 선택창 (단수/복수 선택) (2 cols) */}
              <div className="sm:col-span-2 relative min-w-0" ref={shareDropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsShareDropdownOpen((prev) => !prev)}
                  className={`w-full px-2 py-1.5 rounded-lg border text-xs font-bold transition-all flex items-center justify-between gap-1 shadow-2xs cursor-pointer ${
                    sharedWorkers.length > 0
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-950/60 text-blue-900 dark:text-blue-100 font-black ring-1 ring-blue-400"
                      : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:border-slate-400"
                  }`}
                  title="원하는 공유 작업자: 선택 시 해당 작업자의 일정에도 함께 등록됩니다"
                >
                  <div className="flex items-center gap-1 truncate min-w-0">
                    <Users className={`w-3.5 h-3.5 shrink-0 ${sharedWorkers.length > 0 ? "text-blue-600" : "text-slate-400"}`} />
                    <span className="truncate text-[11px]">
                      {sharedWorkers.length === 0
                        ? "공유작업자"
                        : sharedWorkers.length === 1
                        ? sharedWorkers[0].name
                        : `${sharedWorkers[0].name} 외 ${sharedWorkers.length - 1}명`}
                    </span>
                  </div>
                  {sharedWorkers.length > 0 ? (
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        setSharedWorkers([]);
                      }}
                      className="p-0.5 hover:bg-blue-200 dark:hover:bg-blue-900 rounded text-slate-400 hover:text-slate-700"
                      title="선택 초기화"
                    >
                      <X className="w-3 h-3" />
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400">▼</span>
                  )}
                </button>

                {/* 전작업자 드롭다운 팝업 */}
                {isShareDropdownOpen && (
                  <div className="absolute right-0 top-full mt-1.5 w-72 sm:w-80 max-w-[calc(100vw-2rem)] bg-white dark:bg-slate-800 rounded-xl shadow-2xl border-2 border-slate-300 dark:border-slate-700 p-2.5 z-50 animate-fadeIn space-y-2">
                    <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-slate-700">
                      <span className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-blue-500" />
                        <span>원하는 공유 작업자 선택</span>
                      </span>
                      {sharedWorkers.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setSharedWorkers([])}
                          className="text-[10.5px] font-bold text-rose-500 hover:underline cursor-pointer"
                        >
                          전체해제
                        </button>
                      )}
                    </div>

                    <div className="max-h-56 overflow-y-auto space-y-2 pr-1 no-scrollbar text-xs">
                      {/* 본사 / 경영진 */}
                      {(() => {
                        const adminList = (ADMIN_USERS || []).filter(
                          (u) => u.id !== currentProfile?.id && u.name !== workerFullName
                        );
                        if (adminList.length === 0) return null;
                        return (
                          <div>
                            <div className="text-[11px] font-black text-indigo-700 dark:text-indigo-400 mb-1.5 flex items-center justify-between p-1.5 px-2 rounded-lg bg-indigo-50/70 hover:bg-indigo-100/80 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/80 select-none">
                              <div className="flex items-center gap-1.5">
                                <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                                <span>본사 / 경영진</span>
                                <span className="text-[9.5px] font-normal text-slate-500 dark:text-slate-400">
                                  ({adminList.length}명)
                                </span>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-1 mb-2">
                              {adminList.map((w) => {
                                const isSelected = sharedWorkers.some((sw) => sw.id === w.id);
                                return (
                                  <button
                                    key={w.id}
                                    type="button"
                                    onClick={() => toggleSharedWorker(w)}
                                    className={`px-2 py-1.5 rounded-lg border text-[11px] font-bold transition-all flex items-center justify-between cursor-pointer active:scale-95 ${
                                      isSelected
                                        ? "bg-indigo-100 dark:bg-indigo-950/80 border-indigo-500 text-indigo-900 dark:text-indigo-100 font-black shadow-2xs ring-1 ring-indigo-400/50"
                                        : "bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-slate-300"
                                    }`}
                                  >
                                    <span>{w.name}</span>
                                    <span className="text-[9.5px] opacity-70">
                                      {isSelected ? "✓" : w.title || "대표"}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })()}

                      {/* 한림공장 작업자 */}
                      <div>
                        {(() => {
                          const plantWorkers =
                            PLANTS[1]?.workers?.filter(
                              (w) => w.id !== currentProfile?.id && w.name !== workerFullName
                            ) || [];
                          const isAllPlantSelected =
                            plantWorkers.length > 0 &&
                            plantWorkers.every((w) => sharedWorkers.some((sw) => sw.id === w.id));

                          return (
                            <div
                              onClick={() => togglePlantSharedWorkers(1)}
                              className="text-[11px] font-black text-emerald-700 dark:text-emerald-400 mb-1.5 flex items-center justify-between p-1.5 px-2 rounded-lg bg-emerald-50/70 hover:bg-emerald-100/80 dark:bg-emerald-950/40 dark:hover:bg-emerald-950/70 border border-emerald-200/80 dark:border-emerald-800/80 cursor-pointer transition-all select-none group active:scale-[0.99]"
                              title="한림공장 작업자 전체 선택 / 해제"
                            >
                              <div className="flex items-center gap-1.5">
                                <Factory className="w-3.5 h-3.5 group-hover:scale-110 transition-transform text-emerald-600" />
                                <span className="group-hover:underline">한림공장</span>
                                <span className="text-[9.5px] font-normal text-slate-500 dark:text-slate-400">
                                  ({plantWorkers.length}명)
                                </span>
                              </div>
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded-md font-black transition-all ${
                                  isAllPlantSelected
                                    ? "bg-emerald-600 text-white shadow-2xs"
                                    : "bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700"
                                }`}
                              >
                                {isAllPlantSelected ? "✓ 전체해제" : "+ 전체선택"}
                              </span>
                            </div>
                          );
                        })()}
                        <div className="grid grid-cols-2 gap-1">
                          {PLANTS[1]?.workers
                            ?.filter((w) => w.id !== currentProfile?.id && w.name !== workerFullName)
                            .map((w) => {
                              const isSelected = sharedWorkers.some((sw) => sw.id === w.id);
                              return (
                                <button
                                  key={w.id}
                                  type="button"
                                  onClick={() => toggleSharedWorker(w)}
                                  className={`px-2 py-1.5 rounded-lg border text-[11px] font-bold transition-all flex items-center justify-between cursor-pointer active:scale-95 ${
                                    isSelected
                                      ? "bg-emerald-100 dark:bg-emerald-950/80 border-emerald-500 text-emerald-900 dark:text-emerald-100 font-black shadow-2xs ring-1 ring-emerald-400/50"
                                      : "bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-slate-300"
                                  }`}
                                >
                                  <span>{w.name}</span>
                                  <span className="text-[9.5px] opacity-70">
                                    {isSelected ? "✓" : w.title || "선임"}
                                  </span>
                                </button>
                              );
                            })}
                        </div>
                      </div>

                      {/* 삼랑진공장 작업자 */}
                      <div>
                        {(() => {
                          const plantWorkers =
                            PLANTS[0]?.workers?.filter(
                              (w) => w.id !== currentProfile?.id && w.name !== workerFullName
                            ) || [];
                          const isAllPlantSelected =
                            plantWorkers.length > 0 &&
                            plantWorkers.every((w) => sharedWorkers.some((sw) => sw.id === w.id));

                          return (
                            <div
                              onClick={() => togglePlantSharedWorkers(0)}
                              className="text-[11px] font-black text-amber-700 dark:text-amber-400 mb-1.5 flex items-center justify-between p-1.5 px-2 rounded-lg bg-amber-50/70 hover:bg-amber-100/80 dark:bg-amber-950/40 dark:hover:bg-amber-950/70 border border-amber-200/80 dark:border-amber-800/80 cursor-pointer transition-all select-none group active:scale-[0.99]"
                              title="삼랑진공장 작업자 전체 선택 / 해제"
                            >
                              <div className="flex items-center gap-1.5">
                                <Factory className="w-3.5 h-3.5 group-hover:scale-110 transition-transform text-amber-600" />
                                <span className="group-hover:underline">삼랑진공장</span>
                                <span className="text-[9.5px] font-normal text-slate-500 dark:text-slate-400">
                                  ({plantWorkers.length}명)
                                </span>
                              </div>
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded-md font-black transition-all ${
                                  isAllPlantSelected
                                    ? "bg-amber-600 text-white shadow-2xs"
                                    : "bg-white dark:bg-slate-800 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700"
                                }`}
                              >
                                {isAllPlantSelected ? "✓ 전체해제" : "+ 전체선택"}
                              </span>
                            </div>
                          );
                        })()}
                        <div className="grid grid-cols-2 gap-1">
                          {PLANTS[0]?.workers
                            ?.filter((w) => w.id !== currentProfile?.id && w.name !== workerFullName)
                            .map((w) => {
                              const isSelected = sharedWorkers.some((sw) => sw.id === w.id);
                              return (
                                <button
                                  key={w.id}
                                  type="button"
                                  onClick={() => toggleSharedWorker(w)}
                                  className={`px-2 py-1.5 rounded-lg border text-[11px] font-bold transition-all flex items-center justify-between cursor-pointer active:scale-95 ${
                                    isSelected
                                      ? "bg-amber-100 dark:bg-amber-950/80 border-amber-500 text-amber-900 dark:text-amber-100 font-black shadow-2xs ring-1 ring-amber-400/50"
                                      : "bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-slate-300"
                                  }`}
                                >
                                  <span>{w.name}</span>
                                  <span className="text-[9.5px] opacity-70">
                                    {isSelected ? "✓" : w.title || "선임"}
                                  </span>
                                </button>
                              );
                            })}
                        </div>
                      </div>
                    </div>

                    <div className="pt-1.5 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                      <span className="text-[10.5px] font-bold text-slate-500">
                        {sharedWorkers.length > 0 ? `${sharedWorkers.length}명 선택됨` : "작업자 선택 안함"}
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsShareDropdownOpen(false)}
                        className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-black text-[11px] cursor-pointer"
                      >
                        선택 완료
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* 6. Submit Button (1 col) */}
              <div className="sm:col-span-1 min-w-0">
                <button
                  type="submit"
                  disabled={scheduleSaving || isProcessingScheduleFiles}
                  className="w-full py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-black text-xs shadow-2xs shadow-blue-500/25 transition-all flex items-center justify-center gap-0.5 cursor-pointer disabled:opacity-50"
                >
                  <span>{scheduleSaving ? "..." : "등록"}</span>
                </button>
              </div>
            </div>

            {/* Attached files preview strip */}
            {(scheduleAttachedFiles.length > 0 || isProcessingScheduleFiles) && (
              <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-slate-100 dark:border-slate-800">
                <span className="text-[10.5px] font-black text-slate-500 dark:text-slate-400 shrink-0 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  <span>첨부 파일 ({scheduleAttachedFiles.length}개):</span>
                </span>
                {isProcessingScheduleFiles && (
                  <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold animate-pulse">
                    파일 압축/처리 중...
                  </span>
                )}
                {scheduleAttachedFiles.map((file, idx) => (
                  <div
                    key={file.id || idx}
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-[10.5px] font-bold shadow-2xs"
                  >
                    {file.fileType === "image" || file.dataUrl?.startsWith("data:image") ? (
                      <img
                        src={file.dataUrl}
                        alt={file.name}
                        onClick={() => setPreviewImageModal({ url: file.dataUrl, name: file.name })}
                        className="w-4 h-4 object-cover rounded shrink-0 cursor-pointer hover:opacity-80"
                        title="클릭하여 사진 크게보기"
                      />
                    ) : (
                      <FileText className="w-3 h-3 text-blue-500 shrink-0" />
                    )}
                    <span className="max-w-[90px] truncate text-slate-800 dark:text-slate-200" title={file.name}>
                      {file.name}
                    </span>
                    <span className="text-[9px] text-slate-400 font-normal">({file.size})</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveScheduleFile(idx)}
                      className="p-0.5 text-slate-400 hover:text-rose-500 rounded transition-colors cursor-pointer"
                      title="첨부 파일 삭제"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Bottom Bar: Registered schedules strip & Weekly mini-calendar toggle */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-slate-800 text-xs">
        {/* Active Registered Schedules List */}
        <div className="flex items-center gap-1.5 flex-wrap min-w-0">
          <span className="text-[11px] font-black text-slate-500 dark:text-slate-400 shrink-0">
            나의 등록 일정:
          </span>
          {myActiveLeaves.length === 0 ? (
            <span className="text-[11px] text-slate-400 italic">등록된 활성 일정이 없습니다.</span>
          ) : (
            myActiveLeaves.map((l) => {
              const isToday = (l.startDate || "") === todayDateStr;
              const isRecipient = Boolean(l.isSharedRecipient || l.sharedBy);
              const isOrigin = Boolean(
                l.isSharedOrigin ||
                (Array.isArray(l.sharedWithDetails) && l.sharedWithDetails.length > 0) ||
                (Array.isArray(l.sharedWith) && l.sharedWith.length > 0)
              );
              const hasNewReply = Boolean(l.hasNewReply);

              return (
                <span
                  key={l.id}
                  onClick={() =>
                    setScheduleDetailModal({
                      selectedDate: l.startDate || todayDateStr,
                      dayName: "",
                      filterTab: isRecipient || isOrigin ? "shared" : "day",
                      isRecipient: isRecipient
                    })
                  }
                  className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-bold border transition-all cursor-pointer hover:shadow-xs active:scale-95 ${
                    isToday
                      ? "bg-blue-600 text-white border-blue-600 shadow-2xs ring-2 ring-blue-400/40 animate-pulse"
                      : "bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-800 hover:border-blue-400"
                  }`}
                  title={`[클릭 시 상세/전체목록 확인] 등록일: ${l.createdAt ? formatKSTDate(l.createdAt) : (l.createdDate || "미상")} ~ 만료일: ${l.endDate || l.startDate}`}
                >
                  <span className="font-extrabold">{l.startDate?.slice(5)}</span>
                  <span className="opacity-90">{l.leaveType}</span>
                  {l.reason && l.reason !== l.leaveType && (
                    <span className="max-w-[120px] truncate text-[10.5px] opacity-85">({l.reason})</span>
                  )}
                  {isRecipient && (
                    <span className="text-[9.5px] px-1 py-0.2 rounded bg-purple-600 text-white font-black shrink-0 flex items-center gap-0.5" title={`${l.sharedBy}님이 공유함 (삭제 시 답장 전송 필요)`}>
                      <MessageCircle className="w-2.5 h-2.5" />
                      <span>공유받음</span>
                    </span>
                  )}
                  {isOrigin && (
                    <span className="text-[9.5px] px-1 py-0.2 rounded bg-indigo-600 text-white font-black shrink-0 flex items-center gap-0.5" title={`공유 대상: ${(l.sharedWithDetails?.length || l.sharedWith?.length || 0)}명`}>
                      <Users className="w-2.5 h-2.5" />
                      <span>공유 {l.sharedWithDetails?.length || l.sharedWith?.length || 0}명</span>
                      {hasNewReply && <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping ml-0.5" />}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRequestDismissOrDelete(l, "dismiss");
                    }}
                    className={`p-0.5 rounded transition-all cursor-pointer ${
                      isToday ? "hover:bg-blue-700 text-white/80 hover:text-white" : "hover:bg-blue-200 dark:hover:bg-blue-900 text-slate-400 hover:text-slate-700"
                    }`}
                    title={isRecipient ? "답장 작성 후 삭제" : "일정 삭제 (공유 작업자 포함 자동 삭제)"}
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              );
            })
          )}
        </div>

        {/* Toggle Weekly Calendar View Button & All List Quick Button */}
        <div className="flex items-center gap-1.5 ml-auto">
          <button
            type="button"
            onClick={() =>
              setScheduleDetailModal({
                selectedDate: scheduleSelectedDate || todayDateStr,
                dayName: "",
                filterTab: "shared",
                isRecipient: false
              })
            }
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/70 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 text-xs font-black transition-all cursor-pointer border border-indigo-200 dark:border-indigo-800 shadow-2xs"
            title="공유답장 및 전체 등록 일정 목록 팝업 열기"
          >
            <FileText className="w-3 h-3 text-indigo-600" />
            <span>전체 리스트</span>
          </button>

          <button
            type="button"
            onClick={() => setShowMiniCalendar((prev) => !prev)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-black transition-all cursor-pointer border border-slate-200 dark:border-slate-700"
          >
            <Calendar className="w-3 h-3 text-blue-600" />
            <span>{showMiniCalendar ? "달력 접기" : "주차별 달력보기"}</span>
            <span className="text-[10px] text-slate-400">{showMiniCalendar ? "▲" : "▼"}</span>
          </button>
        </div>
      </div>

      {/* Collapsible Weekly Calendar Grid */}
      {showMiniCalendar && (
        <div className="pt-2 border-t border-slate-200/70 dark:border-slate-800 space-y-1.5 animate-fadeIn">
          <div className="flex items-center justify-between px-1 flex-wrap gap-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                <span>{scheduleWeekAnchor.slice(0, 7)} 주간 일정 현황</span>
              </span>
              <span className="text-[10.5px] text-slate-400 font-bold hidden sm:inline">
                (날짜나 일정을 탭하면 전체 리스트가 팝업됩니다)
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handlePrevWeek}
                className="p-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-black"
              >
                ◀ 이전주
              </button>
              <button
                type="button"
                onClick={handleResetToToday}
                className="px-2 py-1 rounded bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-300 text-[11px] font-black border border-blue-200 dark:border-blue-900"
              >
                오늘
              </button>
              <button
                type="button"
                onClick={handleNextWeek}
                className="p-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-black"
              >
                다음주 ▶
              </button>
            </div>
          </div>

          {/* 7 Days Row */}
          <div className="grid grid-cols-7 gap-1">
            {myWeeklyCalendarDays.map((day) => {
              const isSun = day.dayOfWeek === 0;
              const isSat = day.dayOfWeek === 6;
              const hasRecip = day.events.some((e) => e.isSharedRecipient || e.sharedBy);

              return (
                <div
                  key={day.dateStr}
                  onClick={() => {
                    setScheduleSelectedDate(day.dateStr);
                    setScheduleDetailModal({
                      selectedDate: day.dateStr,
                      dayName: day.dayName,
                      filterTab: day.events.length > 0 ? "day" : "all",
                      isRecipient: hasRecip
                    });
                  }}
                  className={`p-1.5 rounded-lg border text-center transition-all cursor-pointer min-h-[68px] flex flex-col justify-between hover:shadow-xs group ${
                    day.isSelected
                      ? "ring-2 ring-blue-500 border-blue-500 bg-blue-50/70 dark:bg-blue-950/50"
                      : day.isToday
                      ? "bg-amber-50/60 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800"
                      : "bg-slate-50/50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700"
                  }`}
                  title={`[탭 시 전체리스트 팝업] ${day.dateStr} (${day.dayName}) 등록 일정: ${day.events.length}건`}
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className={`font-black ${isSun ? "text-rose-600" : isSat ? "text-blue-600" : "text-slate-700 dark:text-slate-300"}`}>
                      {day.dayName}
                    </span>
                    <span className={`text-[10px] font-bold ${day.isToday ? "px-1 rounded bg-amber-500 text-white font-black" : "text-slate-500"}`}>
                      {day.month}/{day.dayNumber}
                    </span>
                  </div>

                  <div className="space-y-0.5 mt-1 overflow-hidden">
                    {day.events.length === 0 ? (
                      <span className="text-[10px] text-slate-300 dark:text-slate-600 block">-</span>
                    ) : (
                      day.events.slice(0, 2).map((ev) => {
                        const isDone = Boolean(ev.isCompleted || ev.isDismissed);
                        const isTodo = ev.leaveType === "할일" || ev.leaveType?.includes("할일");
                        const isRecip = Boolean(ev.isSharedRecipient || ev.sharedBy);
                        const displayText = isTodo
                          ? (ev.reason && ev.reason !== "할일" ? `📝 ${ev.reason}` : "📝 할일")
                          : (ev.reason && ev.reason !== ev.leaveType ? `${ev.leaveType} (${ev.reason})` : ev.leaveType);

                        return (
                          <div
                            key={ev.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setScheduleSelectedDate(day.dateStr);
                              setScheduleDetailModal({
                                selectedDate: day.dateStr,
                                dayName: day.dayName,
                                filterTab: "day",
                                isRecipient: isRecip
                              });
                            }}
                            className={`text-[9.5px] px-1 py-0.5 rounded font-bold truncate text-left transition-all ${
                              isDone
                                ? "bg-slate-200/90 dark:bg-slate-800/90 text-slate-400 dark:text-slate-500 border border-slate-300 dark:border-slate-700/80 opacity-75 shadow-none"
                                : isTodo
                                ? "bg-amber-100 dark:bg-amber-950/80 hover:bg-amber-200 dark:hover:bg-amber-900 text-amber-950 dark:text-amber-100 border border-amber-300 dark:border-amber-700 shadow-2xs"
                                : isRecip
                                ? "bg-purple-100 dark:bg-purple-900/60 hover:bg-purple-200 dark:hover:bg-purple-800 text-purple-900 dark:text-purple-200 border border-purple-200 dark:border-purple-800"
                                : "bg-blue-100 dark:bg-blue-900/60 hover:bg-blue-200 dark:hover:bg-blue-800 text-blue-900 dark:text-blue-200"
                            }`}
                            title={`${isDone ? "[완료됨] " : ""}${ev.leaveType}: ${ev.reason || ""} (탭하여 전체 리스트 보기)`}
                          >
                            <span className={isDone ? "line-through decoration-slate-400 dark:decoration-slate-500 decoration-1" : ""}>
                              {isDone ? `✓ ${displayText}` : displayText}
                            </span>
                          </div>
                        );
                      })
                    )}
                    {day.events.length > 2 && (
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          setScheduleSelectedDate(day.dateStr);
                          setScheduleDetailModal({
                            selectedDate: day.dateStr,
                            dayName: day.dayName,
                            filterTab: "day",
                            isRecipient: hasRecip
                          });
                        }}
                        className="text-[9px] text-blue-600 dark:text-blue-400 font-bold block hover:underline"
                      >
                        +{day.events.length - 2}건 상세▶
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
