import { useState } from "react";
import {
  X,
  Calendar,
  SlidersHorizontal,
  Camera,
  CheckCircle2,
  ShieldAlert
} from "lucide-react";
import { saveExtrusionQualityIssue } from "../../../services/extrusionQualityIssueService";
import { saveHanulQualityIssue } from "../../../services/hanulQualityIssueService";
import { saveYuseongQualityIssue } from "../../../services/yuseongQualityIssueService";
import { saveMachiningQualityIssue } from "../../../services/machiningQualityIssueService";
import { updateUrgentIssueActionResult } from "../../../services/urgentIssueService";
import {
  registerToFourMLedger,
  getCore4MId
} from "../../../services/fourMChangePointService";
import { compressImage } from "./utils/imageCompressor";

/**
 * AbnormalityDetailModal
 * Renders full detail view of a 4M record with reclassification options, photo gallery, and action registration.
 */
export const AbnormalityDetailModal = ({
  selectedItem,
  onClose,
  currentProfile,
  onUpdateItemFourM,
  onToggleLedger,
  fourMLedgerRecords = [],
  onPreviewImage,
  onItemUpdated
}) => {
  const [actionInputText, setActionInputText] = useState(selectedItem?.actionResult || "");
  const [actionAuthorInput, setActionAuthorInput] = useState(currentProfile?.name || "관리자");
  const [actionPhotos, setActionPhotos] = useState([]);
  const [isSavingAction, setIsSavingAction] = useState(false);

  if (!selectedItem) return null;

  // 조치 사진 업로드 핸들러
  const handleActionPhotoUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    try {
      const compressedList = await Promise.all(
        files.map((file) => compressImage(file, 1200, 1200, 0.8))
      );
      setActionPhotos((prev) => [...prev, ...compressedList]);
    } catch (err) {
      console.error("Action photo upload error:", err);
      alert("사진 처리 중 오류가 발생했습니다.");
    }
  };

  // 조치 내용 및 사진 저장 핸들러
  const handleSaveActionResult = async () => {
    const newActionImages = actionPhotos.map((p) => p.dataUrl || p);
    if (!actionInputText.trim() && newActionImages.length === 0) {
      alert("조치 내용 또는 첨부 사진을 입력해 주세요.");
      return;
    }

    setIsSavingAction(true);
    const nowStr = new Date().toLocaleString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    }).replace(/\. /g, "-").replace(/\./g, "");

    try {
      const effectiveAuthor = actionAuthorInput || currentProfile?.name || "관리자";
      const actionText = actionInputText.trim() || "조치 사진 첨부 완료";
      const idStr = String(selectedItem.id || "");
      const rawIssue = selectedItem.raw || {};
      const originStr = String(selectedItem.origin || rawIssue.origin || "");
      const coreId = getCore4MId(rawIssue.id || idStr);

      if (idStr.startsWith("ext_q_") || originStr === "EXTRUSION_QUALITY") {
        const targetId = rawIssue.id && !String(rawIssue.id).startsWith("ledger_") ? rawIssue.id : coreId;
        await saveExtrusionQualityIssue({
          ...rawIssue,
          id: targetId,
          actionResult: actionText,
          actionAuthor: effectiveAuthor,
          actionAt: nowStr,
          actionImages: Array.from(new Set([...(rawIssue.actionImages || []), ...newActionImages])),
          status: "RESOLVED",
          isResolved: true
        });
      } else if (idStr.startsWith("hanul_q_") || originStr === "HANUL_QUALITY") {
        const targetId = rawIssue.id && !String(rawIssue.id).startsWith("ledger_") ? rawIssue.id : coreId;
        await saveHanulQualityIssue({
          ...rawIssue,
          id: targetId,
          actionResult: actionText,
          actionAuthor: effectiveAuthor,
          actionAt: nowStr,
          actionImages: Array.from(new Set([...(rawIssue.actionImages || []), ...newActionImages])),
          status: "RESOLVED",
          isResolved: true
        });
      } else if (idStr.startsWith("ys_q_") || originStr === "YUSEONG_QUALITY") {
        const targetId = rawIssue.id && !String(rawIssue.id).startsWith("ledger_") ? rawIssue.id : coreId;
        await saveYuseongQualityIssue({
          ...rawIssue,
          id: targetId,
          actionResult: actionText,
          actionAuthor: effectiveAuthor,
          actionAt: nowStr,
          actionImages: Array.from(new Set([...(rawIssue.actionImages || []), ...newActionImages])),
          status: "RESOLVED",
          isResolved: true
        });
      } else if (idStr.startsWith("mach_q_") || originStr === "MACHINING_QUALITY") {
        const targetId = rawIssue.id && !String(rawIssue.id).startsWith("ledger_") ? rawIssue.id : coreId;
        await saveMachiningQualityIssue({
          ...rawIssue,
          id: targetId,
          actionResult: actionText,
          actionAuthor: effectiveAuthor,
          actionAt: nowStr,
          actionImages: Array.from(new Set([...(rawIssue.actionImages || []), ...newActionImages])),
          status: "RESOLVED",
          isResolved: true
        });
      } else if (
        idStr.startsWith("urg_") ||
        originStr === "URGENT_ISSUE" ||
        selectedItem.sourceType === "QUALITY_ALERT" ||
        String(coreId).startsWith("issue_")
      ) {
        const targetId = rawIssue.id && !String(rawIssue.id).startsWith("ledger_") ? rawIssue.id : coreId;
        await updateUrgentIssueActionResult(
          targetId,
          actionText,
          effectiveAuthor,
          newActionImages,
          rawIssue
        );
      }

      if (selectedItem.isRegisteredInLedger || selectedItem.sourceType === "OFFICIAL_LEDGER" || idStr.startsWith("ledger_")) {
        await registerToFourMLedger(
          {
            ...selectedItem,
            actionResult: actionText,
            actionAuthor: effectiveAuthor,
            actionAt: nowStr,
            actionImages: Array.from(new Set([...(selectedItem.actionImages || []), ...newActionImages])),
            isResolved: true
          },
          effectiveAuthor
        ).catch(() => {});
      }

      const updatedItem = {
        ...selectedItem,
        actionResult: actionText,
        actionAuthor: effectiveAuthor,
        actionAt: nowStr,
        actionImages: Array.from(new Set([...(selectedItem.actionImages || []), ...newActionImages])),
        isResolved: true
      };

      if (onItemUpdated) {
        onItemUpdated(updatedItem);
      }

      alert("조치 내용 및 첨부 사진이 성공적으로 저장되었습니다.");
    } catch (err) {
      console.error("Save action error:", err);
      alert("조치 내용 저장 중 오류가 발생했습니다.");
    } finally {
      setIsSavingAction(false);
    }
  };

  const isAlreadyInLedger = fourMLedgerRecords.some(
    (r) => r.originalId === selectedItem.id || r.id === selectedItem.id
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-scaleIn">
        <div className="px-4 py-3 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between border-b border-indigo-500/30">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-indigo-500 text-white font-black text-xs">
              [{selectedItem.fourM}] {selectedItem.origin}
            </span>
            <h3 className="font-black text-sm text-white truncate">
              변동점 상세 및 조치 등록
            </h3>
          </div>
          <button type="button" onClick={onClose} className="p-1 text-slate-400 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto space-y-3.5 text-xs">
          {/* Meta Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-[11px]">
            <div>
              <span className="text-slate-400 block">등록일시 (발생일)</span>
              <span className="font-black text-slate-900 dark:text-white flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-rose-500" />
                <span>{selectedItem.date} {selectedItem.time || ""}</span>
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">공장 / 라인</span>
              <span className="font-black text-slate-900 dark:text-white">{selectedItem.plant} • {selectedItem.line}</span>
            </div>
            <div>
              <span className="text-slate-400 block">보고자</span>
              <span className="font-black text-slate-900 dark:text-white">{selectedItem.writer}</span>
            </div>
            <div>
              <span className="text-slate-400 block">조치상태</span>
              <span className={`font-black ${selectedItem.isResolved ? "text-emerald-600" : "text-rose-600"}`}>
                {selectedItem.isResolved ? "✅ 조치완료" : "🚨 미조치"}
              </span>
            </div>
          </div>

          {/* 4M 분류 변경 컨트롤 */}
          <div className="p-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-1">
              <span className="text-xs font-black text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
                <SlidersHorizontal className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>4M 카테고리 분류 변경 (수정)</span>
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                현재 적용: <b className="text-indigo-600 dark:text-indigo-400 font-black">{selectedItem.fourM}</b>
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {[
                { key: "Machine", label: "⚙️ Machine", desc: "설비·기계·수리", active: "bg-indigo-600 text-white border-indigo-700 ring-2 ring-indigo-400/50 shadow-xs" },
                { key: "Material", label: "🧱 Material", desc: "원료·자재·불량", active: "bg-rose-600 text-white border-rose-700 ring-2 ring-rose-400/50 shadow-xs" },
                { key: "Man", label: "👤 Man", desc: "결근·대체투입", active: "bg-sky-600 text-white border-sky-700 ring-2 ring-sky-400/50 shadow-xs" },
                { key: "Method", label: "📐 Method", desc: "공법·작업표준", active: "bg-amber-600 text-white border-amber-700 ring-2 ring-amber-400/50 shadow-xs" }
              ].map((m) => {
                const isSelected = selectedItem.fourM === m.key;
                return (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => onUpdateItemFourM(selectedItem, m.key)}
                    className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                      isSelected
                        ? m.active
                        : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750"
                    }`}
                  >
                    <div className="font-black text-xs">{m.label}</div>
                    <div className={`text-[10px] mt-0.5 truncate ${isSelected ? "text-white/90" : "text-slate-400"}`}>{m.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title & Stats */}
          <div>
            <span className="text-slate-400 block text-[10.5px] mb-0.5">변동 및 발생 항목</span>
            <h4 className="font-black text-sm text-slate-900 dark:text-white">
              {selectedItem.title}
            </h4>
            {(selectedItem.downtimeMinutes > 0 || selectedItem.scrapKg > 0) && (
              <div className="flex items-center gap-2 mt-1">
                {selectedItem.downtimeMinutes > 0 && (
                  <span className="px-2 py-0.5 rounded bg-orange-100 text-orange-900 dark:bg-orange-950 dark:text-orange-200 font-black text-[11px]">
                    비가동: {selectedItem.downtimeMinutes}분
                  </span>
                )}
                {selectedItem.scrapKg > 0 && (
                  <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-200 font-black text-[11px]">
                    불량손실: {selectedItem.scrapKg}kg
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Detailed Content */}
          <div>
            <span className="text-slate-400 block text-[10.5px] mb-1">상세 내용</span>
            <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 whitespace-pre-line leading-relaxed font-medium">
              {selectedItem.content || "(상세 내용 없음)"}
            </div>
          </div>

          {/* Attached Photos */}
          {Array.isArray(selectedItem.images) && selectedItem.images.length > 0 && (
            <div>
              <span className="text-slate-400 block text-[10.5px] mb-1 flex items-center gap-1">
                <Camera className="w-3.5 h-3.5 text-amber-500" />
                <span>현장 사진 ({selectedItem.images.length}장) - 클릭 시 확대</span>
              </span>
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {selectedItem.images.map((img, iIdx) => {
                  const src = typeof img === "object" ? img.dataUrl || img.url : img;
                  if (!src) return null;
                  return (
                    <img
                      key={iIdx}
                      src={src}
                      alt="현장 사진"
                      onClick={() => onPreviewImage && onPreviewImage(src)}
                      className="w-16 h-16 object-cover rounded-lg border-2 border-amber-400 cursor-pointer hover:scale-105 transition shrink-0"
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Action Result Form */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2.5">
            <span className="font-black text-xs text-slate-900 dark:text-white flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>원인분석 및 조치내용 등록</span>
            </span>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-slate-500 block text-[10.5px] mb-0.5">조치자</label>
                <input
                  type="text"
                  value={actionAuthorInput}
                  onChange={(e) => setActionAuthorInput(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                />
              </div>
              <div>
                <label className="text-slate-500 block text-[10.5px] mb-0.5">조치 확인 사진</label>
                <label className="flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg border border-dashed border-indigo-400 bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-bold cursor-pointer text-[11px]">
                  <Camera className="w-3 h-3" />
                  <span>사진 ({actionPhotos.length}장)</span>
                  <input type="file" accept="image/*" multiple onChange={handleActionPhotoUpload} className="hidden" />
                </label>
              </div>
            </div>

            {actionPhotos.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {actionPhotos.map((p, pIdx) => (
                  <div key={pIdx} className="relative shrink-0">
                    <img src={p.dataUrl} alt="조치사진" className="w-14 h-14 object-cover rounded-lg border border-emerald-400" />
                    <button
                      type="button"
                      onClick={() => setActionPhotos((prev) => prev.filter((_, idx) => idx !== pIdx))}
                      className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white rounded-full p-0.5 cursor-pointer"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div>
              <label className="text-slate-500 block text-[10.5px] mb-0.5">조치 내용 및 결과</label>
              <textarea
                rows={2}
                value={actionInputText}
                onChange={(e) => setActionInputText(e.target.value)}
                placeholder="조치 내용, 원인 및 재발방지 내용을 입력하세요..."
                className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium"
              />
            </div>

            <div className="flex items-center justify-between gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => onToggleLedger(selectedItem)}
                className={`px-3 py-1.5 rounded-lg font-black text-xs transition-all flex items-center gap-1 cursor-pointer ${
                  isAlreadyInLedger
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 hover:bg-emerald-600 hover:text-white"
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>
                  {isAlreadyInLedger
                    ? "공식 대장 등록됨 (클릭 시 해제)"
                    : "➕ 공식 변동점 대장 등록"}
                </span>
              </button>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer"
                >
                  닫기
                </button>
                <button
                  type="button"
                  onClick={handleSaveActionResult}
                  disabled={isSavingAction}
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs shadow-xs transition cursor-pointer"
                >
                  {isSavingAction ? "저장 중..." : "조치 저장"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
