import React, { useState, useEffect } from "react";
import {
  Layers,
  Sparkles,
  Database,
  ChevronDown,
  ChevronUp,
  Maximize2,
  X,
  FileSpreadsheet,
  ExternalLink
} from "lucide-react";
import {
  getLocalWorkReportTemplates,
  subscribeWorkReportTemplates,
  getLocalCustomLegoBlocks,
  subscribeCustomLegoBlocks
} from "../../../services/workReportTemplateService";
import { LEGO_IMAGE_REFERENCES } from "../../lego/legoPresetData.js";
import LegoBlockCollectionModal from "../../lego/LegoBlockCollectionModal";

const WorkReportTemplateManagerView = React.lazy(() =>
  import("../../WorkReportTemplateManagerView").then((m) => ({
    default: m.WorkReportTemplateManagerView || m.default
  }))
);

export const LegoWorkReportBuilderBar = ({ onNavigateTab, currentProfile }) => {
  const [templateCount, setTemplateCount] = useState(() => getLocalWorkReportTemplates().length);
  const [customBlocks, setCustomBlocks] = useState(() => getLocalCustomLegoBlocks());
  const [isExpanded, setIsExpanded] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBlockCollectionOpen, setIsBlockCollectionOpen] = useState(false);
  const [collectionInitTab, setCollectionInitTab] = useState("ALL");

  useEffect(() => {
    const unsub = subscribeWorkReportTemplates((list) => {
      if (Array.isArray(list)) {
        setTemplateCount(list.length);
      }
    });
    const unsubBlocks = subscribeCustomLegoBlocks((list) => {
      if (Array.isArray(list)) {
        setCustomBlocks(list);
      }
    });
    return () => {
      unsub();
      unsubBlocks();
    };
  }, []);

  const totalBlocksCount = LEGO_IMAGE_REFERENCES.length + customBlocks.length;

  return (
    <div className="space-y-2 animate-fadeIn">
      {/* 🧩 한줄짜리 레고블록 작업일보 빌더 바 (단순화된 원라인 패널) */}
      <div className="rounded-2xl px-3 sm:px-4 py-2 sm:py-2.5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border border-indigo-500/40 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 min-w-0 transition-all hover:border-indigo-400/60">
        {/* 좌측: 타이틀 및 핵심 뱃지 요약 (한줄 구성) */}
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-wrap">
          <div className="p-1.5 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 text-white shadow-xs shrink-0 flex items-center justify-center">
            <Layers className="w-4 h-4 text-cyan-100" />
          </div>

          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <span className="font-black text-xs sm:text-sm text-white tracking-tight flex items-center gap-1.5 whitespace-nowrap">
              <span>레고블록 작업일보 빌더</span>
            </span>

            <button
              type="button"
              onClick={() => {
                setCollectionInitTab("ALL");
                setIsBlockCollectionOpen(true);
              }}
              className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-amber-400 hover:bg-amber-300 text-slate-950 flex items-center gap-1 whitespace-nowrap shadow-xs cursor-pointer transition active:scale-95"
              title="블록모음 열람 및 블록사진 분석·저장"
            >
              <span>🧱 블록모음</span>
            </button>
          </div>
        </div>

        {/* 우측: 직관적 액션 버튼 그룹 (한줄 내 배치) */}
        <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
          {/* 1. 전체화면 팝업 열기 */}
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs shadow-xs active:scale-95 transition-all cursor-pointer whitespace-nowrap"
            title="레고블록 작업일보 빌더를 전체화면 팝업으로 엽니다"
          >
            <Maximize2 className="w-3.5 h-3.5 text-slate-950" />
            <span>빌더 팝업 열기</span>
          </button>

          {/* 2. 전용 탭 바로가기 (네비게이션 연동) */}
          {onNavigateTab && (
            <button
              type="button"
              onClick={() => onNavigateTab("work_report_templates")}
              className="flex items-center gap-1 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-indigo-600/80 hover:bg-indigo-600 text-white font-black text-xs border border-indigo-400/30 shadow-xs active:scale-95 transition-all cursor-pointer whitespace-nowrap hidden sm:inline-flex"
              title="일보 양식 관리 전체 탭으로 전환합니다"
            >
              <ExternalLink className="w-3.5 h-3.5 text-indigo-200" />
              <span>전용 탭</span>
            </button>
          )}

          {/* 3. 인라인 펼치기 / 접기 토글 */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className={`flex items-center gap-1 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl font-black text-xs border transition-all cursor-pointer whitespace-nowrap ${
              isExpanded
                ? "bg-slate-800 text-slate-200 border-slate-600 hover:bg-slate-700"
                : "bg-white/10 text-white border-white/20 hover:bg-white/20"
            }`}
            title={isExpanded ? "빌더 접기" : "대시보드에서 빌더 바로 펼치기"}
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-3.5 h-3.5 text-slate-300" />
                <span>접기</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5 text-slate-300" />
                <span>펼치기</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 🌟 인라인 펼치기 영역 (사용자가 펼치기 버튼을 클릭했을 때만 확장) */}
      {isExpanded && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-3 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm animate-scaleUp">
          <React.Suspense
            fallback={
              <div className="p-8 text-center text-slate-400 font-bold">
                레고블록 작업일보 빌더를 불러오는 중입니다...
              </div>
            }
          >
            <WorkReportTemplateManagerView />
          </React.Suspense>
        </div>
      )}

      {/* 🌟 전체화면 팝업 모달 (빌더 팝업 열기 클릭 시 실행) */}
      {isModalOpen && (
        <div
          onClick={() => setIsModalOpen(false)}
          className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-fadeIn"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 w-full max-w-7xl h-[94vh] rounded-3xl border-2 border-indigo-500/50 shadow-2xl flex flex-col overflow-hidden animate-scaleUp relative"
          >
            {/* Modal Header */}
            <div className="px-4 sm:px-6 py-3 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between border-b border-indigo-500/40 shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-xl bg-cyan-500 text-slate-950 shadow-xs">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-sm sm:text-base leading-tight text-white flex items-center gap-1.5">
                    <span>레고블록 작업일보 빌더 & 양식 관리 센터</span>
                    <span className="px-2 py-0.2 rounded-full text-[10px] font-black bg-cyan-400 text-slate-950">
                      TEST 관제
                    </span>
                  </h3>
                  <p className="text-[11px] text-indigo-200/90 font-medium">
                    16대 표준 블록 조합 및 5대 공정 양식을 자유롭게 제작·수정·보관할 수 있습니다.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                title="닫기"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-2 sm:p-4">
              <React.Suspense
                fallback={
                  <div className="p-12 text-center text-slate-400 font-bold">
                    레고블록 작업일보 빌더를 불러오는 중입니다...
                  </div>
                }
              >
                <WorkReportTemplateManagerView />
              </React.Suspense>
            </div>
          </div>
        </div>
      )}

      {/* 🌟 블록모음 & 블록사진 AI 분석·저장 센터 모달 */}
      {isBlockCollectionOpen && (
        <LegoBlockCollectionModal
          isOpen={isBlockCollectionOpen}
          onClose={() => setIsBlockCollectionOpen(false)}
          standardBlocks={LEGO_IMAGE_REFERENCES}
          customBlocks={customBlocks}
          initialTab={collectionInitTab}
          onCustomBlockSaved={(saved) => {
            setCustomBlocks((prev) => [
              saved,
              ...prev.filter((b) => (b.id || b.key) !== (saved.id || saved.key))
            ]);
          }}
        />
      )}
    </div>
  );
};

export default LegoWorkReportBuilderBar;
