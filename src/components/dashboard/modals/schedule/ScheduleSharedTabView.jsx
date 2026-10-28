import React from "react";
import { MessageCircle, CheckCheck } from "lucide-react";
import ScheduleItemCard from "./ScheduleItemCard";

/**
 * ScheduleSharedTabView
 * Dedicated view for shared schedules & colleague replies
 */
export default function ScheduleSharedTabView({
  list = [],
  todayDateStr,
  workerFullName,
  workerPlant,
  handleReactivateLeave,
  handleDeleteLeave,
  handleRequestDismissOrDelete,
  setPreviewImageModal
}) {
  const activeShared = list.filter((l) => !l.isCompleted && !l.isDismissed && l.replyStatus !== "REPLIED" && !l.replyText);
  const repliedShared = list.filter((l) => l.isCompleted || l.isDismissed || l.replyStatus === "REPLIED" || Boolean(l.replyText));

  if (activeShared.length === 0 && repliedShared.length === 0) {
    return (
      <div className="py-10 text-center space-y-3">
        <div className="w-12 h-12 rounded-full bg-purple-50 dark:bg-purple-950/40 text-purple-500 mx-auto flex items-center justify-center">
          <MessageCircle className="w-6 h-6" />
        </div>
        <p className="text-xs font-bold text-slate-500">
          공유받거나 동료에게 보낸 공유답장 내역이 없습니다.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 1. 진행 중인 공유 일정 (미답장 / 확인 대기) */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-200 pb-0.5">
          <span className="flex items-center gap-1.5">
            <MessageCircle className="w-4 h-4 text-purple-600" />
            <span>진행 중인 공유 일정 ({activeShared.length}건)</span>
          </span>
          <span className="text-[10.5px] text-slate-400 font-normal">
            답장 작성 후 삭제하거나 회신을 확인할 수 있습니다
          </span>
        </div>

        {activeShared.length === 0 ? (
          <div className="py-3.5 px-3 text-center text-xs font-bold text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
            현재 대기 중인 공유 일정이 없습니다.
          </div>
        ) : (
          <div className="space-y-2.5">
            {activeShared.map((item) => (
              <ScheduleItemCard
                key={item.id}
                item={item}
                isToday={(item.startDate || "") === todayDateStr}
                workerFullName={workerFullName}
                workerPlant={workerPlant}
                handleReactivateLeave={handleReactivateLeave}
                handleDeleteLeave={handleDeleteLeave}
                handleRequestDismissOrDelete={handleRequestDismissOrDelete}
                setPreviewImageModal={setPreviewImageModal}
                variant="shared_active"
              />
            ))}
          </div>
        )}
      </div>

      {/* 2. 답장 후 삭제 및 완료된 공유 이력 (별도 구분 섹션) */}
      <div className="pt-3 border-t border-slate-200 dark:border-slate-700 space-y-2.5">
        <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-200 pb-0.5">
          <span className="flex items-center gap-1.5">
            <CheckCheck className="w-4 h-4 text-emerald-600" />
            <span>✓ 답장 후 삭제 및 완료된 공유 이력 ({repliedShared.length}건)</span>
          </span>
          <span className="text-[10.5px] text-slate-400 font-normal">
            실수로 삭제/완료한 경우 '진행중으로 복구'할 수 있습니다
          </span>
        </div>

        {repliedShared.length === 0 ? (
          <div className="py-3.5 px-3 text-center text-xs font-bold text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
            답장 후 삭제되거나 마무리된 공유 이력이 없습니다.
          </div>
        ) : (
          <div className="space-y-2">
            {repliedShared.map((item) => (
              <ScheduleItemCard
                key={item.id}
                item={item}
                workerFullName={workerFullName}
                workerPlant={workerPlant}
                handleReactivateLeave={handleReactivateLeave}
                handleDeleteLeave={handleDeleteLeave}
                handleRequestDismissOrDelete={handleRequestDismissOrDelete}
                setPreviewImageModal={setPreviewImageModal}
                variant="shared_replied"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
