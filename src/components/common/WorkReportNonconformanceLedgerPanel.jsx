import React, { useState, useEffect, useMemo } from "react";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { sanitizeForFirestore } from "../../utils/firestoreUtils";
import { subscribeToExtrusionReports } from "../../services/extrusionProductionService";
import { subscribeMachiningWorkReports } from "../../services/machiningWorkReportService";
import { subscribeHanulWorkReports } from "../../services/hanulWorkReportService";
import { subscribeYuseongWorkReports } from "../../services/yuseongWorkReportService";
import {
  registerToFourMLedger,
  unregisterFromFourMLedger,
  determineFourMCategory
} from "../../services/fourMChangePointService";

export const WORK_REPORT_NC_STORAGE_KEY = "work_report_nonconformance_ledger_v1";

const compressImageToBase64 = (file, maxWidth = 800, quality = 0.72) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const getLocalWorkReportNcLedger = () => {
  try {
    const raw = localStorage.getItem(WORK_REPORT_NC_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") return parsed;
    }
  } catch (e) {
    console.warn("Failed to read work_report_nonconformance_ledger_v1:", e);
  }
  return { overrides: {}, manualItems: [] };
};

export const saveWorkReportNcLedger = async (ledgerState) => {
  const cleanState = {
    overrides: ledgerState?.overrides || {},
    manualItems: Array.isArray(ledgerState?.manualItems) ? ledgerState.manualItems : [],
    updatedAt: new Date().toISOString()
  };
  try {
    localStorage.setItem(WORK_REPORT_NC_STORAGE_KEY, JSON.stringify(cleanState));
    window.dispatchEvent(new CustomEvent("work_report_nc_ledger_updated", { detail: cleanState }));
  } catch (e) {
    console.warn("LocalStorage save error for work_report_nc_ledger:", e);
  }
  if (db) {
    try {
      await setDoc(
        doc(db, "app_settings", WORK_REPORT_NC_STORAGE_KEY),
        sanitizeForFirestore(cleanState),
        { merge: true }
      );
    } catch (e) {
      console.warn("Firestore save error for work_report_nc_ledger:", e);
    }
  }
  return cleanState;
};

/**
 * Extracts nonconformance occurrences from all work reports across processes
 */
