import React, { useState, useMemo } from "react";
import {
  Clock,
  UserCheck,
  Plus,
  Trash2,
  Download,
  Search,
  Filter,
  CheckCircle2,
  Calendar,
  Layers,
  Save,
  Users,
  Briefcase,
  AlertCircle
} from "lucide-react";
import { useAuth, PLANTS } from "../context/AuthContext";
import { useMonth } from "../context/MonthContext";
import * as XLSX from "xlsx";

const SHIFT_TYPES = [
  "토요특근 (08:30 ~ 17:30)",
  "일요특근 (08:30 ~ 17:30)",
  "평일연장 (17:30 ~ 20:30)",
  "야간특근 (20:30 ~ 05:30)",
  "휴일야간 (20:30 ~ 05:30)"
];

const INITIAL_OVERTIME_LOGS = [
  {
    id: 1,
    date: "2026-08-29",
    plant: "삼랑진공장",
    workerName: "설유철",
    title: "책임",
    process: "압출동 관리",
    shiftType: "토요특근 (08:30 ~ 17:30)",
    hours: 8.0,
    reason: "9BQC FRT 긴급 납기 대응을 위한 압출 1호기 주말 생산 가동",
    approval: "승인완료"
  },
  {
    id: 2,
    date: "2026-08-29",
    plant: "삼랑진공장",
    workerName: "윤경수",
    title: "책임",
    process: "가공동 관리",
    shiftType: "토요특근 (08:30 ~ 17:30)",
    hours: 8.0,
    reason: "DT 수출용 웨더스트립 절단 및 피팅 가공 라인 생산량 달성",
    approval: "승인완료"
  },
  {
    id: 3,
    date: "2026-08-29",
    plant: "삼랑진공장",
    workerName: "양인나",
    title: "선임",
    process: "가공동 관리",
    shiftType: "토요특근 (08:30 ~ 17:30)",
    hours: 8.0,
    reason: "DT 수출품 완제품 조립 및 수출용 포장 라인 가동",
    approval: "승인완료"
  },
  {
    id: 4,
    date: "2026-08-29",
    plant: "삼랑진공장",
    workerName: "이창엽",
    title: "책임",
    process: "품질관리",
    shiftType: "토요특근 (08:30 ~ 17:30)",
    hours: 8.0,
    reason: "토요 주말 생산품 9BQC 및 DT 전수 품질 치수 측정 및 합격 승인",
    approval: "승인완료"
  },
  {
    id: 5,
    date: "2026-08-29",
    plant: "한림공장",
    workerName: "김동욱",
    title: "책임",
    process: "총괄관리",
    shiftType: "토요특근 (08:30 ~ 17:30)",
    hours: 8.0,
    reason: "한림공장 NX4 코너 몰딩 사출 라인 주말 공정 총괄 점검",
    approval: "승인완료"
  },
  {
    id: 6,
    date: "2026-08-29",
    plant: "한림공장",
    workerName: "우창용",
    title: "선임",
    process: "가공동 관리",
    shiftType: "토요특근 (08:30 ~ 17:30)",
    hours: 8.0,
    reason: "NX4 사출품 후가공 및 다듬질 작업",
    approval: "승인완료"
  },
  {
    id: 7,
    date: "2026-08-29",
    plant: "한림공장",
    workerName: "오상민",
    title: "선임",
    process: "가공동 관리",
    shiftType: "토요특근 (08:30 ~ 17:30)",
    hours: 8.0,
    reason: "완제품 박스 포장 및 파렛트 적재 출하 준비",
    approval: "승인완료"
  }
];

const STORAGE_KEY = "factory_overtime_status_logs_v1";

