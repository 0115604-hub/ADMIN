import React from "react";
import {
  X,
  Printer,
  Trash2,
  Edit3,
  FileText,
  PauseCircle,
  AlertCircle,
  Stamp,
  Lock,
  Camera,
  ImageIcon
} from "lucide-react";
import {
  isFourMApprovalDoc,
  isOvertimeApprovalDoc
} from "../../services/approvalService";

export const ApprovalDetailModal = ({
  selectedDoc,
  handleCloseDocModal,
  currentPermission,
  isAdmin,
  adminApprover,
  setAdminApprover,
  currentProfile,
  handleApprove,
  handleHold,
  handleReject,
  handleDelete,
  handleOpenEditModal,
  canEditDoc,
  approvalComment,
  setApprovalComment,
  holdReason,
  setHoldReason,
  rejectReason,
  setRejectReason,
  actionType,
  setActionType,
  handleOpenImagePreview,
  isProcessingAction
}) => {
  if (!selectedDoc) return null;

  const isFourMDoc = isFourMApprovalDoc(selectedDoc);
  const isOvertimeDoc = isOvertimeApprovalDoc(selectedDoc);
  const cleanTitle = isFourMDoc
    ? selectedDoc.title
    : isOvertimeDoc
    ? `특근보고서결재(${selectedDoc.plant || "삼랑진공장"})`
    : selectedDoc.title;

  const cleanDept = selectedDoc.department
    ? `${selectedDoc.plant} • ${selectedDoc.department.replace(/\s*\([^)]*\)/g, "")}`
    : selectedDoc.plant;

  const cleanDate = selectedDoc.createdAt
    ? selectedDoc.createdAt.replace(/\. /g, "-").replace(/\./g, "").slice(0, 10)
    : "-";

  const isApproved = selectedDoc.status === "APPROVED";
  const isHold = selectedDoc.status === "HOLD";
  const isRejected = selectedDoc.status === "REJECTED";
  const docSteps = Array.isArray(selectedDoc.steps) ? selectedDoc.steps : [];

  return (
    <div
      onClick={handleCloseDocModal}
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fadeIn overflow-y-auto cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-900 text-white rounded-3xl max-w-xl w-full p-4 sm:p-6 border border-slate-800 shadow-2xl space-y-4 animate-scaleUp my-4 cursor-default"
      >
        {/* 1. Header */}
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-black text-white tracking-tight truncate">
                {cleanTitle}
              </h2>
              <span className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-black border flex items-center gap-1 shadow-xs shrink-0 ${
                isApproved
                  ? "bg-emerald-950 text-emerald-300 border-emerald-700"
                  : isHold
                  ? "bg-amber-950 text-amber-300 border-amber-700"
                  : isRejected
                  ? "bg-rose-950 text-rose-300 border-rose-700"
                  : "bg-indigo-950 text-indigo-300 border-indigo-700"
              }`}>
                {isApproved ? "✓ 승인 완료" : isHold ? "⏸️ 보류중" : isRejected ? "✕ 반려됨" : "● 결재 진행중"}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">
              기안: <strong className="text-slate-200">{selectedDoc.drafter} {selectedDoc.drafterTitle}</strong> ({cleanDept}) • 기안일: {cleanDate}
            </p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => window.print()}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
              title="결재 문서 인쇄 / PDF 저장"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">인쇄</span>
            </button>
            <button
              type="button"
              onClick={handleCloseDocModal}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 2. Visual Steps Rail */}
        <div className="p-3 sm:p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 mb-2">
            <span>결재 진행 라인</span>
            <span className="text-[11px] text-cyan-400 font-mono">
              {docSteps.filter((s) => s.status === "APPROVED").length}/{docSteps.length}단계 승인됨
            </span>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 sm:gap-2">
            {docSteps.map((st, idx) => {
              const isStepApproved = st.status === "APPROVED";
              const isStepHold = st.status === "HOLD";
              const isStepPending = st.status === "PENDING";

              return (
                <div
                  key={idx}
                  className={`p-2 rounded-xl border text-center flex flex-col justify-between min-h-[90px] transition-all ${
                    isStepApproved
                      ? "bg-emerald-950/40 border-emerald-700/80 text-emerald-200"
                      : isStepHold
                      ? "bg-amber-950/40 border-amber-600 text-amber-200"
                      : isStepPending
                      ? "bg-rose-950/40 border-rose-600 text-rose-200 ring-2 ring-rose-500/40"
                      : "bg-slate-900/60 border-slate-800 text-slate-500"
                  }`}
                >
                  <span className="text-[11px] font-black">{st.role} ({st.title || st.role})</span>

                  {isStepApproved ? (
                    <div className="my-1 py-1 px-1 rounded-lg bg-emerald-900/60 border border-emerald-500 text-emerald-200 flex flex-col items-center">
                      <Stamp className="w-4 h-4 text-emerald-400 mb-0.5" />
                      <span className="text-[11px] font-black">{st.name} [승인]</span>
                    </div>
                  ) : isStepHold ? (
                    <div className="my-1 py-1 px-1 rounded-lg bg-amber-900/60 border border-amber-500 text-amber-200 text-[10px] font-bold">
                      ⏸️ 보류
                    </div>
                  ) : isStepPending ? (
                    <div className="my-1 py-1 px-1 rounded-lg bg-rose-900/60 border border-rose-500 text-rose-200 text-[10px] font-bold animate-pulse">
                      결재대기
                    </div>
                  ) : (
                    <div className="my-1 text-[10px] text-slate-500 font-bold">- (대기)</div>
                  )}

                  <span className="text-[9.5px] text-slate-400 font-mono truncate">
                    {st.date ? st.date.split(" ")[0].slice(5) : st.name || "-"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. Document Content Body */}
        <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1.5">
          <span className="text-[11px] font-black text-slate-400 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-cyan-400" />
            <span>기안 내용</span>
          </span>
          <p className="text-xs sm:text-sm text-slate-200 font-medium leading-relaxed whitespace-pre-wrap">
            {selectedDoc.content}
          </p>
        </div>

        {/* Attached Photos (4M or General) */}
        {((selectedDoc.causeImages && selectedDoc.causeImages.length > 0) || (selectedDoc.actionImages && selectedDoc.actionImages.length > 0)) ? (
          <div className="space-y-3">
            {selectedDoc.causeImages && selectedDoc.causeImages.length > 0 && (
              <div className="p-3.5 rounded-2xl bg-rose-950/20 border border-rose-800/60 space-y-2">
                <span className="text-xs font-black text-rose-300 flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-rose-400" />
                  <span>📸 조치 전 (이상발생 및 현장 원인) - {selectedDoc.causeImages.length}장</span>
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {selectedDoc.causeImages.map((img, idx) => {
                    const imgUrl = typeof img === "string" ? img : img.dataUrl || img.url || "";
                    const imgName = typeof img === "object" ? img.name || `조치전_${idx + 1}` : `조치전_${idx + 1}`;
                    return (
                      <div
                        key={idx}
                        onClick={() => handleOpenImagePreview({ url: imgUrl, name: imgName })}
                        className="cursor-pointer rounded-xl overflow-hidden border border-rose-700/60 bg-slate-900 aspect-square"
                      >
                        <img src={imgUrl} alt={imgName} className="w-full h-full object-cover" />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {selectedDoc.actionImages && selectedDoc.actionImages.length > 0 && (
              <div className="p-3.5 rounded-2xl bg-emerald-950/20 border border-emerald-800/60 space-y-2">
                <span className="text-xs font-black text-emerald-300 flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-emerald-400" />
                  <span>📸 조치 후 (시정조치 및 개선대책 완료) - {selectedDoc.actionImages.length}장</span>
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {selectedDoc.actionImages.map((img, idx) => {
                    const imgUrl = typeof img === "string" ? img : img.dataUrl || img.url || "";
                    const imgName = typeof img === "object" ? img.name || `조치후_${idx + 1}` : `조치후_${idx + 1}`;
                    return (
                      <div
                        key={idx}
                        onClick={() => handleOpenImagePreview({ url: imgUrl, name: imgName })}
                        className="cursor-pointer rounded-xl overflow-hidden border border-emerald-700/60 bg-slate-900 aspect-square"
                      >
                        <img src={imgUrl} alt={imgName} className="w-full h-full object-cover" />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : selectedDoc.images && selectedDoc.images.length > 0 ? (
          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
            <span className="text-xs font-black text-slate-300 flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
              <span>첨부 사진 ({selectedDoc.images.length}장)</span>
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {selectedDoc.images.map((img, idx) => {
                const imgUrl = typeof img === "string" ? img : img.dataUrl || img.url || "";
                const imgName = typeof img === "object" ? img.name || `첨부사진_${idx + 1}` : `첨부사진_${idx + 1}`;
                return (
                  <div
                    key={idx}
                    onClick={() => handleOpenImagePreview({ url: imgUrl, name: imgName })}
                    className="cursor-pointer rounded-xl overflow-hidden border border-slate-700 bg-slate-900 aspect-square"
                  >
                    <img src={imgUrl} alt={imgName} className="w-full h-full object-cover" />
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

        {/* Hold or Reject Reason */}
        {selectedDoc.holdReason && (
          <div className="p-3 rounded-2xl bg-amber-950/40 border border-amber-700 text-xs space-y-1">
            <span className="font-black text-amber-300 flex items-center gap-1">
              <PauseCircle className="w-3.5 h-3.5" />
              <span>보류 사유:</span>
            </span>
            <p className="text-amber-200">{selectedDoc.holdReason}</p>
          </div>
        )}
        {selectedDoc.rejectReason && (
          <div className="p-3 rounded-2xl bg-rose-950/40 border border-rose-700 text-xs space-y-1">
            <span className="font-black text-rose-300 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>반려 사유:</span>
            </span>
            <p className="text-rose-200">{selectedDoc.rejectReason}</p>
          </div>
        )}

        {/* 4. Action Controls (Approve, Hold, Reject) */}
        {(selectedDoc.status === "IN_PROGRESS" || selectedDoc.status === "HOLD") && (
          <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs font-black text-emerald-400 flex items-center gap-1.5">
                <Stamp className="w-4 h-4 text-emerald-400" />
                <span>{isAdmin ? "대표이사 최고 결재 및 도장 날인" : "전자결재 처리"}</span>
              </span>
              {isAdmin && (
                <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl border border-slate-700">
                  <button
                    type="button"
                    onClick={() => setAdminApprover("권태형")}
                    className={`px-2 py-0.5 rounded-lg text-xs font-black cursor-pointer ${
                      adminApprover === "권태형" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    👑 권태형 대표이사
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdminApprover("최미영")}
                    className={`px-2 py-0.5 rounded-lg text-xs font-black cursor-pointer ${
                      adminApprover === "최미영" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    💎 최미영 전무
                  </button>
                </div>
              )}
            </div>

            {currentPermission.canApprove ? (
              <div className="space-y-2">
                {actionType === "APPROVE" && (
                  <>
                    <input
                      type="text"
                      placeholder="결재 의견 (예: 이상 없음 승인)"
                      value={approvalComment}
                      onChange={(e) => setApprovalComment(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-900 text-xs text-white"
                    />
                    <div className="flex items-center justify-end gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => setActionType("HOLD")}
                        className="px-3 py-1.5 rounded-xl border border-amber-600 text-amber-400 hover:bg-amber-950/40 text-xs font-bold"
                      >
                        ⏸️ 보류 처리
                      </button>
                      <button
                        type="button"
                        onClick={() => setActionType("REJECT")}
                        className="px-3 py-1.5 rounded-xl border border-rose-600 text-rose-400 hover:bg-rose-950/40 text-xs font-bold"
                      >
                        ✕ 반려 처리
                      </button>
                      <button
                        type="button"
                        disabled={isProcessingAction}
                        onClick={handleApprove}
                        className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-md active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <Stamp className="w-3.5 h-3.5" />
                        <span>전자 결재 승인 날인</span>
                      </button>
                    </div>
                  </>
                )}

                {actionType === "HOLD" && (
                  <div className="space-y-2">
                    <textarea
                      rows="2"
                      placeholder="보류 사유를 구체적으로 입력하세요."
                      value={holdReason}
                      onChange={(e) => setHoldReason(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-amber-500 bg-slate-900 text-xs text-white"
                    />
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setActionType("APPROVE")}
                        className="px-3 py-1.5 rounded-xl border border-slate-700 text-xs font-bold text-slate-300"
                      >
                        취소
                      </button>
                      <button
                        type="button"
                        onClick={handleHold}
                        className="px-4 py-1.5 rounded-xl bg-amber-500 text-slate-950 text-xs font-black"
                      >
                        보류 확정
                      </button>
                    </div>
                  </div>
                )}

                {actionType === "REJECT" && (
                  <div className="space-y-2">
                    <textarea
                      rows="2"
                      placeholder="반려 사유를 구체적으로 입력하세요."
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-rose-500 bg-slate-900 text-xs text-white"
                    />
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setActionType("APPROVE")}
                        className="px-3 py-1.5 rounded-xl border border-slate-700 text-xs font-bold text-slate-300"
                      >
                        취소
                      </button>
                      <button
                        type="button"
                        onClick={handleReject}
                        className="px-4 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-black"
                      >
                        반려 확정
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs flex items-center gap-2 text-slate-400">
                <Lock className="w-4 h-4 text-slate-500 shrink-0" />
                <span>{currentPermission.reason || "상위 결재자 순차 승인 대기 중입니다."}</span>
              </div>
            )}
          </div>
        )}

        {/* 5. Footer Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            {isAdmin && (
              <button
                type="button"
                onClick={(e) => handleDelete(selectedDoc.id, e)}
                className="text-rose-400 hover:text-rose-300 font-bold flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>문서 삭제 (ADMIN)</span>
              </button>
            )}
            {canEditDoc(selectedDoc) && (
              <button
                type="button"
                onClick={() => handleOpenEditModal(selectedDoc)}
                className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-black flex items-center gap-1.5 cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>기안서 수정 / 재상신</span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={handleCloseDocModal}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold ml-auto cursor-pointer"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
