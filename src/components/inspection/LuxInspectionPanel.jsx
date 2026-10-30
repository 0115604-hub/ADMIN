import React, { useState, useEffect, useMemo } from "react";
import {
  Lightbulb,
  Plus,
  Settings,
  Calendar,
  User,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Trash2,
  Edit2,
  Clock,
  MapPin,
  ChevronRight,
  Eye
} from "lucide-react";
import {
  subscribeLuxReports,
  getLuxInspectionConfig,
  saveLuxInspectionConfig,
  deleteLuxReport,
  DEFAULT_LUX_LOCATION_ITEMS
} from "../../services/luxInspectionService";
import { LuxInspectionModal } from "./LuxInspectionModal";
import { cleanTitleWithoutEmoji } from "../../config/panelThemeConfig";

export const LuxInspectionPanel = ({
  currentProfile = null,
  customSettings = null,
  isInlineEditing = false,
  onUpdateDraft = null
}) => {
  const [reports, setReports] = useState([]);
  const [config, setConfig] = useState(() => getLuxInspectionConfig());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReport, setEditingReport] = useState(null);
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  // 위치 설정 편집 임시 상태
  const [editInspector, setEditInspector] = useState(config.assignedInspector || "설유철 책임");
  const [editLocations, setEditLocations] = useState(config.locationItems || DEFAULT_LUX_LOCATION_ITEMS);

  useEffect(() => {
    const unsub = subscribeLuxReports((list) => {
      setReports(list || []);
    });
    const handleConfigUpdated = (e) => {
      if (e?.detail) {
        setConfig(e.detail);
        setEditInspector(e.detail.assignedInspector);
        setEditLocations(e.detail.locationItems);
      }
    };
    window.addEventListener("oryuk_lux_config_updated", handleConfigUpdated);
    return () => {
      unsub();
      window.removeEventListener("oryuk_lux_config_updated", handleConfigUpdated);
    };
  }, []);

  const rawTitle = customSettings?.customTitle !== undefined ? customSettings.customTitle : "조도측정일보 (월 1회 정기점검)";
  const titleValue = cleanTitleWithoutEmoji(rawTitle) || "조도측정일보 (월 1회 정기점검)";

  // 당월(10월) 작성 여부 체크
  const currentMonthStr = new Date().toISOString().slice(0, 7);
  const thisMonthReport = reports.find((r) => (r.measureDate || "").startsWith(currentMonthStr));

  const handleSaveConfig = async () => {
    const nextConfig = {
      ...config,
      assignedInspector: editInspector.trim() || "설유철 책임",
      locationItems: editLocations
    };
    setConfig(nextConfig);
    await saveLuxInspectionConfig(nextConfig);
    setIsConfigOpen(false);
  };

  const handleLocationNameChange = (idx, newName) => {
    const next = [...editLocations];
    next[idx] = { ...next[idx], name: newName };
    setEditLocations(next);
  };

  const handleLocationSpecChange = (idx, newSpec) => {
    const next = [...editLocations];
    next[idx] = { ...next[idx], specLux: Number(newSpec) || 300 };
    setEditLocations(next);
  };

  const handleAddLocation = () => {
    const nextId = editLocations.length + 1;
    setEditLocations([
      ...editLocations,
      { id: nextId, name: `신규 측정 위치 ${nextId}`, specLux: 300, note: "추가 구역" }
    ]);
  };

  const handleRemoveLocation = (idx) => {
    if (editLocations.length <= 1) return;
    setEditLocations(editLocations.filter((_, i) => i !== idx));
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-3 sm:p-3.5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 text-slate-900 dark:text-white">
      
      {/* 1. 헤더 바 */}
      <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400">
            <Lightbulb className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <h2 className="text-xs sm:text-sm font-black flex items-center gap-2">
              <span>{titleValue}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40 font-bold">
                주기: 월 1회
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-500/40 font-bold">
                전담: {config.assignedInspector}
              </span>
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* 전담자 & 측정위치 수정 설정 버튼 */}
          <button
            type="button"
            onClick={() => setIsConfigOpen(!isConfigOpen)}
            className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
            title="전담자 및 1~16번 측정 위치 설정"
          >
            <Settings className="w-3.5 h-3.5 text-slate-400" />
            <span>{isConfigOpen ? "설정 닫기" : "위치/전담자 설정"}</span>
          </button>

          {/* 신규 조도측정일보 작성 버튼 */}
          <button
            type="button"
            onClick={() => {
              setEditingReport(null);
              setIsModalOpen(true);
            }}
            className="px-3 py-1 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs shadow-md transition active:scale-95 flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>조도측정일보 작성</span>
          </button>
        </div>
      </div>

      {/* 2. 전담자 & 측정 위치 관리 아코디언 설정 패널 (수정 가능) */}
      {isConfigOpen && (
        <div className="p-3.5 rounded-2xl bg-amber-50/50 dark:bg-slate-950/80 border-2 border-amber-400 dark:border-amber-700/60 space-y-3 animate-fadeIn text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-amber-200 dark:border-slate-800">
            <span className="font-black text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
              <span>⚙️ 전담 측정자 지정 &amp; 측정 위치(1~16번) 커스텀</span>
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleAddLocation}
                className="px-2 py-0.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center gap-0.5 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>위치 추가</span>
              </button>
              <button
                type="button"
                onClick={handleSaveConfig}
                className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs cursor-pointer shadow-xs"
              >
                설정 영구 저장
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-600 dark:text-slate-400 text-[11px] font-bold mb-1">
                조도측정 전담 작업자/관리자
              </label>
              <input
                type="text"
                value={editInspector}
                onChange={(e) => setEditInspector(e.target.value)}
                placeholder="예: 설유철 책임"
                className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-bold text-xs outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-600 dark:text-slate-400 text-[11px] font-bold mb-1">
                측정 주기
              </label>
              <div className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 font-bold text-xs">
                월 1회 정기 측정 (매월 1회 작성 후 결재)
              </div>
            </div>
          </div>

          {/* 위치 목록 그리드 */}
          <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
            <span className="text-[11px] font-bold text-slate-500 block">
              측정 위치 및 기준 조도(lx) 목록 (총 {editLocations.length}개소):
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {editLocations.map((loc, idx) => (
                <div
                  key={idx}
                  className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-2"
                >
                  <span className="w-5 text-center font-bold text-slate-400">{idx + 1}</span>
                  <input
                    type="text"
                    value={loc.name}
                    onChange={(e) => handleLocationNameChange(idx, e.target.value)}
                    className="flex-1 px-2 py-1 rounded bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold"
                  />
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={loc.specLux}
                      onChange={(e) => handleLocationSpecChange(idx, e.target.value)}
                      className="w-16 px-1.5 py-1 rounded bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-mono text-right"
                    />
                    <span className="text-[10px] text-slate-400">lx</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveLocation(idx)}
                    className="text-slate-400 hover:text-rose-500 p-1"
                    title="삭제"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. 당월 점검 상태 알림 카드 */}
      <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200/90 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2 text-xs">
        <div className="flex items-center gap-2">
          {thisMonthReport ? (
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          ) : (
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping"></span>
          )}
          <div>
            <span className="font-bold text-slate-700 dark:text-slate-300">
              {currentMonthStr}월 정기 조도 측정 상태:
            </span>{" "}
            {thisMonthReport ? (
              <span className="font-black text-emerald-600 dark:text-emerald-400">
                작성 완료 ({thisMonthReport.measureDate} 점검 / {thisMonthReport.overallResult})
              </span>
            ) : (
              <span className="font-black text-amber-600 dark:text-amber-400">
                당월 미측정 (전담자: {config.assignedInspector} 점검 필요)
              </span>
            )}
          </div>
        </div>
        <span className="text-[11px] text-slate-500">
          누적 점검 보고서: {reports.length}건
        </span>
      </div>

      {/* 4. 조도측정일보 이력 테이블 */}
      {reports.length === 0 ? (
        <div className="p-6 text-center rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-dashed border-slate-300 dark:border-slate-800 text-xs text-slate-500">
          등록된 조도측정일보가 없습니다. 우측 상단의 [조도측정일보 작성] 버튼을 눌러 점검을 시작하세요.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 font-bold text-[11px] border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-2.5">측정일자</th>
                <th className="p-2.5">측정장소 / 공정</th>
                <th className="p-2.5">측정자</th>
                <th className="p-2.5 text-center">전체 측정</th>
                <th className="p-2.5 text-center">부적합 개소</th>
                <th className="p-2.5 text-center">종합 판정</th>
                <th className="p-2.5">특이사항</th>
                <th className="p-2.5 text-center">작업</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {reports.map((rep) => {
                const isPass = rep.overallResult === "적합";
                return (
                  <tr key={rep.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                    <td className="p-2.5 font-mono font-bold text-slate-900 dark:text-white">
                      {rep.measureDate}
                    </td>
                    <td className="p-2.5 font-bold text-slate-700 dark:text-slate-200">
                      {rep.plantLocation}
                    </td>
                    <td className="p-2.5 text-amber-600 dark:text-amber-300 font-bold">
                      {rep.inspector}
                    </td>
                    <td className="p-2.5 text-center font-mono font-bold">
                      {rep.items?.length || 16}개소
                    </td>
                    <td className="p-2.5 text-center font-mono">
                      {rep.failCount > 0 ? (
                        <span className="text-rose-600 dark:text-rose-400 font-black">
                          {rep.failCount}개소
                        </span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>
                    <td className="p-2.5 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-md font-black text-[10.5px] border ${
                          isPass
                            ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-400/50"
                            : "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-400/50"
                        }`}
                      >
                        {rep.overallResult || "적합"}
                      </span>
                    </td>
                    <td className="p-2.5 text-slate-600 dark:text-slate-400 truncate max-w-xs">
                      {rep.summaryNotes || "-"}
                    </td>
                    <td className="p-2.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingReport(rep);
                            setIsModalOpen(true);
                          }}
                          className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-[11px] cursor-pointer"
                        >
                          조회/수정
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm("해당 조도측정일보를 삭제하시겠습니까?")) {
                              deleteLuxReport(rep.id);
                            }
                          }}
                          className="p-1 rounded text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition cursor-pointer"
                          title="삭제"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* 조도측정일보 입력/수정 모달 */}
      {isModalOpen && (
        <LuxInspectionModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingReport(null);
          }}
          initialData={editingReport}
          config={config}
          currentProfile={currentProfile}
        />
      )}
    </div>
  );
};
export default LuxInspectionPanel;
