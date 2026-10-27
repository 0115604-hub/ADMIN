import { useState, useEffect, useMemo } from "react";
import {
  subscribeMachiningWorkReports,
  deleteMachiningWorkReport,
  exportMachiningReportToExcel,
  MACHINING_PROCESSES,
  isExcludedFromMachiningWorkReport
} from "../../../services/machiningWorkReportService";
import {
  subscribeWorkReportTemplates,
  getLocalWorkReportTemplates,
  subscribeHanulTemplateAssignments,
  getLocalHanulTemplateAssignments,
  saveHanulTemplateAssignment,
  buildHanulProcessSlotKey
} from "../../../services/workReportTemplateService";
import {
  getLocalProductionOrders,
  saveProductionOrder,
  subscribeProductionOrders
} from "../../../services/productionOrderService";
import {
  getLocalWorkReportNcLedger,
  saveWorkReportNcLedger,
  WORK_REPORT_NC_STORAGE_KEY
} from "../../common/WorkReportNonconformanceLedgerPanel";
import {
  registerToFourMLedger,
  unregisterFromFourMLedger
} from "../../../services/fourMChangePointService";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../../../firebase";

export const useMachiningWorkReportTableState = ({
  onOpenReportModal,
  currentWorkerName = ""
}) => {
  const [reports, setReports] = useState([]);
  const [projectFilter, setProjectFilter] = useState("all");
  const [processFilter, setProcessFilter] = useState("all");
  const [searchWorker, setSearchWorker] = useState("");
  const [searchDate, setSearchDate] = useState("");
  const [isDeleting, setIsDeleting] = useState(null);

  // 2단계 생산공정: 생산오더 & 비가동 소팅 상태
  const [productionOrders, setProductionOrders] = useState(() => getLocalProductionOrders("machining"));
  const [ledgerState, setLedgerState] = useState(() => getLocalWorkReportNcLedger());
  const [orderModalProject, setOrderModalProject] = useState(null);
  const [orderModalInput, setOrderModalInput] = useState("");

  // 5대 공정 양식 보관함 리스트 & 양식 매핑 상태
  const [allTemplates, setAllTemplates] = useState(() => getLocalWorkReportTemplates());
  const [templateAssignments, setTemplateAssignments] = useState(() => getLocalHanulTemplateAssignments());
  const [settingProject, setSettingProject] = useState(null);
  const [settingProcessId, setSettingProcessId] = useState("소재준비");
  const [settingSubSlot, setSettingSubSlot] = useState("정치절단");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("ALL");
  const [draftProcessSlots, setDraftProcessSlots] = useState({});
  const [isSavingAssign, setIsSavingAssign] = useState(false);
  const [assignToast, setAssignToast] = useState("");
  const [previewTemplate, setPreviewTemplate] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const unsub = subscribeMachiningWorkReports((list) => {
      if (isMounted) setReports(list || []);
    });
    const unsubTemplates = subscribeWorkReportTemplates((list) => {
      if (isMounted && Array.isArray(list)) setAllTemplates(list);
    });
    const unsubAssign = subscribeHanulTemplateAssignments((map) => {
      if (isMounted && map) setTemplateAssignments(map);
    });
    const unsubOrders = subscribeProductionOrders("machining", (orders) => {
      if (isMounted && orders) setProductionOrders(orders);
    });

    const handleLocalLedgerUpdate = (e) => {
      if (!isMounted) return;
      if (e?.detail) setLedgerState(e.detail);
      else setLedgerState(getLocalWorkReportNcLedger());
    };
    window.addEventListener("work_report_nc_ledger_updated", handleLocalLedgerUpdate);

    let unsubFirestoreLedger = () => {};
    if (db) {
      try {
        unsubFirestoreLedger = onSnapshot(
          doc(db, "app_settings", WORK_REPORT_NC_STORAGE_KEY),
          (snap) => {
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
          },
          (err) => console.warn("Firestore ledger listen error:", err)
        );
      } catch (err) {
        console.warn("Firestore ledger attach error:", err);
      }
    }

    return () => {
      isMounted = false;
      unsub();
      unsubTemplates();
      unsubAssign();
      unsubOrders();
      window.removeEventListener("work_report_nc_ledger_updated", handleLocalLedgerUpdate);
      if (typeof unsubFirestoreLedger === "function") unsubFirestoreLedger();
    };
  }, []);

  const handleOpenTemplateSetting = (projKey) => {
    const targetProj = String(projKey || "HR").toUpperCase();
    const firstProc = (MACHINING_PROCESSES[targetProj] || MACHINING_PROCESSES.HR || [])[0]?.id || "소재준비";
    setSettingProject(targetProj);
    setSettingProcessId(firstProc);
    setSettingSubSlot(firstProc === "소재준비" ? "정치절단" : "MAIN");
    setDraftProcessSlots({ ...(templateAssignments?.processSlots || {}) });
    setSelectedCategoryFilter("ALL");
  };

  const handleSwitchSettingProject = (projKey) => {
    const targetProj = String(projKey || "HR").toUpperCase();
    const firstProc = (MACHINING_PROCESSES[targetProj] || MACHINING_PROCESSES.HR || [])[0]?.id || "소재준비";
    setSettingProject(targetProj);
    setSettingProcessId(firstProc);
    setSettingSubSlot(firstProc === "소재준비" ? "정치절단" : "MAIN");
  };

  const handleSwitchSettingProcess = (procId) => {
    setSettingProcessId(procId);
    setSettingSubSlot(procId === "소재준비" ? "정치절단" : "MAIN");
  };

  const currentSlotKey = useMemo(() => {
    if (!settingProject || !settingProcessId) return null;
    return buildHanulProcessSlotKey(settingProject, settingProcessId, settingSubSlot);
  }, [settingProject, settingProcessId, settingSubSlot]);

  const currentSlotTemplateId = currentSlotKey ? draftProcessSlots?.[currentSlotKey] || null : null;
  const currentSlotTemplateObj = useMemo(() => {
    if (!currentSlotTemplateId) return null;
    return (allTemplates || []).find((t) => t.id === currentSlotTemplateId) || null;
  }, [allTemplates, currentSlotTemplateId]);

  const handleToggleTemplateSelect = (tplId) => {
    if (!currentSlotKey) return;
    setDraftProcessSlots((prev) => {
      const next = { ...prev };
      if (next[currentSlotKey] === tplId) {
        delete next[currentSlotKey];
      } else {
        next[currentSlotKey] = tplId;
      }
      return next;
    });
  };

  const handleClearSlotTemplate = () => {
    if (!currentSlotKey) return;
    setDraftProcessSlots((prev) => {
      const next = { ...prev };
      delete next[currentSlotKey];
      return next;
    });
  };

  const handleSaveProcessSlotAssignment = async (openModalAfter = false) => {
    if (!settingProject) return;
    setIsSavingAssign(true);
    try {
      const targetProj = settingProject;
      const targetProc = settingProcessId;
      const projPrefix = `${targetProj}__`;
      const assignedIdsForProj = Object.entries(draftProcessSlots || {})
        .filter(([k, v]) => k.startsWith(projPrefix) && Boolean(v))
        .map(([, v]) => v);
      await saveHanulTemplateAssignment(targetProj, assignedIdsForProj, draftProcessSlots);
      setAssignToast(`✅ [${targetProj} G/RUN • ${targetProc}] 공정에 선택한 작업일보 양식이 저장 적용되었습니다!`);
      setTimeout(() => setAssignToast(""), 3500);
      setSettingProject(null);
      if (openModalAfter && onOpenReportModal) {
        onOpenReportModal(targetProj, targetProc);
      }
    } catch (e) {
      console.error(e);
      alert("양식 설정 저장 중 오류가 발생했습니다: " + e.message);
    } finally {
      setIsSavingAssign(false);
    }
  };

  // 5대 공정 양식 필터링
  const filteredCatalogTemplates = useMemo(() => {
    let list = allTemplates || [];
    if (selectedCategoryFilter !== "ALL") {
      list = list.filter((t) => t.categoryId === selectedCategoryFilter);
    }
    return list;
  }, [allTemplates, selectedCategoryFilter]);

  // 일보 필터링
  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      if (isExcludedFromMachiningWorkReport(r.worker)) return false;
      if (projectFilter !== "all") {
        const normFilter = projectFilter.toUpperCase();
        const normProj = String(r.project || "").toUpperCase();
        if (normFilter === "NX5A") {
          if (normProj !== "NX5A" && normProj !== "NX4A") return false;
        } else if (normProj !== normFilter) {
          return false;
        }
      }
      if (processFilter !== "all" && r.processId !== processFilter) return false;
      if (searchWorker.trim()) {
        const query = searchWorker.trim().toLowerCase();
        if (!String(r.worker || "").toLowerCase().includes(query)) return false;
      }
      if (searchDate && r.date !== searchDate) return false;
      return true;
    });
  }, [reports, projectFilter, processFilter, searchWorker, searchDate]);

  // 3대 아이템별 당일 생산 실적
  const stats = useMemo(() => {
    let totalCount = 0;
    let hrGross = 0, hrGen = 0;
    let jaGross = 0, jaGen = 0;
    let nx5Gross = 0, nx5Gen = 0;

    reports.forEach((r) => {
      if (searchDate && r.date !== searchDate) return;
      if (searchWorker && !String(r.worker || "").includes(searchWorker)) return;
      totalCount++;
      const g = Number(r.totals?.genuine ?? r.genuineQty ?? 0) || 0;
      const b = Number(r.totals?.bad ?? r.badQty ?? 0) || 0;
      const total = Number(r.totals?.total ?? r.totalQty ?? (g + b)) || (g + b);
      const p = String(r.project || "").toUpperCase();

      if (p.includes("HR") || p.includes("포터")) {
        hrGross += total;
        hrGen += g;
      } else if (p.includes("JA") || p.includes("모닝") || p.includes("레이")) {
        jaGross += total;
        jaGen += g;
      } else if (p.includes("NX5") || p.includes("NX4") || p.includes("투싼")) {
        nx5Gross += total;
        nx5Gen += g;
      }
    });

    const hrYield = hrGross > 0 ? ((hrGen / hrGross) * 100).toFixed(1) : "100.0";
    const jaYield = jaGross > 0 ? ((jaGen / jaGross) * 100).toFixed(1) : "100.0";
    const nx5Yield = nx5Gross > 0 ? ((nx5Gen / nx5Gross) * 100).toFixed(1) : "100.0";

    return { totalCount, hrGross, hrGen, hrYield, jaGross, jaGen, jaYield, nx5Gross, nx5Gen, nx5Yield };
  }, [reports, searchDate, searchWorker]);

  // 생산오더 및 달성률
  const orders = useMemo(() => {
    const defaultOrders = { HR: 800, JA: 1200, NX5A: 1500 };
    return { ...defaultOrders, ...(productionOrders || {}) };
  }, [productionOrders]);

  const hrOrder = Number(orders.HR) || 800;
  const jaOrder = Number(orders.JA) || 1200;
  const nx5Order = Number(orders.NX5A) || 1500;

  const hrAttainment = hrOrder > 0 ? ((stats.hrGen / hrOrder) * 100).toFixed(1) : "100.0";
  const jaAttainment = jaOrder > 0 ? ((stats.jaGen / jaOrder) * 100).toFixed(1) : "100.0";
  const nx5Attainment = nx5Order > 0 ? ((stats.nx5Gen / nx5Order) * 100).toFixed(1) : "100.0";

  // 가공동 비가동 및 부적합 내역 수합
  const machiningIncidents = useMemo(() => {
    const list = [];
    const overrides = ledgerState?.overrides || {};

    filteredReports.forEach((r) => {
      if (!r) return;
      const rId = String(r.id || "");
      const date = String(r.date || "").trim();
      const worker = String(r.worker || "").trim();
      const proj = String(r.project || "가공").trim().toUpperCase();
      const proc = String(r.processId || "").trim();
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

      if (!hasDefectEvent && Number(r.totals?.bad || r.badQty || 0) > 0) {
        const itemId = `wr_nc_def_${rId}`;
        const ov = overrides[itemId] || {};
        if (!ov.isDeleted) {
          const badQty = Number(r.totals?.bad || r.badQty || 0);
          const defectType = ov.defectType || "가공 불량 발생";
          const registrationType = ov.registrationType || "UNREGISTERED";
          list.push({
            id: itemId,
            reportId: rId,
            date,
            time: r.time || "",
            worker,
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
      total: machiningIncidents.length,
      unsorted: machiningIncidents.filter((i) => !i.registrationType || i.registrationType === "UNREGISTERED").length,
      internal: machiningIncidents.filter((i) => i.registrationType === "INTERNAL").length,
      quality: machiningIncidents.filter((i) => i.registrationType === "CHANGE_POINT").length
    };
  }, [machiningIncidents]);

  const handleSortIncident = async (item, targetType) => {
    const nowStr = new Date().toLocaleString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    }).replace(/\. /g, "-").replace(/\./g, "");

    const managerName = currentWorkerName || "가공동 관리자";
    const nextOverrides = {
      ...(ledgerState.overrides || {}),
      [item.id]: {
        ...(ledgerState.overrides?.[item.id] || {}),
        registrationType: targetType,
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

    if (targetType === "CHANGE_POINT") {
      await registerToFourMLedger(
        {
          id: `ledger_${item.id}`,
          originalId: item.id,
          rawId: item.id,
          fourM: "Method",
          origin: "가공동 작업일보 부적합",
          sourceType: "WORK_REPORT_NC",
          plant: "삼랑진공장",
          line: `${item.project} ${item.processId || "가공라인"}`,
          writer: item.worker || managerName,
          title: `[가공동 부적합] ${item.project} - ${item.defectType}`,
          date: item.date,
          time: item.time || "",
          content: item.content || item.defectType || "",
          actionResult: item.actionResult || "",
          actionAuthor: item.actionResult ? managerName : "",
          actionAt: item.actionResult ? nowStr : "",
          images: item.beforePhoto ? [item.beforePhoto] : [],
          actionImages: item.afterPhoto ? [item.afterPhoto] : [],
          isResolved: Boolean(item.actionResult || item.afterPhoto),
          scrapKg: Number(item.scrapKg) || 0,
          downtimeMinutes: Number(item.minutes) || 0,
          registrationBadge: "변동점등록",
          isOfficialLedger: true
        },
        managerName
      );
      setAssignToast(`🚨 [${item.project} ${item.defectType}] 건이 3단계 품질관리자(이창엽 책임) 4M 대장으로 이관되었습니다.`);
    } else if (targetType === "INTERNAL") {
      await unregisterFromFourMLedger(item.id);
      await unregisterFromFourMLedger(`ledger_${item.id}`);
      setAssignToast(`🟢 [${item.project} ${item.defectType}] 건이 사내 내부관리로 종결 처리되었습니다.`);
    } else {
      await unregisterFromFourMLedger(item.id);
      await unregisterFromFourMLedger(`ledger_${item.id}`);
      setAssignToast(`↩️ [${item.project} ${item.defectType}] 소팅이 초기화되었습니다.`);
    }
    setTimeout(() => setAssignToast(""), 3500);
  };

  const handleOpenOrderEdit = (projKey, currentVal) => {
    setOrderModalProject(projKey);
    setOrderModalInput(String(currentVal || 0));
  };

  const handleSaveOrderModal = async () => {
    if (!orderModalProject) return;
    const qty = parseInt(orderModalInput, 10);
    if (isNaN(qty) || qty < 0) {
      alert("유효한 수량을 입력해주세요.");
      return;
    }
    await saveProductionOrder("machining", orderModalProject, qty, currentWorkerName);
    setProductionOrders((prev) => ({ ...prev, [orderModalProject]: qty }));
    setAssignToast(`✅ [${orderModalProject}] 생산오더가 [${qty.toLocaleString()} EA]로 설정되었습니다.`);
    setTimeout(() => setAssignToast(""), 3500);
    setOrderModalProject(null);
  };

  const handleDelete = async (id, e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    if (!window.confirm("정말로 이 작업일보를 영구 삭제하시겠습니까?\n삭제 후에는 복구할 수 없습니다.")) return;
    setIsDeleting(id);
    try {
      await deleteMachiningWorkReport(id);
    } catch (err) {
      console.error(err);
      alert("삭제 중 오류가 발생했습니다: " + err.message);
    } finally {
      setIsDeleting(null);
    }
  };

  return {
    reports,
    projectFilter,
    setProjectFilter,
    processFilter,
    setProcessFilter,
    searchWorker,
    setSearchWorker,
    searchDate,
    setSearchDate,
    isDeleting,
    productionOrders,
    orderModalProject,
    setOrderModalProject,
    orderModalInput,
    setOrderModalInput,
    settingProject,
    setSettingProject,
    settingProcessId,
    setSettingProcessId,
    settingSubSlot,
    selectedCategoryFilter,
    setSelectedCategoryFilter,
    draftProcessSlots,
    isSavingAssign,
    assignToast,
    setAssignToast,
    previewTemplate,
    setPreviewTemplate,
    currentSlotKey,
    currentSlotTemplateId,
    currentSlotTemplateObj,
    filteredCatalogTemplates,
    filteredReports,
    stats,
    orders,
    hrOrder,
    jaOrder,
    nx5Order,
    hrAttainment,
    jaAttainment,
    nx5Attainment,
    machiningIncidents,
    incidentStats,
    handleOpenTemplateSetting,
    handleSwitchSettingProject,
    handleSwitchSettingProcess,
    handleToggleTemplateSelect,
    handleClearSlotTemplate,
    handleSaveProcessSlotAssignment,
    handleSortIncident,
    handleOpenOrderEdit,
    handleSaveOrderModal,
    handleDelete
  };
};