export const extractWorkReportNonconformances = ({
  extrusionReports = [],
  machiningReports = [],
  hanulReports = [],
  yuseongReports = [],
  legoReports = [],
  ledgerState = { overrides: {}, manualItems: [] }
}) => {
  const extracted = [];
  const overrides = ledgerState?.overrides || {};

  const processReportEvents = (report, defaultCompany, defaultPlant, defaultLine) => {
    if (!report) return;
    const rId = String(report.id || "");
    const date = String(report.date || (report.createdAt ? String(report.createdAt).slice(0, 10) : new Date().toISOString().slice(0, 10)));
    const company = String(report.company || defaultCompany || "사내").trim();
    const plant = String(report.plant || defaultPlant || "삼랑진공장").trim();
    const line = String(
      report.lineName ||
      report.line ||
      (report.project && report.processId ? `${report.project} ${report.processId}` : report.project || report.processName || defaultLine)
    ).trim();
    const worker = String(report.worker || report.author || report.writer || "현장작업자").trim();
    const carModel = String(report.vehicle || report.carModel || report.project || "").trim();
    const partName = String(report.itemName || report.partName || report.processId || "").trim();

    const dtEvents = Array.isArray(report.downtimeEvents) ? report.downtimeEvents : [];
    let hasDefectEvent = false;

    dtEvents.forEach((ev, idx) => {
      if (!ev) return;
      const evType = String(ev.type || "").trim();
      const isDefect =
        evType === "불량" ||
        evType === "부적합" ||
        Boolean(ev.beforePhoto || ev.afterPhoto) ||
        String(ev.category || "").includes("불량") ||
        String(ev.category || "").includes("부적합");

      if (!isDefect) return;
      hasDefectEvent = true;

      const itemId = `wr_nc_${rId}_${ev.id || idx}`;
      const ov = overrides[itemId] || {};
      if (ov.isDeleted) return;

      const beforePhoto = ov.beforePhoto !== undefined ? ov.beforePhoto : (ev.beforePhoto || null);
      const afterPhoto = ov.afterPhoto !== undefined ? ov.afterPhoto : (ev.afterPhoto || null);
      const defectType = ov.defectType || ev.category || "공정 부적합";
      const content = ov.content !== undefined ? ov.content : (ev.detail || `${defectType} 발생`);
      const actionResult = ov.actionResult !== undefined ? ov.actionResult : (ev.actionDetail || "");
      const scrapKg = ov.scrapKg !== undefined ? Number(ov.scrapKg) : (Number(ev.scrapKg) || 0);
      const downtimeMinutes = ov.downtimeMinutes !== undefined ? Number(ov.downtimeMinutes) : (Number(ev.minutes) || 0);
      const registrationType = ov.registrationType || "UNREGISTERED"; // "CHANGE_POINT" | "INTERNAL" | "UNREGISTERED"

      const baseObj = {
        id: itemId,
        reportId: rId,
        date,
        time: ev.startTime || report.time || "",
        company,
        plant,
        line,
        worker,
        carModel,
        partName,
        defectType,
        title: ov.title || `[작업일보 부적합] ${line} - ${defectType}`,
        content,
        actionResult,
        scrapKg,
        downtimeMinutes,
        beforePhoto,
        afterPhoto,
        images: beforePhoto ? [beforePhoto] : [],
        actionImages: afterPhoto ? [afterPhoto] : [],
        registrationType,
        status: ov.status || (actionResult || afterPhoto ? "RESOLVED" : "ACTIVE"),
        isResolved: Boolean(ov.status === "RESOLVED" || actionResult || afterPhoto),
        registeredBy: ov.registeredBy || "",
        registeredAt: ov.registeredAt || "",
        fourM: ov.fourM || determineFourMCategory({ title: defectType, content, line }),
        source: "WORK_REPORT"
      };
      extracted.push(baseObj);
    });

    // Also check report-level defects map or defectQty > 0 if no downtimeEvents defect was logged
    if (!hasDefectEvent) {
      const defectsMap = report.defects && typeof report.defects === "object" ? report.defects : {};
      const defectEntries = Object.entries(defectsMap).filter(([, qty]) => Number(qty) > 0);
      const totalDefectQty = Number(report.defectQty) || defectEntries.reduce((acc, [, q]) => acc + (Number(q) || 0), 0);

      if (totalDefectQty > 0) {
        const itemId = `wr_nc_def_${rId}`;
        const ov = overrides[itemId] || {};
        if (!ov.isDeleted) {
          const defectSummary = defectEntries.length > 0
            ? defectEntries.map(([k, q]) => `${k}(${q}EA)`).join(", ")
            : `부적합 ${totalDefectQty}EA`;
          const defectType = ov.defectType || (defectEntries[0]?.[0] || "작업일보 불량");
          const beforePhoto = ov.beforePhoto || null;
          const afterPhoto = ov.afterPhoto || null;
          const content = ov.content !== undefined ? ov.content : `${defectSummary} ${report.remark || report.notes || ""}`.trim();
          const actionResult = ov.actionResult || "";
          const registrationType = ov.registrationType || "UNREGISTERED";

          extracted.push({
            id: itemId,
            reportId: rId,
            date,
            time: report.time || "",
            company,
            plant,
            line,
            worker,
            carModel,
            partName,
            defectType,
            title: ov.title || `[작업일보 부적합] ${line} - ${defectType}`,
            content,
            actionResult,
            scrapKg: totalDefectQty,
            downtimeMinutes: Number(report.downtimeMinutes) || 0,
            beforePhoto,
            afterPhoto,
            images: beforePhoto ? [beforePhoto] : [],
            actionImages: afterPhoto ? [afterPhoto] : [],
            registrationType,
            status: ov.status || (actionResult || afterPhoto ? "RESOLVED" : "ACTIVE"),
            isResolved: Boolean(ov.status === "RESOLVED" || actionResult || afterPhoto),
            registeredBy: ov.registeredBy || "",
            registeredAt: ov.registeredAt || "",
            fourM: ov.fourM || determineFourMCategory({ title: defectType, content, line }),
            source: "WORK_REPORT"
          });
        }
      }
    }
  };

  (extrusionReports || []).forEach((r) => processReportEvents(r, "압출동", "삼랑진공장", r.lineName || "압출라인"));
  (machiningReports || []).forEach((r) => processReportEvents(r, "가공동", "삼랑진공장", `${r.project || "가공"} ${r.processId || ""}`));
  (hanulReports || []).forEach((r) => processReportEvents(r, r.company || "한울", "한림공장", `${r.project || "9BQC"} ${r.processId || ""}`));
  (yuseongReports || []).forEach((r) => processReportEvents(r, "유성", "삼랑진공장", `${r.project || "유성"} ${r.processId || ""}`));
  (legoReports || []).forEach((r) => processReportEvents(r, r.company || r.department || "작업일보", r.plant || "삼랑진공장", r.processName || r.title || "공정 작업일보"));

  // Include manual items registered directly in the Work Report Nonconformance Panel
  const manualList = Array.isArray(ledgerState?.manualItems) ? ledgerState.manualItems : [];
  manualList.forEach((m) => {
    if (!m || m.isDeleted) return;
    const ov = overrides[m.id] || {};
    if (ov.isDeleted) return;
    const merged = { ...m, ...ov };
    extracted.push({
      ...merged,
      images: merged.beforePhoto ? [merged.beforePhoto] : (merged.images || []),
      actionImages: merged.afterPhoto ? [merged.afterPhoto] : (merged.actionImages || []),
      isResolved: Boolean(merged.status === "RESOLVED" || merged.actionResult || merged.afterPhoto),
      fourM: merged.fourM || determineFourMCategory(merged)
    });
  });

  extracted.sort((a, b) => {
    if (b.date !== a.date) return String(b.date || "").localeCompare(String(a.date || ""));
    return String(b.id || "").localeCompare(String(a.id || ""));
  });

  return extracted;
};

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
              localStorage.setItem(WORK_REPORT_NC_STORAGE_KEY, JSON.stringify(nextState));
              setLedgerState(nextState);
            }
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
      // 🌟 변동점등록뱃지로 등록 시 변동점관리대장(4M)에 즉시 함께 등록!
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
    } else if (targetBadgeType === "INTERNAL") {
      // 🌟 사내관리등록뱃지로 등록 시 사내 부적합관리대장으로만 관리 (4M 변동점관리대장에서는 제외)
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
    const todayStr = now.toISOString().slice(0, 10);
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
      {isAddOpen && (
        <div className="p-4 bg-rose-50/50 border-b border-rose-200 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-800">
              {editingItemId ? "✏️ 작업일보 부적합 내역 수정 및 대장 등록" : "➕ 작업일보 부적합 내역 신규 등록"}
            </span>
            {/* Registration Badge Selector in Form */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-black text-slate-600 mr-1">등록구분 뱃지:</span>
              <button
                type="button"
                onClick={() => setFormRegType("CHANGE_POINT")}
                className={`px-3 py-1 rounded-full text-[11px] font-black border transition-all cursor-pointer ${
                  formRegType === "CHANGE_POINT"
                    ? "bg-indigo-600 text-white border-indigo-700 shadow-sm ring-2 ring-indigo-200"
                    : "bg-white text-indigo-700 border-indigo-300 hover:bg-indigo-50"
                }`}
              >
                🔄 변동점등록 (4M 변동점관리대장 동시등록)
              </button>
              <button
                type="button"
                onClick={() => setFormRegType("INTERNAL")}
                className={`px-3 py-1 rounded-full text-[11px] font-black border transition-all cursor-pointer ${
                  formRegType === "INTERNAL"
                    ? "bg-emerald-600 text-white border-emerald-700 shadow-sm ring-2 ring-emerald-200"
                    : "bg-white text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                }`}
              >
                🏢 사내관리등록 (부적합관리대장 전용)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div>
              <label className="block text-[10px] font-black text-slate-600 mb-1">발생 공정 / 라인</label>
              <input
                type="text"
                value={formLine}
                onChange={(e) => setFormLine(e.target.value)}
                placeholder="예: 9BQC 조인트 / PCM 1호기"
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-bold"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-600 mb-1">부적합 유형</label>
              <input
                type="text"
                value={formDefectType}
                onChange={(e) => setFormDefectType(e.target.value)}
                placeholder="예: 외관 스크래치 / 치수 불량"
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-bold"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-600 mb-1">부적합 수량 (EA 또는 kg)</label>
              <input
                type="number"
                value={formScrapKg}
                onChange={(e) => setFormScrapKg(e.target.value)}
                placeholder="0"
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[10px] font-black text-slate-600 mb-1">발생원인 및 부적합 상세내용</label>
              <input
                type="text"
                value={formContent}
                onChange={(e) => setFormContent(e.target.value)}
                placeholder="작업일보 내 발생한 부적합 상세 내역 입력"
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-bold"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-600 mb-1">조치결과 및 대책</label>
              <input
                type="text"
                value={formActionResult}
                onChange={(e) => setFormActionResult(e.target.value)}
                placeholder="현장 조치 내역 입력 (입력 시 조치완료 처리)"
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-bold"
              />
            </div>
          </div>

          {/* 조치전 / 조치후 사진 업로드 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="bg-white p-2.5 rounded-lg border border-rose-200 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-black text-rose-700 block">📸 조치전 사진 (부적합 현상)</span>
                <label className="mt-1 inline-block px-2.5 py-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[10px] font-black cursor-pointer">
                  사진 선택
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handlePhotoUpload("beforePhoto", e.target.files?.[0])}
                    className="hidden"
                  />
                </label>
              </div>
              {formBeforePhoto && (
                <div className="relative">
                  <img src={formBeforePhoto} alt="조치전" className="w-14 h-14 object-cover rounded-lg border border-rose-300" />
                  <button
                    type="button"
                    onClick={() => setFormBeforePhoto(null)}
                    className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-rose-600 text-white text-[9px] font-black flex items-center justify-center"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>

            <div className="bg-white p-2.5 rounded-lg border border-emerald-200 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-black text-emerald-700 block">📸 조치후 사진 (개선 완료)</span>
                <label className="mt-1 inline-block px-2.5 py-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-[10px] font-black cursor-pointer">
                  사진 선택
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handlePhotoUpload("afterPhoto", e.target.files?.[0])}
                    className="hidden"
                  />
                </label>
              </div>
              {formAfterPhoto && (
                <div className="relative">
                  <img src={formAfterPhoto} alt="조치후" className="w-14 h-14 object-cover rounded-lg border border-emerald-300" />
                  <button
                    type="button"
                    onClick={() => setFormAfterPhoto(null)}
                    className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-emerald-600 text-white text-[9px] font-black flex items-center justify-center"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                setIsAddOpen(false);
                handleResetForm();
              }}
              className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-600 text-xs font-bold cursor-pointer"
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleSaveForm}
              className="px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-black shadow-sm cursor-pointer"
            >
              💾 저장 및 {formRegType === "CHANGE_POINT" ? "변동점등록 (4M 연동)" : "사내관리등록"}
            </button>
          </div>
        </div>
      )}

      {/* List of Work Report Nonconformances */}
      <div className={`divide-y divide-slate-100 ${compact ? "max-h-72" : "max-h-96"} overflow-y-auto`}>
        {filteredItems.length === 0 ? (
          <div className="py-8 text-center text-xs font-bold text-slate-400">
            작업일보 내 발생한 부적합 내역이 없습니다.
          </div>
        ) : (
          filteredItems.map((item) => {
            const isChangePoint = item.registrationType === "CHANGE_POINT";
            const isInternal = item.registrationType === "INTERNAL";

            return (
              <div
                key={item.id}
                className="p-3 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
              >
                <div className="flex items-start gap-2.5 min-w-0 flex-1">
                  {/* Photos Thumbnail (Before / After) */}
                  {(item.beforePhoto || item.afterPhoto) && (
                    <div className="flex items-center gap-1 shrink-0">
                      {item.beforePhoto && (
                        <div
                          onClick={() => setPreviewImg(item.beforePhoto)}
                          className="relative w-11 h-11 rounded-lg overflow-hidden border border-rose-300 cursor-pointer group"
                          title="조치전 사진 확대"
                        >
                          <img src={item.beforePhoto} alt="조치전" className="w-full h-full object-cover" />
                          <span className="absolute bottom-0 inset-x-0 bg-rose-600/85 text-white text-[8px] font-black text-center">
                            조치전
                          </span>
                        </div>
                      )}
                      {item.afterPhoto && (
                        <div
                          onClick={() => setPreviewImg(item.afterPhoto)}
                          className="relative w-11 h-11 rounded-lg overflow-hidden border border-emerald-300 cursor-pointer group"
                          title="조치후 사진 확대"
                        >
                          <img src={item.afterPhoto} alt="조치후" className="w-full h-full object-cover" />
                          <span className="absolute bottom-0 inset-x-0 bg-emerald-600/85 text-white text-[8px] font-black text-center">
                            조치후
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 text-white text-[10px] font-black">
                        {item.company}
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-black">
                        {item.line}
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-black">
                        {item.defectType}
                      </span>
                      {item.scrapKg > 0 && (
                        <span className="text-[10px] font-black text-rose-600">
                          ({item.scrapKg} EA/kg)
                        </span>
                      )}
                      <span className="text-[10px] font-bold text-slate-400">
                        {item.date} {item.worker ? `• ${item.worker}` : ""}
                      </span>

                      {/* Current Registration Status Badge */}
                      {isChangePoint && (
                        <span className="px-2 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-black shadow-2xs">
                          ✓ 변동점관리대장 연동됨
                        </span>
                      )}
                      {isInternal && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-black shadow-2xs">
                          ✓ 사내관리 등록됨
                        </span>
                      )}
                    </div>

                    <p className="text-xs font-bold text-slate-800 truncate">
                      {item.content || item.title}
                    </p>
                    {item.actionResult && (
                      <p className="text-[11px] font-bold text-emerald-700 mt-0.5 truncate">
                        ↳ 조치완료: {item.actionResult}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right Action & Registration Badges (변동점등록 뱃지 / 사내관리등록 뱃지) */}
                <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                  <button
                    type="button"
                    onClick={() => handleSelectRegistrationBadge(item, "CHANGE_POINT")}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-black border transition-all cursor-pointer flex items-center gap-1 ${
                      isChangePoint
                        ? "bg-indigo-600 text-white border-indigo-700 shadow-xs ring-2 ring-indigo-200"
                        : "bg-indigo-50/80 text-indigo-700 border-indigo-200 hover:bg-indigo-100"
                    }`}
                    title="변동점등록 뱃지로 등록 (변동점관리대장에 자동 등록)"
                  >
                    🔄 변동점등록
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectRegistrationBadge(item, "INTERNAL")}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-black border transition-all cursor-pointer flex items-center gap-1 ${
                      isInternal
                        ? "bg-emerald-600 text-white border-emerald-700 shadow-xs ring-2 ring-emerald-200"
                        : "bg-emerald-50/80 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                    }`}
                    title="사내관리등록 뱃지로 등록 (부적합관리대장 사내관리 전용)"
                  >
                    🏢 사내관리등록
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenEdit(item)}
                    className="px-2 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 text-[10px] font-black cursor-pointer"
                  >
                    조치/사진
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteItem(item)}
                    className="px-1.5 py-1 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-600 text-[10px] font-black cursor-pointer"
                    title="삭제"
                  >
                    삭제
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Image Lightbox */}
      {previewImg && (
        <div
          onClick={() => setPreviewImg(null)}
          className="fixed inset-0 z-[99999] bg-black/80 flex items-center justify-center p-4"
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
