import React, { useState, useEffect, useMemo } from "react";
import { FileSpreadsheet, Settings } from "lucide-react";
import {
  subscribeYuseongWorkReports,
  deleteYuseongWorkReport,
  exportYuseongReportToExcel
} from "../../services/yuseongWorkReportService";
import {
  subscribeWorkReportTemplates,
  getLocalWorkReportTemplates,
  subscribeHanulTemplateAssignments,
  getLocalHanulTemplateAssignments
} from "../../services/workReportTemplateService";
import Step3CapaActionModal from "../quality/step3/Step3CapaActionModal";
import { ImagePreviewModal } from "../common/ImagePreviewModal";
import { useYuseongIncidents } from "./table/useYuseongIncidents";
import YuseongTemplateAssignmentModal from "./table/YuseongTemplateAssignmentModal";
import YuseongReportListView from "./table/YuseongReportListView";

/**
 * YuseongWorkReportTable
 * (주)유성 가공/협력업체 작업일보 실시간 현황 및 5대 공정 양식 설정, 2단계 비가동/부적합 1차 소팅 통합 테이블
 */
export const YuseongWorkReportTable = ({ onOpenReportModal, currentWorkerName = "" }) => {
  const [reports, setReports] = useState([]);
  const [projectFilter, setProjectFilter] = useState("all");
  const [processFilter, setProcessFilter] = useState("all");
  const [searchWorker, setSearchWorker] = useState("");
  const [searchDate, setSearchDate] = useState("");
  const [isDeleting, setIsDeleting] = useState(null);
  const [assignToast, setAssignToast] = useState("");

  // 5대 공정 양식 보관함 리스트 & 유성 JK1/CE1/DT 양식 설정 상태
  const [allTemplates, setAllTemplates] = useState(() => getLocalWorkReportTemplates());
  const [templateAssignments, setTemplateAssignments] = useState(() => getLocalHanulTemplateAssignments());
  const [settingProject, setSettingProject] = useState(null); // "JK1" | "CE1" | "DT" | null

  useEffect(() => {
    let isMounted = true;
    const unsub = subscribeYuseongWorkReports((list) => {
      if (isMounted) setReports(list || []);
    });
    const unsubTemplates = subscribeWorkReportTemplates((list) => {
      if (isMounted && Array.isArray(list)) setAllTemplates(list);
    });
    const unsubAssign = subscribeHanulTemplateAssignments((map) => {
      if (isMounted && map) setTemplateAssignments(map);
    });

    return () => {
      isMounted = false;
      unsub();
      unsubTemplates();
      unsubAssign();
    };
  }, []);

  // Filtered reports
  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      if (!r) return false;
      if (projectFilter !== "all") {
        const normFilter = projectFilter.toUpperCase();
        const normProj = String(r.project || "").toUpperCase();
        if (normProj !== normFilter) return false;
      }
      if (processFilter !== "all" && r.processId !== processFilter && r.processName !== processFilter) return false;
      if (searchWorker.trim()) {
        const query = searchWorker.trim().toLowerCase();
        if (!String(r.worker || "").toLowerCase().includes(query)) return false;
      }
      if (searchDate && r.date !== searchDate) return false;
      return true;
    });
  }, [reports, projectFilter, processFilter, searchWorker, searchDate]);

  // Aggregate stats (JK1, CE1, DT Hood)
  const stats = useMemo(() => {
    let totalCount = filteredReports.length;
    let jk1Gross = 0,
      jk1Gen = 0;
    let ce1Gross = 0,
      ce1Gen = 0;
    let dtGross = 0,
      dtGen = 0;

    filteredReports.forEach((r) => {
      const g = Number(r.totals?.genuine ?? r.genuineQty ?? 0) || 0;
      const b = Number(r.totals?.bad ?? r.badQty ?? 0) || 0;
      const total = Number(r.totals?.total ?? r.totalQty ?? g + b) || g + b;
      const p = String(r.project || "").toUpperCase();

      if (p.includes("JK1")) {
        jk1Gross += total;
        jk1Gen += g;
      } else if (p.includes("CE1")) {
        ce1Gross += total;
        ce1Gen += g;
      } else if (p.includes("DT")) {
        dtGross += total;
        dtGen += g;
      }
    });

    const jk1Yield = jk1Gross > 0 ? ((jk1Gen / jk1Gross) * 100).toFixed(1) : "100.0";
    const ce1Yield = ce1Gross > 0 ? ((ce1Gen / ce1Gross) * 100).toFixed(1) : "100.0";
    const dtYield = dtGross > 0 ? ((dtGen / dtGross) * 100).toFixed(1) : "100.0";

    return { totalCount, jk1Gross, jk1Gen, jk1Yield, ce1Gross, ce1Gen, ce1Yield, dtGross, dtGen, dtYield };
  }, [filteredReports]);

  // 2단계 생산공정: 유성 비가동 및 부적합 1차 소팅 & CAPA 연동
  const {
    yuseongIncidents,
    incidentStats,
    capaModalState,
    handleSortIncident,
    previewImg,
    setPreviewImg
  } = useYuseongIncidents({
    filteredReports,
    currentWorkerName,
    onToast: (msg) => {
      setAssignToast(msg);
      setTimeout(() => setAssignToast(""), 3500);
    }
  });

  const handleDelete = async (id, e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    if (!window.confirm("정말로 이 유성 가공/협력업체 작업일보를 영구 삭제하시겠습니까?")) return;
    setIsDeleting(id);
    try {
      await deleteYuseongWorkReport(id);
    } catch (err) {
      console.error("Failed to delete yuseong report:", err);
      alert("삭제 중 오류가 발생했습니다.");
    } finally {
      setIsDeleting(null);
    }
  };

  const handleExportExcel = () => {
    if (filteredReports.length === 0) {
      alert("다운로드할 유성 작업일보 데이터가 없습니다.");
      return;
    }
    const today = new Date().toISOString().slice(0, 10);
    exportYuseongReportToExcel(filteredReports, `유성_가공협력업체_작업일보_${today}.xlsx`);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-indigo-200 dark:border-indigo-900/60 shadow-xl overflow-hidden p-3.5 sm:p-5 space-y-4 text-left">
      {assignToast && (
        <div className="p-3 rounded-2xl bg-emerald-600 text-white font-black text-xs sm:text-sm shadow-lg flex items-center justify-between animate-fadeIn">
          <span>{assignToast}</span>
          <button
            type="button"
            onClick={() => setAssignToast("")}
            className="cursor-pointer text-white font-bold ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header and Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-2 sm:p-2.5 rounded-2xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-teal-600 text-white shadow-md shrink-0">
            <FileSpreadsheet className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <h3 className="font-black text-xs sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
              <span>(주)유성 가공/협력업체 작업일보 실시간 현황</span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 font-bold">
                총 {stats.totalCount}건
              </span>
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              JK1 Part'g • CE1 Part'g • DT Hood 실시간 공정별 작업 실적 및 TPM 관리
            </p>
          </div>
        </div>

        {/* 5대 공정 양식 설정 버튼 3종 (JK1 / CE1 / DT) */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => setSettingProject("JK1")}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-xs active:scale-95 transition cursor-pointer"
            title="탭하면 5대 공정 양식 리스트를 열어 JK1 적용 양식을 설정합니다"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>🚗 JK1 양식설정</span>
          </button>
          <button
            type="button"
            onClick={() => setSettingProject("CE1")}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-xs active:scale-95 transition cursor-pointer"
            title="탭하면 5대 공정 양식 리스트를 열어 CE1 적용 양식을 설정합니다"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>🚙 CE1 양식설정</span>
          </button>
          <button
            type="button"
            onClick={() => setSettingProject("DT")}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-black text-xs shadow-xs active:scale-95 transition cursor-pointer"
            title="탭하면 5대 공정 양식 리스트를 열어 DT HOOD 적용 양식을 설정합니다"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>⚡ DT HOOD 양식설정</span>
          </button>
        </div>
      </div>

      {/* 종합 통계 카드, 소팅 바 및 테이블 목록 */}
      <YuseongReportListView
        stats={stats}
        incidentStats={incidentStats}
        yuseongIncidents={yuseongIncidents}
        handleSortIncident={handleSortIncident}
        projectFilter={projectFilter}
        setProjectFilter={setProjectFilter}
        searchDate={searchDate}
        setSearchDate={setSearchDate}
        searchWorker={searchWorker}
        setSearchWorker={setSearchWorker}
        handleExportExcel={handleExportExcel}
        onOpenReportModal={onOpenReportModal}
        filteredReports={filteredReports}
        isDeleting={isDeleting}
        handleDelete={handleDelete}
      />

      {/* 5대 공정 양식 설정 모달 (유성 JK1 / CE1 / DT) */}
      <YuseongTemplateAssignmentModal
        isOpen={Boolean(settingProject)}
        onClose={() => setSettingProject(null)}
        initialProject={settingProject || "JK1"}
        allTemplates={allTemplates}
        templateAssignments={templateAssignments}
        onOpenReportModal={onOpenReportModal}
        onToast={(msg) => {
          setAssignToast(msg);
          setTimeout(() => setAssignToast(""), 3500);
        }}
      />

      {/* 3단계 품질관리자(이창엽 책임) 연동 CAPA 시정조치 & 품질이관 등록 모달 */}
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
        managerName={currentWorkerName || "이성기 대표"}
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

export default YuseongWorkReportTable;
