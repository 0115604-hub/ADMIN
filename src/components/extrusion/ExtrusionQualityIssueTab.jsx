import React, { useState, useEffect, useMemo } from "react";
import { ShieldAlert } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import {
  subscribeExtrusionQualityIssues,
  getLocalExtrusionQualityIssues,
  saveExtrusionQualityIssue,
  resolveExtrusionQualityIssue,
  deleteExtrusionQualityIssue
} from "../../services/extrusionQualityIssueService";
import { ImagePreviewModal } from "../common/ImagePreviewModal";
import WorkReportNonconformanceLedgerPanel from "../common/WorkReportNonconformanceLedgerPanel";

import { compressImage } from "./quality/extrusionIssueUtils";
import ExtrusionIssueForm from "./quality/ExtrusionIssueForm";
import ExtrusionIssueTable from "./quality/ExtrusionIssueTable";
import ExtrusionIssueDetailModal from "./quality/ExtrusionIssueDetailModal";

/**
 * 🏭 압출동 품질이슈 및 긴급공지 탭
 * 설유철 책임 전담
 */
export const ExtrusionQualityIssueTab = () => {
  const { currentProfile } = useAuth();
  const [issues, setIssues] = useState(() => getLocalExtrusionQualityIssues());
  const [isProcessing, setIsProcessing] = useState(false);
  const [isProcessingCauseImages, setIsProcessingCauseImages] = useState(false);
  const [isProcessingActionImages, setIsProcessingActionImages] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [detailModalIssue, setDetailModalIssue] = useState(null);

  // Edit Mode State
  const [editingIssueId, setEditingIssueId] = useState(null);

  // Filter States
  const [selectedLineFilter, setSelectedLineFilter] = useState("all");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("ACTIVE"); // "ALL", "ACTIVE", "RESOLVED"
  const [searchQuery, setSearchQuery] = useState("");

  // Form State: 발생원인 사진(causeImages)과 조치결과 사진(actionImages) 분리 및 등록일자(date) 명시
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [form, setForm] = useState({
    date: todayStr,
    createdAt: undefined,
    line: "PCM 1호기",
    defectType: "외관 스크래치 / 찍힘",
    title: "",
    content: "",
    actionResult: "",
    causeImages: [],
    actionImages: []
  });

  // Real-time Cloud Sync
  useEffect(() => {
    const unsub = subscribeExtrusionQualityIssues((list) => {
      setIssues(list);
    });
    return () => unsub();
  }, []);

  // Image Upload Handlers for 발생원인 사진
  const handleCauseImageFiles = async (files) => {
    if (!files || files.length === 0) return;
    setIsProcessingCauseImages(true);
    try {
      const validFiles = Array.from(files).filter((f) => f.type.startsWith("image/"));
      if (validFiles.length === 0) {
        alert("이미지 파일(JPG, PNG, GIF, WebP 등)만 첨부할 수 있습니다.");
        setIsProcessingCauseImages(false);
        return;
      }
      const processed = await Promise.all(validFiles.map((f) => compressImage(f)));
      setForm((prev) => ({
        ...prev,
        causeImages: [...(prev.causeImages || []), ...processed].slice(0, 8)
      }));
    } catch (err) {
      console.error("Cause image upload error:", err);
      alert("발생원인 사진 첨부 중 오류가 발생했습니다.");
    } finally {
      setIsProcessingCauseImages(false);
    }
  };

  const handleRemoveCauseImage = (idx) => {
    setForm((prev) => ({
      ...prev,
      causeImages: (prev.causeImages || []).filter((_, i) => i !== idx)
    }));
  };

  // Image Upload Handlers for 조치결과 사진
  const handleActionImageFiles = async (files) => {
    if (!files || files.length === 0) return;
    setIsProcessingActionImages(true);
    try {
      const validFiles = Array.from(files).filter((f) => f.type.startsWith("image/"));
      if (validFiles.length === 0) {
        alert("이미지 파일(JPG, PNG, GIF, WebP 등)만 첨부할 수 있습니다.");
        setIsProcessingActionImages(false);
        return;
      }
      const processed = await Promise.all(validFiles.map((f) => compressImage(f)));
      setForm((prev) => ({
        ...prev,
        actionImages: [...(prev.actionImages || []), ...processed].slice(0, 8)
      }));
    } catch (err) {
      console.error("Action image upload error:", err);
      alert("조치결과 사진 첨부 중 오류가 발생했습니다.");
    } finally {
      setIsProcessingActionImages(false);
    }
  };

  const handleRemoveActionImage = (idx) => {
    setForm((prev) => ({
      ...prev,
      actionImages: (prev.actionImages || []).filter((_, i) => i !== idx)
    }));
  };

  // Submit Form (Register or Update Issue)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      alert("품질이슈 제목(불량 현상)을 입력해 주세요.");
      return;
    }
    if (!form.content.trim()) {
      alert("세부 불량 내용 및 발생 원인을 입력해 주세요.");
      return;
    }

    setIsProcessing(true);
    try {
      const authorName = currentProfile?.name || "설유철";
      const authorTitle = currentProfile?.title || "책임";

      const hasAction = Boolean(
        (form.actionResult && form.actionResult.trim().length > 0) ||
        (Array.isArray(form.actionImages) && form.actionImages.length > 0)
      );
      const payload = {
        ...form,
        author: authorName,
        authorTitle,
        status: hasAction ? "RESOLVED" : "ACTIVE",
        isResolved: hasAction,
        actionAuthor: hasAction ? authorName : ""
      };

      if (editingIssueId) {
        payload.id = editingIssueId;
      }

      await saveExtrusionQualityIssue(payload);

      // Reset form
      setForm({
        date: todayStr,
        createdAt: undefined,
        line: "PCM 1호기",
        defectType: "외관 스크래치 / 찍힘",
        title: "",
        content: "",
        actionResult: "",
        causeImages: [],
        actionImages: []
      });

      const isEdit = Boolean(editingIssueId);
      setEditingIssueId(null);

      alert(
        isEdit
          ? "🎉 압출 품질이슈가 성공적으로 수정되었습니다."
          : "🚨 압출동 품질이슈가 등록되었으며 압출동 작업자 로그인 팝업으로 즉시 전파됩니다!"
      );
    } catch (err) {
      console.error("Submit error:", err);
      alert("품질이슈 등록 중 오류가 발생했습니다: " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Load Issue into form for editing
  const handleEdit = (issue) => {
    setEditingIssueId(issue.id);
    const causeImgs = Array.isArray(issue.causeImages)
      ? [...issue.causeImages]
      : Array.isArray(issue.images)
      ? [...issue.images]
      : [];
    const actionImgs = Array.isArray(issue.actionImages) ? [...issue.actionImages] : [];

    const issueDate = issue.date || (issue.createdAt ? issue.createdAt.slice(0, 10) : todayStr);

    setForm({
      date: issueDate,
      createdAt: issue.createdAt,
      line: issue.line || "PCM 1호기",
      defectType: issue.defectType || "외관 스크래치 / 찍힘",
      title: issue.title || "",
      content: issue.content || "",
      actionResult: issue.actionResult || issue.actionGuide || issue.resolutionNote || "",
      causeImages: causeImgs,
      actionImages: actionImgs
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Resolve Issue
  const handleResolve = async (issue) => {
    const defaultNote = issue.actionResult || "다이스 토출구 조치 및 초물 검사 완료";
    const note = window.prompt("조치결과 및 완료 내용을 입력해 주세요:", defaultNote);
    if (note === null) return;

    try {
      await resolveExtrusionQualityIssue(issue.id, note, currentProfile?.name || "설유철");
      alert("✅ 품질이슈가 [조치 완료] 처리되었습니다.");
    } catch (err) {
      console.error("Resolve error:", err);
      alert("조치 완료 처리 중 오류가 발생했습니다.");
    }
  };

  // Delete Issue
  const handleDelete = async (id) => {
    if (!window.confirm("이 품질이슈를 삭제하시겠습니까?")) return;
    try {
      await deleteExtrusionQualityIssue(id);
      if (editingIssueId === id) {
        setEditingIssueId(null);
      }
      if (detailModalIssue?.id === id) {
        setDetailModalIssue(null);
      }
      alert("품질이슈가 삭제되었습니다.");
    } catch (err) {
      console.error("Delete error:", err);
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  // Filtered Issues
  const filteredIssues = useMemo(() => {
    return issues.filter((it) => {
      if (!it) return false;

      // Status filter
      if (selectedStatusFilter !== "ALL") {
        if (it.status !== selectedStatusFilter) return false;
      }

      // Line filter
      if (selectedLineFilter !== "all") {
        if (it.line !== selectedLineFilter && it.line !== "전 라인 (공통)") return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const actionText = it.actionResult || it.actionGuide || it.resolutionNote || "";
        const match =
          (it.title || "").toLowerCase().includes(q) ||
          (it.line || "").toLowerCase().includes(q) ||
          (it.content || "").toLowerCase().includes(q) ||
          (it.defectType || "").toLowerCase().includes(q) ||
          actionText.toLowerCase().includes(q) ||
          (it.author || "").toLowerCase().includes(q);
        if (!match) return false;
      }

      return true;
    });
  }, [issues, selectedStatusFilter, selectedLineFilter, searchQuery]);

  // Summary Metrics
  const stats = useMemo(() => {
    const total = issues.length;
    const active = issues.filter((it) => it.status === "ACTIVE").length;
    const resolved = issues.filter((it) => it.status === "RESOLVED").length;
    return { total, active, resolved };
  }, [issues]);

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* ========================================================================= */}
      {/* 1. Header Banner */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-r from-rose-950/80 via-slate-900 to-amber-950/80 rounded-2xl p-3 sm:p-4 border border-rose-600/40 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-white">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-rose-600 to-amber-600 text-white shadow-md shadow-rose-600/30 shrink-0 animate-pulse">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                압출동 품질이슈 및 긴급공지
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-600 text-white shadow-2xs">
                설유철 책임 전담
              </span>
            </div>
            <p className="text-[11px] text-rose-200/90 font-medium mt-0.5">
              발생원인 사진 및 조치결과 사진을 분리하여 촬영·첨부할 수 있으며 작업자 로그인 시 실시간 공지됩니다.
            </p>
          </div>
        </div>

        {/* Quick KPI Badges */}
        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          <div className="px-3 py-1.5 rounded-xl bg-rose-950/90 border border-rose-500/60 text-center">
            <span className="text-[10px] font-bold text-rose-300 block">🚨 진행중 (조치중)</span>
            <span className="font-mono font-black text-rose-400 text-sm">{stats.active}건</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-emerald-950/90 border border-emerald-500/60 text-center">
            <span className="text-[10px] font-bold text-emerald-300 block">✅ 조치 완료</span>
            <span className="font-mono font-black text-emerald-400 text-sm">{stats.resolved}건</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-slate-800/90 border border-slate-700 text-center">
            <span className="text-[10px] font-bold text-slate-400 block">전체 등록</span>
            <span className="font-mono font-black text-slate-200 text-sm">{stats.total}건</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. Top Section: Quality Issue Registration Panel (품질이슈 등록 패널) */}
      {/* ========================================================================= */}
      <ExtrusionIssueForm
        form={form}
        setForm={setForm}
        editingIssueId={editingIssueId}
        onCancelEdit={() => {
          setEditingIssueId(null);
          setForm({
            date: todayStr,
            createdAt: undefined,
            line: "PCM 1호기",
            defectType: "외관 스크래치 / 찍힘",
            title: "",
            content: "",
            actionResult: "",
            causeImages: [],
            actionImages: []
          });
        }}
        onSubmit={handleSubmit}
        isProcessing={isProcessing}
        currentProfile={currentProfile}
        todayStr={todayStr}
        isProcessingCauseImages={isProcessingCauseImages}
        onCauseImageFiles={handleCauseImageFiles}
        onRemoveCauseImage={handleRemoveCauseImage}
        isProcessingActionImages={isProcessingActionImages}
        onActionImageFiles={handleActionImageFiles}
        onRemoveActionImage={handleRemoveActionImage}
        onPreviewImage={(img) => setPreviewImage(img)}
      />

      {/* ========================================================================= */}
      {/* 3. Bottom Section: 1-Line Table View for Extrusion Issues (1줄짜리 목록) */}
      {/* ========================================================================= */}
      <ExtrusionIssueTable
        issues={issues}
        filteredIssues={filteredIssues}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedStatusFilter={selectedStatusFilter}
        setSelectedStatusFilter={setSelectedStatusFilter}
        selectedLineFilter={selectedLineFilter}
        setSelectedLineFilter={setSelectedLineFilter}
        onSelectIssue={(issue) => setDetailModalIssue(issue)}
        onPreviewImage={(img) => setPreviewImage(img)}
        onResolve={handleResolve}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* ========================================================================= */}
      {/* 3-2. 작업일보내 부적합발생패널 (현장내전파 목록 아래 별도 관리) */}
      {/* ========================================================================= */}
      <WorkReportNonconformanceLedgerPanel
        filterCompany="압출동"
        currentProfile={currentProfile}
        titlePrefix="압출동"
      />

      {/* ========================================================================= */}
      {/* 4. Detail Modal (When user clicks a 1-line item) */}
      {/* ========================================================================= */}
      <ExtrusionIssueDetailModal
        issue={detailModalIssue}
        onClose={() => setDetailModalIssue(null)}
        onPreviewImage={(img) => setPreviewImage(img)}
        onResolve={handleResolve}
        onEdit={(issue) => {
          handleEdit(issue);
          setDetailModalIssue(null);
        }}
      />

      {/* Image Lightbox Preview Modal */}
      {previewImage && (
        <ImagePreviewModal previewImage={previewImage} onClose={() => setPreviewImage(null)} />
      )}
    </div>
  );
};

export default ExtrusionQualityIssueTab;
