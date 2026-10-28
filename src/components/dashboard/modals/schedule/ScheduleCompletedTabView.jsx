import React from "react";
import { CheckCircle2 } from "lucide-react";
import ScheduleItemCard from "./ScheduleItemCard";

/**
 * ScheduleCompletedTabView
 * Dedicated view for finished and completed schedule records
 */
export default function ScheduleCompletedTabView({
  list = [],
  workerFullName,
  workerPlant,
  handleReactivateLeave,
  handleDeleteLeave,
  handleRequestDismissOrDelete,
  setPreviewImageModal
}) {
  if (list.length === 0) {
    return (
      <div className="py-10 text-center space-y-3">
        <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500 mx-auto flex items-center justify-center">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <p className="text-xs font-bold text-slate-500">
          완료되거나 마무리가 끝난 일정이 없습니다.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-300 pb-1">
        <span className="flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>완료 및 마무리된 일정 목록 ({list.length}건)</span>
        </span>
        <span className="text-[10.5px] text-slate-400 font-normal">
          실수로 완료한 경우 '진행중으로 복구'가 가능합니다
        </span>
      </div>

      {list.map((item) => (
        <ScheduleItemCard
          key={item.id}
          item={item}
          workerFullName={workerFullName}
          workerPlant={workerPlant}
          handleReactivateLeave={handleReactivateLeave}
          handleDeleteLeave={handleDeleteLeave}
          handleRequestDismissOrDelete={handleRequestDismissOrDelete}
          setPreviewImageModal={setPreviewImageModal}
          variant="completed"
        />
      ))}
    </div>
  );
}