export const OvertimeStatusView = () => {
  const { currentProfile, isAdmin } = useAuth();
  const { selectedMonth } = useMonth();

  const [logs, setLogs] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : INITIAL_OVERTIME_LOGS;
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPlant, setSelectedPlant] = useState("all");
  const [selectedProcess, setSelectedProcess] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const defaultWorker = currentProfile?.name || "설유철";
  const defaultTitle = currentProfile?.title || "책임";
  const defaultPlant = currentProfile?.plant || "삼랑진공장";
  const defaultProcess = currentProfile?.assignedProcess || "압출동 관리";

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    plant: defaultPlant,
    workerName: defaultWorker,
    title: defaultTitle,
    process: defaultProcess,
    shiftType: "토요특근 (08:30 ~ 17:30)",
    hours: 8.0,
    reason: "",
    approval: "승인완료"
  });

  // KPI Calculations
  const { totalHours, totalWorkers, samHours, halHours } = useMemo(() => {
    const totalH = logs.reduce((sum, l) => sum + (Number(l.hours) || 0), 0);
    const samH = logs.filter((l) => l.plant === "삼랑진공장").reduce((sum, l) => sum + (Number(l.hours) || 0), 0);
    const halH = logs.filter((l) => l.plant === "한림공장").reduce((sum, l) => sum + (Number(l.hours) || 0), 0);
    return {
      totalHours: totalH,
      totalWorkers: logs.length,
      samHours: samH,
      halHours: halH
    };
  }, [logs]);

  // Save Overtime
  const handleSave = (e) => {
    e.preventDefault();
    if (!formData.reason.trim()) {
      alert("특근 사유 및 주요 작업 내용을 입력해 주세요.");
      return;
    }

    const newEntry = {
      id: Date.now(),
      ...formData,
      hours: Number(formData.hours) || 0
    };

    const updated = [newEntry, ...logs];
    setLogs(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    setFormData({
      date: new Date().toISOString().split("T")[0],
      plant: defaultPlant,
      workerName: defaultWorker,
      title: defaultTitle,
      process: defaultProcess,
      shiftType: "토요특근 (08:30 ~ 17:30)",
      hours: 8.0,
      reason: "",
      approval: "승인완료"
    });
    setIsModalOpen(false);
  };

  // Delete
  const handleDelete = (id) => {
    if (!window.confirm("이 특근 내역을 삭제하시겠습니까?")) return;
    const updated = logs.filter((l) => l.id !== id);
    setLogs(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  // Filtered
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchPlant = selectedPlant === "all" || log.plant === selectedPlant;
      const matchProcess = selectedProcess === "all" || log.process === selectedProcess;
      const matchSearch =
        log.workerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.process.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.reason.toLowerCase().includes(searchTerm.toLowerCase());

      return matchPlant && matchProcess && matchSearch;
    });
  }, [logs, selectedPlant, selectedProcess, searchTerm]);

  // Export Excel
  const handleExportExcel = () => {
    const rows = [
      ["공장별 특근 현황 관리 대장"],
      ["조회일자", new Date().toLocaleDateString(), "총 특근시간", `${totalHours}시간`, "특근 누적인원", `${totalWorkers}명`],
      [],
      ["NO", "특근일자", "공장", "성명", "직급", "담당공정", "근무구분", "특근시간", "특근 사유 및 주요 작업내용", "승인상태"]
    ];

    filteredLogs.forEach((l, idx) => {
      rows.push([
        idx + 1,
        l.date,
        l.plant,
        l.workerName,
        l.title,
        l.process,
        l.shiftType,
        l.hours,
        l.reason,
        l.approval
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "특근현황");
    XLSX.writeFile(wb, `공장_특근현황_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-24">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-teal-900 via-emerald-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold">
              <Clock className="w-3.5 h-3.5" />
              <span>공장별 근태 및 특근 실적 관리</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              특근현황
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
              삼랑진공장 및 한림공장 작업자의 주말(토/일) 특근, 평일 연장 및 야간 특근 내역을 기록하고 통계를 실시간으로 집계합니다.
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
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-black shadow-lg shadow-emerald-500/25 active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>특근 내역 등록</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold text-slate-400">총 특근 누적 시간</span>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
            {totalHours} 시간
          </p>
          <p className="text-xs font-semibold text-slate-400 mt-1">
            긴급 납기 및 생산 대응
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold text-slate-400">특근 누적 인원</span>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {totalWorkers} 명
          </p>
          <p className="text-xs font-semibold text-slate-400 mt-1">
            공장 전원 정상 투입
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold text-slate-400">삼랑진공장 특근 시간</span>
          <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-2">
            {samHours} 시간
          </p>
          <p className="text-xs font-semibold text-slate-400 mt-1">
            압출 / 가공 / 품질 4명 투입
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold text-slate-400">한림공장 특근 시간</span>
          <p className="text-2xl font-black text-teal-600 dark:text-teal-400 mt-2">
            {halHours} 시간
          </p>
          <p className="text-xs font-semibold text-slate-400 mt-1">
            사출 / 가공 3명 투입
          </p>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="작업자명, 담당공정, 사유 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <select
              value={selectedPlant}
              onChange={(e) => setSelectedPlant(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200"
            >
              <option value="all">전체 공장</option>
              <option value="삼랑진공장">삼랑진공장</option>
              <option value="한림공장">한림공장</option>
            </select>

            <select
              value={selectedProcess}
              onChange={(e) => setSelectedProcess(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200"
            >
              <option value="all">전체 공정</option>
              <option value="총괄관리">총괄관리</option>
              <option value="압출동 관리">압출동 관리</option>
              <option value="가공동 관리">가공동 관리</option>
              <option value="품질관리">품질관리</option>
              <option value="경리업무">경리업무</option>
            </select>
          </div>
        </div>

        {/* Overtime Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse min-w-[850px]">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-slate-500 font-black">
                <th className="py-3 px-3">일자</th>
                <th className="py-3 px-3">공장</th>
                <th className="py-3 px-3">성명 / 직급</th>
                <th className="py-3 px-3">담당 공정</th>
                <th className="py-3 px-3">근무 형태</th>
                <th className="py-3 px-3 text-right">특근 시간</th>
                <th className="py-3 px-3">특근 사유 및 주요 작업내용</th>
                <th className="py-3 px-3 text-center">승인</th>
                <th className="py-3 px-3 text-center">삭제</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    등록된 특근 내역이 없습니다.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-3 font-semibold text-slate-500">
                      {log.date}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                        log.plant === "한림공장"
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                          : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                      }`}>
                        {log.plant}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-black text-slate-900 dark:text-white">
                      {log.workerName} {log.title}
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
                        {log.process}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-700 dark:text-slate-300">
                      {log.shiftType}
                    </td>
                    <td className="py-3 px-3 text-right font-black text-emerald-600 dark:text-emerald-400 text-sm">
                      {log.hours} 시간
                    </td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-300 max-w-xs truncate" title={log.reason}>
                      {log.reason}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                        {log.approval}
                      </span>
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
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900 dark:text-white">
                    특근 내역 등록
                  </h3>
                  <p className="text-xs text-slate-400">
                    주말 및 야간 특근 대상자 및 사유를 등록합니다.
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
                    특근 일자
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    공장 구분
                  </label>
                  <select
                    value={formData.plant}
                    onChange={(e) => setFormData({ ...formData, plant: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="삼랑진공장">삼랑진공장</option>
                    <option value="한림공장">한림공장</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    작업자 성명
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="예: 설유철"
                    value={formData.workerName}
                    onChange={(e) => setFormData({ ...formData, workerName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    담당 공정
                  </label>
                  <select
                    value={formData.process}
                    onChange={(e) => setFormData({ ...formData, process: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="총괄관리">총괄관리</option>
                    <option value="압출동 관리">압출동 관리</option>
                    <option value="가공동 관리">가공동 관리</option>
                    <option value="품질관리">품질관리</option>
                    <option value="경리업무">경리업무</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    근무 형태
                  </label>
                  <select
                    value={formData.shiftType}
                    onChange={(e) => setFormData({ ...formData, shiftType: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {SHIFT_TYPES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    특근 시간 (시간)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    max="24"
                    required
                    value={formData.hours}
                    onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-black text-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">
                  특근 사유 및 주요 작업 내용
                </label>
                <textarea
                  required
                  rows="2"
                  placeholder="예: 9BQC 긴급 출하 대응을 위한 압출 라인 주말 가동"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black shadow-md shadow-emerald-500/25 active:scale-95 transition-all flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>특근 내역 저장</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
