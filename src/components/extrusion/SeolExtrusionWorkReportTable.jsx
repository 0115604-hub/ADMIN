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
  Clock,
  CheckCircle2
} from "lucide-react";
import {
  subscribeToExtrusionReports,
  deleteExtrusionReport,
  exportExtrusionReportsToExcel
} from "../../services/extrusionProductionService";
import { MajorProcessTemplateSelectModal } from "../common/MajorProcessTemplateSelectModal";

const SEOL_EXTRUSION_SLOTS = [
  { id: "ALL", name: "압출 표준", sub: "전체 라인 공통" },
  { id: "pcm1", name: "PCM 1호", sub: "PCM #1 라인" },
  { id: "pcm3", name: "PCM 3호", sub: "PCM #3 라인" },
  { id: "pvc", name: "PVC LINE", sub: "PVC 압출 라인" },
  { id: "tpe", name: "TPE LINE", sub: "TPE 압출 라인" }
];

export const SeolExtrusionWorkReportTable = ({
  onOpenReportModal,
  currentWorkerName = "설유철"
}) => {
  const [reports, setReports] = useState([]);
  const [searchWorker, setSearchWorker] = useState("");
  const [searchDate, setSearchDate] = useState("");
  const [lineFilter, setLineFilter] = useState("all");
  const [isDeleting, setIsDeleting] = useState(null);
  const [isTemplateSettingOpen, setIsTemplateSettingOpen] = useState(false);

  useEffect(() => {
    const unsub = subscribeToExtrusionReports((list) => {
      setReports(list || []);
    });
    return () => unsub();
  }, []);

  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      if (!r) return false;
      if (lineFilter !== "all" && r.line !== lineFilter && r.extrusionLine !== lineFilter) return false;
      if (searchWorker.trim()) {
        const query = searchWorker.trim().toLowerCase();
        const w = String(r.worker || r.author || r.leader || "").toLowerCase();
        if (!w.includes(query)) return false;
      }
      if (searchDate) {
        const d = r.date || r.workDate || "";
        if (d !== searchDate) return false;
      }
      return true;
    });
  }, [reports, lineFilter, searchWorker, searchDate]);

  // Stats
  const stats = useMemo(() => {
    let totalCount = filteredReports.length;
    let totalOutputM = 0;
    let totalScrapKg = 0;

    filteredReports.forEach((r) => {
      const out = Number(r.totalOutputMeter || r.outputM || r.goodQty || 0) || 0;
      const scrap = Number(r.scrapWeightKg || r.scrapKg || r.badQty || 0) || 0;
      totalOutputM += out;
      totalScrapKg += scrap;
    });

    return { totalCount, totalOutputM, totalScrapKg };
  }, [filteredReports]);

  const handleDelete = async (id, e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    if (!window.confirm("정말로 이 압출 작업일보를 영구 삭제하시겠습니까?")) return;
    setIsDeleting(id);
    try {
      await deleteExtrusionReport(id, true);
    } catch (err) {
      console.error(err);
      alert("삭제 중 오류가 발생했습니다.");
    } finally {
      setIsDeleting(null);
    }
  };

  const handleExportExcel = () => {
    if (filteredReports.length === 0) {
      alert("다운로드할 압출 작업일보 데이터가 없습니다.");
      return;
    }
    exportExtrusionReportsToExcel(filteredReports, null, "설유철_압출일보현황");
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-teal-200 dark:border-teal-900/60 shadow-xl overflow-hidden p-3.5 sm:p-5 space-y-4 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 sm:p-2.5 rounded-2xl bg-gradient-to-tr from-teal-600 to-emerald-600 text-white shadow-md shrink-0">
            <FileSpreadsheet className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <h3 className="font-black text-sm sm:text-lg text-slate-900 dark:text-white flex items-center gap-2">
              <span>삼랑진공장 압출동 작업일보 실시간 현황</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300 font-black">
                총 {stats.totalCount}건
              </span>
            </h3>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              설유철 책임 전용 압출 1~4호 라인 실시간 작업 실적 및 일보 현황
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => setIsTemplateSettingOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs shadow-xs active:scale-95 transition cursor-pointer"
            title="탭하면 압출 1~4호 라인에 적용할 5대 공정 양식 리스트를 열어 설정합니다"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>⚙️ 양식설정</span>
          </button>
          <button
            type="button"
            onClick={handleExportExcel}
            className="flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition active:scale-95 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>엑셀</span>
          </button>
        </div>
      </div>

      {/* 요약 통계 카드 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3 sm:p-4 rounded-2xl bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-950/30 dark:to-emerald-950/20 border border-teal-200/80 dark:border-teal-900/40">
          <div className="flex items-center justify-between">
            <span className="font-black text-xs text-teal-700 dark:text-teal-300">총 작업일보</span>
            <span className="text-[11px] font-bold text-teal-600 dark:text-teal-400">누적 건수</span>
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono">
            {stats.totalCount} <span className="text-xs font-normal text-slate-500">건</span>
          </div>
        </div>

        <div className="p-3 sm:p-4 rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-950/20 border border-indigo-200/80 dark:border-indigo-900/40">
          <div className="flex items-center justify-between">
            <span className="font-black text-xs text-indigo-700 dark:text-indigo-300">압출 생산량</span>
            <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">생산 실적</span>
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-black text-indigo-700 dark:text-indigo-400 font-mono">
            {stats.totalOutputM.toLocaleString()} <span className="text-xs font-normal text-slate-500">M</span>
          </div>
        </div>

        <div className="p-3 sm:p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 border border-amber-200/80 dark:border-amber-900/40">
          <div className="flex items-center justify-between">
            <span className="font-black text-xs text-amber-700 dark:text-amber-300">스크랩 폐기</span>
            <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400">폐기 중량</span>
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-black text-amber-700 dark:text-amber-400 font-mono">
            {stats.totalScrapKg.toLocaleString()} <span className="text-xs font-normal text-slate-500">Kg</span>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={lineFilter}
              onChange={(e) => setLineFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-200"
            >
              <option value="all">전체 라인</option>
              <option value="1호기">1호기</option>
              <option value="2호기">2호기</option>
              <option value="3호기">3호기</option>
              <option value="4호기">4호기</option>
            </select>
          </div>

          <div className="flex items-center gap-1 bg-white dark:bg-slate-900 px-2 py-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="date"
              value={searchDate}
              onChange={(e) => setSearchDate(e.target.value)}
              className="text-xs bg-transparent border-0 outline-none text-slate-700 dark:text-slate-200 font-bold"
            />
            {searchDate && (
              <button type="button" onClick={() => setSearchDate("")} className="text-slate-400 hover:text-slate-600 text-xs">✕</button>
            )}
          </div>

          <div className="flex items-center gap-1 bg-white dark:bg-slate-900 px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="작업자/조장 검색"
              value={searchWorker}
              onChange={(e) => setSearchWorker(e.target.value)}
              className="text-xs bg-transparent border-0 outline-none w-24 sm:w-28 text-slate-700 dark:text-slate-200 font-bold"
            />
            {searchWorker && (
              <button type="button" onClick={() => setSearchWorker("")} className="text-slate-400 hover:text-slate-600 text-xs">✕</button>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-black border-b border-slate-200 dark:border-slate-700">
              <th className="py-2.5 px-3">일자</th>
              <th className="py-2.5 px-3">라인</th>
              <th className="py-2.5 px-3">작업자/조장</th>
              <th className="py-2.5 px-3">차종 / 품명</th>
              <th className="py-2.5 px-3 text-right">생산량 (M)</th>
              <th className="py-2.5 px-3 text-right">스크랩 (Kg)</th>
              <th className="py-2.5 px-3 text-center">승인상태</th>
              <th className="py-2.5 px-3 text-center">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredReports.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-10 text-center text-slate-400 font-bold">
                  등록된 압출 작업일보가 없습니다.
                </td>
              </tr>
            ) : (
              filteredReports.slice(0, 15).map((r) => {
                const outM = Number(r.totalOutputMeter || r.outputM || r.goodQty || 0) || 0;
                const scrapKg = Number(r.scrapWeightKg || r.scrapKg || r.badQty || 0) || 0;
                const isApproved = Boolean(r.isApproved || r.approved);

                return (
                  <tr
                    key={r.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition cursor-pointer"
                  >
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900 dark:text-white">
                      {r.date || r.workDate}
                    </td>
                    <td className="py-2.5 px-3 font-black text-teal-700 dark:text-teal-300">
                      {r.line || r.extrusionLine || "1호기"}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-slate-800 dark:text-slate-200">
                      {r.worker || r.author || r.leader || "작업자"}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-600 dark:text-slate-400 truncate max-w-xs">
                      {r.carModel || r.vehicleModel || "공통"} {r.productName ? `(${r.productName})` : ""}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-indigo-700 dark:text-indigo-400">
                      {outM.toLocaleString()} M
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-600">
                      {scrapKg.toLocaleString()} Kg
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                        isApproved
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                          : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                      }`}>
                        {isApproved ? "승인완료" : "결재대기"}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={(e) => handleDelete(r.id, e)}
                        disabled={isDeleting === r.id}
                        className="p-1 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition"
                        title="일보 삭제"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 🌟 5대 공정 양식 설정 모달 (설유철 책임 전용 압출 라인별 양식 매핑) */}
      <MajorProcessTemplateSelectModal
        isOpen={isTemplateSettingOpen}
        onClose={() => setIsTemplateSettingOpen(false)}
        title="삼랑진공장 압출동 5대 공정 작업일보 양식 설정"
        subtitle="압출 1~4호 라인별 적용할 표준 5대 공정 양식을 선택 및 매핑하세요."
        companyKey="EXTRUSION"
        companyName="설유철 압출동"
        slots={SEOL_EXTRUSION_SLOTS}
        defaultCategoryId="EXTRUSION"
        onApplyAndOpenReport={(tpl, slotId) => {
          if (onOpenReportModal) {
            onOpenReportModal({ templateId: tpl?.id, line: slotId });
          }
        }}
      />
    </div>
  );
};

export default SeolExtrusionWorkReportTable;
