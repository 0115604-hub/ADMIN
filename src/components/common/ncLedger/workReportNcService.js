import { doc, setDoc } from "firebase/firestore";
import { db } from "../../../firebase";
import { sanitizeForFirestore } from "../../../utils/firestoreUtils";
import { determineFourMCategory } from "../../../services/fourMChangePointService";

export const WORK_REPORT_NC_STORAGE_KEY = "work_report_nonconformance_ledger_v1";

export const compressImageToBase64 = (file, maxWidth = 800, quality = 0.72) => {
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
  workLogs = [],
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

  (extrusionReports || []).forEach((r) => processReportEvents(r, r.company || "오륙", "삼랑진공장", r.lineName || "압출라인"));
  (machiningReports || []).forEach((r) => {
    const rawProj = String(r.project || "");
    const comp = r.company || (rawProj.includes("조영") ? "조영" : rawProj.includes("부림") ? "부림텍" : "오륙");
    processReportEvents(r, comp, "삼랑진공장", `${r.project || "가공"} ${r.processId || ""}`);
  });
  (hanulReports || []).forEach((r) => processReportEvents(r, r.company || "한울", "한림공장", `${r.project || "9BQC"} ${r.processId || ""}`));
  (yuseongReports || []).forEach((r) => processReportEvents(r, r.company || "유성", "삼랑진공장", `${r.project || "유성"} ${r.processId || ""}`));
  (legoReports || []).forEach((r) => processReportEvents(r, r.company || r.department || "오륙", r.plant || "삼랑진공장", r.processName || r.title || "공정 작업일보"));
  (workLogs || []).forEach((r) => {
    if (!r) return;
    const rawComp = String(r.company || "");
    const rawWriter = String(r.writer || "");
    const rawProc = String(r.assignedProcess || r.process || "");
    const isBurim = rawComp.includes("부림") || rawWriter.includes("부림") || rawWriter === "최현영" || rawWriter === "김동훈" || rawProc.includes("부림");
    const isJoyoung = rawComp.includes("조영") || rawWriter.includes("조영") || rawWriter === "오상민" || rawWriter === "김동욱" || rawProc.includes("조영");
    if (isBurim) {
      processReportEvents(r, "부림텍", "한림공장", rawProc || "가공/협력업체(부림텍)");
    } else if (isJoyoung) {
      processReportEvents(r, "조영", "한림공장", rawProc || "가공/협력업체(조영)");
    }
  });

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
