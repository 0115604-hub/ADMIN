import { useMemo } from "react";
import { useCapaActionModalState } from "../../quality/step3/useCapaActionModalState";
import { saveWorkReportNcLedger } from "../../common/WorkReportNonconformanceLedgerPanel";
import { unregisterFromFourMLedger } from "../../../services/fourMChangePointService";

/**
 * useHanulIncidents
 * Extracts Hanul downtime & nonconformance events from filtered reports,
 * aggregates incident metrics, and handles 1st-stage sorting (Internal vs Quality CAPA).
 */
export function useHanulIncidents({
  filteredReports = [],
  ledgerState,
  setLedgerState,
  currentWorkerName,
  setAssignToast
}) {
  // 2단계 생산공정: 한울 비가동 및 부적합 내역 수합 (1차 소팅용)
  const hanulIncidents = useMemo(() => {
    const list = [];
    const overrides = ledgerState?.overrides || {};

    filteredReports.forEach((r) => {
      if (!r) return;
      const rId = String(r.id || "");
      const date = String(r.date || "").trim();
      const worker = String(r.worker || "").trim();
      const proj = String(r.project || "9BQC").trim().toUpperCase();
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
          company: "한울",
          plant: "한림공장",
          line: `${proj} ${proc}`,
          project: proj,
          processId: proc,
          defectType,
          minutes: Number(ov.downtimeMinutes !== undefined ? ov.downtimeMinutes : (ev.minutes || 0)),
          scrapKg: Number(ov.scrapKg !== undefined ? ov.scrapKg : (ev.scrapKg || 0)),
          content: ov.content !== undefined ? ov.content : (ev.detail || `${defectType} 발생`),
          actionResult: ov.actionResult !== undefined ? ov.actionResult : (ev.actionDetail || ""),
          beforePhoto: ov.beforePhoto !== undefined ? ov.beforePhoto : (ev.beforePhoto || null),
          afterPhoto: ov.afterPhoto !== undefined ? ov.afterPhoto : (ev.afterPhoto || null),
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
          const defectType = ov.defectType || "한울 불량 발생";
          const registrationType = ov.registrationType || "UNREGISTERED";
          list.push({
            id: itemId,
            reportId: rId,
            date,
            time: r.time || "",
            worker,
            company: "한울",
            plant: "한림공장",
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
      total: hanulIncidents.length,
      unsorted: hanulIncidents.filter((i) => !i.registrationType || i.registrationType === "UNREGISTERED").length,
      internal: hanulIncidents.filter((i) => i.registrationType === "INTERNAL").length,
      quality: hanulIncidents.filter((i) => i.registrationType === "CHANGE_POINT").length
    };
  }, [hanulIncidents]);

  const capaModalState = useCapaActionModalState({
    managerName: currentWorkerName || "한울 관리자",
    defaultPlant: "한림공장",
    ledgerState,
    setLedgerState,
    onAfterSave: (item) => {
      setAssignToast(`🚨 [${item.line || "한울"}] 조치결과가 전체취합대장(품질 이관)으로 정상 등록되었습니다.`);
      setTimeout(() => setAssignToast(""), 4000);
    }
  });

  const handleSortIncident = async (item, targetType) => {
    if (targetType === "CHANGE_POINT") {
      capaModalState.handleOpenCapaModal(item, currentWorkerName || "한울 관리자");
      return;
    }

    const nowStr = new Date().toLocaleString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    }).replace(/\. /g, "-").replace(/\./g, "");

    const mgr = currentWorkerName || "한울 관리자";
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
      setAssignToast(`🟢 [${item.line || "한울"} ${item.defectType}] 건이 사내 내부관리로 종결 처리되었습니다.`);
    } else {
      await unregisterFromFourMLedger(item.id);
      await unregisterFromFourMLedger(`ledger_${item.id}`);
      setAssignToast(`↩️ [${item.line || "한울"} ${item.defectType}] 소팅이 초기화되었습니다.`);
    }
    setTimeout(() => setAssignToast(""), 3500);
  };

  return {
    hanulIncidents,
    incidentStats,
    capaModalState,
    handleSortIncident
  };
}
