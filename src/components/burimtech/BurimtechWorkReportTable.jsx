import React, { useState, useEffect, useMemo } from "react";
import {
  FileSpreadsheet,
  Plus,
  Search,
  Filter,
  Trash2,
  Calendar,
  Layers,
  User,
  TrendingUp,
  Download,
  Settings,
  Camera,
  CheckCircle2
} from "lucide-react";
import { MajorProcessTemplateSelectModal } from "../common/MajorProcessTemplateSelectModal";
import { deleteWorkLog } from "../../services/workLogService";
import {
  getLocalWorkReportNcLedger,
  saveWorkReportNcLedger,
  WORK_REPORT_NC_STORAGE_KEY
} from "../common/WorkReportNonconformanceLedgerPanel";
import { unregisterFromFourMLedger } from "../../services/fourMChangePointService";
import { useCapaActionModalState } from "../quality/step3/useCapaActionModalState";
import Step3CapaActionModal from "../quality/step3/Step3CapaActionModal";
import { ImagePreviewModal } from "../common/ImagePreviewModal";
import { MachiningIncidentSortingBar } from "../machining/table/MachiningIncidentSortingBar";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase";

const BURIMTECH_SLOTS = [
  { id: "STANDARD", name: "부림텍 표준", sub: "전 공정 공통" },
  { id: "소재준비", name: "소재준비", sub: "정치절단 및 컷팅" },
  { id: "가류_조인트", name: "가류/조인트", sub: "사출 및 프레스 가류" },
  { id: "후가공", name: "후가공", sub: "본드로봇 및 부자재" },
  { id: "검사_포장", name: "검사/포장", sub: "치수 및 외관 검사" }
];

