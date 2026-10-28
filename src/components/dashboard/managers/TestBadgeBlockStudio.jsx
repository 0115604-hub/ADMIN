import React, { useState } from "react";
import {
  Boxes,
  ArrowUp,
  ArrowDown,
  X,
  Plus,
  Save,
  RotateCcw,
  Sparkles,
  UserCheck,
  SlidersHorizontal,
  Eye,
  Palette
} from "lucide-react";
import {
  ALL_DASHBOARD_BLOCKS,
  STUDIO_MANAGERS
} from "../../../config/dashboardPanelConfig";
import { PanelDesignCustomizerModal } from "./PanelDesignCustomizerModal";
import { BatchThemeCustomizerModal } from "./BatchThemeCustomizerModal";

export const TestBadgeBlockStudio = ({
  selectedManagerId,
  onSelectManager,
  activePanels,
  onChangePanels,
  onSaveLayout,
  onResetLayout,
  panelCustomSettings = {},
  onSavePanelSetting,
  onResetPanelSetting,
  onBatchApplyTheme,
  isSaving = false
}) => {
  const [selectedPlantTab, setSelectedPlantTab] = useState("ALL"); // ALL, 본사, 삼랑진공장, 한림공장
  const [editingBlockKey, setEditingBlockKey] = useState(null);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);

  const currentManager =
    STUDIO_MANAGERS.find((m) => m.id === selectedManagerId) || STUDIO_MANAGERS[0];

  const filteredManagers = STUDIO_MANAGERS.filter((m) => {
    if (selectedPlantTab === "ALL") return true;
    return m.plant === selectedPlantTab;
  });

  // Move block up in sequence
  const handleMoveUp = (index) => {
    if (index <= 0) return;
    const next = [...activePanels];
    const temp = next[index - 1];
    next[index - 1] = next[index];
    next[index] = temp;
    onChangePanels(next);
  };

  // Move block down in sequence
  const handleMoveDown = (index) => {
    if (index >= activePanels.length - 1) return;
    const next = [...activePanels];
    const temp = next[index + 1];
    next[index + 1] = next[index];
    next[index] = temp;
    onChangePanels(next);
  };

  // Remove block from active list
  const handleRemoveBlock = (blockKey) => {
    const next = activePanels.filter((k) => k !== blockKey);
    onChangePanels(next);
  };

  // Add block to active list
  const handleAddBlock = (blockKey) => {
    if (activePanels.includes(blockKey)) return;
    onChangePanels([...activePanels, blockKey]);
  };

  // Blocks that are not currently active
  const inactiveBlocks = ALL_DASHBOARD_BLOCKS.filter(
    (b) => !activePanels.includes(b.key)
  );

  return (
    <>
      <div className="bg-slate-900 border-2 border-cyan-500/40 rounded-3xl p-4 sm:p-6 shadow-2xl space-y-5 animate-fadeIn">
        {/* 1. Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-cyan-600 via-teal-500 to-emerald-500 text-white shadow-lg shadow-cyan-950/50">
              <Boxes className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                  🛠️ 관리자 대시보드 블록 & 디자인 스튜디오 (Studio)
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-cyan-950 text-cyan-300 border border-cyan-700/80">
                  TEST 전용
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                패널 블록 온/오프, 순서 이동, <strong>패널 제목 직접 수정 및 디자인 테마 일괄 통일</strong>이 가능합니다.
              </p>
            </div>
          </div>

          {/* Global Action Buttons */}
          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 flex-wrap">
            {/* 전체 일괄 통일 버튼 */}
            <button
              type="button"
              onClick={() => setIsBatchModalOpen(true)}
              className="px-3 py-2 rounded-xl bg-teal-950 hover:bg-teal-900 text-teal-300 hover:text-white font-bold text-xs flex items-center gap-1.5 transition-all border border-teal-700 cursor-pointer active:scale-95 shadow-xs"
              title="모든 활성 패널의 테마, 규격, 주석 숨김을 한 번에 통일"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>전체 디자인 일괄 통일</span>
            </button>

            <button
              type="button"
              onClick={onResetLayout}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs flex items-center gap-1.5 transition-all border border-slate-700 cursor-pointer active:scale-95"
              title="이 관리자의 패널 구성을 공장 기본값으로 복원"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>기본값 복원</span>
            </button>

            <button
              type="button"
              onClick={onSaveLayout}
              disabled={isSaving}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-1.5 shadow-md shadow-cyan-950/50 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
              title="이 관리자의 커스텀 대시보드 구성을 클라우드 및 전 기기에 영구 저장"
            >
              {isSaving ? (
                <span className="animate-spin text-sm">⏳</span>
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>[{currentManager.name}] 설정 저장</span>
            </button>
          </div>
        </div>

        {/* 2. Manager Selection Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span>커스터마이징할 관리자 선택</span>
            </label>
            {/* Factory Plant Filter Pills */}
            <div className="flex items-center gap-1">
              {[
                { id: "ALL", label: "전체" },
                { id: "삼랑진공장", label: "삼랑진" },
                { id: "한림공장", label: "한림" },
                { id: "본사", label: "본사" }
              ].map((plant) => (
                <button
                  key={plant.id}
                  type="button"
                  onClick={() => setSelectedPlantTab(plant.id)}
                  className={`px-2 py-0.5 rounded-lg text-[10.5px] font-bold transition-all cursor-pointer ${
                    selectedPlantTab === plant.id
                      ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                      : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  {plant.label}
                </button>
              ))}
            </div>
          </div>

          {/* Manager Cards Horizontal Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
            {filteredManagers.map((mgr) => {
              const isSelected = mgr.id === selectedManagerId;
              return (
                <button
                  key={mgr.id}
                  type="button"
                  onClick={() => onSelectManager(mgr.id)}
                  className={`p-2 rounded-2xl text-left border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                    isSelected
                      ? "bg-cyan-950/80 border-cyan-400 shadow-md shadow-cyan-950 text-white ring-1 ring-cyan-400/50"
                      : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs">{mgr.icon}</span>
                    <span className="text-[9.5px] font-mono text-slate-500 truncate max-w-[60px]">
                      {mgr.plant.replace("공장", "")}
                    </span>
                  </div>
                  <div>
                    <div className="font-black text-xs truncate flex items-center gap-1">
                      <span className={isSelected ? "text-cyan-300" : ""}>{mgr.name}</span>
                      <span className="text-[10px] text-slate-500 font-medium">{mgr.title}</span>
                    </div>
                    <div className="text-[9.5px] text-slate-500 truncate">{mgr.process}</div>
                  </div>
                  {isSelected && (
                    <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Block Arrangement Section */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-teal-400" />
              <span>현재 배치된 패널 블록 (순서 이동 · 제목 및 디자인 수정) - 총 {activePanels.length}개</span>
            </label>
            <span className="text-[11px] text-slate-500 font-mono">
              [🎨 제목/디자인] 클릭 시 명칭 수정 및 테마 변경
            </span>
          </div>

          {/* Active Blocks List */}
          {activePanels.length === 0 ? (
            <div className="p-6 rounded-2xl bg-slate-950/80 border border-dashed border-slate-800 text-center text-xs text-slate-500">
              배치된 패널 블록이 없습니다. 아래 풀에서 패널을 추가해 주세요.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {activePanels.map((blockKey, idx) => {
                const meta =
                  ALL_DASHBOARD_BLOCKS.find((b) => b.key === blockKey) || {
                    label: blockKey,
                    badge: "패널",
                    category: "기타",
                    description: ""
                  };
                const blockSetting = panelCustomSettings[blockKey] || {};
                const hasCustomTitle = Boolean(blockSetting.customTitle || blockSetting.customTopTitle || blockSetting.customBottomTitle);

                return (
                  <div
                    key={blockKey}
                    className="bg-slate-950/90 border border-slate-800 hover:border-slate-700 rounded-2xl p-3 flex items-center justify-between gap-2 shadow-xs group transition-all"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-black text-xs text-slate-200 truncate">
                            {meta.label}
                          </span>
                          <span className="px-1.5 py-0.2 rounded-md bg-slate-800 text-slate-400 text-[9.5px] font-medium shrink-0">
                            {meta.badge}
                          </span>
                        </div>
                        {hasCustomTitle ? (
                          <div className="text-[10px] text-cyan-300 font-bold truncate mt-0.5 flex items-center gap-1">
                            <span>✏️</span>
                            <span className="truncate">
                              {blockSetting.customTitle || blockSetting.customBottomTitle || blockSetting.customTopTitle}
                            </span>
                          </div>
                        ) : (
                          <p className="text-[10px] text-slate-500 truncate mt-0.5">{meta.description}</p>
                        )}
                      </div>
                    </div>

                    {/* Move, Edit & Remove Controls */}
                    <div className="flex items-center gap-1 shrink-0">
                      {/* 🎨 제목/디자인 수정 버튼 */}
                      <button
                        type="button"
                        onClick={() => setEditingBlockKey(blockKey)}
                        className="px-2 py-1 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 hover:text-white border border-cyan-700/60 font-bold text-[10.5px] flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                        title="이 패널의 제목 수정 및 디자인 변경"
                      >
                        <Palette className="w-3 h-3" />
                        <span className="hidden sm:inline">제목/디자인</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleMoveUp(idx)}
                        disabled={idx === 0}
                        className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                        title="위로 이동"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveDown(idx)}
                        disabled={idx === activePanels.length - 1}
                        className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                        title="아래로 이동"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveBlock(blockKey)}
                        className="p-1 rounded-lg bg-rose-950/60 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-900/60 transition-all cursor-pointer"
                        title="이 블록 제외"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 4. Inactive Blocks Pool (추가 가능한 블록 풀) */}
        {inactiveBlocks.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <label className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 text-emerald-400" />
              <span>추가 가능한 대시보드 블록 풀 ({inactiveBlocks.length}개 선택 가능)</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
              {inactiveBlocks.map((b) => (
                <button
                  key={b.key}
                  type="button"
                  onClick={() => handleAddBlock(b.key)}
                  className="p-2 rounded-xl bg-slate-950/50 hover:bg-slate-800/80 border border-dashed border-slate-800 hover:border-emerald-500/60 text-left transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-slate-500 font-bold">{b.category}</span>
                    <Plus className="w-3 h-3 text-emerald-400 group-hover:scale-125 transition-transform" />
                  </div>
                  <div className="font-bold text-xs text-slate-300 group-hover:text-emerald-300 truncate">
                    {b.label}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 5. Live Preview Sticky Banner */}
        <div className="p-3 rounded-2xl bg-gradient-to-r from-cyan-950 via-slate-950 to-indigo-950 border border-cyan-500/30 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-cyan-300 font-bold">
            <Eye className="w-4 h-4 animate-pulse text-cyan-400" />
            <span>
              현재 아래 화면은 <strong className="text-white underline decoration-cyan-400">[{currentManager.plant} {currentManager.name} {currentManager.title}]</strong> 시각으로 실시간 조립 렌더링 중입니다.
            </span>
          </div>
          <div className="text-[11px] text-slate-400 font-mono hidden sm:block">
            블록 설정 및 제목/디자인을 수정하면 아래 화면에 즉시 반영됩니다.
          </div>
        </div>
      </div>

      {/* 🎨 개별 패널 제목 및 디자인 수정 모달 */}
      {editingBlockKey && (
        <PanelDesignCustomizerModal
          isOpen={Boolean(editingBlockKey)}
          onClose={() => setEditingBlockKey(null)}
          blockKey={editingBlockKey}
          currentManager={currentManager}
          initialSettings={panelCustomSettings[editingBlockKey] || {}}
          onSave={onSavePanelSetting}
          onReset={onResetPanelSetting}
        />
      )}

      {/* 🌟 전체 패널 디자인 일괄 통일 모달 */}
      {isBatchModalOpen && (
        <BatchThemeCustomizerModal
          isOpen={isBatchModalOpen}
          onClose={() => setIsBatchModalOpen(false)}
          activePanels={activePanels}
          currentManager={currentManager}
          onApplyBatch={onBatchApplyTheme}
        />
      )}
    </>
  );
};

export default TestBadgeBlockStudio;
