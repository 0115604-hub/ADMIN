import React from "react";
import {
  FileText,
  X,
  ShieldCheck,
  Users,
  UserMinus,
  Trash2,
  Edit3,
  Printer
} from "lucide-react";

export const OvertimeReportDetailModal = ({
  isOpen,
  onClose,
  selectedLegacyReport,
  approvalDocs = [],
  cleanCompanyName,
  getPlantForCompany,
  getLiveApprovalForReport,
  KWON_SIGNATURE_BLACK,
  handleDeleteReport,
  checkApprovalPermission,
  currentProfile,
  isAdmin,
  approveDocumentStep,
  triggerToast,
  handleEditReport
}) => {
  if (!isOpen || !selectedLegacyReport) return null;

  const rawTitle = selectedLegacyReport.title || "";
  const liveApproval = getLiveApprovalForReport(selectedLegacyReport, approvalDocs);
  let cleanTitle = rawTitle.replace(/근태 및 특근실시 보고서|특근실시보고서|특근실시 보고서|근태보고서|근태 및 특근보고서/g, "특근보고서");
  if (!cleanTitle.includes("특근보고서")) cleanTitle += " 특근보고서";

  const rawItems = selectedLegacyReport.items || [];
  const attendedItems = rawItems.filter((it) => {
    const code = String(it.attendanceCode || it.category || "").trim();
    const hrs = Number(it.hours) || 0;
    if (code === "결근" || code === "-" || code === "휴무" || code === "미출근" || code === "미입력" || hrs === 0) {
      return false;
    }
    return true;
  });

  const offItems = rawItems.filter((it) => {
    const code = String(it.attendanceCode || it.category || "").trim();
    const hrs = Number(it.hours) || 0;
    return code === "결근" || code === "-" || code === "휴무" || code === "미출근" || code === "미입력" || hrs === 0;
  });

  const workersCount = attendedItems.length > 0 ? attendedItems.length : (selectedLegacyReport.totalWorkers || 0);
  const totalHours = attendedItems.reduce((acc, it) => acc + (Number(it.hours) || 8), 0) || selectedLegacyReport.totalHours || (workersCount * 8);
  const cost = selectedLegacyReport.cost || (totalHours * 15000);

  const getBadge = (code) => {
    const str = String(code || "").trim();
    if (str === "야간") return { label: "🌌 야간", bg: "bg-indigo-950 text-indigo-300 border-indigo-700/80" };
    if (str === "특근" || str === "주말특근") return { label: "🌙 특근(8H)", bg: "bg-purple-950 text-purple-300 border-purple-700/80" };
    if (str === "-" || str === "휴무" || str === "미출근" || str === "결근") return { label: "- 미출근", bg: "bg-slate-800 text-slate-400 border-slate-700" };
    return { label: "🌙 특근(8H)", bg: "bg-purple-950 text-purple-300 border-purple-700" };
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-xs animate-in fade-in duration-150 cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-900 text-white rounded-2xl sm:rounded-3xl max-w-4xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh] cursor-default border-2 border-rose-500 shadow-rose-950/40"
      >
        {/* Modal Header */}
        <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-950 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 rounded-lg border bg-rose-500/20 text-rose-400 border-rose-500/30">
              <FileText className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-black text-sm sm:text-base text-white flex items-center gap-2">
                <span>[{cleanCompanyName(selectedLegacyReport.company || "오륙")}] 개별 특근보고서 상세 내역</span>
                <span className="text-xs px-2 py-0.5 rounded-md bg-purple-950 text-purple-300 border border-purple-800 font-mono">
                  {selectedLegacyReport.workDateFormatted || selectedLegacyReport.workDate}
                </span>
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4 text-xs">
          {/* Top Approval Box & Meta Grid */}
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 p-4 rounded-2xl bg-slate-950 border border-slate-800">
            <div className="space-y-2 flex-1">
              <div>
                <span className="text-[11px] font-bold text-slate-400 block pb-0.5">보고서 제목</span>
                <div className="font-black text-white text-sm sm:text-base">
                  {cleanTitle}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                <div>
                  <span className="text-slate-400 font-bold block pb-0.5">작성자:</span>
                  <span className="font-bold text-white">{selectedLegacyReport.author || "현장관리자"}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block pb-0.5">소속 업체 (개별 상신):</span>
                  <span className="font-bold text-cyan-300">
                    {cleanCompanyName(selectedLegacyReport.company || "오륙")} ({getPlantForCompany(selectedLegacyReport.company || "오륙")})
                  </span>
                </div>
              </div>
            </div>

            {/* 4 Approval Blocks */}
            <div className="shrink-0 space-y-1">
              <div className="flex items-center justify-between px-1">
                <span className="text-[10.5px] font-black text-purple-300 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                  <span>결재선</span>
                </span>
                <span className={`text-[10px] font-black ${
                  liveApproval.status === "APPROVED"
                    ? "text-emerald-400"
                    : liveApproval.status === "HOLD"
                    ? "text-amber-400 animate-pulse"
                    : liveApproval.status === "REJECTED"
                    ? "text-rose-400"
                    : "text-yellow-400 animate-pulse"
                }`}>
                  {liveApproval.status === "APPROVED"
                    ? "🟢 결재 완료 (4/4)"
                    : liveApproval.status === "HOLD"
                    ? "⏸️ 결재 보류"
                    : liveApproval.status === "REJECTED"
                    ? "🔴 반려됨"
                    : `🟡 결재 진행중 (${liveApproval.steps.find((s) => s.status === "PENDING")?.role || "책임"} 결재대기)`}
                </span>
              </div>
              <div className="border-2 border-slate-700 rounded-xl overflow-hidden bg-white text-slate-900 shadow-md">
                <div className="grid grid-cols-4 divide-x divide-slate-300 text-center font-bold text-[11px] bg-slate-100 text-slate-800">
                  {liveApproval.steps.map((st, sIdx) => (
                    <div key={sIdx} className="py-1 px-2 font-black">
                      {st.role}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-4 divide-x divide-slate-300 text-center text-xs h-15 items-center bg-white">
                  {liveApproval.steps.map((st, sIdx) => {
                    const isApprovedStep = st.status === "APPROVED";
                    const isPendingStep = st.status === "PENDING";
                    const isHoldStep = st.status === "HOLD";
                    const isRejectedStep = st.status === "REJECTED";

                    return (
                      <div key={sIdx} className="p-1 flex flex-col items-center justify-center space-y-0.5 relative h-full bg-white">
                        {isApprovedStep ? (
                          st.role === "대표" || st.name === "권태형" ? (
                            <div className="w-15 h-11 flex items-center justify-center p-0.5 relative select-none animate-scaleUp">
                              <img
                                src={KWON_SIGNATURE_BLACK}
                                alt="권태형 대표이사 친필 서명"
                                className="w-full h-full object-contain filter drop-shadow-xs"
                              />
                            </div>
                          ) : (
                            <div className={`w-10 h-10 rounded-full border-2 ${sIdx === 0 ? "border-blue-600 text-blue-600" : "border-rose-600 text-rose-600"} flex flex-col items-center justify-center font-black leading-none transform rotate-[-5deg] select-none bg-white animate-scaleUp`}>
                              <span className="text-[7px] font-bold">{cleanCompanyName(selectedLegacyReport.company || "오륙")}</span>
                              <span className="text-[10px] font-black">{st.name?.slice(0, 3)}</span>
                              <span className="text-[7px]">{sIdx === 0 ? "기안" : "승인"}</span>
                            </div>
                          )
                        ) : isHoldStep ? (
                          <div className="w-10 h-10 rounded-full border-2 border-amber-600 text-amber-600 flex flex-col items-center justify-center font-black text-[9px] transform rotate-[-4deg] bg-white">
                            <span>보류</span>
                            <span className="text-[7px]">{st.name?.slice(0, 3)}</span>
                          </div>
                        ) : isRejectedStep ? (
                          <div className="w-10 h-10 rounded-full border-2 border-slate-700 text-slate-700 flex flex-col items-center justify-center font-black text-[9px] transform rotate-[-6deg] bg-white">
                            <span>반려</span>
                            <span className="text-[7px]">{st.name?.slice(0, 3)}</span>
                          </div>
                        ) : isPendingStep ? (
                          <span className="text-[10.5px] font-black text-rose-600 animate-pulse">
                            결재대기
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-bold">
                            - (대기)
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="grid grid-cols-4 divide-x divide-slate-300 text-center text-[9.5px] bg-slate-50 text-slate-600 font-mono py-0.5 border-t border-slate-200">
                  {liveApproval.steps.map((st, sIdx) => (
                    <div key={sIdx} className="truncate px-0.5">
                      {st.date ? st.date.split(" ")[0].slice(5) : "-"}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Summary KPIs */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-center">
                <span className="text-[10.5px] text-slate-400 font-bold block">총 특근 투입 인원</span>
                <span className="font-mono font-black text-sm text-emerald-400">{workersCount}명</span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-center">
                <span className="text-[10.5px] text-slate-400 font-bold block">총 투입 공수</span>
                <span className="font-mono font-black text-sm text-cyan-300">{totalHours} M/H</span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-center">
                <span className="text-[10.5px] text-slate-400 font-bold block">소속 업체</span>
                <span className="font-mono font-black text-sm text-purple-400">{cleanCompanyName(selectedLegacyReport.company || "오륙")}</span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-center">
                <span className="text-[10.5px] text-slate-400 font-bold block">예상 총 노무비</span>
                <span className="font-mono font-black text-rose-400">₩{cost.toLocaleString()}</span>
              </div>
            </div>

            {/* Reason / Notes Area */}
            {selectedLegacyReport.reasons && selectedLegacyReport.reasons.length > 0 && (
              <div className="space-y-1 p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="font-bold text-slate-300 block text-xs flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-purple-400" />
                  <span>특근 사유 및 주요 작업 내용</span>
                </span>
                <div className="space-y-1 text-slate-300 font-medium text-xs leading-relaxed whitespace-pre-wrap">
                  {selectedLegacyReport.reasons.map((rs, rIdx) => (
                    <div key={rIdx}>{rs}</div>
                  ))}
                </div>
              </div>
            )}

            {/* 1. 특근 투입 작업자 명단 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="font-black text-slate-200 text-xs flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-purple-400" />
                  <span>특근 투입 작업자 명단 ({attendedItems.length}명)</span>
                </span>
              </div>

              <div className="border border-slate-800 rounded-xl overflow-hidden max-h-56 overflow-y-auto bg-slate-950/60 p-2">
                {attendedItems.length === 0 ? (
                  <div className="py-6 text-center text-slate-500 font-bold text-xs">
                    등록된 특근 투입 인원 정보가 없습니다.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1.5">
                    {attendedItems.map((it, idx) => {
                      const badge = getBadge(it.attendanceCode || it.category || "특근");
                      return (
                        <div
                          key={idx}
                          className="flex items-center justify-between px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800/90 text-xs"
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="font-mono text-[10.5px] text-slate-500 w-5 text-right shrink-0">{idx + 1}.</span>
                            <span className="text-[11px] font-bold text-slate-400 shrink-0">{it.company || it.factory || ""}</span>
                            <span className="text-[11px] text-slate-500 shrink-0">{it.dept || it.line || it.category || ""}</span>
                            <span className="font-black text-white text-xs truncate">{it.workerName || it.names || "-"}</span>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[11px] font-bold border shrink-0 whitespace-nowrap ${badge.bg}`}>
                            {badge.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* 2. 미출근 명단 */}
            {offItems.length > 0 && (
              <div className="space-y-2 mt-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="font-black text-slate-400 text-xs flex items-center gap-1.5">
                    <UserMinus className="w-3.5 h-3.5 text-slate-500" />
                    <span>미출근 명단 ({offItems.length}명)</span>
                  </span>
                </div>

                <div className="border border-slate-800/80 rounded-xl overflow-hidden max-h-40 overflow-y-auto bg-slate-950/40 p-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1.5">
                    {offItems.map((it, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between px-2.5 py-1 rounded-lg bg-slate-900/60 border border-slate-800/60 text-xs opacity-75"
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="font-mono text-[10.5px] text-slate-500 w-5 text-right shrink-0">{idx + 1}.</span>
                          <span className="text-[11px] font-bold text-slate-500 shrink-0">{it.company || it.factory || ""}</span>
                          <span className="text-[11px] text-slate-500 shrink-0">{it.dept || it.line || it.category || ""}</span>
                          <span className="font-bold text-slate-300 text-xs truncate">{it.workerName || it.names || "-"}</span>
                        </div>
                        <span className="px-1.5 py-0.5 rounded text-[10.5px] font-bold bg-slate-800 text-slate-400 border border-slate-700 shrink-0 whitespace-nowrap">
                          - 미출근
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="px-5 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between shrink-0 gap-2">
          <button
            type="button"
            onClick={() => handleDeleteReport(selectedLegacyReport.id)}
            className="px-4 py-2 rounded-xl bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 font-bold text-xs cursor-pointer active:scale-95 transition-all flex items-center gap-1.5"
          >
            <Trash2 className="w-4 h-4" />
            <span>보고서 삭제</span>
          </button>

          <div className="flex items-center gap-2 flex-wrap">
            {liveApproval.approvalDoc && (() => {
              const perm = checkApprovalPermission(liveApproval.approvalDoc, currentProfile, isAdmin);
              if (perm.canApprove) {
                return (
                  <button
                    type="button"
                    onClick={async () => {
                      if (!window.confirm(`[${perm.stepRole} ${perm.approverName}] 전자결재 승인을 진행하시겠습니까?`)) return;
                      try {
                        await approveDocumentStep(liveApproval.approvalDoc.id, perm.stepIndex, perm.approverName, "승인");
                        triggerToast(`✅ [${perm.stepRole} ${perm.approverName}] 결재 승인이 완료되었습니다.`);
                      } catch (err) {
                        alert("결재 승인 오류: " + err.message);
                      }
                    }}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs cursor-pointer shadow-md shadow-emerald-900/40 active:scale-95 transition-all flex items-center gap-1.5 animate-pulse"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>⚡ {perm.approverName} ({perm.stepRole}) 즉시 승인</span>
                  </button>
                );
              }
              return null;
            })()}

            <button
              type="button"
              onClick={() => handleEditReport(selectedLegacyReport)}
              className="px-4 py-2 rounded-xl bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-700 font-black text-xs cursor-pointer shadow-xs active:scale-95 transition-all flex items-center gap-1.5"
              title="이 보고서의 특근 수정 및 재등록 화면으로 이동합니다"
            >
              <Edit3 className="w-4 h-4 text-cyan-400" />
              <span>✏️ 이 보고서 수정하기</span>
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs cursor-pointer active:scale-95 transition-all flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4" />
              <span>인쇄 / 출력</span>
            </button>

            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs cursor-pointer active:scale-95 transition-all"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
