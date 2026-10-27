import {
  cleanCompanyName,
  registerCompanyWorker,
  removeCompanyWorker,
  saveSmartOvertimeData,
  getLocalSmartOvertimeData
} from "../../services/overtimeSmartService.js";
import {
  normalizeStandardDept,
  normalizeStandardPosition,
  STANDARD_PROCESS_LIST,
  getWorkerPersonnelCard,
  saveWorkerPersonnelCard,
  deleteWorkerPersonnelCard
} from "../../services/personnelCardService.js";
import {
  deleteOvertimeReport,
  saveOvertimeReport,
  saveLocalOvertimeReports
} from "../../services/overtimeService";
import { syncPlantOvertimeToApprovalBox } from "../../services/approvalService";

// Quick Add Company Worker
export const quickAddCompanyWorker = async ({
  quickNewWorkerName,
  quickNewWorkerCompany,
  workerMgmtCompanyFilter,
  selectedCompanyFilter,
  quickNewWorkerDept,
  quickNewWorkerLine,
  quickNewWorkerPos,
  daysInMonth,
  isWeekendDay,
  currentProfile,
  selectedMonth,
  setIsSaving,
  setSmartData,
  setWorkerMgmtCompanyFilter,
  setQuickNewWorkerCompany,
  setPersonnelCardsMap,
  setQuickNewWorkerName,
  triggerToast
}) => {
  const name = (quickNewWorkerName || "").trim();
  if (!name) {
    alert("근로자 성명을 입력해주세요.");
    return;
  }

  const company = cleanCompanyName(
    quickNewWorkerCompany ||
    (workerMgmtCompanyFilter && workerMgmtCompanyFilter !== "전체" ? workerMgmtCompanyFilter : selectedCompanyFilter) ||
    "오륙"
  );
  const dept = normalizeStandardDept(quickNewWorkerDept || "생산팀", company);
  const mainProc = (quickNewWorkerLine || "압출").trim();
  const line = mainProc || dept;
  const position = normalizeStandardPosition(quickNewWorkerPos || "사원", company);

  const emptyDaily = {};
  for (let d = 1; d <= daysInMonth; d++) {
    const isWk = isWeekendDay(d);
    emptyDaily[d] = isWk ? "-" : "";
  }

  try {
    setIsSaving(true);
    const updatedData = await registerCompanyWorker(
      company,
      {
        name,
        dept,
        line,
        position,
        daily: emptyDaily,
        operator: currentProfile?.name || "관리자"
      },
      selectedMonth || "2026-10"
    );

    setSmartData(updatedData);
    setWorkerMgmtCompanyFilter(company);
    setQuickNewWorkerCompany(company);

    const compWorkers = (updatedData.attendanceMatrix || []).filter(
      (w) => cleanCompanyName(w.company) === company
    );
    const nextNo = compWorkers.length || 1;
    const cardKey = `${company}_${name}`;
    const initialCard = getWorkerPersonnelCard(
      {
        name,
        company,
        dept,
        line,
        position,
        personnelCard: {
          name,
          company,
          dept,
          position,
          mainProcess: STANDARD_PROCESS_LIST.includes(mainProc) ? mainProc : "압출"
        }
      },
      nextNo
    );
    await saveWorkerPersonnelCard(cardKey, initialCard);
    setPersonnelCardsMap((prev) => ({ ...prev, [cardKey]: initialCard }));

    setQuickNewWorkerName("");
    triggerToast(`🎉 [${company}] ${name} (${dept} / ${position}) 신규 근로자 등록 완료!`);
  } catch (err) {
    console.error("Failed to register worker:", err);
    alert("근로자 등록 중 오류가 발생했습니다: " + (err.message || err));
  } finally {
    setIsSaving(false);
  }
};

