import React, { useState, useMemo } from "react";
import {
  PauseCircle,
  PlayCircle,
  Clock,
  Plus,
  Trash2,
  Download,
  Filter,
  Search,
  CheckCircle2,
  AlertTriangle,
  Factory,
  Save,
  Calendar,
  Layers,
  TrendingDown,
  Activity,
  Wrench
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useMonth } from "../context/MonthContext";
import * as XLSX from "xlsx";

export const EXTRUSION_LINES = [
  "PVC LINE",
  "PCM 1호 LINE",
  "PCM 3호 LINE",
  "TPE 1호 LINE"
];

export const DOWNTIME_REASONS = [
  "형교환",
  "원료 / 칼라 교체 (퍼징)",
  "온도 안정화 / 승온 대기",
  "설비 정기 점검 / 청소",
  "기계 고장 / 긴급 수리",
  "자재 대기 / 공급 지연",
  "작업 준비 / 교대 점검",
  "기타"
];

const INITIAL_DOWNTIME_LOGS = [
  {
    id: 1,
    date: "2026-08-28",
    week: "8월 4주차",
    plant: "삼랑진공장",
    machine: "PCM 1호 LINE",
    durationMinutes: 45,
    reason: "형교환",
    details: "DT SILL SEAL 형교환 및 피팅 세팅 완료",
    actionTaken: "금형 체결 및 145도 승온 정상화 완료",
    operator: "설유철 책임",
    status: "조치완료"
  },
  {
    id: 2,
    date: "2026-08-28",
    week: "8월 4주차",
    plant: "삼랑진공장",
    machine: "PCM 3호 LINE",
    durationMinutes: 30,
    reason: "형교환",
    details: "DT 호리젠탈 형교환 및 다이스 센터 정렬 완료",
    actionTaken: "금형 장착 및 시험 압출 양품 확인",
    operator: "설유철 책임",
    status: "조치완료"
  },
  {
    id: 3,
    date: "2026-08-27",
    week: "8월 4주차",
    plant: "삼랑진공장",
    machine: "TPE 1호 LINE",
    durationMinutes: 40,
    reason: "형교환",
    details: "JA 전용 TPE 압출 형교환 및 원료 투입 점검",
    actionTaken: "호퍼 청소 및 스크류 잔류물 퍼징 완료",
    operator: "설유철 책임",
    status: "조치완료"
  },
  {
    id: 4,
    date: "2026-08-26",
    week: "8월 4주차",
    plant: "삼랑진공장",
    machine: "PVC LINE",
    durationMinutes: 25,
    reason: "온도 안정화 / 승온 대기",
    details: "PVC 압출 다이스 3존 히터 온도 편차 발생에 따른 승온 안정화",
    actionTaken: "열전대 센서 체결 상태 점검 및 온도 편차 ±1도 이내 정상화",
    operator: "설유철 책임",
    status: "조치완료"
  }
];

const STORAGE_KEY = "factory_extrusion_downtime_logs_v2_exact_lines";

