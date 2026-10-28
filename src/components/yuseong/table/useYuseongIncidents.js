import { useState, useEffect, useMemo } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../../../firebase";
import {
  getLocalWorkReportNcLedger,
  saveWorkReportNcLedger,
  WORK_REPORT_NC_STORAGE_KEY
} from "../../common/WorkReportNonconformanceLedgerPanel";
import { unregisterFromFourMLedger } from "../../../services/fourMChangePointService";
import { useCapaActionModalState } from "../../quality/step3/useCapaActionModalState";

/**
 * useYuseongIncidents
 * 유성 비가동 및 부적합(불량) 1차 소팅, CAPA 시정조치 연동 상태 훅
 */
export const useYuseongIncidents = ({ filteredReports = [], currentWorkerName = "", onToast }) => {
  const [ledgerState, setLedgerState] = useState(() => getLocalWorkReportNcLedger());
  const [previewImg, setPreviewImg] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const handleLocalLedgerUpdate = (e) => {
      if (!isMounted) return;
      if (e?.detail) setLedgerState(e.detail);
      else setLedgerState(getLocalWorkReportNcLedger());
    };
    window.addEventListener("work_report_nc_ledger_updated", handleLocalLedgerUpdate);

    let unsubFirestoreLedger = () => {};
    if (db) {
      try {
        unsubFirestoreLedger = onSnapshot(doc(db, "app_settings", WORK_REPORT_NC_STORAGE_KEY), (snap) => {
          if (!isMounted) return;
          if (snap.exists()) {
            const data = snap.data();
            const nextState = {
              overrides: data?.overrides || {},
              manualItems: Array.isArray(data?.manualItems) ? data.manualItems : []
            };
            try {
              localStorage.setItem(WORK_REPORT_NC_STORAGE_KEY, JSON.stringify(nextState));
            } catch (err) {}
            setLedgerState(nextState);
          }
        }, (err) => {
          console.warn("useYuseongIncidents ledger listen error:", err);
        });
      } catch (err) {}
    }

    return () => {
      isMounted = false;
      unsubFirestoreLedger();
      window.removeEventListener("work_report_nc_ledger_updated", handleLocalLedgerUpdate);
    };
  }, []);

  // 2단계 생산공정: 유성 비가동 및 부적합 내역 수합 (1차 소팅용)
  const yuseongIncidents = useMemo(() => {
    const list = [];
    const overrides = ledgerState?.overrides || {};

    filteredReports.forEach((r) => {
      if (!r) return;
      const rId = String(r.id || "");
      const date = String(r.date || "").trim();
      const worker = String(r.worker || "").trim();
      const proj = String(r.project || "JK1").trim().toUpperCase();
      const proc = String(r.processName || r.processId || "").trim();
      const dtEvents = Array.isArray(r.downtimeEvents) ? r.downtimeEvents : [];
      let hasDefectEvent = false;

      dtEvents.forEach((ev, idx) => {
        if (!ev) return;
        const evType = String(ev.type || "").trim();
        const isDefect =
          evType === "불량" ||
          evType === "부적합" ||
          Boolean(ev.beforePhoto || ev.afterPhoto) ||
          String(ev.category || "").includes("불량") ||
          String(ev.category || "").includes("부적합") ||
          Number(ev.minutes) > 0;

        if (!isDefect) return;
        hasDefectEvent = true;

        const itemId = `wr_nc_${rId}_${ev.id || idx}`;
        const ov = overrides[itemId] || {};
        if (ov.isDeleted) return;

        const defectType = ov.defectType || ev.category || (evType === "부적합" ? "공정 부적합" : "라인 비가동");
        const registrationType = ov.registrationType || "UNREGISTERED";

        list.push({
          id: itemId,
          reportId: rId,
          date,
          time: ev.startTime || r.time || "",
          worker,
          company: "유성",
          plant: "삼랑진공장",
          line: `${proj} ${proc}`,
          project: proj,
          processId: proc,
          defectType,
          minutes: Number(ov.downtimeMinutes !== undefined ? ov.downtimeMinutes : ev.minutes || 0),
          scrapKg: Number(ov.scrapKg !== undefined ? ov.scrapKg : ev.scrapKg || 0),
          content: ov.content !== undefined ? ov.content : ev.detail || `${defectType} 발생`,
          actionResult: ov.actionResult !== undefined ? ov.actionResult : ev.actionDetail || "",
          beforePhoto: ov.beforePhoto !== undefined ? ov.beforePhoto : ev.beforePhoto || null,
          afterPhoto: ov.afterPhoto !== undefined ? ov.afterPhoto : ev.afterPhoto || null,
          registrationType,
          registeredBy: ov.registeredBy || "",
          registeredAt: ov.registeredAt || ""
        });
      });

      const badQty = Number(r.totals?.bad ?? r.badQty ?? 0);
      if (!hasDefectEvent && badQty > 0) {
        const itemId = `wr_nc_def_${rId}`;
        const ov = overrides[itemId] || {};
        if (!ov.isDeleted) {
          const defectType = ov.defectType || "유성 불량 발생";
          const registrationType = ov.registrationType || "UNREGISTERED";
          list.push({
            id: itemId,
            reportId: rId,
            date,
            time: r.time || "",
            worker,
            company: "유성",
            plant: "삼랑진공장",
            line: `${proj} ${proc}`,
            project: proj,
            processId: proc,
            defectType,
            minutes: Number(ov.downtimeMinutes || 0),
            scrapKg: badQty,
            content: ov.content || `${proj} ${proc} 불량 ${badQty}EA 발생 ${r.remark || ""}`.trim(),
            actionResult: ov.actionResult || "",
            beforePhoto: ov.beforePhoto || null,
            afterPhoto: ov.afterPhoto || null,
            registrationType,
            registeredBy: ov.registeredBy || "",
            registeredAt: ov.registeredAt || ""
          });
        }
      }
    });

    return list;
  }, [filteredReports, ledgerState]);

  const incidentStats = useMemo(() => {
    return {
      total: yuseongIncidents.length,
      unsorted: yuseongIncidents.filter((i) => !i.registrationType || i.registrationType === "UNREGISTERED").length,
      internal: yuseongIncidents.filter((i) => i.registrationType === "INTERNAL").length,
      quality: yuseongIncidents.filter((i) => i.registrationType === "CHANGE_POINT").length
    };
  }, [yuseongIncidents]);

  const capaModalState = useCapaActionModalState({
    managerName: currentWorkerName || "이성기 대표",
    defaultPlant: "삼랑진공장",
    ledgerState,
    setLedgerState,
    onAfterSave: (item) => {
      if (onToast) {
        onToast(`🚨 [${item.line || "유성"}] 조치결과가 전체취합대장(품질 이관)으로 정상 등록되었습니다.`);
      }
    }
  });

  const handleSortIncident = async (item, targetType) => {
    if (targetType === "CHANGE_POINT") {
      capaModalState.handleOpenCapaModal(item, currentWorkerName || "이성기 대표");
      return;
    }

    const nowStr = new Date()
      .toLocaleString("ko-KR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
      })
      .replace(/\. /g, "-")
      .replace(/\./g, "");

    const mgr = currentWorkerName || "이성기 대표";
    const nextOverrides = {
      ...(ledgerState.overrides || {}),
      [item.id]: {
        ...(ledgerState.overrides?.[item.id] || {}),
        registrationType: targetType,
        registeredBy: mgr,
        registeredAt: nowStr
      }
    };

    const nextState = {
      ...ledgerState,
      overrides: nextOverrides
    };
    setLedgerState(nextState);
    await saveWorkReportNcLedger(nextState);

    if (targetType === "INTERNAL") {
      await unregisterFromFourMLedger(item.id);
      await unregisterFromFourMLedger(`ledger_${item.id}`);
      if (onToast) {
        onToast(`🟢 [${item.line || "유성"} ${item.defectType}] 건이 사내 내부관리로 종결 처리되었습니다.`);
      }
    } else {
      await unregisterFromFourMLedger(item.id);
      await unregisterFromFourMLedger(`ledger_${item.id}`);
      if (onToast) {
        onToast(`↩️ [${item.line || "유성"} ${item.defectType}] 소팅이 초기화되었습니다.`);
      }
    }
  };

  return {
    yuseongIncidents,
    incidentStats,
    capaModalState,
    handleSortIncident,
    previewImg,
    setPreviewImg
  };
};
