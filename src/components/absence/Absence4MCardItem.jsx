import React, { useState, useEffect, useMemo } from "react";
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  UserX,
  UserCheck,
  ArrowRight,
  Calendar,
  Layers,
  Trash2,
  RefreshCw,
  Wrench,
  Sparkles
} from "lucide-react";
import {
  cleanCompanyName,
  COMPANY_THEMES
} from "../../services/overtimeSmartService.js";
import {
  STANDARD_PROCESS_LIST
} from "../../services/personnelCardService.js";
import {
  ABSENCE_REASONS,
  QUALITY_STATUS_OPTIONS,
  calculate4MRisk,
  generate4MActionResult
} from "../../services/absence4MService.js";

/**
 * Absence4MCardItem
 * 개별 결근자 및 4M 대체투입자 매핑, 리스크 분석, 체크포인트 및 조치결과 동기화 카드 컴포넌트
 */
export default function Absence4MCardItem({
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

  // 외부 item 변경 시 (동기화/저장/실시간 업데이트) 내부 formState 동기화
  useEffect(() => {
    setFormState((prev) => ({
      ...item,
      actionResult: item.actionResult !== undefined ? item.actionResult : prev.actionResult,
      checkpoints: item.checkpoints || prev.checkpoints || {
        firstPieceCheck: true,
        firstPieceChecker: "관리감독자",
        workInstructionTold: true,
        supervisorApproval: true,
        supervisorName: "관리감독자",
        qualityStatus: "NORMAL"
      }
    }));
  }, [item.id, item.updatedAt, item.actionResult, item.substituteWorker?.name]);

  const company = cleanCompanyName(formState.company);
  const theme = COMPANY_THEMES[company] || COMPANY_THEMES["오륙"];

  // 최신 인사카드 데이터 동기화
  const absentKey = `${company}_${formState.absentWorker?.name}`;
  const latestAbsentCard =
    personnelCardsMap[absentKey] ||
    personnelCardsMap[`${formState.company}_${formState.absentWorker?.name}`] ||
    formState.absentWorker ||
    {};
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
      const isAbsent =
        code === "결근" ||
        code === "무단결근" ||
        code === "휴가" ||
        code === "연차" ||
        code === "반차" ||
        code.includes("결근");
      return !isAbsent;
    });
  }, [allWorkers, company, formState.absentWorker?.name]);

  // 다기능공 추천 목록 (해당 공정을 메인 또는 서브공정으로 보유한 작업자 우선)
  const sortedCandidates = useMemo(() => {
    const targetProcess = formState.process || formState.absentWorker?.mainProcess || "압출";
    return [...candidateWorkers].sort((a, b) => {
      const aCard = personnelCardsMap[a.cardKey] || a.personnelCard || {};
      const bCard = personnelCardsMap[b.cardKey] || b.personnelCard || {};

      const aMatch =
        aCard.mainProcess === targetProcess || (aCard.subProcesses || []).includes(targetProcess) ? 1 : 0;
      const bMatch =
        bCard.mainProcess === targetProcess || (bCard.subProcesses || []).includes(targetProcess) ? 1 : 0;

      if (aMatch !== bMatch) return bMatch - aMatch;
      return (bCard.skillLevel || 3) - (aCard.skillLevel || 3);
    });
  }, [candidateWorkers, formState.process, formState.absentWorker?.mainProcess, personnelCardsMap]);

  // 표준 조치결과 기본 문구 계산
  const defaultActionResult = useMemo(() => {
    return generate4MActionResult(formState);
  }, [formState.substituteWorker, formState.checkpoints]);

  // 실시간 유효 조치결과 (사용자 입력값 또는 기본 생성 문구 또는 아이템 저장값)
  const effectiveActionResult = useMemo(() => {
    if (formState.actionResult !== undefined && formState.actionResult !== null && String(formState.actionResult).trim() !== "") {
      return String(formState.actionResult).trim();
    }
    if (item.actionResult && String(item.actionResult).trim() !== "") {
      return String(item.actionResult).trim();
    }
    return String(defaultActionResult || "").trim();
  }, [formState.actionResult, item.actionResult, defaultActionResult]);

  // 대체 작업자 선택 핸들러
  const handleSelectSubstitute = (workerName) => {
    if (!workerName) {
      const updated = {
        ...formState,
        substituteWorker: null,
        riskLevel: "UNKNOWN",
        riskWarningText: "대체 투입 작업자를 선택하거나 라인비가동을 지정해주세요.",
        actionResult: ""
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

      const nextAction = "라인 비가동 (공정 정지/품질영향 없음)";
      const shouldUpdate = !formState.actionResult || formState.actionResult === defaultActionResult;

      const updated = {
        ...formState,
        substituteWorker: subWorkerData,
        riskLevel: risk.level,
        riskWarningText: risk.warningMsg,
        actionResult: shouldUpdate ? nextAction : formState.actionResult,
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

    const nextAction = generate4MActionResult({
      ...formState,
      substituteWorker: subWorkerData
    });
    const shouldUpdate = !formState.actionResult || formState.actionResult === defaultActionResult;

    const updated = {
      ...formState,
      substituteWorker: subWorkerData,
      riskLevel: risk.level,
      riskWarningText: risk.warningMsg,
      actionResult: shouldUpdate ? nextAction : formState.actionResult
    };

    setFormState(updated);
  };

  const subCard = formState.substituteWorker || {};
  const risk = calculate4MRisk(absentCard, formState.substituteWorker, formState.process);

  return (
    <div
      className={`rounded-2xl border transition-all duration-200 shadow-md ${
        item.isDraft
          ? "bg-slate-950/90 border-amber-500/60 ring-1 ring-amber-500/30"
          : "bg-slate-950/80 border-slate-700/80 hover:border-slate-600"
      } p-3.5 sm:p-4 space-y-3`}
    >
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
              <option key={p} value={p}>
                {p} 공정
              </option>
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
            onChange={(e) =>
              setFormState({
                ...formState,
                checkpoints: { ...formState.checkpoints, qualityStatus: e.target.value }
              })
            }
            className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-0.5 text-xs font-bold text-white cursor-pointer"
          >
            {QUALITY_STATUS_OPTIONS.map((q) => (
              <option key={q.code} value={q.code}>
                {q.label}
              </option>
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
              onChange={(e) =>
                setFormState({
                  ...formState,
                  absentWorker: { ...absentCard, reason: e.target.value }
                })
              }
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs font-bold text-rose-300 cursor-pointer"
            >
              {ABSENCE_REASONS.map((r) => (
                <option key={r.code} value={r.code}>
                  {r.label}
                </option>
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
                const isTargetProcess =
                  card.mainProcess === (formState.process || "압출") ||
                  (card.subProcesses || []).includes(formState.process || "압출");
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
            onChange={(e) => {
              const checked = e.target.checked;
              const nextCheckpoints = { ...formState.checkpoints, firstPieceCheck: checked };
              const nextAction = generate4MActionResult({ ...formState, checkpoints: nextCheckpoints });
              const shouldUpdate = !formState.actionResult || formState.actionResult === defaultActionResult;
              setFormState({
                ...formState,
                checkpoints: nextCheckpoints,
                actionResult: shouldUpdate ? nextAction : formState.actionResult
              });
            }}
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
            onChange={(e) => {
              const checked = e.target.checked;
              const nextCheckpoints = { ...formState.checkpoints, workInstructionTold: checked };
              const nextAction = generate4MActionResult({ ...formState, checkpoints: nextCheckpoints });
              const shouldUpdate = !formState.actionResult || formState.actionResult === defaultActionResult;
              setFormState({
                ...formState,
                checkpoints: nextCheckpoints,
                actionResult: shouldUpdate ? nextAction : formState.actionResult
              });
            }}
            className="w-4 h-4 rounded border-slate-700 text-emerald-500 focus:ring-0 cursor-pointer"
          />
          <span className="text-slate-300 font-bold flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>특별교육 실시 완료</span>
          </span>
        </label>
      </div>

      {/* 🛠️ 조치결과 입력란 (대책 및 실행내용 직접 입력 또는 자동완성) */}
      <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-black text-slate-300 flex items-center gap-1.5">
            <Wrench className="w-3.5 h-3.5 text-cyan-400" />
            <span>조치결과 및 대체투입 대책</span>
          </label>
          <button
            type="button"
            onClick={() => {
              const autoText = generate4MActionResult(formState);
              if (autoText) {
                setFormState((prev) => ({ ...prev, actionResult: autoText }));
              }
            }}
            className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 font-bold transition-all cursor-pointer flex items-center gap-1 active:scale-95"
            title="대체투입 작업자 및 체크포인트 기반 표준 문구 자동완성"
          >
            <Sparkles className="w-3 h-3 text-cyan-400" />
            <span>표준문구 자동입력</span>
          </button>
        </div>
        <input
          type="text"
          value={
            formState.actionResult !== undefined
              ? formState.actionResult
              : item.actionResult || defaultActionResult || ""
          }
          onChange={(e) => setFormState({ ...formState, actionResult: e.target.value })}
          placeholder="예: 대체작업자 홍길동(사원) 투입 완료 (초물검사 완료 / 특별교육 완료) 또는 직접 조치결과 입력"
          className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-xl px-3 py-2 text-xs font-bold text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-400/50"
        />
      </div>

      {/* 🟢 조치결과 실시간 단일행 표기 배너 (결근관리 팝업 내 한줄 표시) */}
      {effectiveActionResult ? (
        <div className="bg-emerald-950/70 border border-emerald-500/60 rounded-xl px-3.5 py-2 text-xs flex items-center justify-between gap-2 shadow-sm animate-fadeIn">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-emerald-400 font-black shrink-0 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>↳ 🟢 [조치결과]</span>
            </span>
            <span className="text-emerald-100 font-bold truncate">{effectiveActionResult}</span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shrink-0 font-mono font-black">
            조치완료
          </span>
        </div>
      ) : (
        <div className="bg-slate-900/40 border border-slate-800 rounded-xl px-3.5 py-1.5 text-[11px] text-slate-500 flex items-center gap-1.5">
          <span className="shrink-0">↳ ⚪ [조치결과]</span>
          <span>대체 투입 작업자를 선택하거나 조치결과를 입력하면 이곳에 한 줄로 표시됩니다.</span>
        </div>
      )}

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
              absentWorker: absentCard,
              actionResult: effectiveActionResult,
              isResolved: Boolean(formState.substituteWorker?.name || effectiveActionResult)
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
