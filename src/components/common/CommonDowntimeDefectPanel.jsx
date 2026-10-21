import React, { useState } from "react";
import { Clock, Plus, Trash2, Camera, UploadCloud, X, AlertTriangle } from "lucide-react";
import { DOWNTIME_CATEGORIES } from "../../services/extrusionProductionService";

// Client-side image compression for Before / After action photos
const compressPhotoFile = (file, maxWidth = 1000, maxHeight = 1000, quality = 0.78) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new window.Image();
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
        resolve(dataUrl);
      };
    };
  });
};

const calculateMinutes = (startTime, endTime) => {
  if (!startTime || !endTime) return 0;
  try {
    const [sH, sM] = String(startTime).split(":").map(Number);
    const [eH, eM] = String(endTime).split(":").map(Number);
    if (isNaN(sH) || isNaN(sM) || isNaN(eH) || isNaN(eM)) return 0;
    let sMin = sH * 60 + sM;
    let eMin = eH * 60 + eM;
    if (eMin < sMin) eMin += 24 * 60;
    return Math.max(0, eMin - sMin);
  } catch (e) {
    return 0;
  }
};

const DEFECT_CATEGORY_IDS = [
  "뜯김",
  "철심",
  "재압출",
  "단면형상",
  "스코치",
  "이물",
  "미분산",
  "발포",
  "원인불명",
  "밴딩",
  "심금절단",
  "심금노출",
  "천공",
  "연고무절단",
  "길이",
  "코팅",
  "조인트불량",
  "단컷팅불량",
  "치수불량",
  "오염/기포",
  "패드/마킹누락",
  "외관부적합"
];

const EXTRA_PROCESS_CATEGORIES = [
  { id: "조인트불량", label: "조인트불량", type: "불량", defaultDetail: "조인트 성형부 떨어짐/밀림/단차 발생 및 금형 조치" },
  { id: "단컷팅불량", label: "단컷팅불량", type: "불량", defaultDetail: "단컷팅 치수 편차 발생 및 지그/칼날 조정" },
  { id: "치수불량", label: "치수불량", type: "불량", defaultDetail: "초·중·종물 길이 규격 이탈 및 스토퍼 재세팅" },
  { id: "오염/기포", label: "오염/기포", type: "불량", defaultDetail: "제품 외면 본드 오염/기포 발생 및 세척 조치" },
  { id: "패드/마킹누락", label: "패드/마킹누락", type: "불량", defaultDetail: "부자재 패드/마킹 누락 검출 및 전수 재검사" },
  { id: "칼날교체", label: "칼날교체", type: "비가동", defaultDetail: "절단기 칼날 마모 교체 및 시운전 확인" }
];

const MERGED_CATEGORIES = [
  ...(Array.isArray(DOWNTIME_CATEGORIES) ? DOWNTIME_CATEGORIES : []),
  ...EXTRA_PROCESS_CATEGORIES.filter(
    (ex) => !(Array.isArray(DOWNTIME_CATEGORIES) && DOWNTIME_CATEGORIES.some((c) => c.id === ex.id))
  )
];

/**
 * 전 공정 작업일보 하단 공통 패널:
 * 압출동 · 가공동 · 한울 · 부림텍 · 유성 · 레고블럭 빌더 공통 적용
 * 기존의 '비가동 및 부적합품 발생내역' 틀을 유지하면서 부적합품 등록 및 조치전/조치후 사진 첨부 지원
 */
