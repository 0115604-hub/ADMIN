import React, { useState, useEffect, useMemo } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase";
import { subscribeToExtrusionReports } from "../../services/extrusionProductionService";
import { subscribeMachiningWorkReports } from "../../services/machiningWorkReportService";
import { subscribeHanulWorkReports } from "../../services/hanulWorkReportService";
import { subscribeYuseongWorkReports } from "../../services/yuseongWorkReportService";
import {
  registerToFourMLedger,
  unregisterFromFourMLedger,
  determineFourMCategory
} from "../../services/fourMChangePointService";
import { getKSTDateString } from "../../utils/dateUtils";

// Re-export core services for 100% backward compatibility
export {
  WORK_REPORT_NC_STORAGE_KEY,
  getLocalWorkReportNcLedger,
  saveWorkReportNcLedger,
  extractWorkReportNonconformances
} from "./ncLedger/workReportNcService";

import {
  WORK_REPORT_NC_STORAGE_KEY,
  getLocalWorkReportNcLedger,
  saveWorkReportNcLedger,
  extractWorkReportNonconformances,
  compressImageToBase64
} from "./ncLedger/workReportNcService";

import WorkReportNcAddEditForm from "./ncLedger/WorkReportNcAddEditForm";
import WorkReportNcItemList from "./ncLedger/WorkReportNcItemList";

