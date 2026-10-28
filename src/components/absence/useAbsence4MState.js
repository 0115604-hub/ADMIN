import { useState, useEffect, useMemo } from "react";
import {
  cleanCompanyName,
  COMPANY_APPROVAL_MANAGERS
} from "../../services/overtimeSmartService.js";
import {
  getWorkerPersonnelCard,
  getLocalPersonnelCardsMap,
  subscribePersonnelCards
} from "../../services/personnelCardService.js";
import {
  generate4MActionResult,
  getLocal4MAbsenceLogsMap,
  save4MAbsenceLog,
  delete4MAbsenceLog,
  subscribe4MAbsenceLogs
} from "../../services/absence4MService.js";
import {
  getLocalFourMChangePoints,
  subscribeFourMChangePoints
} from "../../services/fourMChangePointService.js";

/**
 * useAbsence4MState
 * 4M 결근 관리 및 대체인원 투입 상태 관리 훅
 */
export function useAbsence4MState({
  isOpen,
  initialCompany = "오륙",
  selectedDay = 6,
  currentYear = 2026,
  currentMonth = 10,
  attendanceMatrix = []
}) {
  const [selectedCompanyTab, setSelectedCompanyTab] = useState(initialCompany || "오륙");
  const [modalDay, setModalDay] = useState(selectedDay || 7);
  const [logsMap, setLogsMap] = useState(() => getLocal4MAbsenceLogsMap());
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedId, setCopiedId] = useState(null);
  const [personnelCardsMap, setPersonnelCardsMap] = useState(() => getLocalPersonnelCardsMap());
  const [fourMPoints, setFourMPoints] = useState(() => getLocalFourMChangePoints());

  // selectedDay prop 변경 시 modalDay 동기화
  useEffect(() => {
    if (selectedDay) {
      setModalDay(selectedDay);
    }
  }, [selectedDay, isOpen]);

  // 날짜 문자열 계산 (예: "2026-10-06")
  const dateStr = useMemo(() => {
    const y = currentYear || 2026;
    const m = String(currentMonth || 10).padStart(2, "0");
    const d = String(modalDay || 1).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }, [currentYear, currentMonth, modalDay]);

  // 인사카드 실시간 구독 및 동기화
  useEffect(() => {
    setPersonnelCardsMap(getLocalPersonnelCardsMap());
    const unsub = subscribePersonnelCards((cards) => {
      setPersonnelCardsMap(cards || {});
    });
    const handleUpdate = (e) => {
      if (e.detail && e.detail.cardData) {
        const { cardKey, cardData } = e.detail;
        setPersonnelCardsMap((prev) => ({
          ...prev,
          [cardKey]: cardData,
          [`${cleanCompanyName(cardData.company)}_${cardData.name}`]: cardData,
          [`${cardData.company}_${cardData.name}`]: cardData
        }));
      }
    };
    window.addEventListener("oryuk_personnel_card_updated", handleUpdate);
    return () => {
      unsub();
      window.removeEventListener("oryuk_personnel_card_updated", handleUpdate);
    };
  }, [isOpen]);

  // 4M 로그 실시간 구독
  useEffect(() => {
    if (!isOpen) return;
    const unsub = subscribe4MAbsenceLogs((map) => {
      setLogsMap(map || {});
    });
    return () => unsub();
  }, [isOpen]);

  // 4M 공식 대장 실시간 구독 (조치결과 동기화)
  useEffect(() => {
    if (!isOpen) return;
    setFourMPoints(getLocalFourMChangePoints());
    const unsub = subscribeFourMChangePoints((list) => {
      setFourMPoints(list || []);
    });
    return () => unsub();
  }, [isOpen]);

  // initialCompany 변경 시 탭 업데이트
  useEffect(() => {
    if (initialCompany) {
      setSelectedCompanyTab(cleanCompanyName(initialCompany));
    }
  }, [initialCompany, isOpen]);

  // 전체 근로자 리스트 (attendanceMatrix 기반 + 인사카드 최신 데이터 동기화)
  const allWorkers = useMemo(() => {
    return (attendanceMatrix || []).map((w, idx) => {
      const comp = cleanCompanyName(w.company);
      const cardKey = `${comp}_${w.name}`;
      const card =
        personnelCardsMap[cardKey] ||
        personnelCardsMap[`${w.company}_${w.name}`] ||
        w.personnelCard ||
        getWorkerPersonnelCard(w, idx + 1);
      const resolvedComp = card?.company ? cleanCompanyName(card.company) : comp;
      const resolvedDept = card?.dept || w.dept || "생산팀";
      const resolvedPos = card?.position || w.position || "사원";
      const dailyVal =
        (w.daily && (w.daily[modalDay] !== undefined ? w.daily[modalDay] : w.daily[String(modalDay)])) ||
        w[modalDay] ||
        w[String(modalDay)] ||
        "";
      return {
        ...w,
        company: resolvedComp,
        dept: resolvedDept,
        position: resolvedPos,
        cardKey,
        personnelCard: card,
        dailyCode: dailyVal
      };
    });
  }, [attendanceMatrix, modalDay, personnelCardsMap]);

  // 당일 결근/휴무로 체크된 근로자 자동 탐지
  const detectedAbsentWorkers = useMemo(() => {
    return allWorkers.filter((w) => {
      const code = String(w.dailyCode || "").trim();
      return (
        code === "결근" ||
        code === "무단결근" ||
        code === "휴가" ||
        code === "연차" ||
        code === "반차" ||
        code.includes("결근")
      );
    });
  }, [allWorkers]);

  // 화면에 표시할 4M 변경점 항목 목록 (자동 탐지된 결근자 + 저장된 로그 병합)
  const displayEntries = useMemo(() => {
    const allLogsList = Object.values(logsMap);
    const targetLogs = allLogsList.filter((log) => log.date === dateStr);
    const filteredLogs = targetLogs.filter((log) => {
      if (
        selectedCompanyTab !== "전체" &&
        cleanCompanyName(log.company) !== cleanCompanyName(selectedCompanyTab)
      ) {
        return false;
      }
      return true;
    });

    // 기존 저장된 4M 로그에 최신 인사카드 부서/직급/숙련도 동기화
    const syncedLogs = filteredLogs.map((log) => {
      const comp = cleanCompanyName(log.company);
      const absentKey = `${comp}_${log.absentWorker?.name}`;
      const absentCard =
        personnelCardsMap[absentKey] ||
        personnelCardsMap[`${log.company}_${log.absentWorker?.name}`] ||
        log.absentWorker ||
        {};

      let subWorkerObj = log.substituteWorker;
      if (subWorkerObj && subWorkerObj.name && subWorkerObj.name !== "라인비가동" && !subWorkerObj.isLineStopped) {
        const subKey = `${comp}_${subWorkerObj.name}`;
        const subCard =
          personnelCardsMap[subKey] || personnelCardsMap[`${log.company}_${subWorkerObj.name}`] || subWorkerObj;
        subWorkerObj = {
          ...subWorkerObj,
          dept: subCard.dept || subWorkerObj.dept || "생산팀",
          position: subCard.position || subWorkerObj.position || "사원",
          skillLevel: subCard.skillLevel || subWorkerObj.skillLevel || 3,
          skillGrade: subCard.skillGrade || subWorkerObj.skillGrade || "Lv.3 보통",
          mainProcess: subCard.mainProcess || subWorkerObj.mainProcess || log.process || "압출",
          subProcesses: subCard.subProcesses || subWorkerObj.subProcesses || [],
          isMultiSkill: subCard.isMultiSkill !== undefined ? subCard.isMultiSkill : subWorkerObj.isMultiSkill
        };
      }

      // 4M 대장 및 로컬 동기화된 최신 조치결과(actionResult) 확인
      const matched4M = (fourMPoints || []).find(
        (fp) =>
          fp.id === `man_log_${log.id}` ||
          fp.id === log.id ||
          fp.rawId === log.id ||
          fp.originalId === log.id ||
          (fp.date === log.date &&
            cleanCompanyName(fp.company || fp.plant) === cleanCompanyName(log.company) &&
            fp.title?.includes(log.absentWorker?.name))
      );

      const defaultAction = generate4MActionResult({
        ...log,
        substituteWorker: subWorkerObj
      });
      const resolvedAction = (log.actionResult || matched4M?.actionResult || defaultAction || "").trim();

      return {
        ...log,
        actionResult: resolvedAction,
        absentWorker: {
          ...log.absentWorker,
          dept: absentCard.dept || log.absentWorker?.dept || "생산팀",
          position: absentCard.position || log.absentWorker?.position || "사원",
          skillLevel: absentCard.skillLevel || log.absentWorker?.skillLevel || 3,
          skillGrade: absentCard.skillGrade || log.absentWorker?.skillGrade || "Lv.3 보통",
          mainProcess: absentCard.mainProcess || log.absentWorker?.mainProcess || log.process || "압출"
        },
        substituteWorker: subWorkerObj
      };
    });

    // 자동 탐지된 결근자 중 아직 저장되지 않은 항목 생성
    const detectedList = detectedAbsentWorkers
      .filter((w) => {
        if (
          selectedCompanyTab !== "전체" &&
          cleanCompanyName(w.company) !== cleanCompanyName(selectedCompanyTab)
        ) {
          return false;
        }
        const alreadySaved = filteredLogs.some(
          (l) => cleanCompanyName(l.company) === cleanCompanyName(w.company) && l.absentWorker?.name === w.name
        );
        return !alreadySaved;
      })
      .map((w) => {
        const comp = cleanCompanyName(w.company);
        const cardKey = `${comp}_${w.name}`;
        const card =
          personnelCardsMap[cardKey] ||
          personnelCardsMap[`${w.company}_${w.name}`] ||
          w.personnelCard ||
          getWorkerPersonnelCard(w);
        const managerInfo = COMPANY_APPROVAL_MANAGERS[w.company] || COMPANY_APPROVAL_MANAGERS["오륙"];
        const defaultSup = `${managerInfo.drafter || "관리감독자"} ${managerInfo.drafterRole || "선임"}`;

        let reason = "휴가";
        if (w.dailyCode === "휴가") reason = "휴가";
        else if (w.dailyCode === "연차") reason = "연차";
        else if (w.dailyCode === "반차") reason = "반차";
        else if (w.dailyCode === "무단결근") reason = "무단결근";
        else if (w.dailyCode === "결근") reason = "병결";

        const tempId = `auto_${dateStr}_${w.company}_${w.name}`;
        const matched4M = (fourMPoints || []).find(
          (fp) =>
            fp.date === dateStr &&
            cleanCompanyName(fp.company || fp.plant) === cleanCompanyName(w.company) &&
            fp.title?.includes(w.name)
        );

        return {
          id: tempId,
          isDraft: true,
          date: dateStr,
          company: w.company,
          process: card?.mainProcess || "압출",
          actionResult: matched4M?.actionResult || "",
          absentWorker: {
            name: w.name,
            position: card?.position || w.position || "사원",
            dept: card?.dept || w.dept || "생산팀",
            mainProcess: card?.mainProcess || "압출",
            skillLevel: card?.skillLevel || 3,
            skillGrade: card?.skillGrade || "Lv.3 보통",
            reason: reason,
            customReason: ""
          },
          substituteWorker: null,
          riskLevel: "UNKNOWN",
          riskWarningText: "대체 투입 작업자를 지정하거나 라인비가동을 선택해주세요.",
          checkpoints: {
            firstPieceCheck: true,
            firstPieceChecker: defaultSup,
            workInstructionTold: true,
            supervisorApproval: true,
            supervisorName: defaultSup,
            qualityStatus: "NORMAL"
          },
          oneLineLog: `📌 [4M Man 결근] ${currentMonth}/${modalDay} (${w.company}) ${card?.mainProcess || "압출"}공정 | 결근: ${w.name}(${card?.position || "사원"}, Lv.${card?.skillLevel || 3}, ${reason}) ➔ 대체 투입자 지정 필요`,
          remarks: ""
        };
      });

    let combined = [...syncedLogs, ...detectedList];

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      combined = combined.filter((item) => {
        const aName = item.absentWorker?.name || "";
        const sName = item.substituteWorker?.name || "";
        const comp = item.company || "";
        const proc = item.process || "";
        return (
          aName.toLowerCase().includes(q) ||
          sName.toLowerCase().includes(q) ||
          comp.toLowerCase().includes(q) ||
          proc.toLowerCase().includes(q)
        );
      });
    }

    return combined;
  }, [logsMap, detectedAbsentWorkers, selectedCompanyTab, dateStr, currentMonth, modalDay, searchTerm, personnelCardsMap, fourMPoints]);

  // 통계 요약 KPIs (선택된 협력사 독립 기준)
  const metrics = useMemo(() => {
    const cleanTab = cleanCompanyName(selectedCompanyTab || "오륙");
    const compAbsent = detectedAbsentWorkers.filter(
      (w) => cleanCompanyName(w.company) === cleanTab
    ).length;
    const compLogs = Object.values(logsMap).filter(
      (l) => l.date === dateStr && cleanCompanyName(l.company) === cleanTab
    );
    const completedSubs = compLogs.filter((l) => l.substituteWorker?.name || l.actionResult).length;
    const firstPieceDone = compLogs.filter((l) => l.checkpoints?.firstPieceCheck).length;
    const highRisks = compLogs.filter((l) => l.riskLevel === "HIGH").length;

    return {
      totalAbsent: compAbsent,
      completedSubs,
      firstPieceDone,
      highRisks
    };
  }, [detectedAbsentWorkers, logsMap, dateStr, selectedCompanyTab]);

  // 개별 4M 변경점 저장 및 변동점 MAN 동기화 핸들러
  const handleSaveEntry = async (entry) => {
    try {
      const saved = await save4MAbsenceLog(entry);
      setLogsMap((prev) => ({ ...prev, [saved.id]: saved }));
      setCopiedId(`saved_${entry.id}`);
      setTimeout(() => setCopiedId(null), 2000);
      alert("🔄 결근 관리 및 변동점 MAN 조치결과가 성공적으로 동기화되었습니다.");
    } catch (err) {
      alert("4M 결근 변경점 저장 중 오류가 발생했습니다: " + err.message);
    }
  };

  // 개별 4M 변경점 삭제 핸들러
  const handleDeleteEntry = async (id) => {
    if (!window.confirm("해당 4M 작업자 변경점 기록을 삭제하시겠습니까?")) return;
    try {
      await delete4MAbsenceLog(id);
      setLogsMap((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      alert("🗑️ 기록이 삭제되고 변동점 MAN 대장에서 정리되었습니다.");
    } catch (err) {
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  return {
    selectedCompanyTab,
    setSelectedCompanyTab,
    modalDay,
    setModalDay,
    searchTerm,
    setSearchTerm,
    copiedId,
    personnelCardsMap,
    allWorkers,
    detectedAbsentWorkers,
    displayEntries,
    metrics,
    handleSaveEntry,
    handleDeleteEntry
  };
}
