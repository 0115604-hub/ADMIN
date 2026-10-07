import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Copy,
  Check,
  UserX,
  UserCheck,
  ArrowRight,
  Sparkles,
  Calendar,
  Building2,
  Layers,
  Save,
  Trash2,
  Plus,
  RefreshCw,
  Search,
  Award,
  Clock,
  HelpCircle,
  FileSpreadsheet,
  Zap,
  Info
} from "lucide-react";
import {
  COMPANIES,
  cleanCompanyName,
  COMPANY_THEMES,
  COMPANY_APPROVAL_MANAGERS
} from "../services/overtimeSmartService.js";
import {
  STANDARD_PROCESS_LIST,
  getSkillMeta,
  getWorkerPersonnelCard,
  getLocalPersonnelCardsMap,
  subscribePersonnelCards
} from "../services/personnelCardService.js";
import {
  ABSENCE_REASONS,
  QUALITY_STATUS_OPTIONS,
  calculate4MRisk,
  generate4MOneLineLog,
  getLocal4MAbsenceLogsMap,
  save4MAbsenceLog,
  delete4MAbsenceLog,
  subscribe4MAbsenceLogs
} from "../services/absence4MService.js";

export default function Absence4MModal({
  isOpen,
  onClose,
  initialCompany = "오륙",
  selectedDay = 6,
  currentYear = 2026,
  currentMonth = 10,
  attendanceMatrix = [],
  onSaveSyncWithReports
}) {
  const [selectedCompanyTab, setSelectedCompanyTab] = useState(initialCompany || "오륙");
  const [logsMap, setLogsMap] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedId, setCopiedId] = useState(null);
  const [allCopied, setAllCopied] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [personnelCardsMap, setPersonnelCardsMap] = useState({});

  // 신규 수기 4M 항목 폼 상태
  const [newEntry, setNewEntry] = useState({
    company: initialCompany || "오륙",
    process: "압출",
    absentWorkerName: "",
    absentReason: "휴가",
    customReason: "",
    substituteWorkerName: "",
    firstPieceCheck: true,
    firstPieceChecker: "",
    workInstructionTold: true,
    supervisorApproval: true,
    supervisorName: "",
    qualityStatus: "NORMAL",
    remarks: ""
  });

  // 날짜 문자열 계산 (예: "2026-10-06")
  const dateStr = useMemo(() => {
    const y = currentYear || 2026;
    const m = String(currentMonth || 10).padStart(2, "0");
    const d = String(selectedDay || 1).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }, [currentYear, currentMonth, selectedDay]);

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

  // initialCompany 변경 시 탭 업데이트
  useEffect(() => {
    if (initialCompany) {
      setSelectedCompanyTab(cleanCompanyName(initialCompany));
    }
  }, [initialCompany, isOpen]);

  // 기본 감독자명 설정
  useEffect(() => {
    const managerInfo = COMPANY_APPROVAL_MANAGERS[selectedCompanyTab] || COMPANY_APPROVAL_MANAGERS["오륙"];
    const defaultSup = `${managerInfo.drafter || "관리감독자"} ${managerInfo.drafterRole || "선임"}`;
    setNewEntry((prev) => ({
      ...prev,
      company: selectedCompanyTab,
      supervisorName: prev.supervisorName || defaultSup,
      firstPieceChecker: prev.firstPieceChecker || defaultSup
    }));
  }, [selectedCompanyTab]);

  // 전체 근로자 리스트 (attendanceMatrix 기반 + 인사카드 최신 데이터 동기화)
  const allWorkers = useMemo(() => {
    return (attendanceMatrix || []).map((w, idx) => {
      const comp = cleanCompanyName(w.company);
      const cardKey = `${comp}_${w.name}`;
      const card = personnelCardsMap[cardKey] || personnelCardsMap[`${w.company}_${w.name}`] || w.personnelCard || getWorkerPersonnelCard(w, idx + 1);
      const resolvedComp = card?.company ? cleanCompanyName(card.company) : comp;
      const resolvedDept = card?.dept || w.dept || "생산팀";
      const resolvedPos = card?.position || w.position || "사원";
      return {
        ...w,
        company: resolvedComp,
        dept: resolvedDept,
        position: resolvedPos,
        cardKey,
        personnelCard: card,
        dailyCode: w.daily ? w.daily[selectedDay] : ""
      };
    });
  }, [attendanceMatrix, selectedDay, personnelCardsMap]);

  // 당일 결근/휴무로 체크된 근로자 자동 탐지
  const detectedAbsentWorkers = useMemo(() => {
    return allWorkers.filter((w) => {
      const code = String(w.dailyCode || "").trim();
      return code === "결근" || code === "무단결근" || code === "휴가" || code === "연차" || code === "반차";
    });
  }, [allWorkers]);

  // 현재 날짜의 저장된 4M 로그 목록
  const activeDateLogs = useMemo(() => {
    return Object.values(logsMap).filter((log) => log.date === dateStr);
  }, [logsMap, dateStr]);

  // 화면에 표시할 4M 변경점 항목 목록 (자동 탐지된 결근자 + 수기 추가된 로그 병합)
  const displayEntries = useMemo(() => {
    const filteredLogs = activeDateLogs.filter((log) => {
      if (selectedCompanyTab !== "전체" && cleanCompanyName(log.company) !== cleanCompanyName(selectedCompanyTab)) {
        return false;
      }
      return true;
    });

    // 기존 저장된 4M 로그에 최신 인사카드 부서/직급/숙련도 동기화
    const syncedLogs = filteredLogs.map((log) => {
      const comp = cleanCompanyName(log.company);
      const absentKey = `${comp}_${log.absentWorker?.name}`;
      const absentCard = personnelCardsMap[absentKey] || personnelCardsMap[`${log.company}_${log.absentWorker?.name}`] || log.absentWorker || {};

      let subWorkerObj = log.substituteWorker;
      if (subWorkerObj && subWorkerObj.name && subWorkerObj.name !== "라인비가동" && !subWorkerObj.isLineStopped) {
        const subKey = `${comp}_${subWorkerObj.name}`;
        const subCard = personnelCardsMap[subKey] || personnelCardsMap[`${log.company}_${subWorkerObj.name}`] || subWorkerObj;
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

      return {
        ...log,
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
        if (selectedCompanyTab !== "전체" && cleanCompanyName(w.company) !== cleanCompanyName(selectedCompanyTab)) {
          return false;
        }
        // 이미 저장된 로그가 있는지 확인
        const alreadySaved = filteredLogs.some(
          (l) => cleanCompanyName(l.company) === cleanCompanyName(w.company) && l.absentWorker?.name === w.name
        );
        return !alreadySaved;
      })
      .map((w) => {
        const comp = cleanCompanyName(w.company);
        const cardKey = `${comp}_${w.name}`;
        const card = personnelCardsMap[cardKey] || personnelCardsMap[`${w.company}_${w.name}`] || w.personnelCard || getWorkerPersonnelCard(w);
        const managerInfo = COMPANY_APPROVAL_MANAGERS[w.company] || COMPANY_APPROVAL_MANAGERS["오륙"];
        const defaultSup = `${managerInfo.drafter || "관리감독자"} ${managerInfo.drafterRole || "선임"}`;

        let reason = "휴가";
        if (w.dailyCode === "휴가") reason = "휴가";
        else if (w.dailyCode === "연차") reason = "연차";
        else if (w.dailyCode === "반차") reason = "반차";
        else if (w.dailyCode === "무단결근") reason = "무단결근";
        else if (w.dailyCode === "결근") reason = "병결";

        const tempId = `auto_${dateStr}_${w.company}_${w.name}`;

        return {
          id: tempId,
          isDraft: true,
          date: dateStr,
          company: w.company,
          process: card?.mainProcess || "압출",
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
          oneLineLog: `📌 [4M Man 결근] ${currentMonth}/${selectedDay} (${w.company}) ${card?.mainProcess || "압출"}공정 | 결근: ${w.name}(${card?.position || "사원"}, Lv.${card?.skillLevel || 3}, ${reason}) ➔ 대체 투입자 지정 필요`,
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
        return aName.toLowerCase().includes(q) || sName.toLowerCase().includes(q) || comp.toLowerCase().includes(q) || proc.toLowerCase().includes(q);
      });
    }

    return combined;
  }, [activeDateLogs, detectedAbsentWorkers, selectedCompanyTab, dateStr, currentMonth, selectedDay, searchTerm, personnelCardsMap]);

  // 통계 요약 KPIs
  const metrics = useMemo(() => {
    const totalAbsent = detectedAbsentWorkers.length;
    const completedSubs = activeDateLogs.filter((l) => l.substituteWorker?.name).length;
    const firstPieceDone = activeDateLogs.filter((l) => l.checkpoints?.firstPieceCheck).length;
    const highRisks = activeDateLogs.filter((l) => l.riskLevel === "HIGH").length;

    return {
      totalAbsent,
      completedSubs,
      firstPieceDone,
      highRisks
    };
  }, [detectedAbsentWorkers, activeDateLogs]);

  // 개별 4M 변경점 저장 핸들러
  const handleSaveEntry = async (entry) => {
    try {
      const saved = await save4MAbsenceLog(entry);
      setLogsMap((prev) => ({ ...prev, [saved.id]: saved }));
      setCopiedId(`saved_${entry.id}`);
      setTimeout(() => setCopiedId(null), 2000);
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
    } catch (err) {
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  // 1줄 기록 클립보드 복사
  const handleCopyOneLine = (text, id) => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  // 당일 4M 전체 1줄 기록 통합 복사
  const handleCopyAllOneLines = () => {
    const lines = displayEntries.map((e) => generate4MOneLineLog(e)).filter(Boolean);
    if (lines.length === 0) {
      alert("복사할 4M 변경점 기록이 없습니다.");
      return;
    }
    const combinedText = `[4M Man 작업자 변경점 일일 대장 - ${dateStr}]\n` + lines.join("\n");
    navigator.clipboard.writeText(combinedText).then(() => {
      setAllCopied(true);
      setTimeout(() => setAllCopied(false), 2500);
    });
  };

  // 일일 근태보고서 특기사항에 4M 1줄 기록 동기화
  const handleSyncToReports = () => {
    const lines = displayEntries.map((e) => generate4MOneLineLog(e)).filter(Boolean);
    if (lines.length === 0) {
      alert("동기화할 4M 변경점 기록이 없습니다.");
      return;
    }
    if (onSaveSyncWithReports) {
      onSaveSyncWithReports(lines);
      alert(`✅ 당일 4M 변경점 기록 (${lines.length}건)이 근태/특근보고서 특기사항에 동기화되었습니다!`);
    } else {
      handleCopyAllOneLines();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-2 sm:p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-slate-900 border-2 border-slate-700 w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-white">
        {/* ========================================================================= */}
        {/* 🏆 모달 헤더: 4M Man 변경점 관리 시스템 */}
        {/* ========================================================================= */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shadow-inner">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 font-black">
                  4M Man 변경점
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-bold">
                  품질 & 감사 추적성 보장
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2 mt-0.5">
                <span>결근 관리 및 대체인원 투입 (4M 변경점 대장)</span>
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs font-mono font-bold text-slate-300">
              <Calendar className="w-3.5 h-3.5 text-cyan-400" />
              <span>{currentYear}년 {currentMonth}월 {selectedDay}일</span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
              title="닫기 (ESC)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 💡 4M 품질 관리 철학 배너 (사용자 강조 메시지 완벽 구현) */}
        {/* ========================================================================= */}
        <div className="bg-slate-950/80 px-4 py-3 border-b border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-start gap-2 text-slate-300">
            <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-amber-400 font-bold">자동차 및 정밀 제조현장 품질 원칙:</span>{" "}
              작업자가 결근하여 대체 인원이 투입될 때 발생하는 <strong className="text-white">4M Man 변경점</strong>을 1줄로 표준 기록하여,
              품질 이상 발생 시 원인을 즉각 역추적하고 고객사 정기 품질감사 시 완벽한 증빙 자료로 활용합니다.
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
            <button
              type="button"
              onClick={handleCopyAllOneLines}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                allCopied
                  ? "bg-emerald-600 text-white border-emerald-500 shadow-md"
                  : "bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700"
              }`}
              title="당일 4M 전체 1줄 기록을 클립보드에 복사"
            >
              {allCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5 text-cyan-400" />}
              <span>{allCopied ? "전체 복사됨!" : "당일 1줄 전체 복사"}</span>
            </button>

            {onSaveSyncWithReports && (
              <button
                type="button"
                onClick={handleSyncToReports}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold border border-indigo-500 transition-all cursor-pointer shadow-sm"
                title="근태보고서 특기사항에 동기화"
              >
                <Zap className="w-3.5 h-3.5 text-yellow-300" />
                <span>보고서 특기사항 동기화</span>
              </button>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 🏢 회사별 탭 네비게이션 & 통계 요약 바 */}
        {/* ========================================================================= */}
        <div className="bg-slate-900/90 p-3 sm:p-4 border-b border-slate-800 space-y-3">
          {/* 회사 선택 필터 탭 */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <button
                type="button"
                onClick={() => setSelectedCompanyTab("전체")}
                className={`px-3 py-1.5 rounded-xl font-black text-xs transition-all cursor-pointer ${
                  selectedCompanyTab === "전체"
                    ? "bg-white text-slate-950 shadow-md"
                    : "bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-slate-700/80"
                }`}
              >
                <span>5개사 전체 ({detectedAbsentWorkers.length}명 결근)</span>
              </button>

              {COMPANIES.map((comp) => {
                const compAbsentCount = detectedAbsentWorkers.filter((w) => cleanCompanyName(w.company) === comp).length;
                const isSelected = selectedCompanyTab === comp;
                return (
                  <button
                    key={comp}
                    type="button"
                    onClick={() => setSelectedCompanyTab(comp)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-black text-xs transition-all cursor-pointer ${
                      isSelected
                        ? "bg-rose-600 text-white shadow-rose-900/40 shadow-md ring-2 ring-rose-400/50"
                        : "bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700/80 border border-slate-700/80"
                    }`}
                  >
                    <span>{comp}</span>
                    {compAbsentCount > 0 && (
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                        isSelected ? "bg-white text-rose-700" : "bg-rose-950 text-rose-300 border border-rose-700 animate-pulse"
                      }`}>
                        {compAbsentCount}명 결근
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* 수기 추가 토글 버튼 */}
            <button
              type="button"
              onClick={() => setShowAddForm(!showAddForm)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                showAddForm
                  ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                  : "bg-slate-800 hover:bg-slate-700 text-cyan-300 border-cyan-500/40 hover:border-cyan-400"
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{showAddForm ? "추가 폼 닫기" : "수기 4M 변경점 추가"}</span>
            </button>
          </div>

          {/* KPI 미니 대시보드 */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400 font-bold flex items-center gap-1">
                <UserX className="w-3.5 h-3.5 text-rose-400" />
                <span>당일 결근 인원</span>
              </span>
              <span className="font-mono font-black text-rose-400 text-sm">{metrics.totalAbsent}명</span>
            </div>

            <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400 font-bold flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>대체 투입 완료</span>
              </span>
              <span className="font-mono font-black text-emerald-400 text-sm">
                {metrics.completedSubs}건
              </span>
            </div>

            <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400 font-bold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                <span>초물 한도검사</span>
              </span>
              <span className="font-mono font-black text-cyan-400 text-sm">
                {metrics.firstPieceDone}건 완료
              </span>
            </div>

            <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400 font-bold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span>4M 고위험 주의</span>
              </span>
              <span className={`font-mono font-black text-sm ${metrics.highRisks > 0 ? "text-rose-400 animate-pulse" : "text-slate-400"}`}>
                {metrics.highRisks}건
              </span>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* ➕ [수기 추가 폼] (예상치 못한 현장 대체 투입 시) */}
        {/* ========================================================================= */}
        {showAddForm && (
          <div className="bg-slate-950 p-4 border-b border-slate-800 space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-cyan-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>신규 4M Man 변경점 직접 등록</span>
              </h4>
              <span className="text-[11px] text-slate-400">결근자 및 대체 투입자를 지정하여 4M 품질 대장에 추가합니다.</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">대상 협력사</label>
                <select
                  value={newEntry.company}
                  onChange={(e) => setNewEntry({ ...newEntry, company: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white font-bold"
                >
                  {COMPANIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">해당 공정</label>
                <select
                  value={newEntry.process}
                  onChange={(e) => setNewEntry({ ...newEntry, process: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white font-bold"
                >
                  {STANDARD_PROCESS_LIST.map((p) => (
                    <option key={p} value={p}>{p} 공정</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">결근 사유</label>
                <select
                  value={newEntry.absentReason}
                  onChange={(e) => setNewEntry({ ...newEntry, absentReason: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white font-bold"
                >
                  {ABSENCE_REASONS.map((r) => (
                    <option key={r.code} value={r.code}>{r.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">결근 작업자 이름</label>
                <input
                  type="text"
                  placeholder="예: 홍길동"
                  value={newEntry.absentWorkerName}
                  onChange={(e) => setNewEntry({ ...newEntry, absentWorkerName: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white font-bold"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-slate-400">대체 투입 작업자</label>
                  <button
                    type="button"
                    onClick={() => setNewEntry({ ...newEntry, substituteWorkerName: "라인비가동" })}
                    className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 hover:bg-amber-950 text-amber-300 border border-slate-700 hover:border-amber-600 font-bold cursor-pointer"
                  >
                    ⏸️ 라인비가동
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="예: 김선임 또는 라인비가동"
                  value={newEntry.substituteWorkerName}
                  onChange={(e) => setNewEntry({ ...newEntry, substituteWorkerName: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">관리감독자(선임/책임)</label>
                <input
                  type="text"
                  placeholder="예: 양인나 선임"
                  value={newEntry.supervisorName}
                  onChange={(e) => setNewEntry({ ...newEntry, supervisorName: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white font-bold"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
              >
                취소
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!newEntry.absentWorkerName.trim()) {
                    alert("결근자 이름을 입력해주세요.");
                    return;
                  }
                  const comp = cleanCompanyName(newEntry.company);
                  const absentCard = personnelCardsMap[`${comp}_${newEntry.absentWorkerName.trim()}`] || {};
                  const isLineStop = newEntry.substituteWorkerName.trim() === "라인비가동";
                  const subCard = newEntry.substituteWorkerName ? (personnelCardsMap[`${comp}_${newEntry.substituteWorkerName.trim()}`] || {}) : null;

                  const substituteObj = isLineStop ? {
                    name: "라인비가동",
                    isLineStopped: true,
                    position: "비가동",
                    dept: absentCard.dept || "생산팀",
                    mainProcess: newEntry.process,
                    subProcesses: [],
                    isMultiSkill: false,
                    skillLevel: 0,
                    skillGrade: "라인비가동"
                  } : (newEntry.substituteWorkerName.trim() ? {
                    name: newEntry.substituteWorkerName.trim(),
                    position: subCard?.position || "사원",
                    dept: subCard?.dept || "생산팀",
                    mainProcess: subCard?.mainProcess || newEntry.process,
                    subProcesses: subCard?.subProcesses || [],
                    isMultiSkill: subCard?.isMultiSkill || false,
                    skillLevel: subCard?.skillLevel || 3,
                    skillGrade: subCard?.skillGrade || "Lv.3 보통"
                  } : null);

                  const entryData = {
                    date: dateStr,
                    company: comp,
                    process: newEntry.process,
                    absentWorker: {
                      name: newEntry.absentWorkerName.trim(),
                      position: absentCard.position || "사원",
                      dept: absentCard.dept || "생산팀",
                      mainProcess: newEntry.process,
                      skillLevel: absentCard.skillLevel || 3,
                      skillGrade: absentCard.skillGrade || "Lv.3 보통",
                      reason: newEntry.absentReason,
                      customReason: newEntry.customReason
                    },
                    substituteWorker: substituteObj,
                    checkpoints: {
                      firstPieceCheck: isLineStop ? false : newEntry.firstPieceCheck,
                      firstPieceChecker: newEntry.firstPieceChecker || newEntry.supervisorName,
                      workInstructionTold: isLineStop ? false : newEntry.workInstructionTold,
                      supervisorApproval: newEntry.supervisorApproval,
                      supervisorName: newEntry.supervisorName,
                      qualityStatus: isLineStop ? "NORMAL" : newEntry.qualityStatus
                    },
                    remarks: newEntry.remarks
                  };

                  await handleSaveEntry(entryData);
                  setShowAddForm(false);
                  setNewEntry({
                    ...newEntry,
                    absentWorkerName: "",
                    substituteWorkerName: "",
                    customReason: ""
                  });
                }}
                className="flex items-center gap-1 px-4 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-black text-xs shadow-md cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>대장에 4M 변경점 저장</span>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 📋 4M 변경점 메인 리스트 */}
        {/* ========================================================================= */}
        <div className="p-4 space-y-4 overflow-y-auto flex-1">
          {displayEntries.length === 0 ? (
            <div className="py-12 px-4 text-center rounded-2xl bg-slate-950/50 border border-slate-800 space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-black text-white">당일 결근자 및 4M Man 변경점이 없습니다.</h4>
                <p className="text-xs text-slate-400 mt-1">
                  선택된 {selectedCompanyTab === "전체" ? "5개사 전 사업장" : selectedCompanyTab}에서 {currentMonth}월 {selectedDay}일 전원 정상 출근 상태입니다.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddForm(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-bold cursor-pointer transition-all"
              >
                <Plus className="w-3.5 h-3.5 text-cyan-400" />
                <span>수기로 4M 대체 투입 등록하기</span>
              </button>
            </div>
          ) : (
            displayEntries.map((item, index) => {
              return (
                <Absence4MCardItem
                  key={item.id || `entry_${index}`}
                  item={item}
                  allWorkers={allWorkers}
                  personnelCardsMap={personnelCardsMap}
                  onSave={handleSaveEntry}
                  onDelete={handleDeleteEntry}
                  onCopyOneLine={handleCopyOneLine}
                  isCopied={copiedId === item.id || copiedId === `saved_${item.id}`}
                  currentMonth={currentMonth}
                  selectedDay={selectedDay}
                />
              );
            })
          )}
        </div>

        {/* ========================================================================= */}
        {/* 📌 모달 하단 액션 바 */}
        {/* ========================================================================= */}
        <div className="bg-slate-950 p-3 sm:p-4 border-t border-slate-800 flex items-center justify-between gap-2 shrink-0">
          <span className="text-[11px] text-slate-400 font-mono">
            총 <strong className="text-cyan-400 font-bold">{displayEntries.length}건</strong>의 4M 작업자 변경점이 관리 중입니다.
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs transition-all cursor-pointer"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// 📇 개별 4M 변경점 카드 아이템 컴포넌트
// =============================================================================
function Absence4MCardItem({
  item,
  allWorkers,
  personnelCardsMap,
  onSave,
  onDelete,
  onCopyOneLine,
  isCopied,
  currentMonth,
  selectedDay
}) {
  const [formState, setFormState] = useState(() => ({
    ...item,
    checkpoints: item.checkpoints || {
      firstPieceCheck: true,
      firstPieceChecker: "관리감독자",
      workInstructionTold: true,
      supervisorApproval: true,
      supervisorName: "관리감독자",
      qualityStatus: "NORMAL"
    }
  }));

  const company = cleanCompanyName(formState.company);
  const theme = COMPANY_THEMES[company] || COMPANY_THEMES["오륙"];

  // 최신 인사카드 데이터 동기화
  const absentKey = `${company}_${formState.absentWorker?.name}`;
  const latestAbsentCard = personnelCardsMap[absentKey] || personnelCardsMap[`${formState.company}_${formState.absentWorker?.name}`] || formState.absentWorker || {};
  const currentAbsentDept = latestAbsentCard.dept || formState.absentWorker?.dept || "생산팀";
  const currentAbsentPos = latestAbsentCard.position || formState.absentWorker?.position || "사원";
  const currentAbsentSkill = latestAbsentCard.skillLevel || formState.absentWorker?.skillLevel || 3;
  const currentAbsentProcess = latestAbsentCard.mainProcess || formState.absentWorker?.mainProcess || formState.process || "압출";

  const absentCard = {
    ...formState.absentWorker,
    dept: currentAbsentDept,
    position: currentAbsentPos,
    skillLevel: currentAbsentSkill,
    mainProcess: currentAbsentProcess
  };

  // 해당 회사의 모든 근로자 후보 (대체 인원 추천용)
  const candidateWorkers = useMemo(() => {
    return allWorkers.filter((w) => cleanCompanyName(w.company) === company && w.name !== formState.absentWorker?.name);
  }, [allWorkers, company, formState.absentWorker?.name]);

  // 다기능공 추천 목록 (해당 공정을 메인 또는 서브공정으로 보유한 작업자 우선)
  const sortedCandidates = useMemo(() => {
    const targetProcess = formState.process || formState.absentWorker?.mainProcess || "압출";
    return [...candidateWorkers].sort((a, b) => {
      const aCard = personnelCardsMap[a.cardKey] || a.personnelCard || {};
      const bCard = personnelCardsMap[b.cardKey] || b.personnelCard || {};

      const aMatch = (aCard.mainProcess === targetProcess || (aCard.subProcesses || []).includes(targetProcess)) ? 1 : 0;
      const bMatch = (bCard.mainProcess === targetProcess || (bCard.subProcesses || []).includes(targetProcess)) ? 1 : 0;

      if (aMatch !== bMatch) return bMatch - aMatch;
      return (bCard.skillLevel || 3) - (aCard.skillLevel || 3);
    });
  }, [candidateWorkers, formState.process, formState.absentWorker?.mainProcess, personnelCardsMap]);

  // 대체 작업자 선택 핸들러
  const handleSelectSubstitute = (workerName) => {
    if (!workerName) {
      const updated = {
        ...formState,
        substituteWorker: null,
        riskLevel: "UNKNOWN",
        riskWarningText: "대체 투입 작업자를 선택하거나 라인비가동을 지정해주세요."
      };
      setFormState(updated);
      return;
    }

    if (workerName === "라인비가동") {
      const subWorkerData = {
        name: "라인비가동",
        isLineStopped: true,
        position: "비가동",
        dept: currentAbsentDept,
        mainProcess: formState.process || "압출",
        subProcesses: [],
        isMultiSkill: false,
        skillLevel: 0,
        skillGrade: "라인비가동"
      };

      const risk = calculate4MRisk(
        absentCard,
        subWorkerData,
        formState.process || formState.absentWorker?.mainProcess || "압출"
      );

      const updated = {
        ...formState,
        substituteWorker: subWorkerData,
        riskLevel: risk.level,
        riskWarningText: risk.warningMsg,
        checkpoints: {
          ...formState.checkpoints,
          firstPieceCheck: false,
          workInstructionTold: false
        }
      };

      setFormState(updated);
      return;
    }

    const workerObj = candidateWorkers.find((w) => w.name === workerName);
    const subCardKey = `${company}_${workerName}`;
    const card = personnelCardsMap[subCardKey] || personnelCardsMap[workerObj?.cardKey] || workerObj?.personnelCard || {};

    const subWorkerData = {
      name: workerName,
      position: card.position || workerObj?.position || "사원",
      dept: card.dept || workerObj?.dept || "생산팀",
      mainProcess: card.mainProcess || "압출",
      subProcesses: card.subProcesses || [],
      isMultiSkill: card.isMultiSkill || false,
      skillLevel: card.skillLevel || 3,
      skillGrade: card.skillGrade || "Lv.3 보통"
    };

    const risk = calculate4MRisk(
      absentCard,
      subWorkerData,
      formState.process || formState.absentWorker?.mainProcess || "압출"
    );

    const updated = {
      ...formState,
      substituteWorker: subWorkerData,
      riskLevel: risk.level,
      riskWarningText: risk.warningMsg
    };

    setFormState(updated);
  };

  // 실시간 1줄 로그 계산
  const currentOneLine = useMemo(() => {
    return generate4MOneLineLog({
      ...formState,
      absentWorker: absentCard
    });
  }, [formState, absentCard]);

  const subCard = formState.substituteWorker || {};
  const risk = calculate4MRisk(absentCard, formState.substituteWorker, formState.process);

  return (
    <div className={`rounded-2xl border transition-all duration-200 shadow-md ${
      item.isDraft
        ? "bg-slate-950/90 border-amber-500/60 ring-1 ring-amber-500/30"
        : "bg-slate-950/80 border-slate-700/80 hover:border-slate-600"
    } p-3.5 sm:p-4 space-y-3`}>
      {/* 🏷️ 카드 상단 헤더: 회사 / 공정 / 4M 위험도 배지 */}
      <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2.5 py-0.5 rounded-lg font-black ${theme.badge}`}>
            {company}
          </span>

          <select
            value={formState.process || "압출"}
            onChange={(e) => setFormState({ ...formState, process: e.target.value })}
            className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-0.5 text-xs font-bold text-cyan-300 cursor-pointer"
          >
            {STANDARD_PROCESS_LIST.map((p) => (
              <option key={p} value={p}>{p} 공정</option>
            ))}
          </select>

          {item.isDraft && (
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold animate-pulse">
              ⚡ 미저장 결근 감지됨
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className={`text-[11px] px-2.5 py-0.5 rounded-lg border font-black flex items-center gap-1 ${risk.badgeClass}`}>
            <span>{risk.label}</span>
          </span>

          <select
            value={formState.checkpoints?.qualityStatus || "NORMAL"}
            onChange={(e) => setFormState({
              ...formState,
              checkpoints: { ...formState.checkpoints, qualityStatus: e.target.value }
            })}
            className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-0.5 text-xs font-bold text-white cursor-pointer"
          >
            {QUALITY_STATUS_OPTIONS.map((q) => (
              <option key={q.code} value={q.code}>{q.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 🔄 결근자(OUT) ➔ 대체투입자(IN) 매핑 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-11 gap-3 items-center">
        {/* 결근자 (OUT) */}
        <div className="md:col-span-5 bg-rose-950/30 border border-rose-900/60 rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-rose-400 flex items-center gap-1">
              <UserX className="w-3.5 h-3.5" />
              <span>❌ 결근자 (Out)</span>
            </span>
            <span className="text-[11px] px-2 py-0.2 rounded-md bg-rose-950 text-rose-300 border border-rose-800 font-bold">
              {absentCard.position || "사원"}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-black text-white">{absentCard.name}</span>
              <span className="text-xs text-slate-400 ml-1.5 font-mono">({absentCard.dept || "생산팀"})</span>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-md bg-slate-900 text-amber-300 border border-slate-800 font-bold">
              ⭐ Lv.{absentCard.skillLevel || 3} ({absentCard.mainProcess || "압출"})
            </span>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <span className="text-[11px] font-bold text-slate-400 shrink-0">결근사유:</span>
            <select
              value={absentCard.reason || "휴가"}
              onChange={(e) => setFormState({
                ...formState,
                absentWorker: { ...absentCard, reason: e.target.value }
              })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs font-bold text-rose-300 cursor-pointer"
            >
              {ABSENCE_REASONS.map((r) => (
                <option key={r.code} value={r.code}>{r.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* 중앙 화살표 흐름 표시 */}
        <div className="md:col-span-1 flex flex-col items-center justify-center py-1">
          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-cyan-400 shadow-sm">
            <ArrowRight className="w-4 h-4 hidden md:block" />
            <span className="text-[10px] font-bold md:hidden">투입</span>
          </div>
        </div>

        {/* 대체 투입자 (IN) */}
        <div className="md:col-span-5 bg-emerald-950/30 border border-emerald-900/60 rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-emerald-400 flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5" />
              <span>🔄 4M 대체투입 (In)</span>
            </span>
            {subCard.isMultiSkill && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-purple-950 text-purple-300 border border-purple-800 font-bold">
                ⭐ 다기능공
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <select
              value={subCard.name || ""}
              onChange={(e) => handleSelectSubstitute(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs font-black text-emerald-300 cursor-pointer"
            >
              <option value="">-- 4M 대체 투입 작업자 선택 --</option>
              <option value="라인비가동" className="text-amber-400 font-bold bg-slate-900">
                ⏸️ [라인비가동] 대체인원 미투입 (공정 정지/비가동)
              </option>
              {sortedCandidates.map((w) => {
                const card = personnelCardsMap[w.cardKey] || w.personnelCard || {};
                const isTargetProcess = card.mainProcess === (formState.process || "압출") || (card.subProcesses || []).includes(formState.process || "압출");
                const hint = isTargetProcess ? "⭐ [다기능 추천]" : "";
                return (
                  <option key={w.name} value={w.name}>
                    {hint} {w.name} ({card.position || "사원"}, Lv.{card.skillLevel || 3} {card.mainProcess})
                  </option>
                );
              })}
            </select>
          </div>

          {subCard.name === "라인비가동" || subCard.isLineStopped ? (
            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-amber-300 font-bold flex items-center gap-1">
                <span>⏸️ 라인 비가동 (대체 미투입 / 공정 일시정지)</span>
              </span>
              <span className="px-2 py-0.5 rounded-md bg-slate-900 text-slate-400 border border-slate-700 font-bold">
                품질영향 없음
              </span>
            </div>
          ) : subCard.name ? (
            <div className="flex items-center justify-between text-xs pt-0.5">
              <span className="text-slate-300 font-bold">
                {subCard.position} · {subCard.mainProcess}
                {subCard.subProcesses?.length > 0 && ` (지원: ${subCard.subProcesses.join(",")})`}
              </span>
              <span className="px-2 py-0.2 rounded-md bg-slate-900 text-amber-300 border border-slate-800 font-bold">
                ⭐ Lv.{subCard.skillLevel || 3}
              </span>
            </div>
          ) : (
            <p className="text-[11px] text-amber-400/90 font-medium">
              💡 위 드롭다운에서 당일 대체 투입할 작업자를 지정하거나 [라인비가동]을 선택하세요.
            </p>
          )}
        </div>
      </div>

      {/* ⚠️ 4M 리스크 가이드 메시지 바 */}
      {risk.warningMsg && (
        <div className="bg-slate-900/90 px-3 py-2 rounded-xl border border-slate-800 flex items-center gap-2 text-xs text-slate-300">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="font-bold text-amber-300/90">{risk.warningMsg}</span>
        </div>
      )}

      {/* 🛡️ 4M 품질 관리 필수 체크포인트 */}
      <div className="bg-slate-900/70 p-3 rounded-xl border border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={!!formState.checkpoints?.firstPieceCheck}
            onChange={(e) => setFormState({
              ...formState,
              checkpoints: { ...formState.checkpoints, firstPieceCheck: e.target.checked }
            })}
            className="w-4 h-4 rounded border-slate-700 text-emerald-500 focus:ring-0 cursor-pointer"
          />
          <span className="text-slate-300 font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>초물(First Piece) 한도검사 완료</span>
          </span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={!!formState.checkpoints?.workInstructionTold}
            onChange={(e) => setFormState({
              ...formState,
              checkpoints: { ...formState.checkpoints, workInstructionTold: e.target.checked }
            })}
            className="w-4 h-4 rounded border-slate-700 text-emerald-500 focus:ring-0 cursor-pointer"
          />
          <span className="text-slate-300 font-bold flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>특별교육</span>
          </span>
        </label>
      </div>

      {/* 📌 1줄 4M 변경점 감사 증빙 로그 박스 */}
      <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 overflow-hidden">
          <span className="text-xs px-2 py-0.5 rounded-md bg-indigo-950 text-indigo-300 border border-indigo-800 font-mono font-black shrink-0">
            1줄 감사기록
          </span>
          <span className="text-xs font-mono text-slate-300 truncate" title={currentOneLine}>
            {currentOneLine}
          </span>
        </div>

        <button
          type="button"
          onClick={() => onCopyOneLine(currentOneLine, item.id)}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer shrink-0 ${
            isCopied
              ? "bg-emerald-600 text-white border-emerald-500"
              : "bg-slate-800 hover:bg-slate-700 text-cyan-300 border-slate-700 hover:border-cyan-500"
          }`}
          title="이 1줄 기록을 클립보드에 복사"
        >
          {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{isCopied ? "복사됨!" : "1줄 복사"}</span>
        </button>
      </div>

      {/* 🔘 액션 버튼 바 (저장 및 삭제) */}
      <div className="flex items-center justify-end gap-2 pt-1">
        {!item.isDraft && (
          <button
            type="button"
            onClick={() => onDelete(item.id)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-300 border border-slate-700 hover:border-rose-800 text-xs font-bold transition-all cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>삭제</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => {
            const entryToSave = {
              ...formState,
              absentWorker: absentCard
            };
            onSave(entryToSave);
          }}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-black text-xs shadow-md transition-all cursor-pointer"
        >
          <Save className="w-3.5 h-3.5" />
          <span>{item.isDraft ? "4M 대장에 신규 저장" : "변경사항 저장"}</span>
        </button>
      </div>
    </div>
  );
}
