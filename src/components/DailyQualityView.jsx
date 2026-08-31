import React, { useState, useMemo } from "react";
import {
  CheckSquare,
  ShieldCheck,
  AlertCircle,
  Plus,
  Trash2,
  Download,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Save,
  Calendar,
  Layers,
  Sparkles,
  TrendingUp,
  Award
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useMonth } from "../context/MonthContext";
import * as XLSX from "xlsx";

const DEFECT_TYPES = [
  "치수 편차 (공차 초과)",
  "외관 스크래치 / 찍힘",
  "원료 기포 (Void / Burrs)",
  "표면 광택 불량",
  "절단면 거침 / 단차",
  "밀림 / 휨 변형",
  "이물 혼입",
  "기타"
];

const INITIAL_QUALITY_LOGS = [
  {
    id: 1,
    date: "2026-08-28",
    plant: "삼랑진공장",
    carType: "9BQC",
    productName: "9BQC FRT LH 웨더스트립",
    prodQty: 2450,
    inspectQty: 2450,
    goodQty: 2446,
    defectQty: 4,
    defectType: "치수 편차 (공차 초과)",
    judgment: "적합",
    actionTaken: "금형 피팅 미세 조정 및 전수 치수 측정 합격",
    inspector: "이창엽 책임"
  },
  {
    id: 2,
    date: "2026-08-28",
    plant: "삼랑진공장",
    carType: "DT",
    productName: "DT 수출용 웨더스트립",
    prodQty: 1800,
    inspectQty: 1800,
    goodQty: 1795,
    defectQty: 5,
    defectType: "외관 스크래치 / 찍힘",
    judgment: "적합",
    actionTaken: "이송 가이드 롤러 테이핑 보강 및 불량품 폐기",
    inspector: "이창엽 책임"
  },
  {
    id: 3,
    date: "2026-08-28",
    plant: "삼랑진공장",
    carType: "PCM",
    productName: "PCM 압출 루프 몰딩",
    prodQty: 4200,
    inspectQty: 4200,
    goodQty: 4196,
    defectQty: 4,
    defectType: "원료 기포 (Void / Burrs)",
    judgment: "적합",
    actionTaken: "원료 호퍼 탈기 라인 진공압 보강",
    inspector: "이창엽 책임"
  },
  {
    id: 4,
    date: "2026-08-28",
    plant: "한림공장",
    carType: "NX4",
    productName: "NX4 코너 몰딩 사출품",
    prodQty: 3200,
    inspectQty: 3200,
    goodQty: 3197,
    defectQty: 3,
    defectType: "원료 기포 (Void / Burrs)",
    judgment: "적합",
    actionTaken: "사출 버(Burr) 제거 지그 교체 완료",
    inspector: "김동욱 책임"
  }
];

const STORAGE_KEY = "factory_daily_quality_logs_v1";