// Confirm Delete Worker Permanently
export const confirmDeleteWorker = async ({
  workerToDelete,
  setIsDeletingWorker,
  selectedMonth,
  prevYearMonth,
  legacyReports,
  setSmartData,
  setPrevMonthData,
  setPersonnelCardsMap,
  setLegacyReports,
  setWorkerToDelete,
  triggerToast
}) => {
  if (!workerToDelete) return;
  setIsDeletingWorker(true);
  try {
    const { name, company, position } = workerToDelete;
    const cleanComp = cleanCompanyName(company);

    // 1. 인사카드 클라우드 및 로컬스토리지에서 영구 삭제
    await deleteWorkerPersonnelCard(cleanComp, name);

    // 2. 5개사 독립 스마트 근태 대장에서 해당 업체 인원 영구 삭제
    const updatedData = await removeCompanyWorker(cleanComp, name, selectedMonth || "2026-10");
    setSmartData(updatedData);
    setPrevMonthData(getLocalSmartOvertimeData(prevYearMonth || "2026-09"));

    // 3. 로컬 personnelCardsMap 상태 동기화
    setPersonnelCardsMap((prev) => {
      const next = { ...prev };
      delete next[`${cleanComp}_${name}`];
      delete next[`${company}_${name}`];
      delete next[`${workerToDelete.rawCompany}_${name}`];
      return next;
    });

    // 4. 등록된 일일 보고서에서도 퇴사자 인원 자동 정리
    if (Array.isArray(legacyReports)) {
      const updatedLegacyReports = legacyReports.map((r) => {
        if (!r || cleanCompanyName(r.company) !== cleanComp) return r;
        const filteredItems = (r.items || []).filter(
          (it) => (it.workerName || it.name || "").trim() !== name.trim()
        );
        if (filteredItems.length === (r.items || []).length) return r;
        const reindexedItems = filteredItems.map((it, i) => ({ ...it, no: i + 1 }));
        const totalHours = reindexedItems.reduce((sum, it) => sum + (Number(it.hours) || 0), 0);
        const totalOtHours = reindexedItems.reduce((sum, it) => sum + (Number(it.otHours) || 0), 0);
        const updatedRep = {
          ...r,
          items: reindexedItems,
          totalWorkers: reindexedItems.length,
          attendedWorkers: reindexedItems.filter((it) => it.hours > 0).length,
          totalHours,
          otHours: totalOtHours,
          cost: totalHours * 15000,
          updatedAt: new Date().toISOString()
        };
        saveOvertimeReport(updatedRep).catch(() => {});
        return updatedRep;
      });
      setLegacyReports(updatedLegacyReports);
      saveLocalOvertimeReports(updatedLegacyReports);
    }

    setWorkerToDelete(null);
    triggerToast(`🗑️ [${cleanComp}] ${name} (${position}) 인원이 마스터 명단 및 인사카드에서 영구 삭제되었습니다.`);
  } catch (err) {
    console.error("Worker delete error:", err);
    triggerToast("⚠️ 근로자 삭제 중 오류가 발생했습니다: " + err.message);
  } finally {
    setIsDeletingWorker(false);
  }
};

