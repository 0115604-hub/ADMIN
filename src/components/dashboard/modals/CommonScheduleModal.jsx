import React from "react";
import {
  Calendar,
  Clock,
  Plus,
  Trash2,
  Filter,
  CheckCheck,
  FileCheck,
  CalendarDays,
  MessageCircle
} from "lucide-react";
import { formatKSTDate } from "../../../utils/dateUtils";

export default function CommonScheduleModal({
  commonScheduleModalOpen,
  setCommonScheduleModalOpen,
  commonScheduleForm,
  setCommonScheduleForm,
  commonScheduleSaving,
  handleRegisterCommonSchedule,
  todayDateStr,
  TIME_OPTIONS_30MIN,
  scheduleCounts,
  commonScheduleFilterTab,
  setCommonScheduleFilterTab,
  modalFilteredSchedules,
  currentProfile,
  isAdmin,
  handleToggleCompleteCommonSchedule,
  handleDeleteCommonSchedule,
  setSelectedCommonScheduleForComments
}) {
  const [editingCommonScheduleId, setEditingCommonScheduleId] = React.useState(null);

  if (!commonScheduleModalOpen) return null;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) setCommonScheduleModalOpen(false);
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn overflow-y-auto cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 my-6 animate-scaleUp cursor-default"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base sm:text-lg text-slate-900 dark:text-white">
                공통 일정 관리 & 실시간 완료 체크
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                등록된 일정은 메인 대시보드와 매일 아침 브리핑에 자동 반영됩니다.
              </p>
            </div>
          </div>
          <button
            onClick={() => setCommonScheduleModalOpen(false)}
            className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* 1. 새로운 일정 등록 / 수정 폼 */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 text-blue-600" />
              <span>{editingCommonScheduleId ? "공통 일정 수정" : "새 공통 일정 등록"}</span>
            </span>
            {editingCommonScheduleId && (
              <button
                type="button"
                onClick={() => {
                  setEditingCommonScheduleId(null);
                  setCommonScheduleForm({
                    title: "",
                    date: todayDateStr,
                    time: "09:00",
                    category: "회의",
                    author: currentProfile?.name || "관리자"
                  });
                }}
                className="text-[11px] font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                새로 등록하기로 전환
              </button>
            )}
          </div>

          <form onSubmit={handleRegisterCommonSchedule} className="space-y-3.5">
            {/* 카테고리 칩 선택 */}
            <div className="flex flex-wrap gap-1.5">
              {[
                { key: "회의", label: "회의", activeBg: "bg-indigo-600 text-white border-indigo-600" },
                { key: "점검", label: "점검", activeBg: "bg-emerald-600 text-white border-emerald-600" },
                { key: "납기", label: "납기", activeBg: "bg-amber-600 text-white border-amber-600" },
                { key: "출장", label: "출장", activeBg: "bg-purple-600 text-white border-purple-600" },
                { key: "손님방문", label: "손님방문", activeBg: "bg-pink-600 text-white border-pink-600" },
                { key: "세미나", label: "세미나", activeBg: "bg-blue-600 text-white border-blue-600" },
                { key: "행사", label: "행사", activeBg: "bg-cyan-600 text-white border-cyan-600" },
                { key: "기타", label: "기타", activeBg: "bg-slate-700 text-white border-slate-700" }
              ].map((cat) => {
                const isSelected = (commonScheduleForm.category || "회의") === cat.key;
                return (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => setCommonScheduleForm({ ...commonScheduleForm, category: cat.key })}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all border ${
                      isSelected
                        ? `${cat.activeBg} shadow-sm scale-102`
                        : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300"
                    }`}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>

            {/* 일자 & 시간 선택 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                  일정 일자
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="date"
                    value={commonScheduleForm.date || todayDateStr}
                    onChange={(e) =>
                      setCommonScheduleForm({ ...commonScheduleForm, date: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setCommonScheduleForm({ ...commonScheduleForm, date: todayDateStr })}
                    className={`px-2.5 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-colors border ${
                      (commonScheduleForm.date || todayDateStr) === todayDateStr
                        ? "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800"
                        : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    오늘
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                  시작 시간
                </label>
                <div className="relative">
                  <input
                    type="time"
                    value={commonScheduleForm.time || "09:00"}
                    onChange={(e) =>
                      setCommonScheduleForm({ ...commonScheduleForm, time: e.target.value })
                    }
                    className="w-full px-3 py-2 pl-8 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                  />
                  <Clock className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                {/* 30분 단위 빠른 선택 칩 */}
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {(TIME_OPTIONS_30MIN || [
                    "08:30", "09:00", "09:30", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"
                  ]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setCommonScheduleForm({ ...commonScheduleForm, time: t })}
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-lg border transition-all ${
                        (commonScheduleForm.time || "09:00") === t
                          ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                          : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 일정 제목 입력 */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                일정 제목 / 내용
              </label>
              <input
                type="text"
                placeholder="예: 삼랑진공장 설비 정기 점검 회의 (2공장 2층 회의실)"
                value={commonScheduleForm.title || ""}
                onChange={(e) =>
                  setCommonScheduleForm({ ...commonScheduleForm, title: e.target.value })
                }
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                required
              />
            </div>

            {/* 등록 / 수정 제출 버튼 */}
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="submit"
                disabled={commonScheduleSaving}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-xs shadow-md shadow-blue-500/25 active:scale-95 transition-all disabled:opacity-50"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{commonScheduleSaving ? "등록 중..." : editingCommonScheduleId ? "일정 수정 완료" : "공통 일정 등록"}</span>
              </button>
            </div>
          </form>
        </div>

        {/* 2. 등록된 일정 목록 & 탭 필터 */}
        <div className="space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                <CalendarDays className="w-4 h-4 text-blue-600" />
                <span>등록된 일정 목록</span>
              </span>
              <span className="text-[11px] text-slate-400 font-bold">
                (총 {scheduleCounts?.all || 0}건)
              </span>
            </div>

            {/* 필터 탭 */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold">
              <button
                type="button"
                onClick={() => setCommonScheduleFilterTab("all")}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  commonScheduleFilterTab === "all"
                    ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-2xs font-black"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800"
                }`}
              >
                전체 ({scheduleCounts?.all || 0})
              </button>
              <button
                type="button"
                onClick={() => setCommonScheduleFilterTab("active")}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  commonScheduleFilterTab === "active"
                    ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-2xs font-black"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800"
                }`}
              >
                진행중 ({scheduleCounts?.active || 0})
              </button>
              <button
                type="button"
                onClick={() => setCommonScheduleFilterTab("completed")}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  commonScheduleFilterTab === "completed"
                    ? "bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-2xs font-black"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800"
                }`}
              >
                완료됨 ({scheduleCounts?.completed || 0})
              </button>
            </div>
          </div>

          {/* 일정 리스트 뷰 */}
          <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
            {(!modalFilteredSchedules || modalFilteredSchedules.length === 0) ? (
              <div className="p-8 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
                {commonScheduleFilterTab === "completed"
                  ? "완료 처리된 일정이 없습니다."
                  : commonScheduleFilterTab === "active"
                  ? "현재 진행 중인 공통 일정이 없습니다."
                  : "등록된 공통 일정이 없습니다. 위에서 새 일정을 등록해보세요!"}
              </div>
            ) : (
              modalFilteredSchedules.map((item) => {
                const isCompleted = Boolean(item.isCompleted);
                const schedDate = item.startDate || item.date || todayDateStr;
                const regDate = item.createdAt ? formatKSTDate(item.createdAt) : schedDate;
                const isToday = schedDate === todayDateStr;

                return (
                  <div
                    key={item.id}
                    className={`p-3 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
                      isCompleted
                        ? "bg-slate-50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-800/70 opacity-60"
                        : isToday
                        ? "bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/60 shadow-2xs"
                        : "bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 shadow-2xs hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      {/* 완료 체크박스 버튼 */}
                      <button
                        type="button"
                        onClick={() => handleToggleCompleteCommonSchedule(item.id, isCompleted)}
                        className={`p-1.5 rounded-xl border mt-0.5 transition-all ${
                          isCompleted
                            ? "bg-emerald-600 text-white border-emerald-600"
                            : "bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-transparent hover:border-emerald-500"
                        }`}
                        title={isCompleted ? "완료 취소하기" : "완료 체크하기"}
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                      </button>

                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                            {item.category || "일정"}
                          </span>
                          <span className={`text-[11px] font-bold ${isToday ? "text-blue-600 dark:text-blue-400" : "text-slate-500 dark:text-slate-400"}`}>
                            {schedDate} {item.time ? `(${item.time})` : ""}
                          </span>
                          {isToday && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-blue-600 text-white">
                              오늘
                            </span>
                          )}
                          {isCompleted && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                              완료됨
                            </span>
                          )}
                        </div>

                        <p className={`text-xs font-bold leading-snug break-words ${
                          isCompleted ? "line-through text-slate-400" : "text-slate-900 dark:text-white"
                        }`}>
                          {item.title}
                        </p>

                        <div className="flex items-center gap-2 text-[10px] text-slate-400">
                          <span>작성: {item.author || "관리자"}</span>
                          <span>•</span>
                          <span>등록일: {regDate}</span>
                        </div>
                      </div>
                    </div>

                    {/* 액션 버튼들 */}
                    <div className="flex items-center gap-1 shrink-0">
                      {/* 의견 / 댓글 팝업 열기 */}
                      <button
                        type="button"
                        onClick={() => setSelectedCommonScheduleForComments(item)}
                        className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-blue-600 transition-colors relative"
                        title="의견 및 댓글 확인"
                      >
                        <MessageCircle className="w-4 h-4" />
                        {Array.isArray(item.comments) && item.comments.length > 0 && (
                          <span className="absolute -top-1 -right-1 px-1 rounded-full text-[9px] font-black bg-rose-500 text-white">
                            {item.comments.length}
                          </span>
                        )}
                      </button>

                      {/* 수정 버튼 */}
                      <button
                        type="button"
                        onClick={() => {
                          setEditingCommonScheduleId(item.id);
                          setCommonScheduleForm({
                            title: item.title,
                            date: item.startDate || item.date || todayDateStr,
                            time: item.time || "09:00",
                            category: item.category || "회의",
                            author: item.author || currentProfile?.name || "관리자"
                          });
                        }}
                        className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 transition-colors"
                        title="수정하기"
                      >
                        ✏️
                      </button>

                      {/* 삭제 버튼 */}
                      {(currentProfile?.name === item.author || isAdmin) && (
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm("이 일정을 삭제하시겠습니까?")) {
                              handleDeleteCommonSchedule(item.id);
                            }
                          }}
                          className="p-1.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-600 transition-colors"
                          title="삭제하기"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={() => setCommonScheduleModalOpen(false)}
            className="px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white font-bold text-xs shadow-sm active:scale-95 transition-all"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