export const DailyQualityView = () => {
  const { currentProfile } = useAuth();
  const { selectedMonth } = useMonth();

  const [logs, setLogs] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : INITIAL_QUALITY_LOGS;
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPlant, setSelectedPlant] = useState("all");
  const [selectedCarType, setSelectedCarType] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const defaultInspector = `${currentProfile?.name || "이창엽"} ${currentProfile?.title || "책임"}`;
  const defaultPlant = currentProfile?.plant || "삼랑진공장";

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    plant: defaultPlant,
    carType: "9BQC",
    productName: "9BQC FRT LH 웨더스트립",
    prodQty: 2000,
    inspectQty: 2000,
    goodQty: 1996,
    defectQty: 4,
    defectType: "치수 편차 (공차 초과)",
    judgment: "적합",
    actionTaken: "전수 측정 및 양품 출하 검사 완료",
    inspector: defaultInspector
  });

  // KPI Calculations
  const { totalInspect, totalGood, totalDefect, yieldRate, defectRate } = useMemo(() => {
    const inspect = logs.reduce((sum, l) => sum + (Number(l.inspectQty) || 0), 0);
    const good = logs.reduce((sum, l) => sum + (Number(l.goodQty) || 0), 0);
    const defect = logs.reduce((sum, l) => sum + (Number(l.defectQty) || 0), 0);
    const yRate = inspect > 0 ? ((good / inspect) * 100).toFixed(2) : "100.00";
    const dRate = inspect > 0 ? ((defect / inspect) * 100).toFixed(2) : "0.00";
    return { totalInspect: inspect, totalGood: good, totalDefect: defect, yieldRate: yRate, defectRate: dRate };
  }, [logs]);

  // Save quality log
  const handleSave = (e) => {
    e.preventDefault();
    if (!formData.productName.trim()) {
      alert("품목명을 입력해 주세요.");
      return;
    }

    const prod = Number(formData.prodQty) || 0;
    const inspect = Number(formData.inspectQty) || prod;
    const defect = Number(formData.defectQty) || 0;
    const good = Math.max(0, inspect - defect);

    const newEntry = {
      id: Date.now(),
      ...formData,
      prodQty: prod,
      inspectQty: inspect,
      goodQty: good,
      defectQty: defect
    };

    const updated = [newEntry, ...logs];
    setLogs(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    setFormData({
      date: new Date().toISOString().split("T")[0],
      plant: defaultPlant,
      carType: "9BQC",
      productName: "9BQC FRT LH 웨더스트립",
      prodQty: 2000,
      inspectQty: 2000,
      goodQty: 1996,
      defectQty: 4,
      defectType: "치수 편차 (공차 초과)",
      judgment: "적합",
      actionTaken: "",
      inspector: defaultInspector
    });
    setIsModalOpen(false);
  };

  // Delete
  const handleDelete = (id) => {
    if (!window.confirm("이 품질 검사 내역을 삭제하시겠습니까?")) return;
    const updated = logs.filter((l) => l.id !== id);
    setLogs(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  // Filtered logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchPlant = selectedPlant === "all" || log.plant === selectedPlant;
      const matchCar = selectedCarType === "all" || log.carType === selectedCarType;
      const matchSearch =
        log.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.carType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.defectType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.inspector.toLowerCase().includes(searchTerm.toLowerCase());

      return matchPlant && matchCar && matchSearch;
    });
  }, [logs, selectedPlant, selectedCarType, searchTerm]);

  // Export Excel
  const handleExportExcel = () => {
    const rows = [
      ["일일 품질 현황 및 검사 결과 보고서"],
      ["조회일자", new Date().toLocaleDateString(), "총 검사수량", `${totalInspect.toLocaleString()}개`, "양품률", `${yieldRate}%`, "불량률", `${defectRate}%`],
      [],
      ["NO", "검사일자", "공장", "차종", "품목명", "생산수량", "검사수량", "양품수량", "불량수량", "불량률(%)", "불량유형", "판정", "조치사항", "검사자"]
    ];

    filteredLogs.forEach((l, idx) => {
      const dRate = l.inspectQty > 0 ? ((l.defectQty / l.inspectQty) * 100).toFixed(2) : "0.00";
      rows.push([
        idx + 1,
        l.date,
        l.plant,
        l.carType,
        l.productName,
        l.prodQty,
        l.inspectQty,
        l.goodQty,
        l.defectQty,
        dRate,
        l.defectType,
        l.judgment,
        l.actionTaken,
        l.inspector
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "일일품질현황");
    XLSX.writeFile(wb, `일일_품질현황_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-24">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>품질 무결함 전수 검사 시스템</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              일일 품질현황
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
              삼랑진공장 및 한림공장의 일일 생산 품목 전수 검사 결과, 양품률, 불량 유형 분석 및 조치 사항을 통합 관리합니다.
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
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-xs font-black shadow-lg shadow-blue-500/25 active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>품질 검사 등록</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold text-slate-400">총 검사 수량</span>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {totalInspect.toLocaleString()} 개
          </p>
          <p className="text-xs font-semibold text-slate-400 mt-1">
            전수 검사 완료
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold text-slate-400">종합 양품률</span>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
            {yieldRate}%
          </p>
          <p className="text-xs font-semibold text-slate-400 mt-1">
            품질 목표(99.5%) 초과 달성
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold text-slate-400">총 불량 수량 / 불량률</span>
          <p className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-2">
            {totalDefect.toLocaleString()} 개 ({defectRate}%)
          </p>
          <p className="text-xs font-semibold text-slate-400 mt-1">
            사소 편차 및 선별 처리
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold text-slate-400">품질관리 총괄 책임자</span>
          <p className="text-xl font-black text-slate-900 dark:text-white mt-2">
            이창엽 책임
          </p>
          <p className="text-xs font-semibold text-slate-400 mt-1">
            삼랑진공장 품질관리팀
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
              placeholder="품목명, 차종, 불량유형, 검사자 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              value={selectedCarType}
              onChange={(e) => setSelectedCarType(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200"
            >
              <option value="all">전체 차종</option>
              <option value="9BQC">9BQC</option>
              <option value="DT">DT</option>
              <option value="PCM">PCM</option>
              <option value="NX4">NX4</option>
            </select>
          </div>
        </div>

        {/* Quality Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse min-w-[850px]">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-slate-500 font-black">
                <th className="py-3 px-3">검사일자</th>
                <th className="py-3 px-3">공장 / 차종</th>
                <th className="py-3 px-3">품목명</th>
                <th className="py-3 px-3 text-right">검사수량</th>
                <th className="py-3 px-3 text-right">양품 / 불량</th>
                <th className="py-3 px-3">불량 유형</th>
                <th className="py-3 px-3 text-center">판정</th>
                <th className="py-3 px-3">조치 사항</th>
                <th className="py-3 px-3">검사자</th>
                <th className="py-3 px-3 text-center">삭제</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    등록된 품질 검사 내역이 없습니다.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const dRate = log.inspectQty > 0 ? ((log.defectQty / log.inspectQty) * 100).toFixed(2) : "0.00";
                  return (
                    <tr key={log.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-3 font-semibold text-slate-500">
                        {log.date}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900 dark:text-white">{log.plant}</div>
                        <span className="text-[10px] text-blue-600 font-black">[{log.carType}]</span>
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-800 dark:text-slate-200 max-w-xs truncate" title={log.productName}>
                        {log.productName}
                      </td>
                      <td className="py-3 px-3 text-right font-black text-slate-900 dark:text-white">
                        {log.inspectQty.toLocaleString()} 개
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span className="font-bold text-emerald-600">{log.goodQty.toLocaleString()}</span> /{" "}
                        <span className="font-bold text-rose-600">{log.defectQty}</span>
                        <div className="text-[10px] text-slate-400">({dRate}%)</div>
                      </td>
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                        {log.defectQty > 0 ? log.defectType : "-"}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                          {log.judgment}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-500 dark:text-slate-400 max-w-xs truncate" title={log.actionTaken}>
                        {log.actionTaken}
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                        {log.inspector}
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
                  );
                })
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
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  <CheckSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900 dark:text-white">
                    일일 품질 검사 결과 등록
                  </h3>
                  <p className="text-xs text-slate-400">
                    생산 품목의 전수 검사 결과 및 불량 내역을 등록합니다.
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
                    검사 일자
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    공장 구분
                  </label>
                  <select
                    value={formData.plant}
                    onChange={(e) => setFormData({ ...formData, plant: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="삼랑진공장">삼랑진공장</option>
                    <option value="한림공장">한림공장</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    차종 구분
                  </label>
                  <select
                    value={formData.carType}
                    onChange={(e) => setFormData({ ...formData, carType: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="9BQC">9BQC</option>
                    <option value="DT">DT</option>
                    <option value="PCM">PCM</option>
                    <option value="NX4">NX4</option>
                    <option value="GN7">GN7</option>
                    <option value="기타">기타 차종</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    품목명
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="예: 9BQC FRT LH 웨더스트립"
                    value={formData.productName}
                    onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    검사 수량
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.inspectQty}
                    onChange={(e) => setFormData({ ...formData, inspectQty: e.target.value, prodQty: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-black text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    불량 수량
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.defectQty}
                    onChange={(e) => setFormData({ ...formData, defectQty: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-black text-rose-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    판정
                  </label>
                  <select
                    value={formData.judgment}
                    onChange={(e) => setFormData({ ...formData, judgment: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold text-emerald-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="적합">적합 (합격)</option>
                    <option value="조건부적합">조건부 합격</option>
                    <option value="부적합">부적합 (불합격)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">
                  불량 유형 (불량 발생 시)
                </label>
                <select
                  value={formData.defectType}
                  onChange={(e) => setFormData({ ...formData, defectType: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {DEFECT_TYPES.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">
                  조치 사항 및 특이사항
                </label>
                <textarea
                  rows="2"
                  placeholder="예: 금형 미세 조정 완료, 양품 선별 출하 검사 완료"
                  value={formData.actionTaken}
                  onChange={(e) => setFormData({ ...formData, actionTaken: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black shadow-md shadow-blue-500/25 active:scale-95 transition-all flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>품질 검사 저장</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