// Save Personnel Card
export const savePersonnelCard = async ({
  updatedCardData,
  selectedPersonnelWorkerIndex,
  smartData,
  currentProfile,
  selectedMonth,
  setIsSaving,
  setPersonnelCardsMap,
  setSmartData,
  triggerToast
}) => {
  setIsSaving(true);
  try {
    const cleanComp = cleanCompanyName(updatedCardData.company);
    const cardKey = `${cleanComp}_${updatedCardData.name}`;

    setPersonnelCardsMap((prev) => ({
      ...prev,
      [cardKey]: updatedCardData,
      [`${updatedCardData.company}_${updatedCardData.name}`]: updatedCardData
    }));

    const currentMatrix = [...(smartData.attendanceMatrix || [])];
    let targetIdx = selectedPersonnelWorkerIndex;

    if (targetIdx < 0 || targetIdx >= currentMatrix.length) {
      targetIdx = currentMatrix.findIndex(
        (w) => cleanCompanyName(w.company) === cleanComp && w.name === updatedCardData.name
      );
    }

    if (targetIdx >= 0 && currentMatrix[targetIdx]) {
      const nextRow = {
        ...currentMatrix[targetIdx],
        name: updatedCardData.name,
        company: cleanComp,
        dept: normalizeStandardDept(updatedCardData.dept, updatedCardData.company),
        line: updatedCardData.line || updatedCardData.mainProcess || normalizeStandardDept(updatedCardData.dept, updatedCardData.company),
        position: updatedCardData.position,
        empNo: updatedCardData.empNo,
        joinDate: updatedCardData.joinDate,
        tenure: updatedCardData.tenure,
        career: updatedCardData.career,
        mainProcess: updatedCardData.mainProcess,
        processYear: updatedCardData.processYear,
        skillLevel: updatedCardData.skillLevel,
        skillGrade: updatedCardData.skillGrade,
        isMultiSkill: updatedCardData.isMultiSkill,
        subProcesses: updatedCardData.subProcesses
      };
      delete nextRow.personnelCard;
      delete nextRow.card;
      delete nextRow.photoUrl;
      currentMatrix[targetIdx] = nextRow;
    }

    const reindexedMatrix = currentMatrix.map((w, idx) => ({ ...w, no: idx + 1 }));
    const reindexedMaster = reindexedMatrix.map((w, idx) => {
      const masterRow = {
        ...w,
        no: idx + 1,
        company: w.company,
        dept: normalizeStandardDept(w.dept, w.company),
        line: w.line || normalizeStandardDept(w.dept, w.company),
        name: w.name,
        position: w.position || updatedCardData.position,
        empNo: w.empNo || updatedCardData.empNo
      };
      delete masterRow.personnelCard;
      delete masterRow.card;
      delete masterRow.photoUrl;
      return masterRow;
    });

    const updatedData = {
      ...smartData,
      masterWorkers: reindexedMaster,
      attendanceMatrix: reindexedMatrix
    };

    setSmartData(updatedData);

    await saveWorkerPersonnelCard(cardKey, updatedCardData);
    await saveSmartOvertimeData(updatedData, selectedMonth || "2026-10", {
      targetCompany: cleanComp,
      auditMeta: {
        operator: currentProfile?.name || "관리자",
        source: "PERSONNEL_CARD_UPDATE",
        reason: `[${updatedCardData.company}] ${updatedCardData.name} 인사카드 정보 갱신`
      }
    });

    triggerToast(`🎉 [${updatedCardData.company}] ${updatedCardData.name}님의 제조현장 인사카드가 저장되었습니다!`);
  } catch (err) {
    console.error(err);
    alert("인사카드 저장 중 오류가 발생했습니다: " + (err.message || err));
  } finally {
    setIsSaving(false);
  }
};

// Delete Overtime Report
export const deleteReportAction = async ({
  reportOrId,
  e,
  legacyReports,
  smartData,
  selectedLegacyReport,
  setLegacyReports,
  setIsLegacyModalOpen,
  setSelectedLegacyReport,
  triggerToast
}) => {
  if (e) e.stopPropagation();
  const reportId = typeof reportOrId === "object" ? reportOrId.id : reportOrId;
  const targetRep = typeof reportOrId === "object" ? reportOrId : legacyReports.find((r) => r.id === reportId);
  const repName = targetRep?.title || "선택한 특근보고서";

  if (!window.confirm(`정말로 이 특근보고서를 삭제하시겠습니까?\n(${repName})`)) return;
  try {
    await deleteOvertimeReport(reportId);
    const nextReports = legacyReports.filter((r) => r.id !== reportId);
    setLegacyReports(nextReports);

    const currentMatrix = smartData.attendanceMatrix || [];
    if (targetRep) {
      await syncPlantOvertimeToApprovalBox({
        plant: targetRep.plant,
        company: targetRep.company,
        workDate: targetRep.workDate,
        matrix: currentMatrix,
        reports: nextReports,
        isDeleteAction: true
      });
    }

    if (selectedLegacyReport && selectedLegacyReport.id === reportId) {
      setIsLegacyModalOpen(false);
      setSelectedLegacyReport(null);
    }
    triggerToast("🗑️ 특근보고서가 정상적으로 삭제되었습니다.");
  } catch (err) {
    console.error(err);
    alert("삭제 중 오류가 발생했습니다: " + err.message);
  }
};
