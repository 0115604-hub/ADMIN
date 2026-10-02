import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  AlertTriangle,
  AlertCircle,
  Plus,
  Send,
  Camera,
  Image as ImageIcon,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  Trash2,
  Edit3,
  X,
  ZoomIn,
  ShieldAlert,
  Flame,
  User,
  Factory,
  Layers,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Check,
  RotateCcw
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import {
  EXTRUSION_LINES,
  DEFECT_TYPES,
  SEVERITY_LEVELS,
  subscribeExtrusionQualityIssues,
  getLocalExtrusionQualityIssues,
  saveExtrusionQualityIssue,
  resolveExtrusionQualityIssue,
  deleteExtrusionQualityIssue
} from "../../services/extrusionQualityIssueService";
import { ImagePreviewModal } from "../common/ImagePreviewModal";

const VEHICLE_PRESETS = ["NQ5", "DL3", "GL3", "NX4", "HR", "JA", "SP2", "MQ4", "KA4", "공통"];

// Client-side instant image compression
const compressImage = (file, maxWidth = 1200, maxHeight = 1200, quality = 0.8) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        resolve({
          id: `img_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          name: file.name,
          size: ((dataUrl.length * 0.75) / 1024).toFixed(1) + " KB",
          dataUrl
        });
      };
      img.onerror = () => {
        resolve({
          id: `img_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          name: file.name,
          size: (file.size / 1024).toFixed(1) + " KB",
          dataUrl: event.target.result
        });
      };
    };
  });
};

