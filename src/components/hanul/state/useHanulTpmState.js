import { useState, useEffect, useMemo, useCallback } from "react";
import {
  HANUL_TPM_MACHINES,
  HANUL_TPM_CHECK_ITEMS,
  createDefaultHanulTpmChecks
} from "../../../services/hanulWorkReportService";
import { getKSTDateString } from "../../../utils/dateUtils";
import { getWorkLogText } from "../../../services/workLogI18nService";
import { isHanulTpmAlreadyDone } from "../hanulReportHelpers";

/**
 * useHanulTpmState
 * 한울 작업일보의 TPM 점검 상태, 검사 체크, 요약 및 다국어 텍스트 관리 서브 훅
 */
export const useHanulTpmState = ({
  isOpen,
  editReport,
  initialProcess,
  processId,
  worker,
  customWorker,
  date,
  allReports,
  currentLang,
  scrollContainerRef
}) => {
  const [currentStep, setCurrentStep] = useState(editReport ? "report" : "tpm");
  const [tpmChecks, setTpmChecks] = useState(() => createDefaultHanulTpmChecks());
  const [tpmActionNote, setTpmActionNote] = useState("");
  const [isHanulTpmDone, setIsHanulTpmDone] = useState(false);

  // TPM 다국어 라벨 일괄 계산
  const tpmI18n = useMemo(() => {
    const machines = {};
    HANUL_TPM_MACHINES.forEach((m) => {
      const machKey = `tpm_mach_${m.id}`;
      const txt = getWorkLogText(machKey, currentLang);
      machines[m.id] = {
        fullName: txt !== machKey ? txt : m.name,
        shortName: txt !== machKey ? txt : m.shortName
      };
    });

    const items = {};
    HANUL_TPM_CHECK_ITEMS.forEach((it) => {
      const itemKey = `tpm_item_${it.no}`;
      const txt = getWorkLogText(itemKey, currentLang);
      items[it.no] = txt !== itemKey ? txt : it.content;
    });

    return {
      statusOk: getWorkLogText("tpm_status_ok", currentLang),
      statusNg: getWorkLogText("tpm_status_ng", currentLang),
      machineOk: getWorkLogText("machine_ok", currentLang),
      allOk: getWorkLogText("all_ok", currentLang),
      checkItemsTitle: getWorkLogText("tpm_check_items_title", currentLang),
      sheetTitle: getWorkLogText("tpm_sheet_title", currentLang),
      sheetSubtitle: getWorkLogText("tpm_sheet_subtitle", currentLang),
      saveAndNext: getWorkLogText("tpm_save_and_next", currentLang),
      abnormalityNote: getWorkLogText("abnormality_note", currentLang),
      abnormalityPlaceholder: getWorkLogText("abnormality_placeholder", currentLang),
      backToTpm: getWorkLogText("back_to_tpm", currentLang),
      close: getWorkLogText("close", currentLang),
      saveReport: getWorkLogText("save_report", currentLang),
      autoTranslatedBadge: getWorkLogText("auto_translated_badge", currentLang),
      machines,
      items
    };
  }, [currentLang]);

  // TPM 초기화 및 상태 점검
  useEffect(() => {
    if (!isOpen) return;

    const effectiveW = editReport?.worker || customWorker.trim() || worker || "박종미";
    const targetD = editReport?.date || date || getKSTDateString();
    const alreadyDone = isHanulTpmAlreadyDone(targetD, effectiveW, allReports, editReport);
    setIsHanulTpmDone(alreadyDone);

    if (editReport) {
      setCurrentStep("report");
      setTpmChecks(editReport.tpmChecks || createDefaultHanulTpmChecks());
      setTpmActionNote(editReport.tpmActionNote || "");
    } else {
      const isSojae = (initialProcess || processId) === "소재준비";
      setCurrentStep(isSojae && !alreadyDone ? "tpm" : "report");
      setTpmChecks(createDefaultHanulTpmChecks());
      setTpmActionNote("");
    }
  }, [isOpen, editReport, initialProcess, processId, worker, customWorker, date, allReports]);

  // TPM 개별 항목 토글
  const handleToggleTpmCheck = useCallback((machineId, itemNo) => {
    setTpmChecks((prev) => {
      const cur = prev[machineId]?.[itemNo] || "OK";
      const nextVal = cur === "OK" ? "NG" : "OK";
      return {
        ...prev,
        [machineId]: {
          ...(prev[machineId] || {}),
          [itemNo]: nextVal
        }
      };
    });
  }, []);

  // 전체 TPM OK 일괄 설정
  const handleSetAllTpmOk = useCallback(() => {
    setTpmChecks(createDefaultHanulTpmChecks());
  }, []);

  // 특정 설비 전체 OK 일괄 설정
  const handleSetMachineAllOk = useCallback((machineId) => {
    setTpmChecks((prev) => {
      const machineChecks = {};
      HANUL_TPM_CHECK_ITEMS.forEach((it) => {
        machineChecks[it.no] = "OK";
      });
      return {
        ...prev,
        [machineId]: machineChecks
      };
    });
  }, []);

  // TPM 완료 후 일보 작성 화면으로 이동
  const handleProceedToReport = () => {
    const effectiveWorkerName = (customWorker.trim() || worker).trim();
    const key = `hanul_tpm_done_${date}_${effectiveWorkerName}`;
    try {
      localStorage.setItem(key, "true");
    } catch (e) {}
    setIsHanulTpmDone(true);
    setCurrentStep("report");
    setTimeout(() => {
      if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = 0;
    }, 50);
  };

  // TPM 요약 통계 계산
  const tpmSummary = useMemo(() => {
    let okCount = 0;
    let ngCount = 0;
    const ngList = [];
    HANUL_TPM_MACHINES.forEach((m) => {
      HANUL_TPM_CHECK_ITEMS.forEach((it) => {
        const st = tpmChecks[m.id]?.[it.no] || "OK";
        if (st === "OK") okCount++;
        else {
          ngCount++;
          ngList.push({
            machine: m.shortName,
            machineName: m.name,
            item: it.content,
            itemNo: it.no,
            method: it.method
          });
        }
      });
    });
    return { okCount, ngCount, ngList, total: okCount + ngCount };
  }, [tpmChecks]);

  return {
    currentStep,
    setCurrentStep,
    tpmChecks,
    setTpmChecks,
    tpmActionNote,
    setTpmActionNote,
    isHanulTpmDone,
    setIsHanulTpmDone,
    tpmI18n,
    tpmSummary,
    handleToggleTpmCheck,
    handleSetAllTpmOk,
    handleSetMachineAllOk,
    handleProceedToReport
  };
};
