import React, { useState, useEffect, useMemo } from "react";
import { ShieldAlert, Check } from "lucide-react";
import {
  subscribeMachiningQualityIssues,
  getLocalMachiningQualityIssues,
  acknowledgeMachiningQualityIssue
} from "../../services/machiningQualityIssueService";
import {
  Factory,
  ClipboardList,
  Plus,
  Cpu,
  CheckCircle2,
  FileText,
  Clock,
  Gauge
} from "lucide-react";
import { isWorkerManagerRole } from "../../services/personnelCardService";
import { DigitalInspectionModal } from "../sq/DigitalInspectionModal";
import {
  getOverallDaySampleStatus,
  getSampleInspectionStatus
} from "../../utils/sampleInspectionUtils";

export default function FieldWorkerDashboardView({
  workerPlant = "",
  workerFullName = "",
  workerPosition = "",
  assignedProcess = "",
  todayFormattedLabel = "",
  handleOpenWorkLogModal,
  isExtrusionWorkerOnly = false,
  onNavigateTab,
  todayLog = null,
  isWorkLogApproved,
  handleOpenLogDetail,
  handleOpenEditModal,
  workerLogsList = [],
  workerLogScope = "my",
  setWorkerLogScope,
  workerLogApprovalFilter = "all",
  setWorkerLogApprovalFilter,
  currentProfile = null,
  handleDeleteLog,
}) {
  const isManager = useMemo(() => isWorkerManagerRole(currentProfile), [currentProfile]);
  const [isInspectionModalOpen, setIsInspectionModalOpen] = useState(false);

  const isBurimtech = useMemo(() => {
    return (
      currentProfile?.company === "부림텍" ||
      currentProfile?.portalType === "bulimtech" ||
      currentProfile?.name === "부림텍" ||
      currentProfile?.name === "최현영" ||
      workerFullName === "부림텍" ||
      workerFullName === "최현영"
    );
  }, [currentProfile, workerFullName]);

  const isJoyoungWorker = useMemo(() => {
    return (
      currentProfile?.company === "조영" ||
      currentProfile?.portalType === "joyoung" ||
      String(currentProfile?.id || "").startsWith("jy_")
    );
  }, [currentProfile]);

  const [machiningQualityIssues, setMachiningQualityIssues] = useState(() => getLocalMachiningQualityIssues());

  useEffect(() => {
    const unsub = subscribeMachiningQualityIssues((list) => {
      setMachiningQualityIssues(list || []);
    });
    return () => unsub();
  }, []);

  const targetQualityIssues = useMemo(() => {
    return (machiningQualityIssues || []).filter((it) => {
      if (!it || it.status === "RESOLVED") return false;
      if (isBurimtech) {
        return it.targetWorkerGroup === "burimtech" || it.company === "부림텍" || it.author === "부림텍";
      }
      if (isJoyoungWorker) {
        return it.targetWorkerGroup === "joyoung" || it.company === "조영" || it.author === "김동욱";
      }
      return false;
    });
  }, [machiningQualityIssues, isBurimtech, isJoyoungWorker]);

  const displayTitle = currentProfile?.title || currentProfile?.position || (
    isBurimtech && (currentProfile?.name === "최현영" || workerFullName === "최현영") ? "반장" :
    (isManager ? "반장" : "사원")
  );

  const companyTitle = isBurimtech
    ? "한림공장 (주)부림텍 외주가공"
    : `${workerPlant || currentProfile?.plant || "삼랑진공장"} (주)${currentProfile?.company || "오륙"} 현장가공`;

  const workerBadgeText = `[작업자] ${workerFullName || currentProfile?.name || (isBurimtech ? "부림텍" : "")} ${displayTitle}`;

  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const sampleStatus = useMemo(() => {
    return getOverallDaySampleStatus(workerLogsList, todayStr);
  }, [workerLogsList, todayStr]);

  return (
    <div className="space-y-3.5 sm:space-y-4 animate-fadeIn max-w-[1400px] w-full mx-auto min-w-0">
      {/* ========================================================================= */}
      {/* 🏭 상단 바: 초·중·종물 기록 여부만 표출 (6단계 라벨 및 일보 작성 뱃지 제거) */}
      {/* ========================================================================= */}
      <div className="bg-slate-900/90 rounded-2xl shadow-lg border border-slate-800 p-3.5 sm:p-4 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-white">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2.5 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-400/30 shrink-0">
            <Factory className="w-6 h-6" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-black text-white leading-tight">
                {companyTitle}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-teal-600/30 text-teal-300 border border-teal-400/40">
                {workerBadgeText}
              </span>

              {/* 🔥 초·중·종물 기록 여부 뱃지만 표출 */}
              {sampleStatus.isComplete ? (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-950 text-emerald-300 border border-emerald-500/80 flex items-center gap-1.5 shadow-sm shadow-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>✓ 초·중·종물 기록 완료</span>
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-950 text-amber-300 border border-amber-500/80 flex items-center gap-1.5 shadow-sm shadow-amber-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
                  <span>⏳ 초·중·종물 기록 진행중 (종물 대기)</span>
                </span>
              )}
            </div>

            <p className="text-xs text-slate-400 font-medium mt-1 truncate">
              금일 작업 공정 표준 및 안전수칙을 준수하고 실적을 정확히 기록하세요.
            </p>
          </div>
        </div>

        <div className="text-right shrink-0 flex items-center sm:flex-col sm:items-end justify-between gap-1">
          <span className="text-xs font-mono font-bold text-slate-400">{todayStr}</span>
          <span className={`text-[11px] font-black font-mono ${sampleStatus.isComplete ? "text-emerald-400" : "text-amber-400"}`}>
            {sampleStatus.summary}
          </span>
        </div>
      </div>

      {/* 🌟 압출동 작업자가 이 화면에 들어온 경우 바로가기 배너 */}
      {isExtrusionWorkerOnly && (
        <div className="p-4 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-300 dark:border-teal-800 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2.5 min-w-0">
            <Cpu className="w-5 h-5 text-teal-600 shrink-0" />
            <div>
              <p className="text-xs sm:text-sm font-black text-teal-950 dark:text-teal-100">
                🏭 삼랑진공장 압출동 작업자 모드
              </p>
              <p className="text-xs text-teal-700 dark:text-teal-300">
                압출 생산관리 탭에서 전용 압출 작업일보 및 라인별 생산실적을 기록하실 수 있습니다.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              try {
                localStorage.setItem("factory_extrusion_active_subtab", "production");
              } catch (e) {
                // ignore
              }
              if (onNavigateTab) onNavigateTab("extrusion_downtime");
            }}
            className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-black text-xs shadow-xs active:scale-95 transition-all cursor-pointer shrink-0"
          >
            압출 작업일보 바로가기 ➡️
          </button>
        </div>
      )}

      {/* 🌟 부림텍 / 조영 전용 부적합경보 공유판 */}
      {(isBurimtech || isJoyoungWorker) && (
        <div className="bg-slate-900 rounded-2xl border-2 border-rose-500/50 p-3.5 sm:p-4 text-white space-y-2.5 shadow-lg">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-400 animate-pulse" />
              <h3 className="text-sm font-black text-white">
                {isBurimtech ? "🚨 부림텍 관리자 부적합품 경보 전파" : "🚨 김동욱 관리자(조영) 부적합품 경보 전파"}
              </h3>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-600 text-white">
              전파중 {targetQualityIssues.length}건
            </span>
          </div>

          {targetQualityIssues.length === 0 ? (
            <div className="py-4 text-center rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-emerald-400 font-bold">
              ✓ 현재 등록된 부적합품 경보가 없습니다. 표준 작업수칙을 준수하세요.
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {targetQualityIssues.map((it) => {
                const ackList = Array.isArray(it.acknowledgedBy) ? it.acknowledgedBy : [];
                const isAcked = currentProfile?.name ? ackList.some((a) => a.name === currentProfile.name) : false;
                return (
                  <div key={it.id} className="p-3 rounded-xl bg-slate-950/80 border border-rose-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-2 py-0.5 rounded bg-rose-600 text-white text-[10px] font-black">{it.line || "전 라인"}</span>
                        {it.defectType && <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-700 text-[10px] font-bold">⚠️ {it.defectType}</span>}
                        <span className="text-[11px] text-slate-400 font-mono">{it.occurredDate}</span>
                      </div>
                      <p className="text-xs sm:text-sm font-black text-white">{it.title}</p>
                      {it.content && <p className="text-xs text-slate-300">{it.content}</p>}
                      {it.actionResult && <p className="text-xs text-emerald-300 font-bold">👉 조치지침: {it.actionResult}</p>}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (currentProfile?.name) {
                          acknowledgeMachiningQualityIssue(it.id, currentProfile.name);
                        }
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black shrink-0 cursor-pointer transition-all flex items-center gap-1 ${
                        isAcked
                          ? "bg-emerald-950 text-emerald-300 border border-emerald-500/60"
                          : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm"
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{isAcked ? `숙지완료 (${ackList.length}명)` : `숙지 확인 (${ackList.length}명)`}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 3. Work Logs List Table Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-3.5">
        {/* Top Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              <span>작업일보 등록 내역</span>
            </h3>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              총 {workerLogsList.length}건
            </span>
          </div>

          {/* Filter Mode Toggle & Status Filter */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700 text-xs">
              <button
                type="button"
                onClick={() => setWorkerLogScope && setWorkerLogScope("my")}
                className={`px-3 py-1 rounded-lg font-black transition-all ${
                  workerLogScope === "my"
                    ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                내 일보만
              </button>
              <button
                type="button"
                onClick={() => setWorkerLogScope && setWorkerLogScope("plant")}
                className={`px-3 py-1 rounded-lg font-black transition-all ${
                  workerLogScope === "plant"
                    ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {workerPlant} 전체
              </button>
            </div>

            <select
              value={workerLogApprovalFilter}
              onChange={(e) => setWorkerLogApprovalFilter && setWorkerLogApprovalFilter(e.target.value)}
              className="px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer"
            >
              <option value="all">결재상태: 전체</option>
              <option value="대기">결재대기만</option>
              <option value="승인">승인완료만</option>
            </select>

            <button
              type="button"
              onClick={() => setIsInspectionModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-cyan-700 hover:bg-cyan-600 text-white font-black text-xs flex items-center gap-1 shadow-xs cursor-pointer active:scale-95 transition-all"
            >
              <Gauge className="w-3.5 h-3.5 text-cyan-200" />
              <span>간편점검</span>
            </button>
            <button
              type="button"
              onClick={handleOpenWorkLogModal}
              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs flex items-center gap-1 shadow-xs cursor-pointer active:scale-95 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>일보 작성</span>
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="w-full overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse min-w-[760px]">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-bold h-8 text-[11px]">
                <th className="py-1 px-3 w-[10%] text-center">일자</th>
                <th className="py-1 px-3 w-[11%]">작성자</th>
                <th className="py-1 px-3 w-[35%]">작업 내용 및 실적</th>
                <th className="py-1 px-3 w-[18%] text-center">초·중·종물 검사</th>
                <th className="py-1 px-3 w-[13%] text-center">결재 현황</th>
                <th className="py-1 px-3 w-[13%] text-center">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {workerLogsList.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-10 text-center text-slate-400 font-bold">
                    <p className="text-sm text-slate-500 dark:text-slate-400">등록된 작업일보가 없습니다.</p>
                    <button
                      type="button"
                      onClick={handleOpenWorkLogModal}
                      className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-xs cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>첫 작업일보 작성하기</span>
                    </button>
                  </td>
                </tr>
              ) : (
                workerLogsList.map((log) => {
                  const isApproved = isWorkLogApproved ? isWorkLogApproved(log) : false;
                  const sampleInsp = getSampleInspectionStatus(log);
                  const isMyLog =
                    log.writer === workerFullName ||
                    log.writer === currentProfile?.name ||
                    log.author === currentProfile?.name ||
                    (currentProfile?.name && typeof log.writer === "string" && log.writer.includes(currentProfile.name));

                  return (
                    <tr
                      key={log.id}
                      onClick={() => handleOpenLogDetail && handleOpenLogDetail(log)}
                      className="hover:bg-blue-50/70 dark:hover:bg-blue-950/30 cursor-pointer transition-colors h-10 group text-[11.5px]"
                      title="클릭하여 상세내용 확인"
                    >
                      <td className="py-2 px-3 text-center font-mono font-bold text-slate-800 dark:text-slate-200">
                        {log.date}
                      </td>
                      <td className="py-2 px-3 font-bold text-slate-900 dark:text-white truncate">
                        {log.writer} {log.title || ""}
                      </td>
                      <td className="py-2 px-3 font-medium text-slate-800 dark:text-slate-200">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-bold text-slate-900 dark:text-slate-100 truncate group-hover:text-blue-600">
                            {log.workContent || "-"}
                          </span>
                          {Array.isArray(log.images) && log.images.length > 0 && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-black bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 shrink-0">
                              📷 {log.images.length}
                            </span>
                          )}
                          {log.issues && log.issues !== "특이사항 없음" && log.issues !== "-" && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 truncate max-w-[150px]">
                              ⚠️ {log.issues}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2 px-3 text-center">
                        {sampleInsp.isComplete ? (
                          <span
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800"
                            title={sampleInsp.summary}
                          >
                            <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                            <span>초·중·종 완료</span>
                          </span>
                        ) : sampleInsp.hasAny ? (
                          <span
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-black bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800"
                            title={sampleInsp.summary}
                          >
                            <span>{sampleInsp.start && sampleInsp.mid ? "초·중 기록" : "초물만 기록"}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                            <span>미기록</span>
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-center">
                        {isApproved ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                            <span>승인완료</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-black bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                            <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                            <span>결재대기</span>
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenLogDetail && handleOpenLogDetail(log)}
                            className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-[10.5px] cursor-pointer"
                          >
                            상세
                          </button>
                          {isMyLog && !isApproved && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleOpenEditModal && handleOpenEditModal(log)}
                                className="px-2 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold text-[10.5px] cursor-pointer"
                              >
                                수정
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteLog && handleDeleteLog(log.id)}
                                className="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-bold text-[10.5px] cursor-pointer"
                              >
                                삭제
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <DigitalInspectionModal
        isOpen={isInspectionModalOpen}
        onClose={() => setIsInspectionModalOpen(false)}
      />
    </div>
  );
}