const CommonDowntimeDefectPanel = ({
  title = "비가동 및 부적합품 발생내역",
  plantLabel = "",
  unitLabel = "폐기량/수량",
  events,
  onChangeEvents,
  defaultEvents = [],
  onSyncSummary
}) => {
  const [internalEvents, setInternalEvents] = useState(() =>
    Array.isArray(defaultEvents) ? defaultEvents : []
  );

  const activeEvents = Array.isArray(events) ? events : internalEvents;

  const updateEvents = (nextList) => {
    if (typeof onChangeEvents === "function") {
      onChangeEvents(nextList);
    } else {
      setInternalEvents(nextList);
    }
    if (typeof onSyncSummary === "function") {
      const totalMin = nextList.reduce((s, ev) => s + (Number(ev?.minutes) || 0), 0);
      const summaryText = nextList
        .map((ev) => `[${ev.category}] ${ev.detail || ""}`)
        .filter(Boolean)
        .join(" / ");
      onSyncSummary({ totalMinutes: totalMin, summaryText, events: nextList });
    }
  };

  const [draft, setDraft] = useState({
    type: "불량",
    category: "뜯김",
    startTime: "08:00",
    endTime: "08:30",
    minutes: 30,
    scrapKg: "",
    detail: "표면 미세 뜯김 발생 → 다이스 클리닝 및 조건 보정 후 정상 복구",
    beforePhoto: null,
    afterPhoto: null
  });

  const [previewModal, setPreviewModal] = useState(null);

  const isDraftDefect =
    draft.type === "불량" ||
    draft.type === "부적합" ||
    DEFECT_CATEGORY_IDS.includes(draft.category);

  const handleModeSwitch = (targetType) => {
    if (targetType === "불량") {
      const defaultCat = "뜯김";
      const catObj = MERGED_CATEGORIES.find((c) => c.id === defaultCat);
      setDraft((prev) => ({
        ...prev,
        type: "불량",
        category: DEFECT_CATEGORY_IDS.includes(prev.category) ? prev.category : defaultCat,
        detail: prev.detail || catObj?.defaultDetail || ""
      }));
    } else {
      const defaultCat = "압개시";
      const catObj = MERGED_CATEGORIES.find((c) => c.id === defaultCat);
      setDraft((prev) => ({
        ...prev,
        type: "비가동",
        category: !DEFECT_CATEGORY_IDS.includes(prev.category) ? prev.category : defaultCat,
        detail: prev.detail || catObj?.defaultDetail || ""
      }));
    }
  };

  const handleDraftChange = (field, value) => {
    setDraft((prev) => {
      const next = { ...prev };
      if (field === "minutes" || field === "scrapKg") {
        next[field] = value === "" ? "" : Math.max(0, Number(value));
      } else if (field === "category") {
        next.category = value;
        const catObj = MERGED_CATEGORIES.find((c) => c.id === value);
        const isDef = DEFECT_CATEGORY_IDS.includes(value) || catObj?.type === "불량";
        next.type = isDef ? "불량" : "비가동";
        if (!next.detail || MERGED_CATEGORIES.some((c) => c.defaultDetail === next.detail)) {
          next.detail = catObj?.defaultDetail || "";
        }
      } else {
        next[field] = value;
      }

      if (field === "startTime" || field === "endTime") {
        const s = field === "startTime" ? value : next.startTime;
        const e = field === "endTime" ? value : next.endTime;
        if (s && e) {
          next.minutes = calculateMinutes(s, e);
        }
      }
      return next;
    });
  };

  const handlePhotoSelect = async (e, slot) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await compressPhotoFile(file);
    setDraft((prev) => ({
      ...prev,
      [slot === "before" ? "beforePhoto" : "afterPhoto"]: dataUrl
    }));
    e.target.value = "";
  };

  const handleEventPhotoSelect = async (e, index, slot) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await compressPhotoFile(file);
    const nextList = activeEvents.map((ev, i) =>
      i === index
        ? { ...ev, [slot === "before" ? "beforePhoto" : "afterPhoto"]: dataUrl }
        : ev
    );
    updateEvents(nextList);
    e.target.value = "";
  };

  const handleAddEvent = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const category = draft.category || "압개시";
    const catObj = MERGED_CATEGORIES.find((c) => c.id === category);
    const detail = String(draft.detail || "").trim() || catObj?.defaultDetail || `${category} 조치 완료`;
    const minutes =
      Number(draft.minutes) ||
      (draft.startTime && draft.endTime ? calculateMinutes(draft.startTime, draft.endTime) : 0);
    const scrapKg = draft.scrapKg !== "" && draft.scrapKg !== undefined ? Number(draft.scrapKg) : 0;

    const newEvent = {
      id: `dt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      type: isDraftDefect ? "불량" : "비가동",
      category,
      startTime: draft.startTime || "",
      endTime: draft.endTime || "",
      minutes,
      scrapKg,
      detail,
      beforePhoto: draft.beforePhoto || null,
      afterPhoto: draft.afterPhoto || null
    };

    updateEvents([...activeEvents, newEvent]);

    setDraft((prev) => ({
      ...prev,
      startTime: prev.endTime || "",
      endTime: "",
      minutes: 0,
      scrapKg: "",
      beforePhoto: null,
      afterPhoto: null
    }));
  };

  const handleRemoveEvent = (index) => {
    updateEvents(activeEvents.filter((_, i) => i !== index));
  };

  const totalMinutes = activeEvents.reduce((sum, ev) => sum + (Number(ev?.minutes) || 0), 0);
  const totalScrap = Number(
    activeEvents.reduce((sum, ev) => sum + (Number(ev?.scrapKg) || 0), 0).toFixed(1)
  );
  const defectCount = activeEvents.filter(
    (ev) => ev?.type === "불량" || ev?.type === "부적합" || DEFECT_CATEGORY_IDS.includes(ev?.category)
  ).length;

  return (
    <div className="bg-slate-50 dark:bg-slate-800/60 p-3 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-2.5">
      {/* Header & Badges (기존 틀 완벽 유지) */}
      <div className="flex items-center justify-between flex-wrap gap-1.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-black text-slate-900 dark:text-white flex items-center gap-1.5 text-xs sm:text-sm">
            <Clock className="w-4 h-4 text-amber-500" />
            <span>{title}</span>
          </span>
          {plantLabel && (
            <span className="text-[10.5px] font-black px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              {plantLabel}
            </span>
          )}
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
            총 {activeEvents.length}건
          </span>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="px-2 py-0.5 rounded-md text-[11px] font-black bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
            ⏱️ {totalMinutes}분
          </span>
          {defectCount > 0 && (
            <span className="px-2 py-0.5 rounded-md text-[11px] font-black bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
              🚨 부적합 {defectCount}건
            </span>
          )}
          {totalScrap > 0 && (
            <span className="px-2 py-0.5 rounded-md text-[11px] font-black bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300 border border-orange-300 dark:border-orange-800">
              🗑️ {totalScrap}
            </span>
          )}
        </div>
      </div>

      {/* Input Card (기존 틀 유지 + 부적합품 등록 및 조치전/조치후 사진 등록) */}
      <div className="p-2.5 sm:p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 shadow-xs space-y-2.5">
        {/* 상단 구분 스위치: 부적합품 발생 등록 vs 일반 비가동 등록 */}
        <div className="flex items-center justify-between flex-wrap gap-2 pb-1.5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleModeSwitch("불량")}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition cursor-pointer flex items-center gap-1 ${
                isDraftDefect
                  ? "bg-rose-600 text-white shadow-xs"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
              }`}
            >
              <AlertTriangle className="w-3 h-3" />
              <span>🚨 부적합품 발생 등록 (조치전·후 사진)</span>
            </button>
            <button
              type="button"
              onClick={() => handleModeSwitch("비가동")}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition cursor-pointer flex items-center gap-1 ${
                !isDraftDefect
                  ? "bg-amber-500 text-slate-950 shadow-xs"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
              }`}
            >
              <Clock className="w-3 h-3" />
              <span>⏱️ 일반 비가동 등록</span>
            </button>
          </div>
          <span className="text-[10.5px] font-bold text-slate-500 dark:text-slate-400">
            부적합품 발생 시 조치 전 · 조치 후 사진을 함께 첨부하여 등록할 수 있습니다.
          </span>
        </div>

        {/* 1행: 항목 선택 / 시작~종료 / 소요시간 / 폐기량·부적합수량 */}
        <div className="grid grid-cols-2 sm:grid-cols-12 gap-1.5 sm:gap-2 items-center">
          {/* 항목 선택 (4 cols) */}
          <div className="col-span-2 sm:col-span-4">
            <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-0.5">
              부적합품/비가동 항목 ({MERGED_CATEGORIES.length}종)
            </label>
            <select
              value={draft.category || "압개시"}
              onChange={(e) => handleDraftChange("category", e.target.value)}
              className={`w-full px-2 py-1.5 rounded-lg border text-xs font-black cursor-pointer focus:outline-hidden ${
                isDraftDefect
                  ? "border-rose-300 dark:border-rose-700 bg-rose-50/40 dark:bg-slate-800 text-rose-950 dark:text-rose-200"
                  : "border-amber-300 dark:border-amber-700 bg-amber-50/40 dark:bg-slate-800 text-amber-950 dark:text-amber-200"
              }`}
            >
              {MERGED_CATEGORIES.map((c) => {
                const isDef = DEFECT_CATEGORY_IDS.includes(c.id) || c.type === "불량";
                return (
                  <option key={c.id} value={c.id}>
                    {c.label} ({isDef ? "부적합" : "비가동"})
                  </option>
                );
              })}
            </select>
          </div>

          {/* 시작 ~ 종료 시간 (4 cols) */}
          <div className="col-span-2 sm:col-span-4">
            <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-0.5">
              시간 (시작 ~ 종료)
            </label>
            <div className="flex items-center gap-1">
              <input
                type="time"
                value={draft.startTime || ""}
                onChange={(e) => handleDraftChange("startTime", e.target.value)}
                className="w-full px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-center text-slate-900 dark:text-white"
              />
              <span className="text-slate-400 text-xs">~</span>
              <input
                type="time"
                value={draft.endTime || ""}
                onChange={(e) => handleDraftChange("endTime", e.target.value)}
                className="w-full px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-center text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* 소요시간 (2 cols) */}
          <div className="col-span-1 sm:col-span-2">
            <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-0.5">
              소요시간(분)
            </label>
            <input
              type="number"
              min="0"
              step="5"
              value={draft.minutes ?? ""}
              onChange={(e) => handleDraftChange("minutes", e.target.value)}
              placeholder="0"
              className="w-full px-2 py-1.5 rounded-lg border border-rose-300 dark:border-rose-700 bg-rose-50/40 dark:bg-slate-800 text-xs font-black text-right text-rose-700 dark:text-rose-300"
            />
          </div>

          {/* 폐기중량 / 부적합수량 (2 cols) */}
          <div className="col-span-1 sm:col-span-2">
            <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-0.5">
              {unitLabel}
            </label>
            <input
              type="number"
              min="0"
              step="0.1"
              value={draft.scrapKg ?? ""}
              onChange={(e) => handleDraftChange("scrapKg", e.target.value)}
              placeholder="0"
              className="w-full px-2 py-1.5 rounded-lg border border-orange-300 dark:border-orange-700 bg-orange-50/40 dark:bg-slate-800 text-xs font-black text-right text-orange-700 dark:text-orange-300"
            />
          </div>
        </div>

        {/* 📸 조치 전 (Before) / 조치 후 (After) 사진 업로드 슬롯 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5">
          {/* 🔴 조치 전 사진 (Before) */}
          <div className="p-2 rounded-xl bg-rose-50/60 dark:bg-rose-950/25 border border-rose-200 dark:border-rose-800/70 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              {draft.beforePhoto ? (
                <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-rose-400 shrink-0 group">
                  <img
                    src={draft.beforePhoto}
                    alt="조치전"
                    onClick={() => setPreviewModal({ title: "🚨 조치 전 (Before) 사진", url: draft.beforePhoto })}
                    className="w-full h-full object-cover cursor-pointer"
                  />
                  <button
                    type="button"
                    onClick={() => setDraft((prev) => ({ ...prev, beforePhoto: null }))}
                    className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-black/70 text-white text-[9px] font-black flex items-center justify-center cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <label className="w-12 h-12 rounded-lg bg-white dark:bg-slate-800 border-2 border-dashed border-rose-300 dark:border-rose-700 flex flex-col items-center justify-center cursor-pointer hover:border-rose-500 shrink-0">
                  <Camera className="w-4 h-4 text-rose-500" />
                  <span className="text-[9px] font-black text-rose-600 dark:text-rose-300">조치전</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handlePhotoSelect(e, "before")}
                    className="hidden"
                  />
                </label>
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 rounded bg-rose-600 text-white text-[10px] font-black">
                    조치 전 (Before)
                  </span>
                  <span className="text-[10px] font-bold text-rose-600 dark:text-rose-300">
                    {draft.beforePhoto ? "✓ 사진 첨부됨" : "부적합 현상 사진"}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  <label className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 hover:bg-rose-100 dark:hover:bg-rose-900/50 border border-rose-300 dark:border-rose-700 text-rose-700 dark:text-rose-200 text-[10px] font-bold cursor-pointer flex items-center gap-1">
                    <Camera className="w-3 h-3" />
                    <span>촬영/파일선택</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handlePhotoSelect(e, "before")}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* 🟢 조치 후 사진 (After) */}
          <div className="p-2 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/25 border border-emerald-200 dark:border-emerald-800/70 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              {draft.afterPhoto ? (
                <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-emerald-400 shrink-0 group">
                  <img
                    src={draft.afterPhoto}
                    alt="조치후"
                    onClick={() => setPreviewModal({ title: "✨ 조치 후 (After) 사진", url: draft.afterPhoto })}
                    className="w-full h-full object-cover cursor-pointer"
                  />
                  <button
                    type="button"
                    onClick={() => setDraft((prev) => ({ ...prev, afterPhoto: null }))}
                    className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-black/70 text-white text-[9px] font-black flex items-center justify-center cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <label className="w-12 h-12 rounded-lg bg-white dark:bg-slate-800 border-2 border-dashed border-emerald-300 dark:border-emerald-700 flex flex-col items-center justify-center cursor-pointer hover:border-emerald-500 shrink-0">
                  <UploadCloud className="w-4 h-4 text-emerald-500" />
                  <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-300">조치후</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handlePhotoSelect(e, "after")}
                    className="hidden"
                  />
                </label>
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 rounded bg-emerald-600 text-white text-[10px] font-black">
                    조치 후 (After)
                  </span>
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-300">
                    {draft.afterPhoto ? "✓ 사진 첨부됨" : "개선 조치 완료 사진"}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  <label className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-200 text-[10px] font-bold cursor-pointer flex items-center gap-1">
                    <Camera className="w-3 h-3" />
                    <span>촬영/파일선택</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handlePhotoSelect(e, "after")}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 2행: 내역 직접입력 + [등록] 버튼 (기존 틀 유지) */}
        <div className="flex items-center gap-1.5">
          <input
            type="text"
            value={draft.detail || ""}
            onChange={(e) => handleDraftChange("detail", e.target.value)}
            placeholder="발생 내역 및 조치 내용을 입력하세요 (직접 입력 또는 자동 문구 수정)"
            className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
          />
          <button
            type="button"
            onClick={handleAddEvent}
            className={`px-3.5 py-1.5 rounded-lg text-white font-black text-xs shrink-0 transition active:scale-95 cursor-pointer flex items-center gap-1 shadow-xs ${
              isDraftDefect ? "bg-rose-600 hover:bg-rose-700" : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isDraftDefect ? "부적합품 등록" : "비가동 등록"}</span>
          </button>
        </div>
      </div>

      {/* 등록된 목록 (간결한 1줄 카드 + 조치전/조치후 썸네일 & 추가 첨부 지원) */}
      {activeEvents.length > 0 ? (
        <div className="space-y-1.5">
          {activeEvents.map((ev, idx) => {
            const isDefect =
              DEFECT_CATEGORY_IDS.includes(ev.category) ||
              ev.type === "불량" ||
              ev.type === "부적합";
            return (
              <div
                key={ev.id || `dt_item_${idx}`}
                className={`p-2 sm:p-2.5 bg-white dark:bg-slate-900 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs transition ${
                  isDefect
                    ? "border-rose-300 dark:border-rose-800/80"
                    : "border-slate-200 dark:border-slate-700"
                }`}
              >
                <div className="flex items-center gap-1.5 flex-wrap min-w-0 flex-1">
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-black shrink-0 ${
                      isDefect
                        ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                        : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                    }`}
                  >
                    {isDefect ? "🚨 부적합" : "⏱️ 비가동"} · {ev.category || "압개시"}
                  </span>

                  {(ev.startTime || ev.endTime) && (
                    <span className="text-[11px] font-mono font-bold text-slate-600 dark:text-slate-400 shrink-0">
                      {ev.startTime || "--:--"}~{ev.endTime || "--:--"}
                    </span>
                  )}

                  {ev.minutes > 0 && (
                    <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-rose-600 dark:text-rose-400 text-[10.5px] font-black shrink-0">
                      {ev.minutes}분
                    </span>
                  )}

                  {Number(ev.scrapKg) > 0 && (
                    <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-orange-600 dark:text-orange-400 text-[10.5px] font-black shrink-0">
                      {ev.scrapKg}
                    </span>
                  )}

                  <span
                    className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate min-w-[80px]"
                    title={ev.detail}
                  >
                    {ev.detail || "-"}
                  </span>
                </div>

                {/* 우측: 조치전 / 조치후 사진 배지 및 삭제 */}
                <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                  {/* 조치전 사진 표시 또는 즉시 추가 */}
                  {ev.beforePhoto ? (
                    <button
                      type="button"
                      onClick={() =>
                        setPreviewModal({
                          title: `🚨 조치 전 (Before) - ${ev.category}`,
                          url: ev.beforePhoto
                        })
                      }
                      className="flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 cursor-pointer hover:opacity-90"
                      title="조치전 사진 확대보기"
                    >
                      <img
                        src={ev.beforePhoto}
                        alt="조치전"
                        className="w-6 h-6 rounded object-cover"
                      />
                      <span className="text-[10px] font-black text-rose-700 dark:text-rose-300">
                        조치전
                      </span>
                    </button>
                  ) : (
                    <label
                      className="px-1.5 py-1 rounded-lg bg-rose-50/70 dark:bg-rose-950/40 border border-dashed border-rose-300 dark:border-rose-800 text-[10px] font-bold text-rose-600 dark:text-rose-300 cursor-pointer hover:bg-rose-100 flex items-center gap-0.5"
                      title="조치전 사진 추가"
                    >
                      <Camera className="w-3 h-3" />
                      <span>+조치전</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleEventPhotoSelect(e, idx, "before")}
                        className="hidden"
                      />
                    </label>
                  )}

                  <span className="text-slate-400 text-[10px]">➔</span>

                  {/* 조치후 사진 표시 또는 즉시 추가 */}
                  {ev.afterPhoto ? (
                    <button
                      type="button"
                      onClick={() =>
                        setPreviewModal({
                          title: `✨ 조치 후 (After) - ${ev.category}`,
                          url: ev.afterPhoto
                        })
                      }
                      className="flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 cursor-pointer hover:opacity-90"
                      title="조치후 사진 확대보기"
                    >
                      <img
                        src={ev.afterPhoto}
                        alt="조치후"
                        className="w-6 h-6 rounded object-cover"
                      />
                      <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-300">
                        조치후
                      </span>
                    </button>
                  ) : (
                    <label
                      className="px-1.5 py-1 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/40 border border-dashed border-emerald-300 dark:border-emerald-800 text-[10px] font-bold text-emerald-600 dark:text-emerald-300 cursor-pointer hover:bg-emerald-100 flex items-center gap-0.5"
                      title="조치후 사진 추가"
                    >
                      <Camera className="w-3 h-3" />
                      <span>+조치후</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleEventPhotoSelect(e, idx, "after")}
                        className="hidden"
                      />
                    </label>
                  )}

                  <button
                    type="button"
                    onClick={() => handleRemoveEvent(idx)}
                    className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer shrink-0"
                    title="삭제"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-2.5 text-center text-xs text-slate-400 bg-white/50 dark:bg-slate-900/50 rounded-lg border border-dashed border-slate-200 dark:border-slate-800">
          등록된 비가동 및 부적합품 발생 내역이 없습니다.
        </div>
      )}

      {/* 확대 사진 프리뷰 모달 */}
      {previewModal && (
        <div
          className="fixed inset-0 z-80 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setPreviewModal(null)}
        >
          <div
            className="relative max-w-2xl w-full bg-slate-900 rounded-2xl overflow-hidden shadow-2xl p-3 border border-slate-700 space-y-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-black text-white">{previewModal.title}</span>
              <button
                type="button"
                onClick={() => setPreviewModal(null)}
                className="p-1 rounded-lg bg-slate-800 hover:bg-rose-600 text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <img
              src={previewModal.url}
              alt={previewModal.title}
              className="w-full h-auto max-h-[75vh] object-contain rounded-xl"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default CommonDowntimeDefectPanel;