export const ExtrusionDowntimeView = () => {
  const { currentProfile, isAdmin } = useAuth();
  const { selectedMonth } = useMonth();

  const monthParts = selectedMonth.split("-");
  const monthTitle = `${monthParts[0]}년 ${monthParts[1]}월`;

  const [logs, setLogs] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : INITIAL_DOWNTIME_LOGS;
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMachine, setSelectedMachine] = useState("all");
  const [selectedReason, setSelectedReason] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const defaultOperator = `${currentProfile?.name || "설유철"} ${currentProfile?.title || "책임"}`;
  const defaultPlant = currentProfile?.plant || "삼랑진공장";

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    week: "8월 4주차",
    plant: defaultPlant,
    machine: "PCM 1호 LINE",
    durationMinutes: 30,
    reason: "형교환",
    details: "",
    actionTaken: "",
    operator: defaultOperator
  });

  // KPI Calculations
  const totalDowntimeMinutes = useMemo(() => {
    return logs.reduce((sum, log) => sum + (Number(log.durationMinutes) || 0), 0);
  }, [logs]);

  const totalDowntimeHours = (totalDowntimeMinutes / 60).toFixed(1);
  const standardWeeklyHours = 40 * 4; // 4 lines * 40 hours = 160 hours
  const operationRatio = (100 - (totalDowntimeMinutes / (standardWeeklyHours * 60)) * 100).toFixed(1);

  // Save new log
  const handleSave = (e) => {
    e.preventDefault();
    if (!formData.details.trim()) {
      alert("비가동 세부 내용을 입력해 주세요.");
      return;
    }

    const newEntry = {
      id: Date.now(),
      ...formData,
      durationMinutes: Number(formData.durationMinutes) || 0,
      status: "조치완료"
    };

    const updated = [newEntry, ...logs];
    setLogs(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    setFormData({
      date: new Date().toISOString().split("T")[0],
      week: "8월 4주차",
      plant: defaultPlant,
      machine: "PCM 1호 LINE",
      durationMinutes: 30,
      reason: "형교환",
      details: "",
      actionTaken: "",
      operator: defaultOperator
    });
    setIsModalOpen(false);
  };

  // Delete log
  const handleDelete = (id) => {
    if (!window.confirm("이 비가동 내역을 삭제하시겠습니까?")) return;
    const updated = logs.filter((l) => l.id !== id);
    setLogs(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  // Filtered logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchMachine = selectedMachine === "all" || log.machine === selectedMachine;
      const matchReason = selectedReason === "all" || log.reason === selectedReason;
      const matchSearch =
        log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.actionTaken.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.operator.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.machine.toLowerCase().includes(searchTerm.toLowerCase());

      return matchMachine && matchReason && matchSearch;
    });
  }, [logs, selectedMachine, selectedReason, searchTerm]);

  // Export to Excel
  const handleExportExcel = () => {
    const rows = [
      ["압출동 주간 비가동 내역 관리 보고서"],
      ["조회일자", new Date().toLocaleDateString(), "총 비가동시간", `${totalDowntimeMinutes}분 (${totalDowntimeHours}시간)`, "설비 가동률", `${operationRatio}%`],
      [],
      ["NO", "일자", "주차", "공장", "압출 LINE", "비가동시간(분)", "비가동 구분", "세부내용", "조치사항", "담당자", "상태"]
    ];

    filteredLogs.forEach((l, idx) => {
      rows.push([
        idx + 1,
        l.date,
        l.week,
        l.plant,
        l.machine,
        l.durationMinutes,
        l.reason,
        l.details,
        l.actionTaken,
        l.operator,
        l.status
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "압출동 비가동내역");
    XLSX.writeFile(wb, `압출동_주간_비가동내역_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-24">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-amber-900 via-orange-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-semibold">
              <Wrench className="w-3.5 h-3.5" />
              <span>압출 4개 LINE (PVC / PCM 1호 / PCM 3호 / TPE 1호) 설비 가동 효율</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              압출동 주간 비가동 내역
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
              PVC LINE, PCM 1호 LINE, PCM 3호 LINE, TPE 1호 LINE의 형교환, 승온대기, 퍼징 등 주간 비가동 시간을 체계적으로 분석하여 최적의 가동률을 달성합니다.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all shadow-sm"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>엑셀 다운로드</span>
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black shadow-lg shadow-amber-500/25 active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>비가동 내역 등록</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold text-slate-400">금주 총 비가동 시간</span>
          <p className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-2">
            {totalDowntimeMinutes} 분
          </p>
          <p className="text-xs font-semibold text-slate-400 mt-1">
            약 {totalDowntimeHours} 시간 손실
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold text-slate-400">압출 4개 LINE 평균 가동률</span>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
            {operationRatio}%
          </p>
          <p className="text-xs font-semibold text-slate-400 mt-1">
            주간 목표(96.0%) 대비 양호
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold text-slate-400">총 비가동 발생 건수</span>
          <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-2">
            {logs.length} 건
          </p>
          <p className="text-xs font-semibold text-slate-400 mt-1">
            형교환 및 퍼징 위주
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold text-slate-400">압출 공정 총괄 관리자</span>
          <p className="text-xl font-black text-slate-900 dark:text-white mt-2">
            설유철 책임
          </p>
          <p className="text-xs font-semibold text-slate-400 mt-1">
            삼랑진공장 압출동
          </p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="LINE, 사유, 조치내용, 담당자 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {/* Extrusion Line Filter */}
            <select
              value={selectedMachine}
              onChange={(e) => setSelectedMachine(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200"
            >
              <option value="all">전체 압출 LINE</option>
              {EXTRUSION_LINES.map((line) => (
                <option key={line} value={line}>
                  {line}
                </option>
              ))}
            </select>

            {/* Reason Filter */}
            <select
              value={selectedReason}
              onChange={(e) => setSelectedReason(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200"
            >
              <option value="all">전체 비가동 사유</option>
              {DOWNTIME_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Downtime Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-slate-500 font-black">
                <th className="py-3 px-3">일자 / 주차</th>
                <th className="py-3 px-3">압출 LINE</th>
                <th className="py-3 px-3 text-right">비가동 시간</th>
                <th className="py-3 px-3">비가동 구분 / 원인</th>
                <th className="py-3 px-3">세부 내용</th>
                <th className="py-3 px-3">조치 사항</th>
                <th className="py-3 px-3">조치자</th>
                <th className="py-3 px-3 text-center">삭제</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    등록된 비가동 내역이 없습니다.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-3 font-semibold text-slate-500">
                      <div>{log.date}</div>
                      <span className="text-[10px] text-amber-600 font-bold">{log.week}</span>
                    </td>
                    <td className="py-3 px-3 font-black text-slate-900 dark:text-white">
                      <span className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 font-extrabold text-[11px] border border-amber-200/60 dark:border-amber-800/60">
                        {log.machine}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-black text-rose-600 dark:text-rose-400 text-sm">
                      {log.durationMinutes} 분
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-800 dark:text-slate-200">
                      <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                        log.reason === "형교환"
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300"
                          : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                      }`}>
                        {log.reason}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-300 max-w-xs truncate" title={log.details}>
                      {log.details}
                    </td>
                    <td className="py-3 px-3 text-slate-500 dark:text-slate-400 max-w-xs truncate" title={log.actionTaken}>
                      {log.actionTaken}
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                      {log.operator}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => handleDelete(log.id)}
                        className="p-1.5 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors"
                        title="삭제"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Registration Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                  <PauseCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900 dark:text-white">
                    압출동 비가동 내역 등록
                  </h3>
                  <p className="text-xs text-slate-400">
                    PVC LINE, PCM 1·3호 LINE, TPE 1호 LINE 형교환 및 비가동 등록
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-xs font-bold text-slate-400 hover:text-slate-600"
              >
                닫기
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    발생 일자
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    압출 LINE 선택
                  </label>
                  <select
                    value={formData.machine}
                    onChange={(e) => setFormData({ ...formData, machine: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-black text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    {EXTRUSION_LINES.map((line) => (
                      <option key={line} value={line}>
                        {line}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    비가동 시간 (분)
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="예: 30"
                    value={formData.durationMinutes}
                    onChange={(e) => setFormData({ ...formData, durationMinutes: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-black text-rose-600 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    비가동 구분 / 원인
                  </label>
                  <select
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border-2 border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-950/40 font-black text-amber-900 dark:text-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    {DOWNTIME_REASONS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">
                  비가동 세부 내용 (차종/금형/작업)
                </label>
                <textarea
                  required
                  rows="2"
                  placeholder="예: DT SILL SEAL 형교환 및 피팅 세팅 진행"
                  value={formData.details}
                  onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                ></textarea>
              </div>

              <div>
                <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">
                  조치 사항 및 정상화 내용
                </label>
                <textarea
                  rows="2"
                  placeholder="예: 금형 체결 후 145도 승온 완료, 시험 압출 양품 확인"
                  value={formData.actionTaken}
                  onChange={(e) => setFormData({ ...formData, actionTaken: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                ></textarea>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 font-bold hover:bg-slate-100"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black shadow-md shadow-amber-500/25 active:scale-95 transition-all flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>비가동 내역 저장</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
