import React, { useState, useEffect, useMemo } from "react";
import {
  Layers,
  Plus,
  Printer,
  Copy,
  Trash2,
  Edit3,
  CheckCircle2,
  FileSpreadsheet,
  Scissors,
  Wrench,
  Search,
  Sparkles,
  Eye,
  X,
  Save,
  Check,
  RotateCcw,
  Sliders,
  ChevronRight,
  ShieldCheck,
  Cpu
} from "lucide-react";
import {
  REPORT_MAJOR_CATEGORIES,
  getLocalWorkReportTemplates,
  subscribeWorkReportTemplates,
  saveWorkReportTemplate,
  deleteWorkReportTemplate,
  cloneWorkReportTemplate
} from "../services/workReportTemplateService";
import LegoWorkReportBuilder from "./lego/LegoWorkReportBuilder.jsx";

export const WorkReportTemplateManagerView = () => {
  const [managerViewMode, setManagerViewMode] = useState("LEGO_BUILDER"); // 'LEGO_BUILDER' | 'CATALOG'
  const [templates, setTemplates] = useState(() => getLocalWorkReportTemplates());
  const [selectedCategory, setSelectedCategory] = useState("MATERIAL_PREP");
  const [searchTerm, setSearchTerm] = useState("");
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [legoInitialData, setLegoInitialData] = useState(null);

  useEffect(() => {
    const unsub = subscribeWorkReportTemplates((list) => {
      if (Array.isArray(list) && list.length > 0) {
        setTemplates(list);
      }
    });
    return () => unsub();
  }, []);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 2500);
  };

  // Filter templates by category and search
  const filteredTemplates = useMemo(() => {
    return templates.filter((t) => {
      const matchCat = t.categoryId === selectedCategory;
      const matchSearch =
        !searchTerm ||
        (t.title && t.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (t.carModel && t.carModel.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (t.partName && t.partName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (t.processName && t.processName.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchCat && matchSearch;
    });
  }, [templates, selectedCategory, searchTerm]);

  // Counts by category
  const categoryCounts = useMemo(() => {
    const counts = {};
    REPORT_MAJOR_CATEGORIES.forEach((c) => {
      counts[c.id] = templates.filter((t) => t.categoryId === c.id).length;
    });
    return counts;
  }, [templates]);

  // Open Editor for New Template
  const handleAddNew = () => {
    const curCat = REPORT_MAJOR_CATEGORIES.find((c) => c.id === selectedCategory);
    setEditingTemplate({
      id: "",
      categoryId: selectedCategory,
      categoryName: curCat?.name || "소재준비일보",
      title: `${curCat?.name || "작업"} 일보`,
      subTitle: "▣ 공정명 : 신규 공정",
      formNo: "705-02(REV.4)",
      companyName: "(주)오륙",
      carModel: "신규차종",
      partName: "신규품명",
      processName: curCat?.name.replace("일보", "") || "가공",
      subProcess: "",
      divisionType: "SECTION_ABC",
      blocks: {
        timeAndQty: true,
        specAndLot: true,
        machineCondition: selectedCategory === "EXTRUSION" || selectedCategory === "JOINT",
        defectMatrix: true,
        maintenance: true
      },
      specs: [
        { id: `sp_${Date.now()}_1`, section: "A단면", name: "A단면", frtSpec: "800 ± 3mm", frtTarget: 800, frtTol: 3, rrSpec: "500 ± 3mm", rrTarget: 500, rrTol: 3 }
      ],
      defectCategories: [
        {
          name: "주요 불량 항목",
          items: ["외면 흠", "오염", "치수 미달", "가공 불량", "기타"]
        }
      ],
      maintenanceConfig: {
        hasBladeChange: selectedCategory === "MATERIAL_PREP",
        hasTroubleAction: true,
        bladeWarningLimit: 50000
      }
    });
    setIsEditorOpen(true);
  };

  // Open Editor for Existing Template
  const handleEdit = (tpl) => {
    setEditingTemplate(JSON.parse(JSON.stringify(tpl)));
    setIsEditorOpen(true);
  };

  // Clone Template
  const handleClone = async (tpl) => {
    const newCar = prompt(`[${tpl.carModel}] 양식을 복제합니다.\n새로운 차종명을 입력하세요:`, `${tpl.carModel}_신규`);
    if (!newCar) return;
    try {
      const cloned = await cloneWorkReportTemplate(tpl.id, newCar);
      showToast(`✅ [${newCar}] 양식이 성공적으로 복제 생성되었습니다!`);
      handleEdit(cloned);
    } catch (e) {
      alert("복제 중 오류가 발생했습니다: " + e.message);
    }
  };

  // Delete Template
  const handleDelete = async (tpl) => {
    if (!confirm(`정말 [${tpl.title} - ${tpl.carModel}] 양식을 삭제하시겠습니까?`)) return;
    try {
      await deleteWorkReportTemplate(tpl.id);
      showToast("🗑️ 양식이 삭제되었습니다.");
    } catch (e) {
      alert("삭제 실패: " + e.message);
    }
  };

  // Save Template from Editor
  const handleSaveEditor = async (tplData) => {
    try {
      await saveWorkReportTemplate(tplData);
      setIsEditorOpen(false);
      setEditingTemplate(null);
      showToast("✅ 레고 블록 일보 양식이 저장되었습니다!");
    } catch (e) {
      alert("저장 실패: " + e.message);
    }
  };

  // Open Template in Lego Block Builder for modular editing
  const handleOpenInLegoBuilder = (tpl) => {
    setLegoInitialData(tpl);
    setManagerViewMode("LEGO_BUILDER");
    showToast(`🧩 [${tpl.carModel} - ${tpl.partName}] 양식을 레고 블록 편집기로 불러왔습니다.`);
  };

  // Callback when saved from Lego Builder
  const handleSaveFromLegoBuilder = (savedTpl) => {
    showToast(`✅ [${savedTpl.title || "양식"}] 템플릿 보관함 동기화 완료`);
  };

  return (
    <div className="space-y-5 animate-fadeIn p-2 sm:p-4 text-left">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-2xl bg-indigo-600 text-white font-black text-xs shadow-2xl animate-bounce">
          {toastMsg}
        </div>
      )}

      {/* 🧭 Top Mode Switcher: [🧩 레고 블록 양식 조합기 ('레고 양식.xlsx' 16대 블록)] | [📋 5대 대분류 양식 대장] */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-900 dark:bg-slate-950 rounded-2xl border border-slate-700/80 w-fit flex-wrap shadow-sm">
        <button
          type="button"
          onClick={() => setManagerViewMode("LEGO_BUILDER")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-black text-xs sm:text-sm transition-all cursor-pointer ${
            managerViewMode === "LEGO_BUILDER"
              ? "bg-cyan-500 text-slate-950 shadow-md font-black ring-2 ring-cyan-300"
              : "text-slate-300 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>🧩 레고 블록 양식 조합기 ('레고 양식.xlsx' 16대 블록)</span>
        </button>
        <button
          type="button"
          onClick={() => setManagerViewMode("CATALOG")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-black text-xs sm:text-sm transition-all cursor-pointer ${
            managerViewMode === "CATALOG"
              ? "bg-white text-slate-950 shadow-md font-black"
              : "text-slate-300 hover:text-white hover:bg-slate-800"
          }`}
        >
          <FileSpreadsheet className="w-4 h-4 text-indigo-400" />
          <span>📋 5대 공정별 표준 양식 보관함</span>
        </button>
      </div>

      {managerViewMode === "LEGO_BUILDER" ? (
        <LegoWorkReportBuilder
          initialTemplateData={legoInitialData}
          onSaveToTemplateManager={handleSaveFromLegoBuilder}
        />
      ) : (
        <>
          {/* ======================================================== */}
          {/* Header Banner */}
          {/* ======================================================== */}
          <div className="p-4 sm:p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 shadow-xl text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="p-1.5 rounded-xl bg-indigo-600 text-white shadow-sm">
                  <Layers className="w-5 h-5" />
                </span>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              작업일보 양식 관리 (레고 블록형 커스텀 엔진)
            </h2>
            <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
              5대 대분류 완벽 지원
            </span>
          </div>
          <p className="text-xs sm:text-sm text-indigo-200 leading-relaxed">
            <strong>압출일보 • 소재준비일보 • 조인트일보 • 후가공일보 • 검사일보</strong> 5대 공정별 표준 양식을 코딩 없이 레고 블록 스위치와 치수 등록만으로 손쉽게 관리하고 신규 일보를 3분 만에 생성합니다.
          </p>
        </div>

        <button
          onClick={handleAddNew}
          className="shrink-0 px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>+ 새 작업일보 양식 만들기</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* 5 Major Categories Switcher Tabs */}
      {/* ======================================================== */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
        {REPORT_MAJOR_CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat.id;
          const count = categoryCounts[cat.id] || 0;

          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer text-left flex flex-col justify-between gap-2 shadow-sm ${
                isActive
                  ? "bg-white dark:bg-slate-900 border-indigo-600 dark:border-indigo-500 ring-2 ring-indigo-500/30 scale-[1.02]"
                  : "bg-white/70 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xl sm:text-2xl">{cat.icon}</span>
                <span className={`text-[11px] font-black px-2 py-0.5 rounded-full border ${cat.badgeColor}`}>
                  {count}개 양식
                </span>
              </div>
              <div>
                <h4 className="font-black text-xs sm:text-sm text-slate-900 dark:text-white leading-tight">
                  {cat.name}
                </h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5" title={cat.desc}>
                  {cat.desc}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* ======================================================== */}
      {/* Search & Filters Toolbar */}
      {/* ======================================================== */}
      <div className="flex items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="차종, 품명, 공정명, 양식명 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <span className="text-xs font-bold text-slate-500">
          총 <strong className="text-indigo-600 dark:text-indigo-400">{filteredTemplates.length}</strong>개의 템플릿
        </span>
      </div>

      {/* ======================================================== */}
      {/* Template Cards Grid */}
      {/* ======================================================== */}
      {filteredTemplates.length === 0 ? (
        <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 space-y-3">
          <div className="text-3xl">📭</div>
          <p className="text-sm font-bold text-slate-600 dark:text-slate-400">
            해당 분류에 등록된 작업일보 양식이 없습니다.
          </p>
          <button
            onClick={handleAddNew}
            className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-black text-xs hover:bg-indigo-500 cursor-pointer"
          >
            + 첫 번째 양식 만들기
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredTemplates.map((tpl) => {
            const specCount = (tpl.specs || []).length;
            const defectCount = (tpl.defectCategories || []).reduce((acc, c) => acc + (c.items || []).length, 0);

            return (
              <div
                key={tpl.id}
                className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all space-y-3.5 flex flex-col justify-between"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-2 py-0.5 rounded-lg text-xs font-black bg-indigo-600 text-white shadow-2xs">
                          {tpl.carModel}
                        </span>
                        <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-white">
                          {tpl.partName}
                        </h3>
                      </div>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-bold mt-0.5">
                        {tpl.title} • {tpl.processName}
                      </span>
                    </div>

                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 shrink-0">
                      {tpl.formNo || "705-02"}
                    </span>
                  </div>

                  {/* Active Lego Blocks Indicator */}
                  <div className="pt-2 space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 block">장착된 레고 블록:</span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {tpl.blocks?.timeAndQty && (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                          ⏱️ 시간/생산량
                        </span>
                      )}
                      {tpl.blocks?.specAndLot && (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          📐 치수실측({specCount}개)
                        </span>
                      )}
                      {tpl.blocks?.machineCondition && (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                          🌡️ 성형/설비조건
                        </span>
                      )}
                      {tpl.blocks?.defectMatrix && (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                          ⚠️ 불량집계({defectCount}개)
                        </span>
                      )}
                      {tpl.blocks?.maintenance && (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                          🔧 설비보전/칼날
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Specs Quick Peek */}
                  <div className="mt-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800/80 text-[11px] space-y-1">
                    <span className="font-bold text-slate-600 dark:text-slate-300 block">주요 스펙 요약:</span>
                    <div className="text-slate-500 dark:text-slate-400 space-y-0.5">
                      {(tpl.specs || []).slice(0, 3).map((s) => (
                        <div key={s.id} className="flex items-center justify-between">
                          <span>{s.name}</span>
                          <span className="font-black text-indigo-600 dark:text-indigo-400">{s.frtSpec || s.spec || "-"}</span>
                        </div>
                      ))}
                      {(tpl.specs || []).length > 3 && (
                        <span className="text-[10px] text-slate-400 block text-right font-bold">+ 외 {(tpl.specs.length - 3)}개 항목</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                  <button
                    onClick={() => handleOpenInLegoBuilder(tpl)}
                    className="p-1.5 rounded-xl bg-cyan-50 hover:bg-cyan-100 dark:bg-cyan-950/60 dark:hover:bg-cyan-900/60 text-cyan-700 dark:text-cyan-300 text-xs font-black transition flex items-center justify-center gap-1 cursor-pointer col-span-2 sm:col-span-1 shadow-2xs border border-cyan-200 dark:border-cyan-800"
                    title="레고 블록 양식 조합기에서 블록 선택 & 앱내 편집"
                  >
                    <Sliders className="w-3.5 h-3.5 text-cyan-600" />
                    <span>블록편집</span>
                  </button>
                  <button
                    onClick={() => {
                      setPreviewTemplate(tpl);
                      setIsPreviewOpen(true);
                    }}
                    className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                    title="A4 실물 양식 보기 / 인쇄"
                  >
                    <Printer className="w-3.5 h-3.5 text-indigo-500" />
                    <span className="hidden sm:inline">A4양식</span>
                  </button>
                  <button
                    onClick={() => handleEdit(tpl)}
                    className="p-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                    title="레고 블록 및 규격 수정"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">수정</span>
                  </button>
                  <button
                    onClick={() => handleClone(tpl)}
                    className="p-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/60 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                    title="새 차종으로 1초 복제"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">복제</span>
                  </button>
                  <button
                    onClick={() => handleDelete(tpl)}
                    className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                    title="삭제"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">삭제</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ======================================================== */}
      {/* Modal: Lego Block Template Editor */}
      {/* ======================================================== */}
      {isEditorOpen && editingTemplate && (
        <LegoTemplateEditorModal
          template={editingTemplate}
          onClose={() => {
            setIsEditorOpen(false);
            setEditingTemplate(null);
          }}
          onSave={handleSaveEditor}
        />
      )}

      {/* ======================================================== */}
      {/* Modal: A4 Print Preview Modal */}
      {/* ======================================================== */}
      {isPreviewOpen && previewTemplate && (
        <A4PrintPreviewModal
          template={previewTemplate}
          onClose={() => {
            setIsPreviewOpen(false);
            setPreviewTemplate(null);
          }}
        />
      )}
        </>
      )}
    </div>
  );
};

// ============================================================================
// Material Prep Standard A4 Sheet (705-02 REV.4 1:1 Pixel-Perfect Replica)
// 블록 1: 작업시간 & 생산량 (구분: FRT/RR, A/B/C 계획·실적)
// 블록 2: 정치 절단 길이 & LOT NO. (규격, 초/중/종 실측, LOT NO.)
// 블록 3: 불량소재구분 (압출소재 불량 5종 + 공정간 불량 3종 매트릭스)
// 블록 4: 칼날교체 & 설비이상 조치
// ============================================================================
export const MaterialPrepStandardA4Sheet = ({ template, showBlockBadges = false }) => {
  const specs = template?.specs || [];
  const defectCategories = template?.defectCategories || [];
  const extrusionItems = defectCategories[0]?.items || [
    "스코치(Scortch)",
    "외면 흠(Scratch)",
    "오염(Contamination)",
    "길이 미달(Length Bad)",
    "와이어 노출"
  ];
  const processItems = defectCategories[1]?.items || [
    "길이 (Length Bad)",
    "단컷팅(Step Cutt,g)",
    "기타 ( Etc )"
  ];

  return (
    <div className="w-full bg-white text-black p-4 sm:p-6 border-2 border-black font-sans text-xs space-y-2 select-text">
      {/* Title & Approval Box */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 text-center pt-1">
          <h1 className="text-xl sm:text-2xl font-black text-black inline-block tracking-wider border-b-[3px] border-double border-black pb-0.5">
            {template?.title || "소재 준비 작업 일보 (G/RUN)"}
          </h1>
        </div>
        <table className="border-collapse border border-black text-[11px] w-40 text-center font-bold shrink-0">
          <thead>
            <tr className="border-b border-black">
              <th className="border-r border-black py-0.5 w-1/3">작 성</th>
              <th className="border-r border-black py-0.5 w-1/3">검 토</th>
              <th className="py-0.5 w-1/3">승 인</th>
            </tr>
          </thead>
          <tbody>
            <tr className="h-10 text-slate-300">
              <td className="border-r border-black align-bottom pb-1">(인)</td>
              <td className="border-r border-black align-bottom pb-1">(인)</td>
              <td className="align-bottom pb-1">(인)</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Subtitle / Meta row 1 */}
      <div className="flex items-center justify-between text-xs font-bold text-black pt-1">
        <div className="flex items-center gap-3 flex-wrap">
          <span>▣공정명 : {template?.processName || "정치 절단"}</span>
          <span className="text-[11px] text-slate-700">※Record Time : Start / Half / Finish</span>
        </div>
        <div className="text-[11px]">
          작업일자(Date) : 20&nbsp;&nbsp;&nbsp;&nbsp;년&nbsp;&nbsp;&nbsp;&nbsp;월&nbsp;&nbsp;&nbsp;&nbsp;일
        </div>
      </div>

      {/* Header Info Box (Car Model / Part Name / Worker) */}
      <table className="w-full border-collapse border border-black text-xs font-bold">
        <tbody>
          <tr>
            <td className="border border-black bg-white w-[14%] p-1 text-center font-bold">차종(Car model)</td>
            <td className="border border-black w-[22%] p-1 text-center font-black">{template?.carModel || "9BQC"}</td>
            <td className="border border-black bg-white w-[14%] p-1 text-center font-bold">품 명(Part name)</td>
            <td className="border border-black w-[22%] p-1 text-center font-black">{template?.partName || "G/RUN"}</td>
            <td className="border border-black bg-white w-[14%] p-1 text-center font-bold">작업자(Worker)</td>
            <td className="border border-black w-[14%] p-1 text-center font-black"></td>
          </tr>
        </tbody>
      </table>

      {/* ======================================================== */}
      {/* 🧱 [블록 1: 작업시간 및 생산량] */}
      {/* ======================================================== */}
      {template?.blocks?.timeAndQty && (
        <div className="relative">
          {showBlockBadges && (
            <span className="absolute -top-2.5 left-2 bg-indigo-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-xs z-10">
              [블록 1] 작업시간 & 생산량
            </span>
          )}
          <table className="w-full border-collapse border border-black text-xs text-center font-bold">
            <thead>
              <tr className="bg-[#fef9c3] border-b border-black">
                <th colSpan={2} className="border-r border-black p-1 w-1/3">구 분(Division)</th>
                <th className="border-r border-black p-1 w-1/3">FRT</th>
                <th className="p-1 w-1/3">RR</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-black">
                <td className="border-r border-black bg-[#fef9c3] p-1 w-1/6 font-bold">작업시간(time)</td>
                <td className="border-r border-black p-1 w-1/6 font-bold">시작(S)~종료(F)</td>
                <td className="border-r border-black p-1">~</td>
                <td className="p-1"></td>
              </tr>
              <tr className="border-b border-black">
                <td rowSpan={3} className="border-r border-black bg-[#fef9c3] p-1 font-bold">
                  생산량 (Q,ty)
                </td>
                <td className="border-r border-black p-1 font-bold">
                  <div className="flex justify-between px-2 text-[11px]">
                    <span>(계획/실적)</span>
                    <span>A</span>
                  </div>
                </td>
                <td className="border-r border-black p-1">/</td>
                <td className="p-1">/</td>
              </tr>
              <tr className="border-b border-black">
                <td className="border-r border-black p-1 font-bold">
                  <div className="flex justify-between px-2 text-[11px]">
                    <span>(Plan/Output)</span>
                    <span>B</span>
                  </div>
                </td>
                <td className="border-r border-black p-1">/</td>
                <td className="p-1">/</td>
              </tr>
              <tr className="border-b border-black">
                <td className="border-r border-black p-1 font-bold">
                  <div className="flex justify-end px-2 text-[11px]">
                    <span>C</span>
                  </div>
                </td>
                <td className="border-r border-black p-1">/</td>
                {/* Diagonal Cross-out (X) cell for Section C on RR */}
                <td className="p-1 relative overflow-hidden h-6">
                  <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none">
                    <line x1="0" y1="0" x2="100%" y2="100%" stroke="black" strokeWidth="1" />
                    <line x1="100%" y1="0" x2="0" y2="100%" stroke="black" strokeWidth="1" />
                  </svg>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* ======================================================== */}
      {/* 🧱 [블록 2: 정치 절단 길이 & LOT NO.] */}
      {/* ======================================================== */}
      {template?.blocks?.specAndLot && (
        <div className="relative">
          {showBlockBadges && (
            <span className="absolute -top-2.5 left-2 bg-indigo-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-xs z-10">
              [블록 2] 정치 절단 길이 & LOT NO.
            </span>
          )}
          <table className="w-full border-collapse border border-black text-xs text-center font-bold">
            <thead>
              <tr className="bg-[#fef9c3] border-b border-black">
                <th colSpan={3} className="border-r border-black p-1 w-[28%]">구 분(Division)</th>
                <th className="border-r border-black p-1 w-[24%]">초물(Start)</th>
                <th className="border-r border-black p-1 w-[24%]">중물(Half)</th>
                <th className="p-1 w-[24%]">종물(Finish)</th>
              </tr>
            </thead>
            <tbody>
              {specs.map((spec, sIdx) => {
                const isFirst = sIdx === 0;
                const totalSpecs = specs.length;
                return (
                  <React.Fragment key={spec.id || sIdx}>
                    {/* Sub-row 1: 규격(Spec) */}
                    <tr className="border-b border-black">
                      {isFirst && (
                        <td
                          rowSpan={totalSpecs * 3}
                          className="border-r border-black bg-[#fef9c3] p-1 font-bold w-[10%] text-center align-middle"
                        >
                          <div className="leading-snug">
                            정치 절단<br />길이(Spec<br />cutting)
                          </div>
                        </td>
                      )}
                      <td rowSpan={3} className="border-r border-black p-1 w-[9%] text-center font-bold">
                        {spec.section || spec.name || `Section ${sIdx + 1}`}
                      </td>
                      <td className="border-r border-black p-0.5 text-center text-[11px] font-bold w-[9%]">
                        규격(Spec)
                      </td>
                      <td colSpan={3} className="p-0.5 text-center font-black text-indigo-900 bg-slate-50/50">
                        {spec.frtSpec || spec.spec || "-"}
                      </td>
                    </tr>

                    {/* Sub-row 2: 초/중/종 실측치 (초물, 중물, 종물 3개만 기록) */}
                    <tr className="border-b border-black">
                      <td className="border-r border-black p-0.5 text-center text-[11px] font-bold">
                        초/중/종
                      </td>
                      <td className="border-r border-black p-0.5 h-6 text-center font-mono">
                        {spec.startVal || spec.start1 || ""}
                      </td>
                      <td className="border-r border-black p-0.5 h-6 text-center font-mono">
                        {spec.halfVal || spec.half1 || ""}
                      </td>
                      <td className="p-0.5 h-6 text-center font-mono">
                        {spec.finishVal || spec.finish1 || ""}
                      </td>
                    </tr>

                    {/* Sub-row 3: LOT NO. (3개 칸) */}
                    <tr className="border-b border-black">
                      <td className="border-r border-black p-0.5 text-center text-[11px] font-bold">
                        LOT NO.
                      </td>
                      <td className="border-r border-black p-0.5 h-6 text-center font-mono text-[10.5px]">
                        {spec.lotStart || spec.lotNo || ""}
                      </td>
                      <td className="border-r border-black p-0.5 h-6 text-center font-mono text-[10.5px]">
                        {spec.lotHalf || spec.lotNo || ""}
                      </td>
                      <td className="p-0.5 h-6 text-center font-mono text-[10.5px]">
                        {spec.lotFinish || spec.lotNo || ""}
                      </td>
                    </tr>
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ======================================================== */}
      {/* 🧱 [블록 3: 불량소재구분 매트릭스] */}
      {/* ======================================================== */}
      {template?.blocks?.defectMatrix && (
        <div className="relative">
          {showBlockBadges && (
            <span className="absolute -top-2.5 left-2 bg-indigo-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-xs z-10">
              [블록 3] 불량소재 구분 매트릭스
            </span>
          )}
          <table className="w-full border-collapse border border-black text-xs text-center font-bold">
            <thead>
              <tr className="bg-[#fef9c3] border-b border-black">
                <th colSpan={2} className="border-r border-black p-1 w-[25%]">불량소재구분</th>
                <th className="border-r border-black p-1 w-[12.5%]">Section "A"</th>
                <th className="border-r border-black p-1 w-[12.5%]">Section "B"</th>
                <th className="border-r border-black p-1 w-[12.5%]">Section "C"</th>
                <th className="border-r border-black p-1 w-[12.5%]">Section "A"</th>
                <th className="border-r border-black p-1 w-[12.5%]">Section "B"</th>
                <th className="p-1 w-[12.5%]">Section "C"</th>
              </tr>
            </thead>
            <tbody>
              {/* 압출소재 불량 (Extrusion Badness) */}
              {extrusionItems.map((item, idx) => (
                <tr key={`ext_${idx}`} className="border-b border-black">
                  {idx === 0 && (
                    <td
                      rowSpan={extrusionItems.length}
                      className="border-r border-black p-1 font-bold w-[12%] text-center align-middle"
                    >
                      <div className="leading-snug">
                        압출소재<br />불량<br />(Extrusion<br />Badness)
                      </div>
                    </td>
                  )}
                  <td className="border-r border-black p-0.5 text-center text-[10.5px] font-bold w-[13%]">
                    {item}
                  </td>
                  <td className="border-r border-black p-0.5 h-4"></td>
                  <td className="border-r border-black p-0.5 h-4"></td>
                  <td className="border-r border-black p-0.5 h-4"></td>
                  <td className="border-r border-black p-0.5 h-4"></td>
                  <td className="border-r border-black p-0.5 h-4"></td>
                  <td className="p-0.5 h-4"></td>
                </tr>
              ))}

              {/* 공정간 불량 (Process Badness) */}
              {processItems.map((item, idx) => (
                <tr key={`proc_${idx}`} className="border-b border-black">
                  {idx === 0 && (
                    <td
                      rowSpan={processItems.length}
                      className="border-r border-black p-1 font-bold w-[12%] text-center align-middle"
                    >
                      <div className="leading-snug">
                        공정간<br />불량(Process<br />Badness)
                      </div>
                    </td>
                  )}
                  <td className="border-r border-black p-0.5 text-center text-[10.5px] font-bold w-[13%]">
                    {item}
                  </td>
                  <td className="border-r border-black p-0.5 h-4"></td>
                  <td className="border-r border-black p-0.5 h-4"></td>
                  <td className="border-r border-black p-0.5 h-4"></td>
                  <td className="border-r border-black p-0.5 h-4"></td>
                  <td className="border-r border-black p-0.5 h-4"></td>
                  <td className="p-0.5 h-4"></td>
                </tr>
              ))}

              {/* 불량 합계(Bad Sum) */}
              <tr className="border-b border-black font-black bg-slate-50">
                <td colSpan={2} className="border-r border-black p-1 text-center">
                  불량 합계(Bad Sum)
                </td>
                <td className="border-r border-black p-1 h-5"></td>
                <td className="border-r border-black p-1 h-5"></td>
                <td className="border-r border-black p-1 h-5"></td>
                <td className="border-r border-black p-1 h-5"></td>
                <td className="border-r border-black p-1 h-5"></td>
                <td className="p-1 h-5"></td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* ======================================================== */}
      {/* 🧱 [블록 4: 칼날교체 & 설비 이상 조치사항] */}
      {/* ======================================================== */}
      {template?.blocks?.maintenance && (
        <div className="relative">
          {showBlockBadges && (
            <span className="absolute -top-2.5 left-2 bg-indigo-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-xs z-10">
              [블록 4] 칼날교체 & 설비이상 조치
            </span>
          )}
          <table className="w-full border-collapse border border-black text-xs font-bold">
            <tbody>
              <tr>
                <td className="border-r border-black bg-[#fef9c3] p-2 text-center w-[25%] font-bold">
                  칼날교체 시간
                </td>
                <td className="border-r border-black p-2 w-[25%] h-12"></td>
                <td className="border-r border-black bg-[#fef9c3] p-2 text-center w-[25%] font-bold">
                  설비 이상 조치사항
                </td>
                <td className="p-2 w-[25%] h-12"></td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs font-bold pt-2 border-t border-black text-black">
        <span>{template?.formNo || "705-02(REV.4)"}</span>
        <span className="font-black text-sm">{template?.companyName || "(주)오륙"}</span>
        <span>A4(210×297)</span>
      </div>
    </div>
  );
};

// ============================================================================
// Lego Template Editor Modal (Lego Blocks + Real-time live A4 Sheet)
// ============================================================================
const LegoTemplateEditorModal = ({ template, onClose, onSave }) => {
  const [formData, setFormData] = useState(template);
  const isMaterialPrep = formData.categoryId === "MATERIAL_PREP" || formData.divisionType === "SECTION_ABC";

  const updateField = (field, val) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
  };

  const toggleBlock = (blockKey) => {
    setFormData((prev) => ({
      ...prev,
      blocks: {
        ...prev.blocks,
        [blockKey]: !prev.blocks?.[blockKey]
      }
    }));
  };

  const handleAddSpec = () => {
    const nextIdx = (formData.specs || []).length + 1;
    const letter = String.fromCharCode(64 + nextIdx);
    const newSpec = {
      id: `sp_${Date.now()}_${nextIdx}`,
      section: letter,
      name: `Section "${letter}"`,
      frtSpec: "600 ± 5mm",
      frtTarget: 600,
      frtTol: 5,
      rrSpec: "600 ± 5mm",
      rrTarget: 600,
      rrTol: 5
    };
    setFormData((prev) => ({
      ...prev,
      specs: [...(prev.specs || []), newSpec]
    }));
  };

  const handleRemoveSpec = (idToRemove) => {
    setFormData((prev) => ({
      ...prev,
      specs: (prev.specs || []).filter((s) => s.id !== idToRemove)
    }));
  };

  const handleUpdateSpec = (id, key, val) => {
    setFormData((prev) => ({
      ...prev,
      specs: (prev.specs || []).map((s) => (s.id === id ? { ...s, [key]: val } : s))
    }));
  };

  const handleAddDefect = (groupIndex = 0) => {
    const defaultPrompt = groupIndex === 0 ? "압출소재 불량 항목명 (예: 크랙, 흑점 등):" : "공정간 불량 항목명 (예: 치수불량 등):";
    const name = prompt(defaultPrompt);
    if (!name || !name.trim()) return;
    setFormData((prev) => {
      const cats = [...(prev.defectCategories || [])];
      if (!cats[groupIndex]) {
        cats[groupIndex] = { name: groupIndex === 0 ? "압출소재 불량 (Extrusion Badness)" : "공정간 불량(Process Badness)", items: [] };
      }
      cats[groupIndex] = { ...cats[groupIndex], items: [...(cats[groupIndex].items || []), name.trim()] };
      return { ...prev, defectCategories: cats };
    });
  };

  const handleRemoveDefect = (catIdx, itemIdx) => {
    setFormData((prev) => {
      const cats = [...(prev.defectCategories || [])];
      if (!cats[catIdx]) return prev;
      const items = [...cats[catIdx].items];
      items.splice(itemIdx, 1);
      cats[catIdx] = { ...cats[catIdx], items };
      return { ...prev, defectCategories: cats };
    });
  };

  return (
    <div className="fixed inset-0 z-[200] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 w-full max-w-6xl max-h-[94vh] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden text-left">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-indigo-600 text-white shadow-xs">
              <Sliders className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-black text-base sm:text-lg">
                레고 블록 작업일보 템플릿 커스텀
              </h3>
              <p className="text-xs text-indigo-200">
                {formData.categoryName} • {formData.carModel} • {formData.partName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onSave(formData)}
              className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black transition cursor-pointer flex items-center gap-1 shadow-sm active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>템플릿 저장</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: 2-Columns (Left: Builder / Right: Live A4 Sheet) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-y-auto">
          {/* LEFT: Builder Controls */}
          <div className="lg:col-span-5 p-4 sm:p-5 border-r border-slate-200 dark:border-slate-800 space-y-4 overflow-y-auto">
            {/* Step 1: Base Meta */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-2">
              <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 block">
                1. 기본 정보 설정
              </span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-0.5">차종명</label>
                  <input
                    type="text"
                    value={formData.carModel || ""}
                    onChange={(e) => updateField("carModel", e.target.value)}
                    className="w-full px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-center"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-0.5">품명</label>
                  <input
                    type="text"
                    value={formData.partName || ""}
                    onChange={(e) => updateField("partName", e.target.value)}
                    className="w-full px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-center"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-0.5">공정명</label>
                  <input
                    type="text"
                    value={formData.processName || ""}
                    onChange={(e) => updateField("processName", e.target.value)}
                    className="w-full px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-center"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-0.5">양식 번호</label>
                  <input
                    type="text"
                    value={formData.formNo || "705-02(REV.4)"}
                    onChange={(e) => updateField("formNo", e.target.value)}
                    className="w-full px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-center"
                  />
                </div>
              </div>
            </div>

            {/* Step 2: Lego Block Toggles */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 block">
                  2. 레고 블록 ON/OFF 스위치
                </span>
                <span className="text-[10px] font-bold text-slate-400">실시간 우측 서식 연동</span>
              </div>
              <div className="space-y-1.5">
                {(isMaterialPrep
                  ? [
                      { key: "timeAndQty", label: "⏱️ [블록 1] 작업시간 & 생산량 (FRT/RR, A/B/C 계획·실적)" },
                      { key: "specAndLot", label: "📐 [블록 2] 정치 절단 길이 & LOT NO. (초/중/종 실측)" },
                      { key: "defectMatrix", label: "⚠️ [블록 3] 불량소재구분 매트릭스 (압출 5종 + 공정간 3종)" },
                      { key: "maintenance", label: "🔧 [블록 4] 칼날교체 & 설비이상 조치 블록" }
                    ]
                  : [
                      { key: "timeAndQty", label: "⏱️ [블록 1] 작업시간 & 생산량 블록" },
                      { key: "specAndLot", label: "📐 [블록 2] 주요 규격 실측 & LOT 번호 블록" },
                      { key: "machineCondition", label: "🌡️ [블록 3] 성형/설비 조건 블록" },
                      { key: "defectMatrix", label: "⚠️ [블록 4] 불량 세부 매트릭스 블록" },
                      { key: "maintenance", label: "🔧 [블록 5] 설비보전 & 칼날교체 블록" }
                    ]
                ).map((b) => (
                  <label
                    key={b.key}
                    className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 cursor-pointer hover:border-indigo-400 transition"
                  >
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{b.label}</span>
                    <input
                      type="checkbox"
                      checked={Boolean(formData.blocks?.[b.key])}
                      onChange={() => toggleBlock(b.key)}
                      className="w-4 h-4 accent-indigo-600 cursor-pointer"
                    />
                  </label>
                ))}
              </div>
            </div>

            {/* Step 3: Spec Items Editor */}
            {formData.blocks?.specAndLot && (
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 block">
                      3. 정치 절단 치수 규격(Spec) 설정
                    </span>
                    <span className="text-[10px] text-slate-400">FRT 및 RR 단면별 기준 규격</span>
                  </div>
                  <button
                    onClick={handleAddSpec}
                    className="px-2 py-0.5 rounded-lg bg-indigo-600 text-white text-[11px] font-black cursor-pointer hover:bg-indigo-500"
                  >
                    + 단면 추가
                  </button>
                </div>
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {(formData.specs || []).map((s, idx) => (
                    <div
                      key={s.id}
                      className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-black text-indigo-700 dark:text-indigo-300 text-xs">
                          {s.section || s.name || `Section ${idx + 1}`} 단면
                        </span>
                        <button
                          onClick={() => handleRemoveSpec(s.id)}
                          className="text-rose-500 font-bold px-1 hover:bg-rose-50 rounded cursor-pointer"
                          title="삭제"
                        >
                          × 단면 제거
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[9px] font-bold text-slate-400 block">FRT 규격</label>
                          <input
                            type="text"
                            value={s.frtSpec || ""}
                            onChange={(e) => handleUpdateSpec(s.id, "frtSpec", e.target.value)}
                            placeholder="예: 881 ± 3mm"
                            className="w-full px-2 py-1 rounded border text-center font-bold text-indigo-600 dark:text-indigo-400"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-bold text-slate-400 block">RR 규격</label>
                          <input
                            type="text"
                            value={s.rrSpec || ""}
                            onChange={(e) => handleUpdateSpec(s.id, "rrSpec", e.target.value)}
                            placeholder="예: 488 ± 3mm(가절단)"
                            className="w-full px-2 py-1 rounded border text-center font-bold text-purple-600 dark:text-purple-400"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 4: Defect Items Editor */}
            {formData.blocks?.defectMatrix && (
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-rose-600 dark:text-rose-400">
                    4. 불량 세부 매트릭스 항목
                  </span>
                </div>

                {/* Group 1: 압출소재 불량 */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 dark:text-slate-300">
                    <span>압출소재 불량 ({formData.defectCategories?.[0]?.items?.length || 0}개)</span>
                    <button
                      onClick={() => handleAddDefect(0)}
                      className="px-2 py-0.5 rounded-md bg-rose-600 text-white text-[10px] font-black cursor-pointer hover:bg-rose-500"
                    >
                      + 항목 추가
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {(formData.defectCategories?.[0]?.items || []).map((item, itemIdx) => (
                      <span
                        key={`grp0_${itemIdx}`}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                      >
                        <span>{item}</span>
                        <button
                          onClick={() => handleRemoveDefect(0, itemIdx)}
                          className="hover:text-black dark:hover:text-white font-black cursor-pointer"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Group 2: 공정간 불량 */}
                <div className="space-y-1.5 pt-1 border-t border-slate-200 dark:border-slate-700/60">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 dark:text-slate-300">
                    <span>공정간 불량 ({formData.defectCategories?.[1]?.items?.length || 0}개)</span>
                    <button
                      onClick={() => handleAddDefect(1)}
                      className="px-2 py-0.5 rounded-md bg-amber-600 text-white text-[10px] font-black cursor-pointer hover:bg-amber-500"
                    >
                      + 항목 추가
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {(formData.defectCategories?.[1]?.items || []).map((item, itemIdx) => (
                      <span
                        key={`grp1_${itemIdx}`}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                      >
                        <span>{item}</span>
                        <button
                          onClick={() => handleRemoveDefect(1, itemIdx)}
                          className="hover:text-black dark:hover:text-white font-black cursor-pointer"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: Live A4 Sheet Preview */}
          <div className="lg:col-span-7 p-4 sm:p-6 bg-slate-100 dark:bg-slate-950 flex flex-col items-center justify-start overflow-y-auto">
            <div className="flex items-center justify-between w-full mb-2">
              <span className="text-xs font-black text-slate-600 dark:text-slate-400">
                실시간 1:1 표준 A4 서식 연동 미리보기
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                705-02(REV.4) 규격
              </span>
            </div>

            {/* RENDER 1:1 REPLICA FOR MATERIAL PREP */}
            {isMaterialPrep ? (
              <MaterialPrepStandardA4Sheet template={formData} showBlockBadges={true} />
            ) : (
              <div className="w-full bg-white text-black p-5 rounded-2xl shadow-xl border border-slate-300 text-xs space-y-2 min-w-[500px]">
                {/* Title & Approval */}
                <div className="flex items-start justify-between">
                  <div className="flex-1 text-center pt-1">
                    <h2 className="text-xl font-black border-b-4 border-double border-black inline-block pb-0.5">
                      {formData.title || "작업 일보"}
                    </h2>
                  </div>
                  <table className="border-collapse border border-black text-[9px] w-32 shrink-0">
                    <tr className="bg-slate-100 font-bold"><th className="border border-black">작 성</th><th className="border border-black">검 토</th><th className="border border-black">승 인</th></tr>
                    <tr className="h-8 text-slate-400"><td className="border border-black text-center">(인)</td><td className="border border-black text-center">(인)</td><td className="border border-black text-center">(인)</td></tr>
                  </table>
                </div>

                {/* Meta row */}
                <div className="flex items-center justify-between text-[10px] font-bold">
                  <span>▣ 공정명 : {formData.processName}</span>
                  <span>작업일자 : 2026년 10월 16일</span>
                </div>
                <table className="w-full border-collapse border border-black text-[10px]">
                  <tr>
                    <td className="border border-black bg-slate-100 font-bold p-1 w-16 text-center">차종</td>
                    <td className="border border-black font-black p-1 text-center">{formData.carModel}</td>
                    <td className="border border-black bg-slate-100 font-bold p-1 w-16 text-center">품명</td>
                    <td className="border border-black font-black p-1 text-center">{formData.partName}</td>
                    <td className="border border-black bg-slate-100 font-bold p-1 w-16 text-center">작업자</td>
                    <td className="border border-black font-black p-1 text-center">박종미</td>
                  </tr>
                </table>

                {/* Block 1: Time & Qty */}
                {formData.blocks?.timeAndQty && (
                  <div className="border border-black p-1.5 bg-yellow-50/40 text-[10px] space-y-1">
                    <span className="font-black block text-slate-700">[블록 1: 작업시간 & 생산량 (계획/실적)]</span>
                    <div className="grid grid-cols-3 gap-1 text-center font-bold">
                      <div className="border p-1 bg-white">시간: 06:30 ~ 17:30</div>
                      <div className="border p-1 bg-white">계획: 800 EA</div>
                      <div className="border p-1 bg-white text-indigo-700 font-black">실적: 800 EA</div>
                    </div>
                  </div>
                )}

                {/* Block 2: Spec & LOT */}
                {formData.blocks?.specAndLot && (
                  <div className="border border-black p-1.5 space-y-1">
                    <span className="font-black text-[10px] block text-slate-700">[블록 2: 주요 규격 치수 실측 & LOT 관리]</span>
                    <table className="w-full border-collapse border border-black text-[9.5px]">
                      <tr className="bg-yellow-100 font-bold">
                        <th className="border border-black p-0.5">단면/항목</th>
                        <th className="border border-black p-0.5">규격(Spec)</th>
                        <th className="border border-black p-0.5">초물</th>
                        <th className="border border-black p-0.5">중물</th>
                        <th className="border border-black p-0.5">종물</th>
                      </tr>
                      {(formData.specs || []).map((s) => (
                        <tr key={s.id}>
                          <td className="border border-black p-0.5 text-center font-bold">{s.name}</td>
                          <td className="border border-black p-0.5 text-center text-indigo-800 font-black">{s.frtSpec || s.spec}</td>
                          <td className="border border-black p-0.5 text-center bg-emerald-50 text-emerald-800 font-bold">OK</td>
                          <td className="border border-black p-0.5 text-center bg-emerald-50 text-emerald-800 font-bold">OK</td>
                          <td className="border border-black p-0.5 text-center bg-emerald-50 text-emerald-800 font-bold">OK</td>
                        </tr>
                      ))}
                    </table>
                  </div>
                )}

                {/* Block 3: Machine Condition */}
                {formData.blocks?.machineCondition && (
                  <div className="border border-black p-1.5 bg-amber-50/50 text-[10px]">
                    <span className="font-black block text-amber-900 mb-0.5">[블록 3: 성형 / 사출 / 가류 조건]</span>
                    <div className="grid grid-cols-4 gap-1 text-center font-bold text-[9px]">
                      <div className="border p-1 bg-white">노즐: 220℃</div>
                      <div className="border p-1 bg-white">실린더: 215℃</div>
                      <div className="border p-1 bg-white">압력: 140 bar</div>
                      <div className="border p-1 bg-white">시간: 90 sec</div>
                    </div>
                  </div>
                )}

                {/* Block 4: Defect Matrix */}
                {formData.blocks?.defectMatrix && (
                  <div className="border border-black p-1.5 space-y-1">
                    <span className="font-black text-[10px] block text-slate-700">[블록 4: 불량 세부 매트릭스]</span>
                    <div className="flex flex-wrap gap-1 text-[9px]">
                      {(formData.defectCategories || []).flatMap((c) =>
                        (c.items || []).map((item, idx) => (
                          <span key={idx} className="border border-rose-300 px-1.5 py-0.5 bg-rose-50 rounded font-bold">
                            {item}: 0
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* Block 5: Maintenance */}
                {formData.blocks?.maintenance && (
                  <div className="border border-black p-1.5 text-[9.5px]">
                    <div className="grid grid-cols-2 gap-1 font-bold">
                      <div className="border p-1 bg-yellow-50">칼날교체: 08:30 완료</div>
                      <div className="border p-1 bg-white">설비이상: 특이사항 없음</div>
                    </div>
                  </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between text-[9px] font-bold pt-1 text-slate-500 border-t border-slate-300">
                  <span>{formData.formNo || "705-02(REV.4)"}</span>
                  <span className="font-black text-black">{formData.companyName || "(주)오륙"}</span>
                  <span>A4(210×297)</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// A4 Print Preview Modal (Standard sheet ready for A4 printing)
// ============================================================================
const A4PrintPreviewModal = ({ template, onClose }) => {
  const isMaterialPrep = template?.categoryId === "MATERIAL_PREP" || template?.divisionType === "SECTION_ABC";

  return (
    <div className="fixed inset-0 z-[200] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white text-black w-full max-w-4xl max-h-[94vh] rounded-3xl p-5 sm:p-8 overflow-y-auto space-y-4 shadow-2xl text-left">
        <div className="flex items-center justify-between border-b pb-3 no-print">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-indigo-600 text-white"><Printer className="w-5 h-5" /></span>
            <span className="font-black text-base">A4 표준 실물 서식 인쇄 미리보기</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs cursor-pointer flex items-center gap-1 shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>A4 인쇄 / PDF 저장</span>
            </button>
            <button onClick={onClose} className="p-1.5 rounded-xl text-slate-500 hover:bg-slate-100 cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Paper Container */}
        {isMaterialPrep ? (
          <MaterialPrepStandardA4Sheet template={template} showBlockBadges={false} />
        ) : (
          <div className="border-2 border-black p-6 rounded-none space-y-3 font-sans text-xs">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex-1 text-center pt-2">
                <h1 className="text-2xl font-black border-b-4 border-double border-black inline-block pb-1">
                  {template.title}
                </h1>
              </div>
              <table className="border-collapse border border-black text-xs w-40 text-center">
                <tr className="bg-slate-100 font-bold"><th className="border border-black py-1">작 성</th><th className="border border-black py-1">검 토</th><th className="border border-black py-1">승 인</th></tr>
                <tr className="h-12"><td className="border border-black">(인)</td><td className="border border-black">(인)</td><td className="border border-black">(인)</td></tr>
              </table>
            </div>

            <div className="flex items-center justify-between font-bold text-xs">
              <span>▣ 공정명 : {template.processName}</span>
              <span>작업일자 : 2026년 10월 16일</span>
            </div>

            <table className="w-full border-collapse border border-black text-xs text-center font-bold">
              <tr>
                <td className="border border-black bg-slate-100 w-24 p-1">차종</td>
                <td className="border border-black font-black p-1">{template.carModel}</td>
                <td className="border border-black bg-slate-100 w-24 p-1">품 명</td>
                <td className="border border-black font-black p-1">{template.partName}</td>
                <td className="border border-black bg-slate-100 w-24 p-1">작업자</td>
                <td className="border border-black font-black p-1">박종미</td>
              </tr>
            </table>

            {/* Specs */}
            {template.blocks?.specAndLot && (
              <table className="w-full border-collapse border border-black text-xs text-center">
                <thead>
                  <tr className="bg-yellow-200 font-black">
                    <th className="border border-black p-1">검사 부위 및 항목</th>
                    <th className="border border-black p-1">규격(Spec)</th>
                    <th className="border border-black p-1">초물 (Start)</th>
                    <th className="border border-black p-1">중물 (Middle)</th>
                    <th className="border border-black p-1">종물 (Finish)</th>
                    <th className="border border-black p-1">판정</th>
                  </tr>
                </thead>
                <tbody>
                  {(template.specs || []).map((s) => (
                    <tr key={s.id}>
                      <td className="border border-black p-1 font-bold">{s.name}</td>
                      <td className="border border-black p-1 font-black text-indigo-900">{s.frtSpec || s.spec}</td>
                      <td className="border border-black p-1">-</td>
                      <td className="border border-black p-1">-</td>
                      <td className="border border-black p-1">-</td>
                      <td className="border border-black p-1 font-bold text-emerald-700">OK</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between text-xs font-bold pt-2 border-t border-black">
              <span>{template.formNo || "705-02(REV.4)"}</span>
              <span className="font-black text-sm">{template.companyName || "(주)오륙"}</span>
              <span>A4(210×297)</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
