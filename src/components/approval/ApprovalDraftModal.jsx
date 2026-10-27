import React from "react";
import {
  Edit3,
  FileSignature,
  Clock,
  Calendar,
  DollarSign,
  FileText,
  ImageIcon,
  Camera,
  ZoomIn,
  X,
  ShieldCheck,
  Check,
  Send
} from "lucide-react";
import { APPROVAL_MANAGERS } from "../../services/approvalService";

export const ApprovalDraftModal = ({
  isOpen,
  onClose,
  editingDocId,
  draftForm,
  setDraftForm,
  allWorkers = [],
  handleTemplateChange,
  handlePlantChange,
  handleSaveDraft,
  fileInputRef,
  handleImageFiles,
  handleImageDrag,
  handleImageDrop,
  imageDragActive,
  isProcessingImages,
  handleRemoveDraftImage,
  setPreviewImageModal
}) => {
  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fadeIn overflow-y-auto cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full p-5 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 animate-scaleUp my-6 cursor-default"
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-xl ${editingDocId ? "bg-teal-600 text-white shadow-xs" : "bg-emerald-500 text-white shadow-xs"}`}>
              {editingDocId ? <Edit3 className="w-4 h-4" /> : <FileSignature className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="font-black text-base text-slate-900 dark:text-white">
                {editingDocId ? "전자결재 기안서 수정 (재상신)" : "새 전자결재 기안서 작성"}
              </h3>
              <p className="text-xs text-slate-400">
                {editingDocId
                  ? "기안 내용, 소요금액, 첨부사진 및 결재선을 수정한 후 재상신합니다."
                  : "담당(전작업자) ➔ 책임(직급별) ➔ 이사(이명재) ➔ 대표(대표이사) 결재선"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-500 block mb-1.5">
            결재 양식 선택
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            {[
              { key: "OVERTIME", label: "특근 신청서", icon: Clock },
              { key: "LEAVE", label: "휴가/연차 신청", icon: Calendar },
              { key: "EXPENSE", label: "자재/부품 품의", icon: DollarSign },
              { key: "GENERAL", label: "일반 업무기안", icon: FileText }
            ].map((tmpl) => (
              <button
                type="button"
                key={tmpl.key}
                onClick={() => handleTemplateChange(tmpl.key)}
                className={`p-2.5 rounded-xl border text-center font-black transition-all flex flex-col items-center justify-center gap-1 ${
                  draftForm.type === tmpl.key
                    ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/20 shadow-xs"
                    : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                <tmpl.icon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>{tmpl.label}</span>
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSaveDraft} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            {/* 소속 공장 */}
            <div>
              <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">
                소속 공장
              </label>
              <select
                value={draftForm.plant}
                onChange={(e) => handlePlantChange(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-white"
              >
                <option value="삼랑진공장">삼랑진공장</option>
                <option value="한림공장">한림공장</option>
              </select>
            </div>

            {/* 1. 담당 (기안자) */}
            <div>
              <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">
                기안자 (작성자 선택)
              </label>
              <select
                value={draftForm.drafter}
                onChange={(e) => {
                  const sel = allWorkers.find((w) => w.name === e.target.value);
                  setDraftForm({
                    ...draftForm,
                    drafter: e.target.value,
                    drafterTitle: sel?.title || "선임",
                    plant: sel?.plant || sel?.plantName || draftForm.plant,
                    department: sel?.process || sel?.assignedProcess || draftForm.department
                  });
                }}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-white"
              >
                <optgroup label="임원 및 관리자">
                  {allWorkers.filter((w) => w.isManager).map((w) => (
                    <option key={w.name} value={w.name}>
                      {w.name} ({w.title} • {w.plant})
                    </option>
                  ))}
                </optgroup>
                <optgroup label="현장 작업자 / 반장">
                  {allWorkers.filter((w) => !w.isManager).map((w) => (
                    <option key={w.name} value={w.name}>
                      {w.name} ({w.title ? `${w.title} • ` : ""}{w.plant})
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>
          </div>

          {/* 기안 제목 */}
          <div>
            <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">
              기안 제목
            </label>
            <input
              type="text"
              required
              placeholder="예: 9월 1주차 주말 생산라인 특근 신청의 건"
              value={draftForm.title}
              onChange={(e) => setDraftForm({ ...draftForm, title: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-black text-slate-900 dark:text-white text-xs"
            />
          </div>

          {/* 소요 금액 */}
          <div>
            <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">
              소요 금액 / 특근비 (선택 사항)
            </label>
            <input
              type="text"
              placeholder="예: ₩1,248,000 (해당사항 없을 시 비워둠)"
              value={draftForm.amount}
              onChange={(e) => setDraftForm({ ...draftForm, amount: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold text-slate-900 dark:text-white text-xs"
            />
          </div>

          {/* 상세 내용 */}
          <div>
            <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">
              기안 상세 내용
            </label>
            <textarea
              rows="4"
              required
              placeholder="구체적인 사유 및 내역을 입력해 주세요."
              value={draftForm.content}
              onChange={(e) => setDraftForm({ ...draftForm, content: e.target.value })}
              className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium leading-relaxed text-slate-900 dark:text-white text-xs"
            ></textarea>
          </div>

          {/* 사진 및 현장 증빙자료 첨부 (선택) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5 text-xs">
                <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
                <span>사진 및 현장 증빙자료 첨부 (선택)</span>
              </label>
              <span className="text-[10.5px] text-slate-400 font-medium">
                {draftForm.images?.length || 0}/10장 첨부됨
              </span>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleImageFiles(e.target.files)}
            />

            {/* Drag & Drop Upload Zone */}
            <div
              onDragEnter={handleImageDrag}
              onDragOver={handleImageDrag}
              onDragLeave={handleImageDrag}
              onDrop={handleImageDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
                imageDragActive
                  ? "border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 scale-[1.01]"
                  : "border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/50 hover:border-emerald-400 hover:bg-emerald-50/20"
              }`}
            >
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-300 flex items-center justify-center shadow-xs">
                {isProcessingImages ? (
                  <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Camera className="w-5 h-5" />
                )}
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {isProcessingImages ? "사진 압축 및 처리 중..." : "사진을 드래그하거나 클릭하여 첨부하세요"}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  스마트폰 현장 사진, 영수증, 설비 고장/수리 부위 등 (JPG, PNG, WebP 지원)
                </p>
              </div>
            </div>

            {/* Attached Image Thumbnails */}
            {draftForm.images && draftForm.images.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pt-1">
                {draftForm.images.map((img, idx) => (
                  <div
                    key={img.id || idx}
                    className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 aspect-square shadow-xs"
                  >
                    <img
                      src={img.dataUrl}
                      alt={img.name || `첨부사진 ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewImageModal({ url: img.dataUrl, name: img.name });
                        }}
                        className="p-1 rounded-lg bg-white/90 text-slate-800 hover:bg-white shadow-xs cursor-pointer"
                        title="크게보기"
                      >
                        <ZoomIn className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveDraftImage(idx);
                        }}
                        className="p-1 rounded-lg bg-rose-600 text-white hover:bg-rose-700 shadow-xs cursor-pointer"
                        title="삭제"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <span className="absolute bottom-1 left-1 right-1 px-1 py-0.5 rounded bg-slate-900/70 text-white text-[9px] truncate text-center font-mono">
                      {img.name}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 자동 결재선 지정 (기안자, 책임, 이사, 대표 뱃지에서 관리자 및 결재자 선택) */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>자동 결재선 지정 (기안자 및 결재선 관리자 선택)</span>
              </span>
              <span className="text-[10px] text-slate-400">4단계 결재자 배정</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              {/* 1. 기안자 (담당) 뱃지 - 전체 관리자 및 작업자 선택 */}
              <div className="p-2 rounded-xl bg-white dark:bg-slate-700 border border-emerald-300 dark:border-emerald-700 ring-1 ring-emerald-500/20">
                <span className="text-[9.5px] font-bold text-slate-400 block">1. 기안자 (담당)</span>
                <select
                  value={draftForm.drafter}
                  onChange={(e) => {
                    const sel = allWorkers.find((w) => w.name === e.target.value);
                    const selTitle = sel?.title || "선임";
                    const isLead = ["윤경수", "이창엽", "설유철", "전재율", "김동욱", "김동훈"].includes(e.target.value) || selTitle === "책임";
                    setDraftForm({
                      ...draftForm,
                      drafter: e.target.value,
                      drafterTitle: selTitle,
                      leadName: isLead ? e.target.value : draftForm.leadName,
                      plant: sel?.plant || sel?.plantName || draftForm.plant,
                      department: sel?.process || sel?.assignedProcess || draftForm.department
                    });
                  }}
                  className="w-full bg-transparent font-black text-slate-900 dark:text-white text-xs focus:outline-none cursor-pointer mt-0.5"
                >
                  <optgroup label="임원 및 관리자">
                    {allWorkers.filter((w) => w.isManager).map((w) => (
                      <option key={w.name} value={w.name} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
                        {w.name} ({w.title})
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="현장 작업자 / 반장">
                    {allWorkers.filter((w) => !w.isManager).map((w) => (
                      <option key={w.name} value={w.name} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
                        {w.name} {w.title ? `(${w.title})` : ""}
                      </option>
                    ))}
                  </optgroup>
                </select>
                <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-medium">기안 상신자</span>
              </div>

              {/* 2. 책임 (관리자) 뱃지 - 전체 관리자 선택 (공정관리자 기안 시 책임 전결 자동 승인 안내) */}
              {(() => {
                const isLeadDrafter =
                  ["윤경수", "이창엽", "설유철", "전재율", "김동욱", "김동훈"].includes(draftForm.drafter) ||
                  draftForm.drafterTitle === "책임";
                return (
                  <div className={`p-2 rounded-xl border ring-1 transition-all ${
                    isLeadDrafter
                      ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-400 dark:border-emerald-600 ring-emerald-500/30"
                      : "bg-white dark:bg-slate-700 border-emerald-300 dark:border-emerald-700 ring-emerald-500/20"
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="text-[9.5px] font-bold text-slate-400 block">2. 책임 (관리자)</span>
                      {isLeadDrafter && (
                        <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-500 text-white font-black">
                          전결 대상
                        </span>
                      )}
                    </div>
                    <select
                      value={draftForm.leadName}
                      onChange={(e) => setDraftForm({ ...draftForm, leadName: e.target.value })}
                      className="w-full bg-transparent font-black text-slate-900 dark:text-white text-xs focus:outline-none cursor-pointer mt-0.5"
                    >
                      <optgroup label="삼랑진공장 관리자">
                        {APPROVAL_MANAGERS.LEADS.filter((m) => m.plant === "삼랑진공장").map((m) => (
                          <option key={m.name} value={m.name} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
                            {m.name} ({m.title} • {m.process})
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="한림공장 관리자">
                        {APPROVAL_MANAGERS.LEADS.filter((m) => m.plant === "한림공장").map((m) => (
                          <option key={m.name} value={m.name} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
                            {m.name} ({m.title} • {m.process})
                          </option>
                        ))}
                      </optgroup>
                    </select>
                    <span className={`text-[9px] font-medium block truncate ${isLeadDrafter ? "text-emerald-600 dark:text-emerald-400 font-bold" : "text-blue-600 dark:text-blue-400"}`}>
                      {isLeadDrafter ? "✅ 책임 전결 (기안 즉시 승인)" : "책임/중간 결재"}
                    </span>
                  </div>
                );
              })()}

              {/* 3. 이사 (임원) 뱃지 - 임원 선택 */}
              <div className="p-2 rounded-xl bg-white dark:bg-slate-700 border border-purple-300 dark:border-purple-700 ring-1 ring-purple-500/20">
                <span className="text-[9.5px] font-bold text-slate-400 block">3. 이사 (임원)</span>
                <select
                  value={draftForm.directorName || (draftForm.plant === "한림공장" ? "이명재 / 최미영" : "이명재")}
                  onChange={(e) => setDraftForm({ ...draftForm, directorName: e.target.value })}
                  className="w-full bg-transparent font-black text-slate-900 dark:text-white text-xs focus:outline-none cursor-pointer mt-0.5"
                >
                  {APPROVAL_MANAGERS.DIRECTORS.map((m) => (
                    <option key={m.name} value={m.name} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
                      {m.name} ({m.title})
                    </option>
                  ))}
                </select>
                <span className="text-[9px] text-purple-600 dark:text-purple-400 font-medium">총괄/임원 승인</span>
              </div>

              {/* 4. 대표 (CEO/전무) 뱃지 - 최종 결재자 선택 */}
              <div className="p-2 rounded-xl bg-white dark:bg-slate-700 border border-blue-300 dark:border-blue-700 ring-1 ring-blue-500/20">
                <span className="text-[9.5px] font-bold text-slate-400 block">4. 대표 (최종)</span>
                <select
                  value={draftForm.ceoName || "권태형"}
                  onChange={(e) => setDraftForm({ ...draftForm, ceoName: e.target.value })}
                  className="w-full bg-transparent font-black text-slate-900 dark:text-white text-xs focus:outline-none cursor-pointer mt-0.5"
                >
                  {APPROVAL_MANAGERS.CEO.map((m) => (
                    <option key={m.name} value={m.name} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
                      {m.name} ({m.title})
                    </option>
                  ))}
                </select>
                <span className="text-[9px] text-blue-600 dark:text-blue-400 font-medium">최종 결재자</span>
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              취소
            </button>
            <button
              type="submit"
              className={`px-6 py-2.5 rounded-xl ${
                editingDocId
                  ? "bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 shadow-teal-500/25"
                  : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-emerald-500/25"
              } text-white font-black shadow-md active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer`}
            >
              {editingDocId ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>기안서 수정 완료 (재상신)</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>결재 상신 (기안 요청)</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