export const ExtrusionQualityIssueTab = () => {
  const { currentProfile, isAdmin } = useAuth();
  const [issues, setIssues] = useState(() => getLocalExtrusionQualityIssues());
  const [isProcessing, setIsProcessing] = useState(false);
  const [isProcessingImages, setIsProcessingImages] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  // Edit Mode State
  const [editingIssueId, setEditingIssueId] = useState(null);

  // Filter States
  const [selectedLineFilter, setSelectedLineFilter] = useState("all");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("ACTIVE"); // "ALL", "ACTIVE", "RESOLVED"
  const [selectedSeverityFilter, setSelectedSeverityFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Form State
  const [form, setForm] = useState({
    line: "PCM 1호기",
    vehicle: "NQ5",
    itemCode: "",
    defectType: "외관 스크래치 / 찍힘",
    severity: "CRITICAL",
    title: "",
    content: "",
    actionGuide: "",
    images: []
  });

  const fileInputRef = useRef(null);

  // Real-time Cloud Sync
  useEffect(() => {
    const unsub = subscribeExtrusionQualityIssues((list) => {
      setIssues(list);
    });
    return () => unsub();
  }, []);

  // Image Upload Handlers
  const handleImageFiles = async (files) => {
    if (!files || files.length === 0) return;
    setIsProcessingImages(true);
    try {
      const validFiles = Array.from(files).filter((f) => f.type.startsWith("image/"));
      if (validFiles.length === 0) {
        alert("이미지 파일(JPG, PNG, GIF, WebP 등)만 첨부할 수 있습니다.");
        setIsProcessingImages(false);
        return;
      }
      const processed = await Promise.all(validFiles.map((f) => compressImage(f)));
      setForm((prev) => ({
        ...prev,
        images: [...(prev.images || []), ...processed].slice(0, 8)
      }));
    } catch (err) {
      console.error("Image upload error:", err);
      alert("사진 첨부 중 오류가 발생했습니다.");
    } finally {
      setIsProcessingImages(false);
    }
  };

  const handleRemoveImage = (idx) => {
    setForm((prev) => ({
      ...prev,
      images: (prev.images || []).filter((_, i) => i !== idx)
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

      const payload = {
        ...form,
        author: authorName,
        authorTitle,
        status: "ACTIVE"
      };

      if (editingIssueId) {
        payload.id = editingIssueId;
      }

      await saveExtrusionQualityIssue(payload);

      // Reset form
      setForm({
        line: "PCM 1호기",
        vehicle: "NQ5",
        itemCode: "",
        defectType: "외관 스크래치 / 찍힘",
        severity: "CRITICAL",
        title: "",
        content: "",
        actionGuide: "",
        images: []
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
    setForm({
      line: issue.line || "PCM 1호기",
      vehicle: issue.vehicle || "NQ5",
      itemCode: issue.itemCode || "",
      defectType: issue.defectType || "외관 스크래치 / 찍힘",
      severity: issue.severity || "CRITICAL",
      title: issue.title || "",
      content: issue.content || "",
      actionGuide: issue.actionGuide || "",
      images: Array.isArray(issue.images) ? [...issue.images] : []
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Resolve Issue
  const handleResolve = async (issue) => {
    const note = window.prompt("조치 및 해결 완료 내용을 입력해 주세요:", "작업자 교육 및 다이스 토출구 조치 완료");
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

      // Severity filter
      if (selectedSeverityFilter !== "all") {
        if (it.severity !== selectedSeverityFilter) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const match =
          (it.title || "").toLowerCase().includes(q) ||
          (it.vehicle || "").toLowerCase().includes(q) ||
          (it.line || "").toLowerCase().includes(q) ||
          (it.content || "").toLowerCase().includes(q) ||
          (it.defectType || "").toLowerCase().includes(q) ||
          (it.itemCode || "").toLowerCase().includes(q) ||
          (it.author || "").toLowerCase().includes(q);
        if (!match) return false;
      }

      return true;
    });
  }, [issues, selectedStatusFilter, selectedLineFilter, selectedSeverityFilter, searchQuery]);

  // Summary Metrics
  const stats = useMemo(() => {
    const total = issues.length;
    const active = issues.filter((it) => it.status === "ACTIVE").length;
    const critical = issues.filter((it) => it.status === "ACTIVE" && it.severity === "CRITICAL").length;
    const warning = issues.filter((it) => it.status === "ACTIVE" && it.severity === "WARNING").length;
    const resolved = issues.filter((it) => it.status === "RESOLVED").length;
    return { total, active, critical, warning, resolved };
  }, [issues]);

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* ========================================================================= */}
      {/* 1. Header Banner */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-r from-rose-950/80 via-slate-900 to-amber-950/80 rounded-2xl p-3 sm:p-4 border border-rose-600/40 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-white">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-rose-600 to-amber-600 text-white shadow-md shadow-rose-600/30 shrink-0 animate-pulse">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                압출동 품질이슈 공지 및 집중 점검 관리
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-600 text-white shadow-2xs">
                설유철 책임 전담
              </span>
            </div>
            <p className="text-[11px] text-rose-200/90 font-medium mt-0.5">
              등록된 품질이슈는 압출동 작업자(공영국, 심임대, 이상은, 닉, 마이클 등) 로그인 시 팝업창에 즉시 공지됩니다.
            </p>
          </div>
        </div>

        {/* Quick KPI Badges */}
        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          <div className="px-3 py-1.5 rounded-xl bg-rose-950/90 border border-rose-500/60 text-center">
            <span className="text-[10px] font-bold text-rose-300 block">🚨 조치중 긴급</span>
            <span className="font-mono font-black text-rose-400 text-sm">{stats.critical}건</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-amber-950/90 border border-amber-500/60 text-center">
            <span className="text-[10px] font-bold text-amber-300 block">⚠️ 주의 관찰</span>
            <span className="font-mono font-black text-amber-400 text-sm">{stats.warning}건</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-emerald-950/90 border border-emerald-500/60 text-center">
            <span className="text-[10px] font-bold text-emerald-300 block">✅ 조치 완료</span>
            <span className="font-mono font-black text-emerald-400 text-sm">{stats.resolved}건</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. Top Section: Quality Issue Registration Panel (품질이슈 등록 패널) */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border-2 border-rose-500/40 shadow-md space-y-4">
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg ${editingIssueId ? "bg-teal-600" : "bg-rose-600"} text-white shadow-xs`}>
              {editingIssueId ? <Edit3 className="w-4 h-4" /> : <Flame className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-white">
                {editingIssueId ? "압출 품질이슈 수정" : "새 압출 품질이슈 등록 및 현장 전파"}
              </h3>
              <p className="text-[11px] text-slate-400">
                압출 라인별 불량 현상, 집중 점검 사항 및 작업 지침을 등록합니다.
              </p>
            </div>
          </div>

          {editingIssueId && (
            <button
              type="button"
              onClick={() => {
                setEditingIssueId(null);
                setForm({
                  line: "PCM 1호기",
                  vehicle: "NQ5",
                  itemCode: "",
                  defectType: "외관 스크래치 / 찍힘",
                  severity: "CRITICAL",
                  title: "",
                  content: "",
                  actionGuide: "",
                  images: []
                });
              }}
              className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-bold text-slate-600 dark:text-slate-300"
            >
              수정 취소
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {/* Row 1: 라인 선택 & 중요도(경보등급) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* 압출 라인 */}
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                압출 대상 라인
              </label>
              <select
                value={form.line}
                onChange={(e) => setForm({ ...form, line: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-white"
              >
                {EXTRUSION_LINES.map((l) => (
                  <option key={l.id} value={l.name}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 중요도 / 경보 등급 */}
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                경보 등급 (중요도)
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {SEVERITY_LEVELS.map((sev) => (
                  <button
                    type="button"
                    key={sev.id}
                    onClick={() => setForm({ ...form, severity: sev.id })}
                    className={`py-2 px-1 rounded-xl font-black text-[11px] transition-all border text-center ${
                      form.severity === sev.id
                        ? sev.id === "CRITICAL"
                          ? "bg-rose-600 text-white border-rose-700 ring-2 ring-rose-500/30 shadow-xs"
                          : sev.id === "WARNING"
                          ? "bg-amber-500 text-slate-950 border-amber-600 ring-2 ring-amber-500/30 shadow-xs"
                          : "bg-blue-600 text-white border-blue-700 ring-2 ring-blue-500/30 shadow-xs"
                        : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100"
                    }`}
                  >
                    {sev.id === "CRITICAL" ? "🚨 긴급 경보" : sev.id === "WARNING" ? "⚠️ 주의 관찰" : "ℹ️ 품질 공지"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Row 2: 차종 선택 / 입력 & 불량 유형 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* 차종 & 품번 */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  대상 차종 / 품번
                </label>
                <div className="flex items-center gap-1 overflow-x-auto">
                  {VEHICLE_PRESETS.slice(0, 5).map((v) => (
                    <button
                      type="button"
                      key={v}
                      onClick={() => setForm({ ...form, vehicle: v })}
                      className={`px-1.5 py-0.2 rounded-md text-[10px] font-bold border transition ${
                        form.vehicle === v
                          ? "bg-rose-50 border-rose-400 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                          : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500"
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  required
                  placeholder="차종 (예: NQ5, DL3)"
                  value={form.vehicle}
                  onChange={(e) => setForm({ ...form, vehicle: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-white"
                />
                <input
                  type="text"
                  placeholder="품번/품명 (선택)"
                  value={form.itemCode}
                  onChange={(e) => setForm({ ...form, itemCode: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-white font-mono"
                />
              </div>
            </div>

            {/* 불량 유형 */}
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                불량 유형
              </label>
              <select
                value={form.defectType}
                onChange={(e) => setForm({ ...form, defectType: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-white"
              >
                {DEFECT_TYPES.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 3: 품질이슈 제목 */}
          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
              품질이슈 제목 (불량 현상 핵심 요약)
            </label>
            <input
              type="text"
              required
              placeholder="예: PCM 1호 NQ5 다이스 토출구 이물 누적에 따른 외관 미세 스크래치 발생 주의"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-black text-slate-900 dark:text-white text-xs sm:text-sm"
            />
          </div>

          {/* Row 4: 세부 불량 내용 및 작업자 조치/주의 지시사항 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                세부 불량 현상 및 발생 원인
              </label>
              <textarea
                rows="3"
                required
                placeholder="구체적인 불량 현상, 발생 부위 및 추정 원인을 작성해 주세요."
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium text-slate-900 dark:text-white text-xs leading-relaxed"
              ></textarea>
            </div>

            <div>
              <label className="font-bold text-rose-600 dark:text-rose-400 block mb-1">
                작업자 현장 조치 지침 및 점검 주기
              </label>
              <textarea
                rows="3"
                placeholder="예: 1. 30분 단위 버니어 캘리퍼스 측정&#10;2. 스크래치 감지 시 즉시 라인 정지 후 토출구 청소"
                value={form.actionGuide}
                onChange={(e) => setForm({ ...form, actionGuide: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-rose-300 dark:border-rose-800/80 bg-rose-50/40 dark:bg-rose-950/20 font-medium text-slate-900 dark:text-white text-xs leading-relaxed"
              ></textarea>
            </div>
          </div>

          {/* Row 5: 현장 사진 / 한도 견본 첨부 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-rose-600" />
                <span>현장 불량 사진 및 한도 견본 첨부 (선택)</span>
              </label>
              <span className="text-[10.5px] text-slate-400">
                {form.images?.length || 0}/8장 첨부됨
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

            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-3 text-center cursor-pointer hover:border-rose-400 hover:bg-rose-50/20 transition-all flex items-center justify-center gap-2"
            >
              <Camera className="w-4 h-4 text-rose-600" />
              <span className="font-bold text-slate-700 dark:text-slate-300 text-xs">
                {isProcessingImages ? "사진 압축 및 처리 중..." : "스마트폰 현장 불량 부위 사진 / 한도 견본 추가하기"}
              </span>
            </div>

            {form.images && form.images.length > 0 && (
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 pt-1">
                {form.images.map((img, idx) => (
                  <div
                    key={img.id || idx}
                    className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 aspect-square bg-slate-100 dark:bg-slate-800"
                  >
                    <img src={img.dataUrl} alt={img.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewImage({ url: img.dataUrl, name: img.name });
                        }}
                        className="p-1 rounded bg-white text-slate-900"
                      >
                        <ZoomIn className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveImage(idx);
                        }}
                        className="p-1 rounded bg-rose-600 text-white"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
            <span className="text-[11px] text-slate-500 font-bold flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-rose-600" />
              <span>등록자: <strong>{currentProfile?.name || "설유철"} {currentProfile?.title || "책임"}</strong></span>
            </span>

            <button
              type="submit"
              disabled={isProcessing}
              className={`px-6 py-2.5 rounded-xl font-black text-white text-xs sm:text-sm shadow-md flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer ${
                editingIssueId
                  ? "bg-gradient-to-r from-teal-600 to-cyan-600 shadow-teal-500/25 hover:from-teal-700 hover:to-cyan-700"
                  : "bg-gradient-to-r from-rose-600 to-amber-600 shadow-rose-500/25 hover:from-rose-700 hover:to-amber-700"
              }`}
            >
              {editingIssueId ? <Check className="w-4 h-4" /> : <Send className="w-4 h-4" />}
              <span>{editingIssueId ? "품질이슈 수정 완료" : "🚨 압출동 품질이슈 등록 및 현장 전파"}</span>
            </button>
          </div>
        </form>
      </div>

      {/* ========================================================================= */}
      {/* 3. Bottom Section: Registered Quality Issues List (등록된 품질이슈 목록) */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-slate-900 text-white dark:bg-white dark:text-slate-900">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-white">
                등록된 압출 품질이슈 목록
              </h3>
              <p className="text-[11px] text-slate-400">
                총 {issues.length}건 등록됨 (현재 조건: {filteredIssues.length}건)
              </p>
            </div>
          </div>

          {/* Search Input */}
          <div className="relative min-w-[220px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="제목, 차종, 라인, 불량 검색"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
            />
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            {[
              { id: "ACTIVE", label: "🚨 조치중 (진행)" },
              { id: "RESOLVED", label: "✅ 조치완료" },
              { id: "ALL", label: "전체보기" }
            ].map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => setSelectedStatusFilter(st.id)}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  selectedStatusFilter === st.id
                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>

          {/* Line Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-400">라인:</span>
            <select
              value={selectedLineFilter}
              onChange={(e) => setSelectedLineFilter(e.target.value)}
              className="px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-xs"
            >
              <option value="all">전체 라인</option>
              {EXTRUSION_LINES.map((l) => (
                <option key={l.id} value={l.name}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Issues List View */}
        {filteredIssues.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 space-y-2">
            <CheckCircle2 className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
            <p>해당 조건의 품질이슈가 없습니다.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredIssues.map((issue) => {
              const isResolved = issue.status === "RESOLVED";
              const isCritical = issue.severity === "CRITICAL";

              return (
                <div
                  key={issue.id}
                  className={`p-3.5 sm:p-4 rounded-2xl border transition-all space-y-3 ${
                    isResolved
                      ? "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-80"
                      : isCritical
                      ? "bg-rose-50/40 dark:bg-rose-950/20 border-rose-300 dark:border-rose-800/80 shadow-xs"
                      : "bg-amber-50/30 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800/80 shadow-xs"
                  }`}
                >
                  {/* Issue Header */}
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Severity Badge */}
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10.5px] font-black border ${
                          isCritical
                            ? "bg-rose-600 text-white border-rose-700 animate-pulse"
                            : issue.severity === "WARNING"
                            ? "bg-amber-500 text-slate-950 border-amber-600"
                            : "bg-blue-600 text-white border-blue-700"
                        }`}
                      >
                        {isCritical ? "🚨 긴급 경보" : issue.severity === "WARNING" ? "⚠️ 주의 관찰" : "ℹ️ 품질 공지"}
                      </span>

                      {/* Status Badge */}
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10.5px] font-black border ${
                          isResolved
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300"
                            : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-300"
                        }`}
                      >
                        {isResolved ? "✓ 조치 완료" : "● 현장 조치중"}
                      </span>

                      {/* Line Badge */}
                      <span className="px-2 py-0.5 rounded-md text-[10.5px] font-bold bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200">
                        {issue.line}
                      </span>

                      {/* Vehicle & Item */}
                      <span className="px-2 py-0.5 rounded-md text-[10.5px] font-black bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border border-purple-300">
                        {issue.vehicle} {issue.itemCode ? `(${issue.itemCode})` : ""}
                      </span>

                      <span className="text-[11px] font-mono text-slate-400">
                        {issue.date} {issue.time || ""}
                      </span>
                    </div>

                    {/* Author & Action Buttons */}
                    <div className="flex items-center gap-1.5 ml-auto">
                      <span className="text-[11px] text-slate-500 font-bold mr-2">
                        작성: {issue.author} {issue.authorTitle || ""}
                      </span>

                      {!isResolved && (
                        <button
                          type="button"
                          onClick={() => handleResolve(issue)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-xs flex items-center gap-1 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>조치 완료</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleEdit(issue)}
                        className="p-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300"
                        title="수정"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(issue.id)}
                        className="p-1 rounded-lg bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-600 hover:text-white text-rose-600 transition"
                        title="삭제"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Title & Defect Type */}
                  <div>
                    <h4 className="font-black text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span>{issue.title}</span>
                    </h4>
                    <span className="inline-block mt-0.5 px-2 py-0.2 rounded-md bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-bold text-[10.5px]">
                      불량 유형: {issue.defectType}
                    </span>
                  </div>

                  {/* Content & Action Guide */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                    <div className="p-3 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-1">
                      <span className="font-bold text-slate-500 dark:text-slate-400 block text-[10.5px]">
                        발생 현상 및 원인
                      </span>
                      <p className="text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                        {issue.content}
                      </p>
                    </div>

                    {issue.actionGuide && (
                      <div className="p-3 rounded-xl bg-rose-50/80 dark:bg-rose-950/40 border border-rose-300/80 dark:border-rose-800/80 space-y-1">
                        <span className="font-black text-rose-700 dark:text-rose-300 block text-[10.5px]">
                          작업자 집중 점검 및 조치 지침
                        </span>
                        <p className="text-rose-950 dark:text-rose-100 font-medium leading-relaxed whitespace-pre-wrap">
                          {issue.actionGuide}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Attached Photos */}
                  {issue.images && issue.images.length > 0 && (
                    <div className="flex items-center gap-2 pt-1 overflow-x-auto">
                      {issue.images.map((img, idx) => (
                        <div
                          key={img.id || idx}
                          onClick={() => setPreviewImage({ url: img.dataUrl, name: img.name })}
                          className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 cursor-pointer group shrink-0"
                        >
                          <img src={img.dataUrl} alt={img.name} className="w-full h-full object-cover group-hover:scale-105 transition" />
                          <div className="absolute inset-0 bg-slate-950/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                            <ZoomIn className="w-4 h-4 text-white" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Resolution Note if resolved */}
                  {isResolved && issue.resolutionNote && (
                    <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-xs flex items-center justify-between text-emerald-900 dark:text-emerald-200 font-bold">
                      <span>✓ 조치 내용: {issue.resolutionNote}</span>
                      <span className="font-mono text-[10.5px] text-emerald-600 dark:text-emerald-400">
                        {issue.resolvedAt} ({issue.resolvedBy || "설유철"})
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Image Lightbox Preview Modal */}
      {previewImage && (
        <ImagePreviewModal previewImage={previewImage} onClose={() => setPreviewImage(null)} />
      )}
    </div>
  );
};
