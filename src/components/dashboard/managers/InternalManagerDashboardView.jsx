import React from "react";
import { Cpu, Eye, EyeOff, Sparkles, Save, Check, X, Edit3, ArrowUp, ArrowDown, Trash2 } from "lucide-react";
import { TestBadgeBlockStudio } from "./TestBadgeBlockStudio";
import { PanelDesignCustomizerModal } from "./PanelDesignCustomizerModal";
import { BatchThemeCustomizerModal } from "./BatchThemeCustomizerModal";
import { AddPanelModal } from "./AddPanelModal";
import { STUDIO_MANAGERS } from "../../../config/dashboardPanelConfig";
import { ManagerDashboardBlockRenderer } from "./ManagerDashboardBlockRenderer";
import { useManagerDashboardLayoutState } from "./useManagerDashboardLayoutState";

export const InternalManagerDashboardView = (props) => {
  const { currentProfile, onNavigateTab } = props;

  // Layout & Customization State Hook
  const {
    isTest,
    selectedStudioManagerId,
    studioPanels,
    setStudioPanels,
    isSavingStudio,
    panelCustomSettings,
    editingBlockKeyFromDashboard,
    setEditingBlockKeyFromDashboard,
    isAddModalOpen,
    setIsAddModalOpen,
    insertTargetIndex,
    isBatchModalOpen,
    setIsBatchModalOpen,
    isTopStudioVisible,
    setIsTopStudioVisible,
    inlineEditingBlockKey,
    inlineDraftSettings,
    isSavingInline,
    saveSuccessToast,
    handleStartInlineEdit,
    handleCancelInlineEdit,
    handleUpdateInlineDraft,
    handleSaveInlineEdit,
    handleSelectStudioManager,
    handleSavePanelSetting,
    handleResetPanelSetting,
    handleBatchApplyTheme,
    handleSaveStudioLayout,
    handleMoveBlockOnDashboard,
    handleRemoveBlockFromDashboard,
    handleAddBlockToDashboard,
    handleResetStudioLayout,
    activeProfile,
    activePanelKeys
  } = useManagerDashboardLayoutState({ currentProfile });

  return (
    <>
      {/* 🛠️ [TEST 뱃지 전용] 최상단 관리자 대시보드 블록 조립 & 커스터마이저 스튜디오 */}
      {isTest && isTopStudioVisible && (
        <TestBadgeBlockStudio
          selectedManagerId={selectedStudioManagerId}
          onSelectManager={handleSelectStudioManager}
          activePanels={studioPanels}
          onChangePanels={setStudioPanels}
          onSaveLayout={handleSaveStudioLayout}
          onResetLayout={handleResetStudioLayout}
          onCloseStudio={() => setIsTopStudioVisible(false)}
          panelCustomSettings={panelCustomSettings}
          onSavePanelSetting={handleSavePanelSetting}
          onResetPanelSetting={handleResetPanelSetting}
          onBatchApplyTheme={handleBatchApplyTheme}
          isSaving={isSavingStudio}
        />
      )}

      {/* 🛠️ [TEST 뱃지 전용] 수정패널이 접혔을 때 펼치기 바 */}
      {isTest && !isTopStudioVisible && (
        <div className="flex items-center justify-between px-3.5 py-2 rounded-2xl bg-slate-900/95 border border-cyan-500/40 text-xs shadow-md animate-fadeIn">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-cyan-950 text-cyan-300 border border-cyan-700/60">
              🛠️ TEST 스튜디오
            </span>
            <span className="text-slate-300 font-bold text-xs">
              대시보드 수정패널이 닫혀 있습니다.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsTopStudioVisible(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-black text-xs shadow-md transition cursor-pointer active:scale-95"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>수정패널(스튜디오) 펼치기</span>
          </button>
        </div>
      )}

      {/* 🌟 압출동 현장작업자 전용 상단 배너 */}
      {(currentProfile?.building === "압출동" ||
        currentProfile?.id?.startsWith("ext_") ||
        currentProfile?.name === "공영국") &&
        currentProfile?.name !== "설유철" &&
        currentProfile?.id !== "sam_yc" && (
          <div className="p-3 sm:p-4 rounded-2xl bg-gradient-to-r from-teal-600 via-teal-700 to-teal-800 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-2 rounded-xl bg-white/20 backdrop-blur-xs text-white shrink-0">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-sm sm:text-base leading-tight">
                  🏭 삼랑진공장 압출동 작업자 모드 ({currentProfile.name}
                  {currentProfile.title ? ` ${currentProfile.title}` : ""})
                </h3>
                <p className="text-xs text-teal-100 font-medium">
                  압출 생산관리 탭에서 실시간 작업일보 작성 및 생산실적/비가동 분석을 확인하세요.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                try {
                  localStorage.setItem("factory_extrusion_active_subtab", "production");
                } catch (e) {}
                if (onNavigateTab) onNavigateTab("extrusion_downtime");
              }}
              className="px-4 py-2 rounded-xl bg-white text-teal-800 font-black text-xs sm:text-sm hover:bg-teal-50 active:scale-95 transition-all shadow-sm shrink-0 cursor-pointer text-center"
            >
              🏭 압출 생산관리 및 작업일보 바로가기 ➡️
            </button>
          </div>
        )}

      {/* 🌟 빈 화면 안내 */}
      {isTest && activePanelKeys.length === 0 && (
        <div className="p-8 sm:p-12 rounded-3xl bg-slate-900 border-2 border-dashed border-cyan-500/40 text-center space-y-3 animate-fadeIn">
          <p className="text-slate-300 font-bold text-sm">현재 화면에 배치된 패널 블록이 없습니다.</p>
          <p className="text-xs text-slate-500">상단 스튜디오 풀에서 원하는 패널을 활성화하여 맞춤형 대시보드를 구성하세요.</p>
        </div>
      )}

      {/* 🌟 블록 배열 순서대로 동적 렌더링 */}
      {activePanelKeys.map((blockKey, idx) => {
        const isEditingThisBlock = inlineEditingBlockKey === blockKey;

        return (
          <div
            key={blockKey}
            className={`relative group/panel transition-all ${
              isEditingThisBlock
                ? "ring-2 ring-cyan-400 rounded-3xl p-1 bg-cyan-950/10 shadow-2xl shadow-cyan-950/50"
                : ""
            }`}
          >
            {/* 🛠️ [TEST 모드]: 인패널 컨트롤러 */}
            {isTest && (
              <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 opacity-90 group-hover/panel:opacity-100 transition-opacity bg-slate-900/95 backdrop-blur-md px-2.5 py-1 rounded-xl border border-cyan-500/50 shadow-xl max-w-[95%] overflow-x-auto">
                {isEditingThisBlock ? (
                  <>
                    <div className="flex items-center gap-1 pr-2 border-r border-slate-700">
                      <span className="text-[10px] text-slate-400 font-bold hidden sm:inline">테마:</span>
                      {[
                        { key: "indigo", bg: "bg-indigo-500", name: "인디고" },
                        { key: "ocean", bg: "bg-sky-500", name: "오션" },
                        { key: "emerald", bg: "bg-emerald-500", name: "에메랄드" },
                        { key: "amber", bg: "bg-amber-500", name: "앰버" },
                        { key: "slate", bg: "bg-slate-500", name: "슬레이트" },
                        { key: "light", bg: "bg-white", name: "라이트" }
                      ].map((th) => (
                        <button
                          key={th.key}
                          type="button"
                          onClick={() => handleUpdateInlineDraft({ theme: th.key })}
                          title={`${th.name} 테마 적용`}
                          className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full ${th.bg} cursor-pointer transition-transform hover:scale-125 border ${
                            (inlineDraftSettings.theme || panelCustomSettings[blockKey]?.theme || "indigo") === th.key
                              ? "ring-2 ring-cyan-400 scale-110"
                              : "opacity-60 hover:opacity-100"
                          }`}
                        />
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSaveInlineEdit(blockKey)}
                      disabled={isSavingInline}
                      className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-1 shadow-md shadow-emerald-950/40 cursor-pointer transition active:scale-95"
                      title="수정한 제목과 뱃지를 저장합니다"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{isSavingInline ? "저장 중..." : "✓ 완료 및 저장"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleCancelInlineEdit}
                      className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center gap-1 cursor-pointer transition"
                      title="수정 취소"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>취소</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => handleStartInlineEdit(blockKey)}
                      title="이 패널의 제목·뱃지·KPI를 패널에서 직접 수정"
                      className="px-2.5 py-1 rounded-lg bg-cyan-950 hover:bg-cyan-800 text-cyan-300 hover:text-white font-black text-xs flex items-center gap-1 border border-cyan-700/60 cursor-pointer transition active:scale-95"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-cyan-400" />
                      <span>패널 직접수정</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveBlockOnDashboard(idx, "up")}
                      disabled={idx === 0}
                      title="위로 이동"
                      className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-20 cursor-pointer transition"
                    >
                      <ArrowUp className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveBlockOnDashboard(idx, "down")}
                      disabled={idx === activePanelKeys.length - 1}
                      title="아래로 이동"
                      className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-20 cursor-pointer transition"
                    >
                      <ArrowDown className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveBlockFromDashboard(blockKey)}
                      title="이 패널 화면에서 삭제(제외)"
                      className="p-1 rounded-lg bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white cursor-pointer transition"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </>
                )}
              </div>
            )}

            <ManagerDashboardBlockRenderer
              blockKey={blockKey}
              activeProfile={activeProfile}
              panelCustomSettings={panelCustomSettings}
              inlineEditingBlockKey={inlineEditingBlockKey}
              handleUpdateInlineDraft={handleUpdateInlineDraft}
              {...props}
            />
          </div>
        );
      })}

      {/* 🚀 [TEST 모드 전용] 화면 하단 고정 플로팅 퀵 액션바 */}
      {isTest && (
        <div className="sticky bottom-4 z-40 max-w-fit mx-auto px-3.5 sm:px-4 py-2 rounded-2xl bg-slate-900/95 backdrop-blur-md border-2 border-cyan-500/60 shadow-2xl shadow-cyan-950/80 flex items-center gap-2 sm:gap-2.5 flex-wrap animate-fadeIn text-xs">
          <div className="flex items-center gap-1.5 pr-2.5 border-r border-slate-700">
            <span className="text-[11px] text-slate-400 font-bold hidden sm:inline">관리자 뱃지:</span>
            <select
              value={selectedStudioManagerId}
              onChange={(e) => handleSelectStudioManager(e.target.value)}
              className="px-2 py-1 rounded-xl bg-slate-800 border border-cyan-500/40 text-cyan-300 font-black text-xs cursor-pointer outline-none hover:border-cyan-400"
            >
              {STUDIO_MANAGERS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.icon} {m.name} {m.title} ({m.plant.replace("공장", "")})
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => setIsBatchModalOpen(true)}
            className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-teal-700 text-teal-300 hover:text-white border border-slate-700 font-bold flex items-center gap-1 cursor-pointer transition active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">디자인 통일</span>
          </button>

          <button
            type="button"
            onClick={() => setIsTopStudioVisible((v) => !v)}
            className="px-2 sm:px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center gap-1 cursor-pointer transition"
            title={isTopStudioVisible ? "상단 스튜디오 접기" : "상단 스튜디오 펼치기"}
          >
            {isTopStudioVisible ? <EyeOff className="w-3.5 h-3.5 text-slate-400" /> : <Eye className="w-3.5 h-3.5 text-cyan-400" />}
            <span className="hidden sm:inline">{isTopStudioVisible ? "스튜디오 접기" : "스튜디오 펼치기"}</span>
          </button>

          <button
            type="button"
            onClick={handleSaveStudioLayout}
            disabled={isSavingStudio}
            className="px-3.5 sm:px-4 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-black flex items-center gap-1.5 shadow-md shadow-cyan-950/50 cursor-pointer active:scale-95 disabled:opacity-50"
          >
            {isSavingStudio ? <span className="animate-spin">⏳</span> : <Save className="w-3.5 h-3.5" />}
            <span>이 화면 설정 저장</span>
          </button>
        </div>
      )}

      {/* 🌟 설정 저장 완료 토스트 */}
      {saveSuccessToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl bg-emerald-600 text-white font-black text-xs sm:text-sm shadow-2xl shadow-emerald-950/80 border-2 border-emerald-400 flex items-center gap-2 animate-bounce">
          <Check className="w-4 h-4 text-emerald-200" />
          <span>{saveSuccessToast}</span>
        </div>
      )}

      {/* ➕ [모달]: 패널 블록 추가 모달 */}
      {isAddModalOpen && (
        <AddPanelModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          activePanels={studioPanels}
          insertIndex={insertTargetIndex}
          onAddBlock={handleAddBlockToDashboard}
        />
      )}

      {/* 🎨 [모달]: 대시보드에서 직접 패널 클릭 시 열리는 제목 & 디자인 커스터마이저 모달 */}
      {editingBlockKeyFromDashboard && (
        <PanelDesignCustomizerModal
          isOpen={Boolean(editingBlockKeyFromDashboard)}
          onClose={() => setEditingBlockKeyFromDashboard(null)}
          blockKey={editingBlockKeyFromDashboard}
          currentManager={STUDIO_MANAGERS.find((m) => m.id === selectedStudioManagerId) || STUDIO_MANAGERS[0]}
          initialSettings={panelCustomSettings[editingBlockKeyFromDashboard] || {}}
          onSave={handleSavePanelSetting}
          onReset={handleResetPanelSetting}
          onRemoveBlock={handleRemoveBlockFromDashboard}
        />
      )}

      {/* 🌟 [모달]: 전체 패널 디자인 일괄 통일 모달 */}
      {isBatchModalOpen && (
        <BatchThemeCustomizerModal
          isOpen={isBatchModalOpen}
          onClose={() => setIsBatchModalOpen(false)}
          activePanels={studioPanels}
          currentManager={STUDIO_MANAGERS.find((m) => m.id === selectedStudioManagerId) || STUDIO_MANAGERS[0]}
          onApplyBatch={handleBatchApplyTheme}
        />
      )}
    </>
  );
};

export default InternalManagerDashboardView;
