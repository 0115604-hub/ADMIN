import { useState, useEffect, useMemo } from "react";
import {
  Layers,
  FileSpreadsheet,
  Database
} from "lucide-react";
import {
  REPORT_MAJOR_CATEGORIES,
  getLocalWorkReportTemplates,
  subscribeWorkReportTemplates,
  saveWorkReportTemplate,
  deleteWorkReportTemplate,
  deleteAllWorkReportTemplates,
  cloneWorkReportTemplate
} from "../services/workReportTemplateService";
import { deleteMachiningWorkReport } from "../services/machiningWorkReportService";
import LegoWorkReportBuilder from "./lego/LegoWorkReportBuilder.jsx";
import { MaterialPrepStandardA4Sheet } from "./lego/templates/MaterialPrepStandardA4Sheet";
import { LegoTemplateEditorModal } from "./lego/templates/LegoTemplateEditorModal";
import { A4PrintPreviewModal } from "./lego/templates/A4PrintPreviewModal";
import { TemplateCatalogGrid } from "./lego/templates/TemplateCatalogGrid";

// Re-export for backward compatibility with external modals
export { MaterialPrepStandardA4Sheet, LegoTemplateEditorModal };

export const WorkReportTemplateManagerView = () => {
  const [managerViewMode, setManagerViewMode] = useState("LEGO_BUILDER"); // 'LEGO_BUILDER' | 'CATALOG'
  const [templates, setTemplates] = useState(() => getLocalWorkReportTemplates());
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [legoInitialData, setLegoInitialData] = useState(null);

  useEffect(() => {
    const unsub = subscribeWorkReportTemplates((list) => {
      if (Array.isArray(list)) {
        setTemplates(list);
      }
    });
    const handleCustomTemplatesUpdate = (e) => {
      if (Array.isArray(e.detail)) {
        setTemplates(e.detail);
      } else {
        setTemplates(getLocalWorkReportTemplates());
      }
    };
    window.addEventListener("work-report-templates-updated", handleCustomTemplatesUpdate);
    return () => {
      unsub();
      window.removeEventListener("work-report-templates-updated", handleCustomTemplatesUpdate);
    };
  }, []);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 2500);
  };

  const filteredTemplates = useMemo(() => {
    return templates.filter((t) => {
      const matchCat = selectedCategory === "ALL" || t.categoryId === selectedCategory;
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
    const counts = { ALL: templates.length };
    REPORT_MAJOR_CATEGORIES.forEach((c) => {
      counts[c.id] = templates.filter((t) => t.categoryId === c.id).length;
    });
    return counts;
  }, [templates]);

  // Open Editor for New Template
  const handleAddNew = () => {
    const targetCatId = selectedCategory === "ALL" ? "MATERIAL_PREP" : selectedCategory;
    const curCat = REPORT_MAJOR_CATEGORIES.find((c) => c.id === targetCatId);
    setEditingTemplate({
      id: "",
      categoryId: targetCatId,
      categoryName: curCat?.name || "소재준비일보",
      title: targetCatId === "MATERIAL_PREP" ? "소재준비작업일보" : `${curCat?.name.replace("일보", "") || "작업"}작업일보`,
      subTitle: "",
      formNo: "705-02(REV.4)",
      companyName: "(주)오륙",
      carModel: "신규차종",
      partName: "신규품명",
      processName: curCat?.name.replace("일보", "") || "소재준비",
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
      try {
        await deleteMachiningWorkReport(tpl.id);
      } catch (mErr) {}
      setTemplates((prev) => prev.filter((t) => t.id !== tpl.id));
      showToast("🗑️ 양식이 삭제되었습니다.");
    } catch (e) {
      alert("삭제 실패: " + e.message);
    }
  };

  // Delete All Templates
  const handleDeleteAll = async () => {
    if (!confirm("정말 5대 공정 양식 보관함에 있는 모든 양식을 일괄 삭제하시겠습니까?")) return;
    try {
      await deleteAllWorkReportTemplates();
      setTemplates([]);
      showToast("🗑️ 보관함의 모든 양식이 일괄 삭제되었습니다.");
    } catch (e) {
      alert("일괄 삭제 실패: " + e.message);
    }
  };

  // Save Template from Editor (수정등록)
  const handleSaveEditor = async (tplData) => {
    try {
      await saveWorkReportTemplate(tplData);
      setIsEditorOpen(false);
      setEditingTemplate(null);
      setTemplates(getLocalWorkReportTemplates());
      showToast(`✅ [${tplData.carModel || tplData.title || "양식"}] 템플릿이 성공적으로 수정 등록되었습니다!`);
    } catch (e) {
      alert("수정등록 실패: " + e.message);
    }
  };

  // ⚡ 템플릿 적용 (일보 작성 모드로 전환 및 데이터 전달)
  const handleApplyEditor = async (tplData) => {
    try {
      await saveWorkReportTemplate(tplData);
      setIsEditorOpen(false);
      setEditingTemplate(null);
      setLegoInitialData({
        ...tplData,
        appliedAt: Date.now(),
        fromCatalog: true
      });
      setManagerViewMode("LEGO_BUILDER");
      showToast(`⚡ [${tplData.carModel || tplData.title || "양식"}] 템플릿이 성공적으로 적용되었습니다! 즉시 작성이 가능합니다.`);
    } catch (e) {
      alert("템플릿 적용 실패: " + e.message);
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
    const localList = getLocalWorkReportTemplates();
    if (savedTpl && savedTpl.id && !localList.some((t) => t.id === savedTpl.id)) {
      setTemplates([savedTpl, ...localList]);
    } else {
      setTemplates(localList);
    }
    setSelectedCategory("ALL");
    showToast(`✅ [${savedTpl?.title || "양식"}] 5대 공정 양식 보관함에 등록되었습니다!`);
  };

  return (
    <div className="space-y-3 animate-fadeIn p-1 sm:p-2 text-left">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2 rounded-xl bg-indigo-600 text-white font-black text-xs shadow-2xl animate-bounce">
          {toastMsg}
        </div>
      )}

      {/* 🧭 Top Mode Switcher (컴팩트 고시인성 탭) */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-900/90 dark:bg-slate-950 rounded-xl border border-slate-700/80 w-fit flex-wrap shadow-xs">
        <button
          type="button"
          onClick={() => setManagerViewMode("LEGO_BUILDER")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-black text-xs transition-all cursor-pointer whitespace-nowrap ${
            managerViewMode === "LEGO_BUILDER"
              ? "bg-cyan-500 text-slate-950 shadow-xs font-black ring-1 ring-cyan-300"
              : "text-slate-300 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>🧩 레고 블록 조합기</span>
        </button>
        <button
          type="button"
          onClick={() => setManagerViewMode("CATALOG")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-black text-xs transition-all cursor-pointer whitespace-nowrap ${
            managerViewMode === "CATALOG"
              ? "bg-white text-slate-950 shadow-xs font-black"
              : "text-slate-300 hover:text-white hover:bg-slate-800"
          }`}
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-400" />
          <span>📋 5대 공정 양식 보관함</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-cyan-400 text-slate-950 flex items-center gap-0.5">
            <Database className="w-2.5 h-2.5 text-slate-950" />
            <span>{templates.length}</span>
          </span>
        </button>
      </div>

      {managerViewMode === "LEGO_BUILDER" ? (
        <LegoWorkReportBuilder
          initialTemplateData={legoInitialData}
          onSaveToTemplateManager={handleSaveFromLegoBuilder}
          onNavigateToCatalog={() => setManagerViewMode("CATALOG")}
        />
      ) : (
        <TemplateCatalogGrid
          templates={templates}
          filteredTemplates={filteredTemplates}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          categoryCounts={categoryCounts}
          handleAddNew={handleAddNew}
          handleDeleteAll={handleDeleteAll}
          handleEdit={handleEdit}
          handleOpenInLegoBuilder={handleOpenInLegoBuilder}
          setPreviewTemplate={setPreviewTemplate}
          setIsPreviewOpen={setIsPreviewOpen}
          handleClone={handleClone}
          handleDelete={handleDelete}
        />
      )}

      {/* Modal: Lego Block Template Editor (전체보기 / 수정등록 / 템플릿적용) */}
      {isEditorOpen && editingTemplate && (
        <LegoTemplateEditorModal
          template={editingTemplate}
          onClose={() => {
            setIsEditorOpen(false);
            setEditingTemplate(null);
          }}
          onSave={handleSaveEditor}
          onApply={handleApplyEditor}
        />
      )}

      {/* Modal: A4 Print Preview Modal */}
      {isPreviewOpen && previewTemplate && (
        <A4PrintPreviewModal
          template={previewTemplate}
          onClose={() => {
            setIsPreviewOpen(false);
            setPreviewTemplate(null);
          }}
        />
      )}
    </div>
  );
};

export default WorkReportTemplateManagerView;