export default function WorkReportNonconformanceLedgerPanel({
  filterCompany = "", // e.g., "한울", "부림텍", "유성", "조영", "오륙", "압출동", or "" for all
  currentProfile = null,
  titlePrefix = "",
  compact = false
}) {
  const [extrusionReports, setExtrusionReports] = useState([]);
  const [machiningReports, setMachiningReports] = useState([]);
  const [hanulReports, setHanulReports] = useState([]);
  const [yuseongReports, setYuseongReports] = useState([]);
  const [legoReports, setLegoReports] = useState([]);
  const [ledgerState, setLedgerState] = useState(() => getLocalWorkReportNcLedger());

  const [scopeFilter, setScopeFilter] = useState(filterCompany ? "COMPANY" : "ALL");
  const [badgeFilter, setBadgeFilter] = useState("ALL"); // "ALL" | "CHANGE_POINT" | "INTERNAL" | "UNREGISTERED"
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState(null);
  const [previewImg, setPreviewImg] = useState(null);

  // New / Edit Form State
  const [formLine, setFormLine] = useState("");
  const [formDefectType, setFormDefectType] = useState("");
  const [formScrapKg, setFormScrapKg] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formActionResult, setFormActionResult] = useState("");
  const [formBeforePhoto, setFormBeforePhoto] = useState(null);
  const [formAfterPhoto, setFormAfterPhoto] = useState(null);
  const [formRegType, setFormRegType] = useState("CHANGE_POINT"); // "CHANGE_POINT" | "INTERNAL"

  useEffect(() => {
    const unsubExt = subscribeToExtrusionReports((list) => setExtrusionReports(list || []));
    const unsubMach = subscribeMachiningWorkReports((list) => setMachiningReports(list || []));
    const unsubHanul = subscribeHanulWorkReports((list) => setHanulReports(list || []));
    const unsubYs = subscribeYuseongWorkReports((list) => setYuseongReports(list || []));

    const loadLego = () => {
      try {
        const raw = localStorage.getItem("lego_work_reports_v1");
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) setLegoReports(parsed);
        }
      } catch (e) {
        // ignore
      }
    };
    loadLego();

    const handleLocalLedgerUpdate = (e) => {
      if (e.detail) setLedgerState(e.detail);
      else setLedgerState(getLocalWorkReportNcLedger());
    };
    window.addEventListener("work_report_nc_ledger_updated", handleLocalLedgerUpdate);

    let unsubFirestoreLedger = () => {};
    if (db) {
      try {
        unsubFirestoreLedger = onSnapshot(
          doc(db, "app_settings", WORK_REPORT_NC_STORAGE_KEY),
          (snap) => {
            if (snap.exists()) {
              const data = snap.data();
              const nextState = {
                overrides: data?.overrides || {},
                manualItems: Array.isArray(data?.manualItems) ? data.manualItems : []
              };
              const newStr = JSON.stringify(nextState);
              const oldStr = localStorage.getItem(WORK_REPORT_NC_STORAGE_KEY);
              if (newStr !== oldStr) {
                localStorage.setItem(WORK_REPORT_NC_STORAGE_KEY, newStr);
                setLedgerState(nextState);
              }
            }
          },
          (err) => {
            console.warn("WorkReportNonconformanceLedgerPanel ledger onSnapshot error:", err);
          }
        );
      } catch (e) {
        console.warn("Firestore work_report_nc_ledger listen error:", e);
      }
    }

    return () => {
      if (unsubExt) unsubExt();
      if (unsubMach) unsubMach();
      if (unsubHanul) unsubHanul();
      if (unsubYs) unsubYs();
      window.removeEventListener("work_report_nc_ledger_updated", handleLocalLedgerUpdate);
      if (unsubFirestoreLedger) unsubFirestoreLedger();
    };
  }, []);

  const allNcItems = useMemo(() => {
    return extractWorkReportNonconformances({
      extrusionReports,
      machiningReports,
      hanulReports,
      yuseongReports,
      legoReports,
      ledgerState
    });
  }, [extrusionReports, machiningReports, hanulReports, yuseongReports, legoReports, ledgerState]);

  const filteredItems = useMemo(() => {
    return allNcItems.filter((item) => {
      if (scopeFilter === "COMPANY" && filterCompany) {
        const normFilter = filterCompany === "오륙" ? "가공동" : filterCompany;
        const itemComp = String(item.company || "");
        const itemLine = String(item.line || "");
        const matchesCompany =
          itemComp.includes(filterCompany) ||
          itemComp.includes(normFilter) ||
          itemLine.includes(filterCompany) ||
          itemLine.includes(normFilter);
        if (!matchesCompany) return false;
      }
      if (badgeFilter !== "ALL" && item.registrationType !== badgeFilter) {
        return false;
      }
      return true;
    });
  }, [allNcItems, scopeFilter, filterCompany, badgeFilter]);

  const stats = useMemo(() => {
    const baseList = scopeFilter === "COMPANY" && filterCompany
      ? allNcItems.filter((item) => {
          const normFilter = filterCompany === "오륙" ? "가공동" : filterCompany;
          return (
            String(item.company || "").includes(filterCompany) ||
            String(item.company || "").includes(normFilter) ||
            String(item.line || "").includes(filterCompany) ||
            String(item.line || "").includes(normFilter)
          );
        })
      : allNcItems;

    return {
      total: baseList.length,
      changePointCount: baseList.filter((i) => i.registrationType === "CHANGE_POINT").length,
      internalCount: baseList.filter((i) => i.registrationType === "INTERNAL").length,
      unregisteredCount: baseList.filter((i) => !i.registrationType || i.registrationType === "UNREGISTERED").length
    };
  }, [allNcItems, scopeFilter, filterCompany]);

  // Core handler: Register item with either 변동점등록 badge or 사내관리등록 badge
  const handleSelectRegistrationBadge = async (item, targetBadgeType) => {
    const nowStr = new Date().toLocaleString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    }).replace(/\. /g, "-").replace(/\./g, "");

    const managerName = currentProfile?.name || filterCompany || "관리자";
    const nextOverrides = {
      ...(ledgerState.overrides || {}),
      [item.id]: {
        ...(ledgerState.overrides?.[item.id] || {}),
        registrationType: targetBadgeType,
        registeredBy: managerName,
        registeredAt: nowStr
      }
    };

    const nextState = {
      ...ledgerState,
      overrides: nextOverrides
    };
    setLedgerState(nextState);
    await saveWorkReportNcLedger(nextState);

    if (targetBadgeType === "CHANGE_POINT") {
      // 🌟 4M 공식대장 등록권한은 오직 이창엽에게만 있음
      if (managerName === "이창엽" || managerName === "권태형") {
        const fourM = item.fourM || determineFourMCategory(item);
        await registerToFourMLedger(
          {
            id: `ledger_${item.id}`,
            originalId: item.id,
            rawId: item.id,
            fourM,
            origin: "작업일보 부적합",
            sourceType: "WORK_REPORT_NC",
            plant: item.plant || "삼랑진공장",
            line: item.line || item.company || "생산라인",
            writer: item.worker || managerName,
            title: item.title || `[작업일보 부적합] ${item.line} - ${item.defectType}`,
            date: item.date,
            time: item.time || "",
            content: item.content || item.defectType || "",
            actionResult: item.actionResult || "",
            actionAuthor: item.actionResult ? managerName : "",
            actionAt: item.actionResult ? nowStr : "",
            images: item.beforePhoto ? [item.beforePhoto] : [],
            actionImages: item.afterPhoto ? [item.afterPhoto] : [],
            isResolved: Boolean(item.actionResult || item.afterPhoto || item.status === "RESOLVED"),
            scrapKg: Number(item.scrapKg) || 0,
            downtimeMinutes: Number(item.downtimeMinutes) || 0,
            registrationBadge: "변동점등록",
            isOfficialLedger: true
          },
          managerName
        );
      } else {
        await unregisterFromFourMLedger(item.id);
        await unregisterFromFourMLedger(`ledger_${item.id}`);
      }
    } else if (targetBadgeType === "INTERNAL") {
      // 사내관리등록뱃지로 등록 시 사내 부적합관리대장으로만 관리 (4M 변동점관리대장에서는 제외)
      await unregisterFromFourMLedger(item.id);
      await unregisterFromFourMLedger(`ledger_${item.id}`);
    }
  };

  const handleOpenEdit = (item) => {
    setEditingItemId(item.id);
    setFormLine(item.line || "");
    setFormDefectType(item.defectType || "");
    setFormScrapKg(item.scrapKg ? String(item.scrapKg) : "");
    setFormContent(item.content || "");
    setFormActionResult(item.actionResult || "");
    setFormBeforePhoto(item.beforePhoto || null);
    setFormAfterPhoto(item.afterPhoto || null);
    setFormRegType(item.registrationType && item.registrationType !== "UNREGISTERED" ? item.registrationType : "CHANGE_POINT");
    setIsAddOpen(true);
  };

  const handleResetForm = () => {
    setEditingItemId(null);
    setFormLine(filterCompany || "생산라인");
    setFormDefectType("외관/치수 불량");
    setFormScrapKg("");
    setFormContent("");
    setFormActionResult("");
    setFormBeforePhoto(null);
    setFormAfterPhoto(null);
    setFormRegType("CHANGE_POINT");
  };

  const handleSaveForm = async () => {
    const now = new Date();
    const todayStr = getKSTDateString();
    const nowStr = now.toLocaleString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    }).replace(/\. /g, "-").replace(/\./g, "");

    const managerName = currentProfile?.name || filterCompany || "관리자";
    const companyName = filterCompany === "오륙" ? "가공동" : (filterCompany || "사내");
    const plantName = ["한울", "부림텍", "조영"].includes(companyName) ? "한림공장" : "삼랑진공장";

    if (editingItemId) {
      const existingItem = allNcItems.find((i) => i.id === editingItemId) || {};
      const updatedOverride = {
        ...(ledgerState.overrides?.[editingItemId] || {}),
        line: formLine.trim() || existingItem.line || companyName,
        defectType: formDefectType.trim() || existingItem.defectType || "공정 부적합",
        title: `[작업일보 부적합] ${formLine.trim() || existingItem.line || companyName} - ${formDefectType.trim() || "부적합"}`,
        scrapKg: Number(formScrapKg) || 0,
        content: formContent.trim(),
        actionResult: formActionResult.trim(),
        beforePhoto: formBeforePhoto,
        afterPhoto: formAfterPhoto,
        registrationType: formRegType,
        status: formActionResult.trim() || formAfterPhoto ? "RESOLVED" : "ACTIVE",
        registeredBy: managerName,
        registeredAt: nowStr
      };

      const nextState = {
        ...ledgerState,
        overrides: {
          ...(ledgerState.overrides || {}),
          [editingItemId]: updatedOverride
        }
      };
      setLedgerState(nextState);
      await saveWorkReportNcLedger(nextState);

      await handleSelectRegistrationBadge(
        {
          ...existingItem,
          ...updatedOverride,
          id: editingItemId
        },
        formRegType
      );
    } else {
      const newId = `wr_nc_manual_${Date.now()}`;
      const newItem = {
        id: newId,
        date: todayStr,
        time: now.toTimeString().slice(0, 5),
        company: companyName,
        plant: plantName,
        line: formLine.trim() || companyName,
        worker: managerName,
        defectType: formDefectType.trim() || "공정 부적합",
        title: `[작업일보 부적합] ${formLine.trim() || companyName} - ${formDefectType.trim() || "공정 부적합"}`,
        content: formContent.trim() || `${formDefectType.trim() || "부적합"} 발생`,
        actionResult: formActionResult.trim(),
        scrapKg: Number(formScrapKg) || 0,
        downtimeMinutes: 0,
        beforePhoto: formBeforePhoto,
        afterPhoto: formAfterPhoto,
        registrationType: formRegType,
        status: formActionResult.trim() || formAfterPhoto ? "RESOLVED" : "ACTIVE",
        registeredBy: managerName,
        registeredAt: nowStr,
        source: "WORK_REPORT_MANUAL"
      };

      const nextState = {
        ...ledgerState,
        manualItems: [newItem, ...(ledgerState.manualItems || [])],
        overrides: {
          ...(ledgerState.overrides || {}),
          [newId]: {
            registrationType: formRegType,
            registeredBy: managerName,
            registeredAt: nowStr
          }
        }
      };
      setLedgerState(nextState);
      await saveWorkReportNcLedger(nextState);
      await handleSelectRegistrationBadge(newItem, formRegType);
    }

    setIsAddOpen(false);
    handleResetForm();
  };

  const handleDeleteItem = async (item) => {
    if (!window.confirm("이 작업일보 부적합 내역을 관리대장에서 삭제하시겠습니까?")) return;
    const nextOverrides = {
      ...(ledgerState.overrides || {}),
      [item.id]: {
        ...(ledgerState.overrides?.[item.id] || {}),
        isDeleted: true
      }
    };
    const nextManual = (ledgerState.manualItems || []).filter((m) => m.id !== item.id);
    const nextState = {
      ...ledgerState,
      overrides: nextOverrides,
      manualItems: nextManual
    };
    setLedgerState(nextState);
    await saveWorkReportNcLedger(nextState);
    await unregisterFromFourMLedger(item.id);
    await unregisterFromFourMLedger(`ledger_${item.id}`);
  };

  const handlePhotoUpload = async (field, file) => {
    if (!file) return;
    try {
      const base64 = await compressImageToBase64(file);
      if (field === "beforePhoto") setFormBeforePhoto(base64);
      else setFormAfterPhoto(base64);
    } catch (e) {
      alert("사진 변환 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="bg-white rounded-xl border border-rose-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 px-4 py-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-rose-600/90 text-white flex items-center justify-center text-sm font-black shadow-sm">
            📋
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs sm:text-sm font-black text-white tracking-tight">
                {titlePrefix ? `${titlePrefix} ` : ""}작업일보내 부적합발생패널 (부적합관리대장)
              </h4>
              <span className="px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-400/40 text-rose-200 text-[10px] font-extrabold">
                총 {stats.total}건
              </span>
            </div>
            <p className="text-[10px] text-slate-300 font-medium">
              작업일보 부적합 발생내역 자동 집계 • 등록 시 [변동점등록] 뱃지 선택 시 4M 변동점관리대장에 동시 등록됩니다
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {filterCompany && (
            <div className="flex bg-slate-800 p-0.5 rounded-lg border border-slate-700">
              <button
                type="button"
                onClick={() => setScopeFilter("COMPANY")}
                className={`px-2 py-1 rounded-md text-[10px] font-black transition-all cursor-pointer ${
                  scopeFilter === "COMPANY"
                    ? "bg-rose-600 text-white shadow-xs"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                {filterCompany === "오륙" ? "가공동" : filterCompany} 공정만
              </button>
              <button
                type="button"
                onClick={() => setScopeFilter("ALL")}
                className={`px-2 py-1 rounded-md text-[10px] font-black transition-all cursor-pointer ${
                  scopeFilter === "ALL"
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                전 공정 통합
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              if (isAddOpen) {
                setIsAddOpen(false);
                handleResetForm();
              } else {
                handleResetForm();
                setIsAddOpen(true);
              }
            }}
            className="px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-black shadow-sm transition-all cursor-pointer flex items-center gap-1"
          >
            {isAddOpen ? "✕ 닫기" : "＋ 작업일보 부적합 직접등록"}
          </button>
        </div>
      </div>

      {/* Filter Bar for Registration Badges */}
      <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => setBadgeFilter("ALL")}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-black border transition-all cursor-pointer ${
              badgeFilter === "ALL"
                ? "bg-slate-800 text-white border-slate-800"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
            }`}
          >
            전체 ({stats.total})
          </button>
          <button
            type="button"
            onClick={() => setBadgeFilter("CHANGE_POINT")}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-black border transition-all cursor-pointer flex items-center gap-1 ${
              badgeFilter === "CHANGE_POINT"
                ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                : "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100"
            }`}
          >
            🔄 변동점등록 뱃지 ({stats.changePointCount})
          </button>
          <button
            type="button"
            onClick={() => setBadgeFilter("INTERNAL")}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-black border transition-all cursor-pointer flex items-center gap-1 ${
              badgeFilter === "INTERNAL"
                ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
            }`}
          >
            🏢 사내관리등록 뱃지 ({stats.internalCount})
          </button>
          {stats.unregisteredCount > 0 && (
            <button
              type="button"
              onClick={() => setBadgeFilter("UNREGISTERED")}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-black border transition-all cursor-pointer ${
                badgeFilter === "UNREGISTERED"
                  ? "bg-amber-500 text-white border-amber-500"
                  : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
              }`}
            >
              ⏳ 분류대기 ({stats.unregisteredCount})
            </button>
          )}
        </div>

        <span className="text-[10px] font-bold text-slate-500">
          💡 항목 우측의 <strong className="text-indigo-700">[변동점등록]</strong> 또는 <strong className="text-emerald-700">[사내관리등록]</strong> 뱃지를 클릭해 구분 등록하세요
        </span>
      </div>

      {/* Add / Edit Form */}
      <WorkReportNcAddEditForm
        isAddOpen={isAddOpen}
        editingItemId={editingItemId}
        formRegType={formRegType}
        setFormRegType={setFormRegType}
        formLine={formLine}
        setFormLine={setFormLine}
        formDefectType={formDefectType}
        setFormDefectType={setFormDefectType}
        formScrapKg={formScrapKg}
        setFormScrapKg={setFormScrapKg}
        formContent={formContent}
        setFormContent={setFormContent}
        formActionResult={formActionResult}
        setFormActionResult={setFormActionResult}
        formBeforePhoto={formBeforePhoto}
        setFormBeforePhoto={setFormBeforePhoto}
        formAfterPhoto={formAfterPhoto}
        setFormAfterPhoto={setFormAfterPhoto}
        onPhotoUpload={handlePhotoUpload}
        onCancel={() => {
          setIsAddOpen(false);
          handleResetForm();
        }}
        onSave={handleSaveForm}
      />

      {/* List of Work Report Nonconformances */}
      <WorkReportNcItemList
        filteredItems={filteredItems}
        compact={compact}
        onPreviewImg={(src) => setPreviewImg(src)}
        onSelectRegistrationBadge={handleSelectRegistrationBadge}
        onOpenEdit={handleOpenEdit}
        onDeleteItem={handleDeleteItem}
      />

      {/* Image Lightbox */}
      {previewImg && (
        <div
          onClick={() => setPreviewImg(null)}
          className="fixed inset-0 z-[99999] bg-black/80 flex items-center justify-center p-4 cursor-pointer"
        >
          <img
            src={previewImg}
            alt="부적합 사진 확대"
            className="max-w-full max-h-[85vh] rounded-xl border-2 border-white shadow-2xl object-contain"
          />
        </div>
      )}
    </div>
  );
}