export const BurimtechWorkReportTable = ({
  handleOpenWorkLogModal,
  handleOpenLogDetail,
  handleDeleteLog,
  onNavigateTab,
  workLogs = [],
  currentProfile,
  isWorkLogApproved
}) => {
  const [isTemplateSettingOpen, setIsTemplateSettingOpen] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState(null);
  const [assignToast, setAssignToast] = useState("");
  const [previewImg, setPreviewImg] = useState(null);
  const [ledgerState, setLedgerState] = useState(() => getLocalWorkReportNcLedger());

  useEffect(() => {
    let isMounted = true;
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
          (err) => {
            console.warn("BurimtechWorkReportTable ledger onSnapshot error:", err);
          }
        );
      } catch (err) {}
    }

    return () => {
      isMounted = false;
      unsubFirestoreLedger();
      window.removeEventListener("work_report_nc_ledger_updated", handleLocalLedgerUpdate);
    };
  }, []);

  // Filter logs for Burimtech
  const burimLogs = useMemo(() => {
    return (workLogs || []).filter((l) => {
      if (!l) return false;
      const comp = String(l.company || "").trim();
      const writer = String(l.writer || "").trim();
      const proc = String(l.assignedProcess || l.process || "").trim();
      return (
        comp.includes("부림") ||
        writer.includes("부림") ||
        writer === "최현영" ||
        writer === "김동훈" ||
        proc.includes("부림") ||
        (l.plant === "한림공장" && (proc.includes("가공/협력업체") || proc.includes("협력업체") || proc.includes("가공")))
      );
    });
  }, [workLogs]);

  // Aggregate stats
  const stats = useMemo(() => {
    const total = burimLogs.length;
    const approved = burimLogs.filter((l) => isWorkLogApproved && isWorkLogApproved(l)).length;
    const pending = total - approved;
    const rate = total > 0 ? ((approved / total) * 100).toFixed(1) : "100.0";
    return { total, approved, pending, rate };
  }, [burimLogs, isWorkLogApproved]);

  // 2단계 생산공정: 부림텍 비가동 및 부적합 내역 수합 (1차 소팅용)
  const burimIncidents = useMemo(() => {
    const list = [];
    const overrides = ledgerState?.overrides || {};

    burimLogs.forEach((r) => {
      if (!r) return;
      const rId = String(r.id || "");
      const date = String(r.workDate || r.date || "").trim();
      const worker = String(r.writer || "부림텍 작업자").trim();
      const proc = String(r.assignedProcess || r.process || "가공/협력업체(부림텍)").trim();
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
          company: "부림텍",
          plant: "한림공장",
          line: proc,
          project: "부림텍",
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

      const badQty = Number(r.totals?.bad ?? r.defectQty ?? r.badQty ?? 0);
      if (!hasDefectEvent && badQty > 0) {
        const itemId = `wr_nc_def_${rId}`;
        const ov = overrides[itemId] || {};
        if (!ov.isDeleted) {
          const defectType = ov.defectType || "부림텍 불량 발생";
          const registrationType = ov.registrationType || "UNREGISTERED";
          list.push({
            id: itemId,
            reportId: rId,
            date,
            time: r.time || "",
            worker,
            company: "부림텍",
            plant: "한림공장",
            line: proc,
            project: "부림텍",
            processId: proc,
            defectType,
            minutes: Number(ov.downtimeMinutes || 0),
            scrapKg: badQty,
            content: ov.content || `${proc} 불량 ${badQty}EA 발생 ${r.remark || r.notes || ""}`.trim(),
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
  }, [burimLogs, ledgerState]);

  const incidentStats = useMemo(() => {
    return {
      total: burimIncidents.length,
      unsorted: burimIncidents.filter((i) => !i.registrationType || i.registrationType === "UNREGISTERED").length,
      internal: burimIncidents.filter((i) => i.registrationType === "INTERNAL").length,
      quality: burimIncidents.filter((i) => i.registrationType === "CHANGE_POINT").length
    };
  }, [burimIncidents]);

  const capaModalState = useCapaActionModalState({
    managerName: currentProfile?.name || "부림텍 관리자",
    defaultPlant: "한림공장",
    ledgerState,
    setLedgerState,
    onAfterSave: (item) => {
      setAssignToast(`🚨 [${item.line || "부림텍"}] 조치결과가 전체취합대장(품질 이관)으로 정상 등록되었습니다.`);
      setTimeout(() => setAssignToast(""), 4000);
    }
  });

  const handleSortIncident = async (item, targetType) => {
    if (targetType === "CHANGE_POINT") {
      capaModalState.handleOpenCapaModal(item, currentProfile?.name || "부림텍 관리자");
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

    const mgr = currentProfile?.name || "부림텍 관리자";
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
      setAssignToast(`🟢 [${item.line || "부림텍"} ${item.defectType}] 건이 사내 내부관리로 종결 처리되었습니다.`);
    } else {
      await unregisterFromFourMLedger(item.id);
      await unregisterFromFourMLedger(`ledger_${item.id}`);
      setAssignToast(`↩️ [${item.line || "부림텍"} ${item.defectType}] 소팅이 초기화되었습니다.`);
    }
    setTimeout(() => setAssignToast(""), 3500);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-teal-200 dark:border-teal-900/60 shadow-xl overflow-hidden p-2.5 sm:p-3.5 space-y-2.5 text-left">
      {/* Header and Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
        <div className="min-w-0">
          <div>
            <h3 className="font-black text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-1.5 flex-wrap">
              <FileSpreadsheet className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-teal-600 dark:text-teal-400 shrink-0" />
              <span>(주)부림텍 가공/협력업체 작업일보 실시간 현황</span>
              <span className="text-[9.5px] sm:text-[10px] px-2 py-0.2 sm:py-0.5 rounded-full bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300 font-black">
                총 {stats.total}건
              </span>
            </h3>
            <span className="text-[10.5px] text-slate-500 dark:text-slate-400 font-medium">
              한림공장 (주)부림텍 가공/협력업체 일일 작업 실적 및 실시간 결재 승인 현황
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => setIsTemplateSettingOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-[11px] shadow-xs active:scale-95 transition cursor-pointer"
            title="탭하면 부림텍 가공/협력업체에 적용할 5대 공정 양식 리스트를 열어 설정합니다"
          >
            <Settings className="w-3 h-3" />
            <span>부림텍일보설정</span>
          </button>
          {handleOpenWorkLogModal && (
            <button
              type="button"
              onClick={() => handleOpenWorkLogModal()}
              className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-black text-[11px] shadow-xs active:scale-95 transition cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>+ 일보 작성</span>
            </button>
          )}
        </div>
      </div>

      {/* 요약 통계 카드 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <div className="p-2 sm:p-2.5 rounded-xl bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-950/30 dark:to-emerald-950/20 border border-teal-200/80 dark:border-teal-900/40">
          <div className="flex items-center justify-between">
            <span className="font-black text-[11px] text-teal-700 dark:text-teal-300">총 작업일보</span>
            <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400">누적 등록</span>
          </div>
          <div className="mt-1 text-base sm:text-lg font-black text-slate-900 dark:text-white font-mono">
            {stats.total} <span className="text-[11px] font-normal text-slate-500">건</span>
          </div>
        </div>

        <div className="p-2 sm:p-2.5 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/20 border border-emerald-200/80 dark:border-emerald-900/40">
          <div className="flex items-center justify-between">
            <span className="font-black text-[11px] text-emerald-700 dark:text-emerald-300">승인완료</span>
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">결재율 {stats.rate}%</span>
          </div>
          <div className="mt-1 text-base sm:text-lg font-black text-emerald-700 dark:text-emerald-400 font-mono">
            {stats.approved} <span className="text-[11px] font-normal text-slate-500">건</span>
          </div>
        </div>

        <div className="p-2 sm:p-2.5 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 border border-amber-200/80 dark:border-amber-900/40">
          <div className="flex items-center justify-between">
            <span className="font-black text-[11px] text-amber-700 dark:text-amber-300">결재대기</span>
            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">승인대기</span>
          </div>
          <div className="mt-1 text-base sm:text-lg font-black text-amber-700 dark:text-amber-400 font-mono">
            {stats.pending} <span className="text-[11px] font-normal text-slate-500">건</span>
          </div>
        </div>
      </div>

      {/* 2단계 생산공정: 당일 부림텍 비가동 · 부적합 1차 소팅 바 */}
      <MachiningIncidentSortingBar
        incidentStats={incidentStats}
        machiningIncidents={burimIncidents}
        handleSortIncident={handleSortIncident}
        title="당일 부림텍(한림) 비가동 · 부적합 1차 소팅"
        emptyText="오늘 접수된 부림텍 일보에 비가동 및 부적합 내역이 없습니다. (정상 가동 중)"
      />

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-black border-b border-slate-200 dark:border-slate-700 text-[10.5px]">
              <th className="py-1.5 px-2">일자</th>
              <th className="py-1.5 px-2">작성자</th>
              <th className="py-1.5 px-2">공정 / 품목</th>
              <th className="py-1.5 px-2">주요 작업 내용</th>
              <th className="py-1.5 px-2 text-center">사진</th>
              <th className="py-1.5 px-2 text-center">결재상태</th>
              <th className="py-1.5 px-2 text-center">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {burimLogs.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400 font-bold">
                  등록된 부림텍 가공/협력업체 작업일보가 없습니다. 상단의 [+ 일보 작성] 버튼을 클릭해 등록해 주십시오.
                </td>
              </tr>
            ) : (
              burimLogs.slice(0, 15).map((log) => {
                const approved = isWorkLogApproved ? isWorkLogApproved(log) : Boolean(log.approved);
                const hasPhotos = Array.isArray(log.images) && log.images.length > 0;
                return (
                  <tr
                    key={log.id}
                    onClick={() => handleOpenLogDetail && handleOpenLogDetail(log)}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition cursor-pointer text-[10.5px] sm:text-[11px]"
                  >
                    <td className="py-1.5 px-2 font-mono font-bold text-slate-900 dark:text-white">
                      {log.workDate || log.date}
                    </td>
                    <td className="py-1.5 px-2 font-bold text-teal-700 dark:text-teal-300">
                      {log.writer || "부림텍"}
                    </td>
                    <td className="py-1.5 px-2">
                      <span className="px-1.5 py-0.2 rounded text-[9.5px] font-bold bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300">
                        {log.assignedProcess === "외주가공" ? "가공/협력업체" : (log.assignedProcess || log.process || "가공/협력업체")}
                      </span>
                    </td>
                    <td className="py-1.5 px-2 text-slate-700 dark:text-slate-300 max-w-xs truncate font-medium">
                      {log.workContent || log.description || log.content || "-"}
                    </td>
                    <td className="py-1.5 px-2 text-center">
                      {hasPhotos ? (
                        <span className="inline-flex items-center gap-0.5 text-indigo-600 dark:text-indigo-400 font-bold">
                          <Camera className="w-3 h-3" />
                          <span>{log.images.length}</span>
                        </span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                    <td className="py-1.5 px-2 text-center">
                      <span
                        className={`inline-block px-1.5 py-0.2 rounded-full text-[9.5px] font-black ${
                          approved
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                            : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                        }`}
                      >
                        {approved ? "승인완료" : "결재대기"}
                      </span>
                    </td>
                    <td className="py-1.5 px-2 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenLogDetail && handleOpenLogDetail(log);
                          }}
                          className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-[10.5px] font-bold transition cursor-pointer"
                          title="일보 상세 보기"
                        >
                          보기
                        </button>
                        <button
                          type="button"
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (!window.confirm(`정말로 이 부림텍 작업일보 [${log.workDate || log.date} - ${log.writer || "작업자"}] 항목을 영구 삭제하시겠습니까?\n삭제 후에는 복구할 수 없습니다.`)) return;
                            setIsDeletingId(log.id);
                            try {
                              if (handleDeleteLog) {
                                await handleDeleteLog(log.id);
                              } else {
                                await deleteWorkLog(log.id, true);
                              }
                            } catch (err) {
                              alert("삭제 중 오류가 발생했습니다: " + err.message);
                            } finally {
                              setIsDeletingId(null);
                            }
                          }}
                          disabled={isDeletingId === log.id}
                          className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-slate-800 transition cursor-pointer disabled:opacity-50"
                          title="작업일보 영구 삭제"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 🌟 5대 공정 양식 설정 모달 (부림텍 가공/협력업체 공정별 양식 매핑) */}
      <MajorProcessTemplateSelectModal
        isOpen={isTemplateSettingOpen}
        onClose={() => setIsTemplateSettingOpen(false)}
        title="(주)부림텍 가공/협력업체 5대 공정 작업일보 양식 설정"
        subtitle="부림텍 가공/협력업체 공정별 적용할 표준 5대 공정 양식을 선택 및 매핑하세요."
        companyKey="BURIMTECH"
        companyName="(주)부림텍"
        slots={BURIMTECH_SLOTS}
        defaultCategoryId="MATERIAL_PREP"
        onApplyAndOpenReport={(tpl, slotId) => {
          if (handleOpenWorkLogModal) {
            handleOpenWorkLogModal({
              company: "부림텍",
              assignedProcess: slotId === "STANDARD" ? "가공/협력업체" : slotId,
              templateId: tpl?.id
            });
          }
        }}
      />

      {/* 🌟 3단계 품질관리자(이창엽 책임) 연동 CAPA 시정조치 & 품질이관 등록 모달 */}
      <Step3CapaActionModal
        isOpen={capaModalState.isCapaModalOpen}
        onClose={capaModalState.handleCloseCapaModal}
        capaModalItem={capaModalState.capaModalItem}
        capaFourM={capaModalState.capaFourM}
        setCapaFourM={capaModalState.setCapaFourM}
        capaActionResult={capaModalState.capaActionResult}
        setCapaActionResult={capaModalState.setCapaActionResult}
        capaStatus={capaModalState.capaStatus}
        setCapaStatus={capaModalState.setCapaStatus}
        capaBeforePhoto={capaModalState.capaBeforePhoto}
        setCapaBeforePhoto={capaModalState.setCapaBeforePhoto}
        capaAfterPhoto={capaModalState.capaAfterPhoto}
        setCapaAfterPhoto={capaModalState.setCapaAfterPhoto}
        isSavingCapa={capaModalState.isSavingCapa}
        onSaveCapa={capaModalState.handleSaveCapaAction}
        isQualityManager={false}
        managerName={currentProfile?.name || "부림텍 관리자"}
        isOfficialLedger={false}
      />

      {/* 사진 미리보기 모달 */}
      {previewImg && (
        <ImagePreviewModal
          isOpen={Boolean(previewImg)}
          imageUrl={previewImg}
          onClose={() => setPreviewImg(null)}
        />
      )}
    </div>
  );
};

export default BurimtechWorkReportTable;
