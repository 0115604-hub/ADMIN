import { useState, useEffect, useMemo } from "react";
import {
  subscribeWorkReportTemplates,
  getLocalWorkReportTemplates,
  subscribeHanulTemplateAssignments,
  getLocalHanulTemplateAssignments,
  buildHanulProcessSlotKey,
  getAssignedTemplateForWorker
} from "../../../services/workReportTemplateService";
import {
  getCurrentWorkLogLanguage,
  getWorkerLanguageInfo,
  syncWorkerLanguage
} from "../../../services/workLogI18nService";

/**
 * useHanulAssignedTemplate
 * 한울 5대 공정 지정 양식 매칭, 기존 작성 일보 탐색, 다국어 및 근로자 국적 자동 동기화 서브 훅
 */
export const useHanulAssignedTemplate = ({
  companyMode = "HANUL",
  project,
  processId,
  subProcess,
  jointType,
  inspectionType,
  worker,
  customWorker,
  date,
  editReport,
  allReports
}) => {
  // 관리자 지정 5대 공정 양식 연동 상태 (공정표 위치별 매핑)
  const [allCatalogTemplates, setAllCatalogTemplates] = useState(() => getLocalWorkReportTemplates());
  const [templateAssignments, setTemplateAssignments] = useState(() => getLocalHanulTemplateAssignments());
  const [forceLegacyMode, setForceLegacyMode] = useState(false);

  useEffect(() => {
    const unsubTpl = subscribeWorkReportTemplates((list) => {
      if (Array.isArray(list)) setAllCatalogTemplates(list);
    });
    const unsubAssign = subscribeHanulTemplateAssignments((map) => {
      if (map) setTemplateAssignments(map);
    });
    return () => {
      unsubTpl();
      unsubAssign();
    };
  }, []);

  // 다국어 번역 상태 및 근로자 국적 기반 자동 언어 동기화
  const [currentLang, setCurrentLang] = useState(() => getCurrentWorkLogLanguage());

  // 작업자 변경 시 해당 작업자의 국적을 확인하여 모국어로 자동 전환
  useEffect(() => {
    const targetW = customWorker?.trim() || worker;
    if (targetW) {
      const synched = syncWorkerLanguage({ name: targetW, company: "한울" });
      setCurrentLang(synched);
    }
  }, [worker, customWorker]);

  // 언어 변경 리스너
  useEffect(() => {
    const handleLangChange = (e) => {
      if (e?.detail?.lang) {
        setCurrentLang(e.detail.lang);
      }
    };
    window.addEventListener("factory_language_changed", handleLangChange);
    return () => window.removeEventListener("factory_language_changed", handleLangChange);
  }, []);

  const workerLangInfo = useMemo(() => {
    const targetW = customWorker?.trim() || worker;
    return getWorkerLanguageInfo({ name: targetW, company: "한울" });
  }, [worker, customWorker]);

  // 공정표에서 현재 선택된 공정/단계 위치(Slot)의 지정 양식 매칭
  const activeSubSlot = useMemo(() => {
    const normProj = String(project || "").toUpperCase() === "LQ2A" ? "LQ2A" : "9BQC";
    if (processId === "소재준비") {
      return normProj === "9BQC" ? (subProcess || "정치절단") : "작업일보";
    }
    if (processId === "조인트") return jointType || "FRT";
    if (processId === "검사") return inspectionType || "LENGTH";
    return "MAIN";
  }, [project, processId, subProcess, jointType, inspectionType]);

  const activeSlotKey = useMemo(() => {
    return buildHanulProcessSlotKey(project, processId, activeSubSlot);
  }, [project, processId, activeSubSlot]);

  const effectiveWorkerName = (customWorker?.trim() || worker || "").trim();

  const existingWorkerReport = useMemo(() => {
    if (editReport) return editReport;
    if (!effectiveWorkerName || !date || !allReports || allReports.length === 0) return null;
    return (
      allReports.find((r) => {
        if (!r) return false;
        const matchWorker = String(r.worker || "").trim() === effectiveWorkerName;
        const matchDate = r.date === date;
        const matchProj = String(r.project || "").toUpperCase() === String(project || "").toUpperCase();
        const matchProc = r.processId === processId;
        if (!matchWorker || !matchDate || !matchProj || !matchProc) return false;

        if (processId === "소재준비") {
          return (r.subProcess || "정치절단") === (subProcess || "정치절단");
        }
        if (processId === "조인트") {
          return (r.jointType || "FRT") === (jointType || "FRT");
        }
        if (processId === "검사") {
          return (r.inspectionType || "LENGTH") === (inspectionType || "LENGTH");
        }
        return true;
      }) || null
    );
  }, [editReport, effectiveWorkerName, date, allReports, project, processId, subProcess, jointType, inspectionType]);

  const activeAssignedTemplate = useMemo(() => {
    const baseAssigned = getAssignedTemplateForWorker({
      company: companyMode,
      project,
      processId,
      subProcess,
      jointType,
      inspectionType,
      allTemplates: allCatalogTemplates,
      assignments: templateAssignments
    });

    if (existingWorkerReport) {
      return {
        id: existingWorkerReport.assignedTemplateId || baseAssigned?.id || existingWorkerReport.id || "edit_lego_tpl",
        reportDocId: existingWorkerReport.id,
        title: existingWorkerReport.processName || existingWorkerReport.title || baseAssigned?.title || "작업일보",
        carModel: existingWorkerReport.carModel || project,
        partName: existingWorkerReport.partName || baseAssigned?.partName || "G/RUN",
        processName: existingWorkerReport.processId || processId || baseAssigned?.processName || "소재준비",
        targetQty:
          existingWorkerReport.targetQty ||
          existingWorkerReport.orderQty ||
          existingWorkerReport.legoConfig?.targetQty ||
          baseAssigned?.targetQty ||
          350,
        orderQty:
          existingWorkerReport.orderQty ||
          existingWorkerReport.targetQty ||
          existingWorkerReport.legoConfig?.orderQty ||
          baseAssigned?.orderQty ||
          350,
        legoConfig: existingWorkerReport.legoConfig || baseAssigned?.legoConfig || null,
        isExistingDraft: true
      };
    }
    return baseAssigned;
  }, [
    existingWorkerReport,
    templateAssignments,
    allCatalogTemplates,
    companyMode,
    project,
    processId,
    subProcess,
    jointType,
    inspectionType
  ]);

  const isAssignedTemplateMode = Boolean(activeAssignedTemplate) && !forceLegacyMode;

  return {
    allCatalogTemplates,
    templateAssignments,
    forceLegacyMode,
    setForceLegacyMode,
    currentLang,
    setCurrentLang,
    workerLangInfo,
    activeSubSlot,
    activeSlotKey,
    effectiveWorkerName,
    existingWorkerReport,
    activeAssignedTemplate,
    isAssignedTemplateMode
  };
};
