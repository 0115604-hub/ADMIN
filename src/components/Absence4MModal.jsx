import React from "react";
import { CheckCircle2 } from "lucide-react";
import { useModalHistory } from "../utils/modalHistory";
import { useAbsence4MState } from "./absence/useAbsence4MState";
import Absence4MHeaderNav from "./absence/Absence4MHeaderNav";
import Absence4MCardItem from "./absence/Absence4MCardItem";

/**
 * Absence4MModal
 * 4M Man 변경점 (결근 관리 및 대체인원 투입) 모달 파사드 컴포넌트
 */
export default function Absence4MModal({
  isOpen,
  onClose,
  initialCompany = "오륙",
  selectedDay = 6,
  currentYear = 2026,
  currentMonth = 10,
  attendanceMatrix = [],
  onSaveSyncWithReports
}) {
  useModalHistory(isOpen, onClose, "absence4MModal");

  const {
    selectedCompanyTab,
    setSelectedCompanyTab,
    modalDay,
    setModalDay,
    searchTerm,
    setSearchTerm,
    copiedId,
    personnelCardsMap,
    allWorkers,
    detectedAbsentWorkers,
    displayEntries,
    metrics,
    handleSaveEntry,
    handleDeleteEntry
  } = useAbsence4MState({
    isOpen,
    initialCompany,
    selectedDay,
    currentYear,
    currentMonth,
    attendanceMatrix
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-2 sm:p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-slate-900 border-2 border-slate-700 w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-white">
        <Absence4MHeaderNav
          currentYear={currentYear}
          currentMonth={currentMonth}
          modalDay={modalDay}
          setModalDay={setModalDay}
          onClose={onClose}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          selectedCompanyTab={selectedCompanyTab}
          setSelectedCompanyTab={setSelectedCompanyTab}
          detectedAbsentWorkers={detectedAbsentWorkers}
          metrics={metrics}
        />

        {/* 📋 4M 변경점 메인 리스트 */}
        <div className="p-4 space-y-4 overflow-y-auto flex-1">
          {displayEntries.length === 0 ? (
            <div className="py-12 px-4 text-center rounded-2xl bg-slate-950/50 border border-slate-800 space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-black text-white">
                  {currentMonth}월 {modalDay}일 등록된 결근 인원이 없습니다.
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  선택된 {selectedCompanyTab === "전체" ? "5개사 전 사업장" : selectedCompanyTab}에서 {currentMonth}월 {modalDay}일 전원 정상 출근 상태입니다.
                </p>
              </div>
            </div>
          ) : (
            displayEntries.map((item, index) => (
              <Absence4MCardItem
                key={item.id || `entry_${index}`}
                item={item}
                allWorkers={allWorkers}
                personnelCardsMap={personnelCardsMap}
                onSave={handleSaveEntry}
                onDelete={handleDeleteEntry}
                isCopied={copiedId === item.id || copiedId === `saved_${item.id}`}
                currentMonth={currentMonth}
                selectedDay={modalDay}
              />
            ))
          )}
        </div>

        {/* 📌 모달 하단 액션 바 */}
        <div className="bg-slate-950 p-3 sm:p-4 border-t border-slate-800 flex items-center justify-between gap-2 shrink-0">
          <span className="text-[11px] text-slate-400 font-mono">
            📅 {currentMonth}월 {modalDay}일: 총 <strong className="text-cyan-400 font-bold">{displayEntries.length}건</strong>의 결근 및 대체투입 현황 (조치완료 <strong className="text-emerald-400 font-bold">{displayEntries.filter((e) => e.actionResult || e.substituteWorker?.name).length}건</strong>)
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs transition-all cursor-pointer"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
