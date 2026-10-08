import React, { useState, useEffect, useMemo } from "react";
import {
  AlertTriangle,
  ShieldAlert,
  X,
  CheckCircle2,
  ZoomIn,
  Camera,
  Factory,
  Layers,
  ChevronRight,
  Clock,
  User,
  AlertCircle
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import {
  getLocalExtrusionQualityIssues,
  subscribeExtrusionQualityIssues,
  acknowledgeExtrusionQualityIssue,
  isExtrusionWorkerProfile
} from "../../services/extrusionQualityIssueService";
import { ImagePreviewModal } from "../common/ImagePreviewModal";
import { useModalHistory } from "../../utils/modalHistory";

export const ExtrusionQualityAlertModal = () => {
  const { currentProfile, isAuthenticated } = useAuth();
  const [issues, setIssues] = useState(() => getLocalExtrusionQualityIssues());
  const [isOpen, setIsOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  useModalHistory(isOpen, () => setIsOpen(false), "extrusionQualityAlertModal");

  // Subscribe to real-time quality issues
  useEffect(() => {
    const unsub = subscribeExtrusionQualityIssues((list) => {
      setIssues(list);
    });
    return () => unsub();
  }, []);

  // Filter active quality issues
  const activeIssues = useMemo(() => {
    return issues.filter((it) => it && it.status === "ACTIVE");
  }, [issues]);

  // Check whether to show the popup to this extrusion worker
  useEffect(() => {
    if (!isAuthenticated || !currentProfile) {
      setIsOpen(false);
      return;
    }

    const isWorker = isExtrusionWorkerProfile(currentProfile);
    if (!isWorker) {
      setIsOpen(false);
      return;
    }

    if (activeIssues.length === 0) {
      setIsOpen(false);
      return;
    }

    const todayStr = new Date().toISOString().slice(0, 10);
    const dismissKey = `ext_qual_popup_dismissed_${todayStr}_${currentProfile.id || currentProfile.name}`;
    const isDismissed = sessionStorage.getItem(dismissKey) || localStorage.getItem(dismissKey);

    if (!isDismissed) {
      setIsOpen(true);
    }
  }, [isAuthenticated, currentProfile, activeIssues.length]);

  const handleDismissToday = () => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const dismissKey = `ext_qual_popup_dismissed_${todayStr}_${currentProfile?.id || currentProfile?.name}`;
    try {
      localStorage.setItem(dismissKey, "true");
    } catch (e) {}
    setIsOpen(false);
  };

  const handleClose = () => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const dismissKey = `ext_qual_popup_dismissed_${todayStr}_${currentProfile?.id || currentProfile?.name}`;
    try {
      sessionStorage.setItem(dismissKey, "true");
    } catch (e) {}
    setIsOpen(false);
  };

  const handleAcknowledge = (issueId) => {
    if (currentProfile?.name) {
      acknowledgeExtrusionQualityIssue(issueId, currentProfile.name);
    }
  };

  if (!isOpen || activeIssues.length === 0) return null;

  return (
    <div
      onClick={handleClose}
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fadeIn overflow-y-auto cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-4 sm:p-6 border-2 border-rose-500 shadow-2xl space-y-4 animate-scaleUp my-4 cursor-default text-slate-900 dark:text-white"
      >
        {/* Header Bar */}
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-rose-200 dark:border-rose-900/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-rose-600 to-amber-600 text-white shadow-md shadow-rose-600/30 shrink-0 animate-bounce">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-black text-rose-600 dark:text-rose-400 tracking-tight">
                  🚨 압출동 현장 품질 공지 및 작업 지침
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10.5px] font-black bg-rose-600 text-white shadow-2xs">
                  {activeIssues.length}건 집중 관리
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                설유철 책임 공지 • 작업 시작 전 라인별 불량 현상 및 집중 관리 포인트를 반드시 확인하세요.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Worker Greeting */}
        <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-xs flex items-center justify-between">
          <span className="font-bold text-amber-900 dark:text-amber-200">
            압출동 작업자: <strong>{currentProfile?.name} ({currentProfile?.title || "작업자"})</strong>님, 안전 및 품질 수칙을 준수해 주세요.
          </span>
          <span className="text-[11px] font-mono text-amber-700 dark:text-amber-400">
            {new Date().toLocaleDateString("ko-KR")}
          </span>
        </div>

        {/* Active Issues List */}
        <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-1">
          {activeIssues.map((issue, idx) => {
            const isAcked = Array.isArray(issue.acknowledgedBy) && issue.acknowledgedBy.includes(currentProfile?.name);
            const actionText = issue.actionResult || issue.actionGuide || issue.resolutionNote || "";
            const causeImgs = Array.isArray(issue.causeImages)
              ? issue.causeImages
              : Array.isArray(issue.images)
              ? issue.images
              : [];
            const actionImgs = Array.isArray(issue.actionImages) ? issue.actionImages : [];

            return (
              <div
                key={issue.id || idx}
                className="p-3.5 sm:p-4 rounded-2xl border-2 bg-rose-50/40 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800/80 shadow-xs space-y-3"
              >
                {/* Badges & Meta */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="px-2 py-0.5 rounded-md text-[10.5px] font-black bg-rose-600 text-white shadow-2xs">
                      🚨 품질 공지
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[10.5px] font-black bg-slate-900 text-white dark:bg-white dark:text-slate-900">
                      {issue.line}
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[10.5px] font-bold bg-white dark:bg-slate-800 text-rose-600 border border-rose-200 dark:border-rose-800">
                      {issue.defectType}
                    </span>
                  </div>

                  <span className="text-[11px] font-bold text-slate-500">
                    작성: {issue.author} {issue.authorTitle || ""} ({issue.date || issue.createdAt?.slice(0, 10)})
                  </span>
                </div>

                {/* Title */}
                <h4 className="font-black text-sm sm:text-base text-slate-900 dark:text-white">
                  {issue.title}
                </h4>

                {/* 1) 발생원인 내용 및 사진 */}
                <div className="bg-white/80 dark:bg-slate-900/80 p-3 rounded-xl border border-rose-200 dark:border-rose-900/60 space-y-2">
                  <span className="font-bold text-[10.5px] text-rose-700 dark:text-rose-300 block flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 text-rose-600" />
                    <span>1. 세부 불량 현상 및 발생 원인</span>
                  </span>
                  <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap font-medium">
                    {issue.content}
                  </p>

                  {/* 발생원인 사진 */}
                  {causeImgs.length > 0 && (
                    <div className="pt-1 border-t border-rose-100 dark:border-rose-900/40">
                      <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 block mb-1">
                        📸 발생원인 사진 ({causeImgs.length}장):
                      </span>
                      <div className="flex items-center gap-2 overflow-x-auto">
                        {causeImgs.map((img, i) => (
                          <div
                            key={img.id || i}
                            onClick={() => setPreviewImage({ url: img.dataUrl, name: `[원인] ${img.name}` })}
                            className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 border-rose-300 dark:border-rose-700 cursor-pointer group shrink-0 shadow-2xs"
                          >
                            <img src={img.dataUrl} alt={img.name} className="w-full h-full object-cover group-hover:scale-105 transition" />
                            <div className="absolute inset-0 bg-slate-950/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                              <ZoomIn className="w-4 h-4 text-white" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* 2) 조치결과 내용 및 사진 */}
                {actionText && (
                  <div className="p-3 rounded-xl bg-teal-50/80 dark:bg-teal-950/40 border border-teal-300 dark:border-teal-800/80 space-y-2">
                    <span className="font-black text-teal-800 dark:text-teal-300 text-xs flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                      <span>2. 조치결과 및 개선사항</span>
                    </span>
                    <p className="text-xs text-teal-950 dark:text-teal-100 font-bold leading-relaxed whitespace-pre-wrap">
                      {actionText}
                    </p>

                    {/* 조치결과 사진 */}
                    {actionImgs.length > 0 && (
                      <div className="pt-1 border-t border-teal-200 dark:border-teal-900/40">
                        <span className="text-[10px] font-bold text-teal-700 dark:text-teal-300 block mb-1">
                          📸 조치결과 사진 ({actionImgs.length}장):
                        </span>
                        <div className="flex items-center gap-2 overflow-x-auto">
                          {actionImgs.map((img, i) => (
                            <div
                              key={img.id || i}
                              onClick={() => setPreviewImage({ url: img.dataUrl, name: `[조치] ${img.name}` })}
                              className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 border-teal-300 dark:border-teal-700 cursor-pointer group shrink-0 shadow-2xs"
                            >
                              <img src={img.dataUrl} alt={img.name} className="w-full h-full object-cover group-hover:scale-105 transition" />
                              <div className="absolute inset-0 bg-slate-950/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                <ZoomIn className="w-4 h-4 text-white" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Acknowledge Button */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-800 text-xs">
                  <span className="text-[10.5px] text-slate-500 font-mono">
                    확인한 작업자: {(issue.acknowledgedBy || []).join(", ") || "확인 대기"}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleAcknowledge(issue.id)}
                    className={`px-3 py-1 rounded-lg font-black text-xs transition flex items-center gap-1 cursor-pointer ${
                      isAcked
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300"
                        : "bg-rose-600 hover:bg-rose-700 text-white shadow-xs"
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{isAcked ? "확인 완료됨" : "확인완료 작업개시 ✓"}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs gap-2">
          <button
            type="button"
            onClick={handleDismissToday}
            className="px-3.5 py-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            오늘 하루 보지 않기
          </button>

          <button
            type="button"
            onClick={handleClose}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 text-white font-black text-xs sm:text-sm shadow-md shadow-rose-500/20 active:scale-95 transition-all cursor-pointer"
          >
            확인완료 작업개시
          </button>
        </div>
      </div>

      {previewImage && (
        <ImagePreviewModal previewImage={previewImage} onClose={() => setPreviewImage(null)} />
      )}
    </div>
  );
};
