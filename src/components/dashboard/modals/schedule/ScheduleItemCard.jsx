import React from "react";
import {
  Calendar,
  CheckCheck,
  MessageCircle,
  Users,
  RotateCcw,
  Trash2,
  User
} from "lucide-react";
import { formatKSTDateTime } from "../../../../utils/dateUtils";
import ScheduleAttachmentsList from "./ScheduleAttachmentsList";

/**
 * ScheduleItemCard
 * Reusable card item representing a single leave / schedule entry with actions & attachments
 */
export default function ScheduleItemCard({
  item,
  isToday = false,
  workerFullName,
  workerPlant,
  handleReactivateLeave,
  handleDeleteLeave,
  handleRequestDismissOrDelete,
  setPreviewImageModal,
  variant = "active" // "active" | "completed" | "shared_active" | "shared_replied"
}) {
  const isRecipient = Boolean(item.isSharedRecipient || item.sharedBy);
  const isOrigin = Boolean(
    item.isSharedOrigin ||
    (Array.isArray(item.sharedWithDetails) && item.sharedWithDetails.length > 0) ||
    (Array.isArray(item.sharedWith) && item.sharedWith.length > 0)
  );

  const repliedCount = Array.isArray(item.sharedWithDetails)
    ? item.sharedWithDetails.filter((d) => d.status === "REPLIED" || Boolean(d.replyText)).length
    : 0;
  const totalSharedCount = Array.isArray(item.sharedWithDetails)
    ? item.sharedWithDetails.length
    : (item.sharedWith?.length || 0);

  const completeTime = item.completedAt || item.replyAt || item.updatedAt;
  const isDone = variant === "completed" || variant === "shared_replied";

  if (isDone) {
    return (
      <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/90 dark:bg-slate-800/70 shadow-2xs space-y-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="px-2 py-0.5 rounded-md bg-slate-600 text-white text-xs font-bold flex items-center gap-1">
              <span>{item.leaveType}</span>
            </span>
            <span className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-600 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-slate-500" />
              <span>
                {item.startDate}
                {item.endDate && item.endDate !== item.startDate ? ` ~ ${item.endDate}` : ""}
              </span>
            </span>
            <span
              className={`px-2 py-0.5 rounded-md text-[11px] font-black border flex items-center gap-1 ${
                variant === "shared_replied"
                  ? "bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border-purple-300 dark:border-purple-800"
                  : "bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800"
              }`}
            >
              <CheckCheck className={`w-3 h-3 ${variant === "shared_replied" ? "text-purple-600" : "text-emerald-600"}`} />
              <span>
                {variant === "shared_replied"
                  ? isRecipient
                    ? `답장 완료 (${item.sharedBy || "동료"})`
                    : "회신 완료 및 삭제"
                  : isRecipient
                  ? "답장 및 마무리 완료"
                  : "완료됨"}
              </span>
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleReactivateLeave(item)}
              className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-700 hover:bg-blue-50 dark:hover:bg-blue-950 text-blue-600 dark:text-blue-300 text-[11px] font-bold border border-blue-200 dark:border-blue-800 shadow-2xs transition-all cursor-pointer flex items-center gap-1"
              title="일정을 다시 '진행중' 상태로 복구합니다"
            >
              <RotateCcw className="w-3 h-3" />
              <span>진행중으로 복구</span>
            </button>

            <button
              type="button"
              onClick={() => handleDeleteLeave(item.id, item.originLeaveId)}
              className="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900 text-rose-600 dark:text-rose-300 text-[11px] font-bold border border-rose-200 dark:border-rose-800 shadow-2xs transition-all cursor-pointer flex items-center gap-1"
              title="일정 완전 삭제 (공유된 작업자의 일정에서도 자동 삭제)"
            >
              <Trash2 className="w-3 h-3" />
              <span>삭제</span>
            </button>
          </div>
        </div>

        <div className="p-2 rounded-lg bg-white dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-slate-100 space-y-1">
          <div>
            <span className="text-slate-400 font-normal mr-1.5">내용:</span>
            <span>{item.reason || item.leaveType}</span>
          </div>

          {isRecipient && item.replyText && (
            <div
              className={`mt-1 pt-1 border-t text-[11px] ${
                variant === "shared_replied"
                  ? "border-purple-100 dark:border-purple-900/50 text-purple-800 dark:text-purple-300"
                  : "border-slate-100 dark:border-slate-800 text-purple-800 dark:text-purple-300"
              }`}
            >
              내가 보낸 답장: <strong className="font-black">"{item.replyText}"</strong>
            </div>
          )}

          {variant === "shared_replied" && isOrigin && Array.isArray(item.sharedWithDetails) && item.sharedWithDetails.length > 0 && (
            <div className="mt-1 pt-1 border-t border-indigo-100 dark:border-indigo-900/50 text-[11px] flex flex-wrap gap-1">
              {item.sharedWithDetails.map((d, dIdx) => (
                <span key={dIdx} className="text-slate-600 dark:text-slate-300">
                  {d.name}: <strong>"{d.replyText || "확인"}"</strong>
                </span>
              ))}
            </div>
          )}

          <ScheduleAttachmentsList
            item={item}
            setPreviewImageModal={setPreviewImageModal}
            borderTopClass={variant === "shared_replied" ? "border-t border-slate-200/60 dark:border-slate-700/60" : "border-t border-slate-100 dark:border-slate-800"}
          />
        </div>

        <div className="flex items-center justify-between text-[10.5px] text-slate-400 pt-0.5 flex-wrap gap-1">
          <span>작성: {item.userName || workerFullName} ({item.plant || workerPlant})</span>
          {completeTime && (
            <span>
              {variant === "shared_replied" ? "처리 시각: " : "완료 시각: "}
              {formatKSTDateTime(completeTime)}
            </span>
          )}
        </div>
      </div>
    );
  }

  // Active / Shared Active Card
  const cardBorderClass =
    variant === "shared_active"
      ? "border-purple-200 dark:border-purple-800/80 bg-white dark:bg-slate-800 shadow-2xs"
      : isToday
      ? "bg-blue-50/70 dark:bg-blue-950/40 border-blue-400/80 shadow-xs ring-1 ring-blue-400/30"
      : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-2xs";

  return (
    <div className={`p-3.5 rounded-xl border transition-all space-y-2.5 ${cardBorderClass}`}>
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="px-2 py-0.5 rounded-md bg-blue-600 text-white text-xs font-black shadow-2xs flex items-center gap-1">
            <span>{item.leaveType}</span>
          </span>

          <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-600 flex items-center gap-1">
            <Calendar className="w-3 h-3 text-blue-500" />
            <span>
              {item.startDate}
              {item.endDate && item.endDate !== item.startDate ? ` ~ ${item.endDate}` : ""}
            </span>
          </span>

          {isToday && (
            <span className="px-1.5 py-0.2 rounded bg-amber-500 text-white text-[10px] font-black animate-pulse">
              오늘
            </span>
          )}

          {isRecipient && (
            <span className="px-2 py-0.5 rounded-md bg-purple-600 text-white text-[11px] font-black flex items-center gap-1">
              <MessageCircle className="w-3 h-3" />
              <span>공유받음 ({item.sharedBy || "동료작업자"})</span>
            </span>
          )}

          {isOrigin && (
            <span className="px-2 py-0.5 rounded-md bg-indigo-600 text-white text-[11px] font-black flex items-center gap-1">
              <Users className="w-3 h-3" />
              <span>공유 {totalSharedCount}명 {repliedCount > 0 ? `(회신 ${repliedCount}/${totalSharedCount})` : ""}</span>
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5">
          {isRecipient ? (
            <button
              type="button"
              onClick={() => handleRequestDismissOrDelete(item, "dismiss")}
              className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-[11px] font-black shadow-xs transition-all cursor-pointer flex items-center gap-1"
              title="보낸 작업자에게 답장을 보내고 내 일정에서 완전 삭제합니다"
            >
              <MessageCircle className="w-3 h-3" />
              <span>답장 후 삭제</span>
            </button>
          ) : isOrigin ? (
            <button
              type="button"
              onClick={() => handleRequestDismissOrDelete(item, "dismiss")}
              className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 text-[11px] font-black border border-indigo-200 dark:border-indigo-800 transition-all cursor-pointer flex items-center gap-1"
              title="공유 작업자들의 회신 내용을 확인하고 완료/삭제합니다"
            >
              <Users className="w-3 h-3" />
              <span>회신 확인 및 완료</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleRequestDismissOrDelete(item, "dismiss")}
              className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold border border-emerald-200 dark:border-emerald-800 transition-all cursor-pointer flex items-center gap-0.5"
              title="일정 완료 처리"
            >
              <CheckCheck className="w-3 h-3" />
              <span>완료</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => handleDeleteLeave(item.id, item.originLeaveId)}
            className="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900 text-rose-600 dark:text-rose-300 text-[11px] font-bold border border-rose-200 dark:border-rose-800 shadow-2xs transition-all cursor-pointer flex items-center gap-1"
            title="일정 완전 삭제 (공유된 작업자의 일정에서도 자동 삭제)"
          >
            <Trash2 className="w-3 h-3" />
            <span>삭제</span>
          </button>
        </div>
      </div>

      {/* Content / Reason */}
      <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-slate-100 space-y-1">
        <div>
          <span className="text-slate-400 font-normal mr-1.5">일정 내용:</span>
          <span>{item.reason || item.leaveType}</span>
        </div>

        <ScheduleAttachmentsList
          item={item}
          setPreviewImageModal={setPreviewImageModal}
          borderTopClass="border-t border-slate-200/60 dark:border-slate-700/60"
        />

        {/* Recipient Reply Display (if already replied) */}
        {isRecipient && (item.replyStatus === "REPLIED" || Boolean(item.replyText)) && (
          <div className="mt-1 pt-1.5 border-t border-purple-200/60 dark:border-purple-900/40 text-purple-900 dark:text-purple-200 text-[11px] flex items-center gap-1.5">
            <CheckCheck className="w-3 h-3 text-purple-600 shrink-0" />
            <span>
              내가 보낸 답장: <strong className="font-black">"{item.replyText}"</strong>
              {item.replyAt && <span className="opacity-75 text-[10px] ml-1">({formatKSTDateTime(item.replyAt)})</span>}
            </span>
          </div>
        )}

        {/* Origin Sender Replies Summary Preview */}
        {isOrigin && Array.isArray(item.sharedWithDetails) && item.sharedWithDetails.length > 0 && (
          <div className="mt-1 pt-1.5 border-t border-indigo-200/60 dark:border-indigo-900/40 text-[11px] space-y-1">
            <span className="text-slate-500 font-bold block">공유 대상자 회신 현황:</span>
            <div className="flex flex-wrap gap-1.5">
              {item.sharedWithDetails.map((d, dIdx) => (
                <span
                  key={dIdx}
                  className={`px-2 py-0.5 rounded-md text-[10.5px] font-bold border flex items-center gap-1 ${
                    d.status === "REPLIED" || Boolean(d.replyText)
                      ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 border-emerald-300 dark:border-emerald-800"
                      : "bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-800"
                  }`}
                >
                  <span>{d.name}</span>
                  {d.status === "REPLIED" || Boolean(d.replyText) ? (
                    <span className="font-black text-emerald-600 dark:text-emerald-400">"{d.replyText || "확인"}"</span>
                  ) : (
                    <span className="text-amber-600 dark:text-amber-400 font-normal">미회신</span>
                  )}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="flex items-center justify-between text-[10.5px] text-slate-400 pt-0.5 flex-wrap gap-1">
        <span className="flex items-center gap-1">
          <User className="w-3 h-3" />
          <span>작성: {item.userName || workerFullName} ({item.plant || workerPlant})</span>
        </span>
        <span>등록: {item.createdAt ? formatKSTDateTime(item.createdAt) : item.createdDate || "-"}</span>
      </div>
    </div>
  );
}
