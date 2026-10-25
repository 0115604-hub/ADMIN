import React, { useState, useMemo } from "react";
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
  onNavigateTab,
  workLogs = [],
  currentProfile,
  isWorkLogApproved
}) => {
  const [isTemplateSettingOpen, setIsTemplateSettingOpen] = useState(false);
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
        (l.plant === "한림공장" && proc.includes("외주가공"))
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

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-teal-200 dark:border-teal-900/60 shadow-xl overflow-hidden p-3.5 sm:p-5 space-y-4 text-left">
      {/* Header and Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 sm:p-2.5 rounded-2xl bg-gradient-to-tr from-teal-600 via-emerald-600 to-cyan-600 text-white shadow-md shrink-0">
            <FileSpreadsheet className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <h3 className="font-black text-sm sm:text-lg text-slate-900 dark:text-white flex items-center gap-2">
              <span>(주)부림텍 외주가공 작업일보 실시간 현황</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300 font-black">
                총 {stats.total}건
              </span>
            </h3>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              한림공장 (주)부림텍 외주가공 일일 작업 실적 및 실시간 결재 승인 현황
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => setIsTemplateSettingOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs shadow-xs active:scale-95 transition cursor-pointer"
            title="탭하면 부림텍 외주가공에 적용할 5대 공정 양식 리스트를 열어 설정합니다"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>⚙️ 양식설정</span>
          </button>
          {handleOpenWorkLogModal && (
            <button
              type="button"
              onClick={() => handleOpenWorkLogModal()}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-black text-xs shadow-xs active:scale-95 transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ 일보 작성</span>
            </button>
          )}
        </div>
      </div>

      {/* 요약 통계 카드 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3 sm:p-4 rounded-2xl bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-950/30 dark:to-emerald-950/20 border border-teal-200/80 dark:border-teal-900/40">
          <div className="flex items-center justify-between">
            <span className="font-black text-xs text-teal-700 dark:text-teal-300">총 작업일보</span>
            <span className="text-[11px] font-bold text-teal-600 dark:text-teal-400">누적 등록</span>
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono">
            {stats.total} <span className="text-xs font-normal text-slate-500">건</span>
          </div>
        </div>

        <div className="p-3 sm:p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/20 border border-emerald-200/80 dark:border-emerald-900/40">
          <div className="flex items-center justify-between">
            <span className="font-black text-xs text-emerald-700 dark:text-emerald-300">승인완료</span>
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">결재율 {stats.rate}%</span>
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-black text-emerald-700 dark:text-emerald-400 font-mono">
            {stats.approved} <span className="text-xs font-normal text-slate-500">건</span>
          </div>
        </div>

        <div className="p-3 sm:p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 border border-amber-200/80 dark:border-amber-900/40">
          <div className="flex items-center justify-between">
            <span className="font-black text-xs text-amber-700 dark:text-amber-300">결재대기</span>
            <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400">승인대기</span>
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-black text-amber-700 dark:text-amber-400 font-mono">
            {stats.pending} <span className="text-xs font-normal text-slate-500">건</span>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-black border-b border-slate-200 dark:border-slate-700">
              <th className="py-2.5 px-3">일자</th>
              <th className="py-2.5 px-3">작성자</th>
              <th className="py-2.5 px-3">공정 / 품목</th>
              <th className="py-2.5 px-3">주요 작업 내용</th>
              <th className="py-2.5 px-3 text-center">사진</th>
              <th className="py-2.5 px-3 text-center">결재상태</th>
              <th className="py-2.5 px-3 text-center">상세보기</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {burimLogs.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-10 text-center text-slate-400 font-bold">
                  등록된 부림텍 외주가공 작업일보가 없습니다. 상단의 [+ 일보 작성] 버튼을 클릭해 등록해 주십시오.
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
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition cursor-pointer"
                  >
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900 dark:text-white">
                      {log.workDate || log.date}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-teal-700 dark:text-teal-300">
                      {log.writer || "부림텍"}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300">
                        {log.assignedProcess || log.process || "외주가공"}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300 max-w-xs truncate font-medium">
                      {log.workContent || log.description || log.content || "-"}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {hasPhotos ? (
                        <span className="inline-flex items-center gap-0.5 text-indigo-600 dark:text-indigo-400 font-bold">
                          <Camera className="w-3.5 h-3.5" />
                          <span>{log.images.length}</span>
                        </span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                          approved
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                            : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                        }`}
                      >
                        {approved ? "승인완료" : "결재대기"}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenLogDetail && handleOpenLogDetail(log);
                        }}
                        className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition"
                      >
                        보기
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 🌟 5대 공정 양식 설정 모달 (부림텍 외주가공 공정별 양식 매핑) */}
      <MajorProcessTemplateSelectModal
        isOpen={isTemplateSettingOpen}
        onClose={() => setIsTemplateSettingOpen(false)}
        title="(주)부림텍 외주가공 5대 공정 작업일보 양식 설정"
        subtitle="부림텍 외주가공 공정별 적용할 표준 5대 공정 양식을 선택 및 매핑하세요."
        companyKey="BURIMTECH"
        companyName="(주)부림텍"
        slots={BURIMTECH_SLOTS}
        defaultCategoryId="MATERIAL_PREP"
        onApplyAndOpenReport={(tpl, slotId) => {
          if (handleOpenWorkLogModal) {
            handleOpenWorkLogModal({
              company: "부림텍",
              assignedProcess: slotId === "STANDARD" ? "외주가공" : slotId,
              templateId: tpl?.id
            });
          }
        }}
      />
    </div>
  );
};

export default BurimtechWorkReportTable;
