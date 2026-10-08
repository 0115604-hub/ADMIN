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
  Calendar,
  Building2,
  Layers,
  Save,
  Trash2,
  RefreshCw,
  Search,
  Zap
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
  subscribe4MAbsenceLogs,
  purgeAll4MAbsenceLogs
} from "../services/absence4MService.js";
import { useModalHistory } from "../utils/modalHistory";

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
  useModalHistory(isOpen, onClose, "absence4MModal");
  const [selectedCompanyTab, setSelectedCompanyTab] = useState(initialCompany || "오륙");
  const [modalDay, setModalDay] = useState(selectedDay || 7);
  const [logsMap, setLogsMap] = useState(() => getLocal4MAbsenceLogsMap());
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedId, setCopiedId] = useState(null);
  const [personnelCardsMap, setPersonnelCardsMap] = useState(() => getLocalPersonnelCardsMap());

  // 4M 결근 및 대체투입 대장 전체 영구삭제 핸들러
  const handlePurgeAllLogs = async () => {
    if (!window.confirm("⚠️ 4M 결근 및 대체투입 기록의 모든 기존 이력 및 더미데이터를 영구 삭제하시겠습니까?")) return;
    try {
      await purgeAll4MAbsenceLogs();
      setLogsMap({});
      alert("✨ 4M 결근 관리 데이터가 영구 삭제 및 초기화되었습니다.");
    } catch (err) {
      alert("4M 초기화 중 오류가 발생했습니다: " + err.message);
    }
  };

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
      const card = personnelCardsMap[cardKey] || personnelCardsMap[`${w.company}_${w.name}`] || w.personnelCard || getWorkerPersonnelCard(w, idx + 1);
      const resolvedComp = card?.company ? cleanCompanyName(card.company) : comp;
      const resolvedDept = card?.dept || w.dept || "생산팀";
      const resolvedPos = card?.position || w.position || "사원";
      const dailyVal = (w.daily && (w.daily[modalDay] !== undefined ? w.daily[modalDay] : w.daily[String(modalDay)])) || w[modalDay] || w[String(modalDay)] || "";
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
      return code === "결근" || code === "무단결근" || code === "휴가" || code === "연차" || code === "반차" || code.includes("결근");
    });
  }, [allWorkers]);

  // 화면에 표시할 4M 변경점 항목 목록 (자동 탐지된 결근자 + 저장된 로그 병합)
  const displayEntries = useMemo(() => {
    const allLogsList = Object.values(logsMap);
    const targetLogs = allLogsList.filter((log) => log.date === dateStr);
    const filteredLogs = targetLogs.filter((log) => {
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
        return aName.toLowerCase().includes(q) || sName.toLowerCase().includes(q) || comp.toLowerCase().includes(q) || proc.toLowerCase().includes(q);
      });
    }

    return combined;
  }, [logsMap, detectedAbsentWorkers, selectedCompanyTab, dateStr, currentMonth, modalDay, searchTerm, personnelCardsMap]);

  // 통계 요약 KPIs
  const metrics = useMemo(() => {
    const totalAbsent = detectedAbsentWorkers.length;
    const completedSubs = Object.values(logsMap).filter((l) => l.date === dateStr && l.substituteWorker?.name).length;
    const firstPieceDone = Object.values(logsMap).filter((l) => l.date === dateStr && l.checkpoints?.firstPieceCheck).length;
    const highRisks = Object.values(logsMap).filter((l) => l.date === dateStr && l.riskLevel === "HIGH").length;

    return {
      totalAbsent,
      completedSubs,
      firstPieceDone,
      highRisks
    };
  }, [detectedAbsentWorkers, logsMap, dateStr]);

  // 개별 4M 변경점 저장 및 변동점 MAN 동기화 핸들러
  const handleSaveEntry = async (entry) => {
    try {
      const saved = await save4MAbsenceLog(entry);
      setLogsMap((prev) => ({ ...prev, [saved.id]: saved }));
      setCopiedId(`saved_${entry.id}`);
      setTimeout(() => setCopiedId(null), 2000);
      alert("🔄 변동점 MAN과 완벽히 동기화되었습니다.");
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-2 sm:p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-slate-900 border-2 border-slate-700 w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-white">
        {/* ========================================================================= */}
        {/* 🏆 모달 헤더 */}
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
              </div>
              <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2 mt-0.5">
                <span>결근 관리 및 대체인원 투입</span>
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs font-mono font-bold text-slate-300">
              <Calendar className="w-3.5 h-3.5 text-cyan-400" />
              <span>{currentYear}년 {currentMonth}월 {modalDay}일</span>
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
        {/* 🎛️ 일자 네비게이션 & 실시간 검색 & 초기화 툴바 */}
        {/* ========================================================================= */}
        <div className="bg-slate-950 px-4 py-2.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2.5 text-xs">
          {/* 1. 일자 네비게이션 (이전일, 드롭다운, 다음일, 오늘) */}
          <div className="flex items-center gap-1 bg-slate-900/90 border border-slate-800 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setModalDay((prev) => (prev > 1 ? prev - 1 : 31))}
              className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition-all cursor-pointer"
              title="이전 일자로 이동"
            >
              ◀
            </button>
            <select
              value={modalDay}
              onChange={(e) => setModalDay(Number(e.target.value))}
              className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-cyan-300 font-bold font-mono cursor-pointer"
            >
              {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                <option key={d} value={d}>
                  {currentMonth}월 {d}일
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setModalDay((prev) => (prev < 31 ? prev + 1 : 1))}
              className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition-all cursor-pointer"
              title="다음 일자로 이동"
            >
              ▶
            </button>
            <button
              type="button"
              onClick={() => {
                const today = new Date().getDate();
                setModalDay(today);
              }}
              className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-cyan-950 text-slate-300 hover:text-cyan-300 font-bold text-[11px] transition-all ml-0.5 cursor-pointer"
            >
              오늘
            </button>
          </div>

          {/* 2. 검색창 */}
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="작업자/회사/공정 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-white text-xs font-bold placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* 3. 4M 이력 초기화 버튼 */}
          <button
            type="button"
            onClick={handlePurgeAllLogs}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-950/80 hover:bg-rose-900 text-rose-300 hover:text-white text-xs font-bold border border-rose-800 transition-all cursor-pointer shadow-sm"
            title="4M 결근 관리 기록을 영구 삭제하고 초기화합니다."
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
            <span>4M 이력 초기화</span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* 🏢 회사별 탭 네비게이션 & 통계 요약 바 */}
        {/* ========================================================================= */}
        <div className="bg-slate-900/90 p-3 sm:p-4 border-b border-slate-800 space-y-3">
          {/* 회사 선택 필터 탭 */}
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

          {/* KPI 미니 대시보드 */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400 font-bold flex items-center gap-1">
                <UserX className="w-3.5 h-3.5 text-rose-400" />
                <span>당일 결근 인원</span>
              </span>
              <span className="font-mono font-black text-rose-400 text-sm">{metrics.totalAbsent}건</span>
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
        {/* 📋 4M 변경점 메인 리스트 */}
        {/* ========================================================================= */}
        <div className="p-4 space-y-4 overflow-y-auto flex-1">
          {displayEntries.length === 0 ? (
            <div className="py-12 px-4 text-center rounded-2xl bg-slate-950/50 border border-slate-800 space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-black text-white">
                  {currentMonth}월 {modalDay}일 등록된 결근 인원이 없습니다.
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  선택된 {selectedCompanyTab === "전체" ? "5개사 전 사업장" : selectedCompanyTab}에서 {currentMonth}월 {modalDay}일 전원 정상 출근 상태입니다.
                </p>
              </div>
            </div>
          ) : (
            displayEntries.map((item, index) => (
              <Absence4MCardItem
                key={item.id || `entry_${index}`}
                item={item}
                allWorkers={allWorkers}
                personnelCardsMap={personnelCardsMap}
                onSave={handleSaveEntry}
                onDelete={handleDeleteEntry}
                isCopied={copiedId === item.id || copiedId === `saved_${item.id}`}
                currentMonth={currentMonth}
                selectedDay={modalDay}
              />
            ))
          )}
        </div>

        {/* ========================================================================= */}
        {/* 📌 모달 하단 액션 바 */}
        {/* ========================================================================= */}
        <div className="bg-slate-950 p-3 sm:p-4 border-t border-slate-800 flex items-center justify-between gap-2 shrink-0">
          <span className="text-[11px] text-slate-400 font-mono">
            📅 {currentMonth}월 {modalDay}일: 총 <strong className="text-cyan-400 font-bold">{displayEntries.length}건</strong>의 결근 및 대체투입 현황이 표시 중입니다.
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

  // 해당 회사의 모든 근로자 후보 (대체 인원 추천용 - 결근자가 아닌 출근 인원만 선별)
  const candidateWorkers = useMemo(() => {
    return allWorkers.filter((w) => {
      if (cleanCompanyName(w.company) !== company) return false;
      if (w.name === formState.absentWorker?.name) return false;
      const code = String(w.dailyCode || "").trim();
      const isAbsent = code === "결근" || code === "무단결근" || code === "휴가" || code === "연차" || code === "반차" || code.includes("결근");
      return !isAbsent;
    });
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

  const subCard = formState.substituteWorker || {};
  const risk = calculate4MRisk(absentCard, formState.substituteWorker, formState.process);

  return (
    <div className={`rounded-2xl border transition-all duration-200 shadow-md ${
      item.isDraft
        ? "bg-slate-950/90 border-amber-500/60 ring-1 ring-amber-500/30"
        : "bg-slate-950/80 border-slate-700/80 hover:border-slate-600"
    } p-3.5 sm:p-4 space-y-3`}>
      {/* 🏷️ 카드 상단 헤더: 일자 / 회사 / 공정 / 위험도 배지 */}
      <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="text-xs px-2.5 py-0.5 rounded-lg font-mono font-bold bg-slate-800 text-cyan-300 border border-slate-700 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-cyan-400" />
            <span>{formState.date || item.date || `${currentMonth}/${selectedDay}`}</span>
          </span>

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

      {/* ⚠️ 4M 리스크 경고 메시지 바 */}
      {risk.warningMsg && (
        <div className="bg-slate-900/90 px-3 py-2 rounded-xl border border-slate-800 flex items-center gap-2 text-xs text-slate-300">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="font-bold text-amber-300/90">{risk.warningMsg}</span>
        </div>
      )}

      {/* 🛡️ 4M 품질 관리 체크포인트 */}
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
            <span>특별교육 실시 완료</span>
          </span>
        </label>
      </div>

      {/* 🔘 액션 버튼 바 (삭제 및 변동점 MAN 동기화) */}
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
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-black text-xs shadow-md transition-all cursor-pointer active:scale-95"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>변동점 MAN 동기화</span>
        </button>
      </div>
    </div>
  );
}
