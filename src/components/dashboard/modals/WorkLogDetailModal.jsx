import React from "react";
import {
  Lock,
  Edit3,
  FileText,
  AlertTriangle,
  Wrench,
  Copy,
  Camera,
  ShieldCheck,
  MessageSquare,
  CheckCheck,
  CheckCircle2,
  Trash2
} from "lucide-react";

export default function WorkLogDetailModal({
  selectedLogDetail,
  setSelectedLogDetail,
  isWorkLogApproved,
  handleOpenEditModal,
  setPreviewImageModal,
  handleCopyLineMatchText,
  copyToast,
  canApproveLog,
  approvalCommentInput,
  setApprovalCommentInput,
  handleRejectLog,
  handleApproveLog,
  currentProfile,
  isAdmin,
  handleDeleteLog
}) {
  if (!selectedLogDetail) return null;

  return (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedLogDetail(null);
          }}
          className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fadeIn overflow-y-auto cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 my-6 animate-scaleUp cursor-default"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm text-white shadow-md ${
                  selectedLogDetail.plant === "한림공장" ? "bg-emerald-600 ring-2 ring-emerald-400/30" : "bg-amber-500 ring-2 ring-amber-400/30"
                }`}>
                  {selectedLogDetail.writer ? selectedLogDetail.writer[0] : "작"}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-base text-slate-900 dark:text-white">
                      {selectedLogDetail.writer} {selectedLogDetail.title || ""}
                    </h3>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                      selectedLogDetail.plant === "한림공장"
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                        : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                    }`}>
                      {selectedLogDetail.plant}
                    </span>
                    {isWorkLogApproved(selectedLogDetail) ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700 shadow-2xs">
                        <Lock className="w-2.5 h-2.5" />
                        <span>결재완료 (수정불가)</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          const logToEdit = selectedLogDetail;
                          setSelectedLogDetail(null);
                          handleOpenEditModal(logToEdit);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-950/70 dark:text-blue-300 dark:hover:bg-blue-900 border border-blue-300 dark:border-blue-700 shadow-2xs active:scale-95 transition-all cursor-pointer"
                        title="결재 전 일지 내용 수정"
                      >
                        <Edit3 className="w-2.5 h-2.5 text-blue-600 dark:text-blue-400" />
                        <span>내용수정</span>
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {selectedLogDetail.date} ({selectedLogDetail.shift || "주간"}) • {selectedLogDetail.createdAt || "최근 작성"}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedLogDetail(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-base font-black rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Meta Chips */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700">
                <span className="text-[10px] font-semibold text-slate-400 block">담당 공정</span>
                <p className="font-extrabold text-slate-800 dark:text-slate-200 mt-0.5">{selectedLogDetail.process || "-"}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700">
                <span className="text-[10px] font-semibold text-slate-400 block">담당 라인 / 설비</span>
                <p className="font-extrabold text-slate-800 dark:text-slate-200 mt-0.5">{selectedLogDetail.line || "-"}</p>
              </div>
            </div>

            {/* 1. 작업 내용 전문 (설비보전 일지인 경우 항목별 & 개선 전/후 사진 상세 표기) */}
            <div className="space-y-1.5">
              <span className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-blue-600" />
                <span>
                  {selectedLogDetail.process === "설비보전" || selectedLogDetail.writer === "전재율"
                    ? "1. 설비보전 작업 및 점검 내용 전문"
                    : "1. 작업 내용 전문"}
                </span>
              </span>

              {Array.isArray(selectedLogDetail.maintenanceItems) && selectedLogDetail.maintenanceItems.length > 0 ? (
                <div className="space-y-2.5">
                  {selectedLogDetail.maintenanceItems.map((item, idx) => {
                    const hasItemPhotos = (item.imagesBefore && item.imagesBefore.length > 0) || (item.imagesAfter && item.imagesAfter.length > 0);
                    return (
                      <div key={idx} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700 space-y-2">
                        <div className="flex items-center justify-between pb-1.5 border-b border-slate-200/60 dark:border-slate-700/60">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-md bg-blue-600 text-white font-black text-[10.5px]">
                              항목 #{idx + 1}
                            </span>
                            <span className="font-extrabold text-xs text-slate-900 dark:text-white">
                              {item.category} &gt; {item.equipmentName}
                            </span>
                          </div>
                        </div>

                        <p className="text-xs leading-relaxed text-slate-800 dark:text-slate-200 font-medium whitespace-pre-wrap pl-0.5">
                          {item.content || item.workContent}
                        </p>

                        {/* 항목별 개선 전 / 개선 후 사진 */}
                        {hasItemPhotos && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                            {/* 개선 전 (Before) */}
                            {item.imagesBefore && item.imagesBefore.length > 0 && (
                              <div className="p-2 rounded-xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 space-y-1.5">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-black text-rose-600 dark:text-rose-400">
                                    🔴 개선 전 (Before)
                                  </span>
                                  <span className="text-[9px] font-mono text-rose-500 font-bold">
                                    {item.imagesBefore.length}장
                                  </span>
                                </div>
                                <div className="grid grid-cols-3 gap-1">
                                  {item.imagesBefore.map((img, i) => (
                                    <div
                                      key={img.id || i}
                                      onClick={() => setPreviewImageModal({ url: img.dataUrl, name: img.name || `항목${idx + 1}_개선전_${i + 1}` })}
                                      className="aspect-square rounded-lg overflow-hidden border border-rose-300 dark:border-rose-800 bg-white dark:bg-slate-900 cursor-pointer hover:scale-105 transition-transform"
                                    >
                                      <img src={img.dataUrl} alt="Before" className="w-full h-full object-cover" />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* 개선 후 (After) */}
                            {item.imagesAfter && item.imagesAfter.length > 0 && (
                              <div className="p-2 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 space-y-1.5">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400">
                                    🟢 개선 후 (After)
                                  </span>
                                  <span className="text-[9px] font-mono text-emerald-500 font-bold">
                                    {item.imagesAfter.length}장
                                  </span>
                                </div>
                                <div className="grid grid-cols-3 gap-1">
                                  {item.imagesAfter.map((img, i) => (
                                    <div
                                      key={img.id || i}
                                      onClick={() => setPreviewImageModal({ url: img.dataUrl, name: img.name || `항목${idx + 1}_개선후_${i + 1}` })}
                                      className="aspect-square rounded-lg overflow-hidden border border-emerald-300 dark:border-emerald-800 bg-white dark:bg-slate-900 cursor-pointer hover:scale-105 transition-transform"
                                    >
                                      <img src={img.dataUrl} alt="After" className="w-full h-full object-cover" />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs leading-relaxed font-medium whitespace-pre-wrap">
                  {selectedLogDetail.workContent || "작업 내용이 없습니다."}
                </div>
              )}
            </div>

            {/* 2. 부적합사항 및 개선조치 (설비보전 일지에는 비노출) */}
            {selectedLogDetail.process !== "설비보전" && selectedLogDetail.writer !== "전재율" && (
              <div className="space-y-1.5">
                <span className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <span>2. ⚠️ 부적합사항 및 개선조치</span>
                </span>
                <div className="p-3.5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-900/60 text-amber-900 dark:text-amber-200 text-xs leading-relaxed font-medium whitespace-pre-wrap">
                  {selectedLogDetail.issues && selectedLogDetail.issues !== "특이사항 없음" && selectedLogDetail.issues !== "-"
                    ? selectedLogDetail.issues
                    : "부적합 및 개선조치 사항 없음 (정상 작업 완료)"}
                </div>
              </div>
            )}

            {/* ⭐ 라인별 엑셀 파일 매칭 & 비가동 공유 섹션 (실제 lineFileMatches 보유 시만 표시) */}
            {(() => {
              let matches = [];
              if (selectedLogDetail.lineFileMatches) {
                if (Array.isArray(selectedLogDetail.lineFileMatches)) {
                  matches = selectedLogDetail.lineFileMatches;
                } else if (typeof selectedLogDetail.lineFileMatches === "string") {
                  try { matches = JSON.parse(selectedLogDetail.lineFileMatches); } catch {}
                }
              }

              if (!matches || matches.length === 0) return null;

              return (
                <div className="space-y-2 p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border-2 border-emerald-300 dark:border-emerald-800">
                  <div className="flex items-center justify-between pb-2 border-b border-emerald-200 dark:border-emerald-800/80">
                    <div className="flex items-center gap-2">
                      <Wrench className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span className="font-black text-xs text-slate-900 dark:text-white">
                        라인별 엑셀 파일 & 비가동 매칭 내역 ({matches.length}개 라인)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyLineMatchText(matches, selectedLogDetail.date, selectedLogDetail.writer)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10.5px] shadow-xs active:scale-95 transition-all"
                    >
                      <Copy className="w-3 h-3" />
                      <span>{copyToast ? "복사완료!" : "매칭내역 복사"}</span>
                    </button>
                  </div>

                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {matches.map((m, idx) => (
                      <div key={idx} className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200/80 dark:border-emerald-900/60 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded-md font-black text-[10px] bg-emerald-600 text-white shadow-xs">
                              {m.lineName}
                            </span>
                            <span className="font-bold text-slate-900 dark:text-slate-100 text-[11px] truncate max-w-[180px]">
                              📁 {m.fileName}
                            </span>
                          </div>
                          <span className="font-black text-emerald-600 dark:text-emerald-400 text-[11px] font-mono">
                            {m.totalMinutes || 0}분 비가동
                          </span>
                        </div>

                        {m.records && m.records.length > 0 && (
                          <div className="pl-2 border-l-2 border-emerald-400/60 dark:border-emerald-700 text-[10.5px] text-slate-600 dark:text-slate-300 space-y-0.5 mt-1">
                            <p className="font-bold text-slate-800 dark:text-slate-200">
                              사유: <span className="text-emerald-700 dark:text-emerald-300">{m.records[0].reason}</span> ({m.records[0].durationMinutes}분)
                            </p>
                            <p className="truncate">현상: {m.records[0].details}</p>
                            {m.records[0].actionTaken && (
                              <p className="text-slate-500 dark:text-slate-400">조치: {m.records[0].actionTaken}</p>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* 📷 현장 작업/품질불량 사진 증빙 (설비보전 항목 사진이 이미 표시된 경우 중복 방지) */}
            {(!selectedLogDetail.maintenanceItems?.some((it) => (it.imagesBefore?.length || 0) > 0 || (it.imagesAfter?.length || 0) > 0)) &&
              ((Array.isArray(selectedLogDetail.imagesBefore) && selectedLogDetail.imagesBefore.length > 0) ||
              (Array.isArray(selectedLogDetail.imagesAfter) && selectedLogDetail.imagesAfter.length > 0) ||
              (Array.isArray(selectedLogDetail.images) && selectedLogDetail.images.length > 0)) && (
              <div className="space-y-2.5 p-3.5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/70 dark:border-indigo-900/60">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>현장 사진 증빙</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">클릭하여 확대</span>
                </div>

                {/* Before / After 구분 표시 */}
                {((selectedLogDetail.imagesBefore && selectedLogDetail.imagesBefore.length > 0) ||
                  (selectedLogDetail.imagesAfter && selectedLogDetail.imagesAfter.length > 0)) ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* Before */}
                    {selectedLogDetail.imagesBefore && selectedLogDetail.imagesBefore.length > 0 && (
                      <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/60 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-black text-rose-600 dark:text-rose-400 flex items-center gap-1">
                            🔴 개선 전 (Before)
                          </span>
                          <span className="text-[9.5px] font-mono text-rose-500 font-bold">
                            {selectedLogDetail.imagesBefore.length}장
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-1.5">
                          {selectedLogDetail.imagesBefore.map((img, idx) => (
                            <div
                              key={img.id || idx}
                              onClick={() => setPreviewImageModal({ url: img.dataUrl, name: img.name || `개선전_${idx + 1}` })}
                              className="group relative rounded-lg overflow-hidden border border-rose-300 dark:border-rose-800 bg-slate-100 dark:bg-slate-800 cursor-pointer aspect-square hover:scale-105 transition-transform"
                            >
                              <img src={img.dataUrl} alt="Before" className="w-full h-full object-cover" />
                              <span className="absolute top-0.5 left-0.5 px-1 py-0.2 rounded bg-rose-600 text-white text-[7.5px] font-black">Before</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* After */}
                    {selectedLogDetail.imagesAfter && selectedLogDetail.imagesAfter.length > 0 && (
                      <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900/60 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            🟢 개선 후 (After)
                          </span>
                          <span className="text-[9.5px] font-mono text-emerald-500 font-bold">
                            {selectedLogDetail.imagesAfter.length}장
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-1.5">
                          {selectedLogDetail.imagesAfter.map((img, idx) => (
                            <div
                              key={img.id || idx}
                              onClick={() => setPreviewImageModal({ url: img.dataUrl, name: img.name || `개선후_${idx + 1}` })}
                              className="group relative rounded-lg overflow-hidden border border-emerald-300 dark:border-emerald-800 bg-slate-100 dark:bg-slate-800 cursor-pointer aspect-square hover:scale-105 transition-transform"
                            >
                              <img src={img.dataUrl} alt="After" className="w-full h-full object-cover" />
                              <span className="absolute top-0.5 left-0.5 px-1 py-0.2 rounded bg-emerald-600 text-white text-[7.5px] font-black">After</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {selectedLogDetail.images.map((img, idx) => (
                      <div
                        key={img.id || idx}
                        onClick={() => setPreviewImageModal({ url: img.dataUrl, name: img.name || `현장사진_${idx + 1}` })}
                        className="group relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 cursor-pointer shadow-xs aspect-square hover:border-indigo-500 hover:ring-2 hover:ring-indigo-400/30 transition-all"
                      >
                        <img
                          src={img.dataUrl}
                          alt={img.name || `현장 사진 ${idx + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-1">
                          <span className="text-[9px] text-white font-bold truncate">
                            {img.name || `사진 ${idx + 1}`}
                          </span>
                        </div>
                        <span className="absolute top-1 right-1 px-1 py-0.2 rounded bg-black/60 text-white text-[8.5px] font-mono font-bold">
                          {idx + 1}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 3. 전자결재 승인 및 총괄관리자 코멘트 섹션 */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>
                    {selectedLogDetail.plant === "본사" || selectedLogDetail.writer === "권태형" || selectedLogDetail.writer === "최미영"
                      ? "3. 최고경영진 전자결재 & 확인사항"
                      : "3. 공장 총괄관리자 전자결재 & 코멘트"}
                  </span>
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black ${
                  selectedLogDetail.approvalStatus === "결재완료"
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                    : selectedLogDetail.approvalStatus === "반려"
                    ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                    : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                }`}>
                  {selectedLogDetail.approvalStatus === "결재완료" ? "결재완료 (승인됨)" : selectedLogDetail.approvalStatus === "반려" ? "반려됨" : "내용 확인 후 결재 대기"}
                </span>
              </div>

              {/* Approval Stamp Badges */}
              <div className="grid grid-cols-2 gap-3">
                {/* 1. 작성자 날인 */}
                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-center shadow-2xs">
                  <span className="text-[10px] text-slate-400 font-bold block mb-1">작성자 제출</span>
                  <div className="inline-block border-2 border-blue-600 text-blue-600 rounded-xl px-3 py-1 font-black text-xs font-serif tracking-wider">
                    {selectedLogDetail.writer} [인]
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 font-mono">{selectedLogDetail.createdAt || selectedLogDetail.date}</p>
                </div>

                {/* 2. 총괄관리자 / 최고경영진 결재 도장 */}
                {(() => {
                  const isHeadquarterLog =
                    selectedLogDetail.plant === "본사" ||
                    selectedLogDetail.writer === "권태형" ||
                    selectedLogDetail.writer === "최미영" ||
                    selectedLogDetail.department === "본사 관리팀";

                  const approverLabel = isHeadquarterLog
                    ? "본사 최고경영진 전결"
                    : selectedLogDetail.plant === "한림공장"
                    ? "한림 총괄 (김동욱 책임) 결재"
                    : "삼랑진 총괄 (이명재 이사) 결재";

                  const defaultName = isHeadquarterLog
                    ? (selectedLogDetail.writer === "최미영" ? "최미영" : "권태형")
                    : selectedLogDetail.plant === "한림공장"
                    ? "김동욱"
                    : "이명재";

                  const stampTag = isHeadquarterLog ? "[전결]" : "[결재]";

                  return (
                    <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-center shadow-2xs">
                      <span className="text-[10px] text-slate-400 font-bold block mb-1">
                        {approverLabel}
                      </span>
                      {selectedLogDetail.approvalStatus === "결재완료" ? (
                        <div className="animate-scaleUp">
                          <div className="inline-block border-2 border-rose-600 text-rose-600 rounded-xl px-3 py-1 font-black text-xs font-serif tracking-wider shadow-xs">
                            {selectedLogDetail.approverName || defaultName} {stampTag}
                          </div>
                          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-1 font-mono">
                            {selectedLogDetail.approvedAt || "승인완료"}
                          </p>
                        </div>
                      ) : (
                        <div className="py-0.5">
                          <div className="inline-block border-2 border-dashed border-slate-300 dark:border-slate-700 text-slate-400 rounded-xl px-3 py-1 font-bold text-xs">
                            내용 확인 대기
                          </div>
                          <p className="text-[10px] text-slate-400 mt-1">
                            {isHeadquarterLog ? "최고경영진 전결 예정" : selectedLogDetail.plant === "한림공장" ? "김동욱 책임 결재 예정" : "이명재 이사 결재 예정"}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* 💬 총괄관리자 / 최고경영진 결재 의견 / 피드백 카드 (결재 완료 시 표시) */}
              {selectedLogDetail.approvalStatus === "결재완료" && selectedLogDetail.approvalComment && (
                <div className="p-3.5 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800 space-y-1.5 animate-fadeIn">
                  <div className="flex items-center justify-between text-xs font-black text-indigo-950 dark:text-indigo-200">
                    <span className="flex items-center gap-1.5">
                      <MessageSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      <span>
                        {selectedLogDetail.plant === "본사" || selectedLogDetail.writer === "권태형" || selectedLogDetail.writer === "최미영"
                          ? "최고경영진 확인의견 및 경영지침"
                          : "총괄관리자 결재 의견 및 지시사항"}
                      </span>
                    </span>
                    <span className="text-[10.5px] text-indigo-600 dark:text-indigo-400 font-bold">
                      {selectedLogDetail.approverName || (selectedLogDetail.plant === "본사" || selectedLogDetail.writer === "권태형" ? "권태형" : selectedLogDetail.plant === "한림공장" ? "김동욱" : "이명재")}{" "}
                      {selectedLogDetail.approverTitle || (selectedLogDetail.plant === "본사" ? "대표이사" : selectedLogDetail.plant === "한림공장" ? "책임" : "이사")}{" "}
                      날인
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/90 dark:bg-slate-900/80 border border-indigo-100 dark:border-indigo-900 text-xs text-indigo-950 dark:text-indigo-100 font-medium leading-relaxed shadow-2xs whitespace-pre-wrap">
                    "{selectedLogDetail.approvalComment}"
                  </div>
                </div>
              )}

              {/* ✍️ 결재 코멘트 입력창 및 승인 액션 (권한 있는 총괄관리자에게 표시) */}
              {canApproveLog(selectedLogDetail) && (
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-3">
                  {selectedLogDetail.approvalStatus !== "결재완료" ? (
                    <>
                      {/* 결재 코멘트 입력란 */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                            <MessageSquare className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                            <span>결재 코멘트 / 지시사항 입력 (선택)</span>
                          </label>
                          <span className="text-[10px] text-slate-400 font-medium">
                            작업자에게 전달될 피드백을 남겨주세요
                          </span>
                        </div>
                        <textarea
                          rows="2"
                          value={approvalCommentInput}
                          onChange={(e) => setApprovalCommentInput(e.target.value)}
                          placeholder="예: 특이사항 확인 완료. 금형 예열 및 2라인 안전 작업 철저히 진행 바랍니다."
                          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-medium shadow-2xs"
                        />

                        {/* 빠른 선택 프리셋 버튼 */}
                        <div className="flex flex-wrap gap-1.5 pt-0.5">
                          {[
                            "확인 완료. 수고하셨습니다.",
                            "안전 작업 및 설비 점검 철저",
                            "품질 치수 및 불량률 집중 관리",
                            "납기 대응 일정 준수 바람"
                          ].map((preset) => (
                            <button
                              key={preset}
                              type="button"
                              onClick={() => setApprovalCommentInput(preset)}
                              className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-300 transition-all border border-slate-200/80 dark:border-slate-700 shadow-2xs"
                            >
                              + {preset}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* 하단 액션 버튼 */}
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={() => handleRejectLog(selectedLogDetail.id)}
                          className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition-all"
                        >
                          보완요청 / 반려
                        </button>
                        <button
                          onClick={() => handleApproveLog(selectedLogDetail.id, approvalCommentInput)}
                          className="flex-1 flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-black shadow-lg shadow-emerald-500/25 active:scale-95 transition-all"
                        >
                          <CheckCheck className="w-4 h-4" />
                          <span>내용 확인 & 코멘트 결재 승인 (도장 날인)</span>
                        </button>
                      </div>
                    </>
                  ) : (
                    /* 이미 결재 완료된 경우 */
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400 font-bold">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>정상 결재 승인된 일지입니다.</span>
                      </div>
                      <button
                        onClick={() => handleRejectLog(selectedLogDetail.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-800 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold transition-all"
                      >
                        결재 취소 / 반려
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {!isWorkLogApproved(selectedLogDetail) && (
                  <button
                    onClick={() => {
                      const logToEdit = selectedLogDetail;
                      setSelectedLogDetail(null);
                      handleOpenEditModal(logToEdit);
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-black transition-all cursor-pointer shadow-2xs"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>내용수정</span>
                  </button>
                )}

                {(currentProfile?.name === selectedLogDetail.writer || isAdmin) && (
                  <button
                    onClick={() => {
                      if (window.confirm("이 업무일지를 삭제하시겠습니까?")) {
                        handleDeleteLog(selectedLogDetail.id);
                        setSelectedLogDetail(null);
                      }
                    }}
                    className="flex items-center gap-1 px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>삭제</span>
                  </button>
                )}
              </div>

              <button
                onClick={() => setSelectedLogDetail(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white font-bold text-xs shadow-sm active:scale-95 transition-all"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
  );
}
