import { useState } from "react";
import { ImagePreviewModal } from "../common/ImagePreviewModal";
import Step2ProductionManagerPanel from "../production/Step2ProductionManagerPanel";
import Step3QualityControlPanel from "../quality/Step3QualityControlPanel";
import Step4ExecutiveApprovalPanel from "../executive/Step4ExecutiveApprovalPanel";
import {
  registerToFourMLedger,
  unregisterFromFourMLedger,
  updateFourMClassification
} from "../../services/fourMChangePointService";

import { useUnified4MData } from "./abnormality/hooks/useUnified4MData";
import { useAbnormalityFilter } from "./abnormality/hooks/useAbnormalityFilter";
import { AbnormalityHeader } from "./abnormality/AbnormalityHeader";
import { AbnormalityTableView } from "./abnormality/AbnormalityTableView";
import { AbnormalityCardView } from "./abnormality/AbnormalityCardView";
import { AbnormalityDetailModal } from "./abnormality/AbnormalityDetailModal";
import { PANEL_THEMES } from "../../config/panelThemeConfig";

/**
 * UnifiedAbnormalityControlPanel (Facade Container)
 * Orchestrates 4M data pipeline, role-based workflows, high-density table & card views, and modal dialogs.
 */
export const UnifiedAbnormalityControlPanel = ({
  workLogs = [],
  onOpenWorkLogDetail = null,
  onOpenIssueModal = null,
  onOpenExtrusionReport = null,
  currentProfile = null,
  onNavigateTab = null,
  customSettings = null
}) => {
  // 1. Data Aggregation & Realtime Subscriptions
  const {
    allUnifiedRecords,
    fourMLedgerRecords,
    setFourMLedgerRecords,
    setFourMRevision,
    isLoading,
    todayStr,
    handleManualRefresh
  } = useUnified4MData(workLogs);

  // 2. Filter & Statistics State
  const {
    viewMode,
    setViewMode,
    selected4MTab,
    setSelected4MTab,
    selectedOriginFilter,
    setSelectedOriginFilter,
    filteredRecords,
    stats,
    handleExportExcel
  } = useAbnormalityFilter(allUnifiedRecords, fourMLedgerRecords, todayStr);

  // 3. Modals & Detail State
  const [selectedItemForDetail, setSelectedItemForDetail] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  // 4. 사내관리등록 상태 저장
  const [internalMgmtMap, setInternalMgmtMap] = useState(() => {
    try {
      const raw = localStorage.getItem("factory_internal_mgmt_registry_v1");
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  // 4M 카테고리 수동 변경
  const handleUpdateItemFourM = async (item, newFourM) => {
    if (!item || !newFourM || item.fourM === newFourM) return;

    try {
      const updatedList = await updateFourMClassification(
        item,
        newFourM,
        currentProfile?.name || "관리자"
      );

      if (updatedList) {
        setFourMLedgerRecords(updatedList);
      }

      setSelectedItemForDetail((prev) => {
        if (!prev) return null;
        const pId = String(prev.id || "");
        const itId = String(item.id || "");
        if (pId === itId || (item.originalId && pId === item.originalId)) {
          return { ...prev, fourM: newFourM, isManualFourM: true };
        }
        return prev;
      });

      setFourMRevision((r) => r + 1);
    } catch (err) {
      console.error("Failed to update 4M classification:", err);
      alert("4M 분류 변경 중 오류가 발생했습니다.");
    }
  };

  // 공식 변동점 관리대장 등록 및 해제
  const handleToggleLedger = async (item) => {
    if (!item) return;
    const rawId = item.raw?.id || "";
    const isAlready = fourMLedgerRecords.some(
      (r) =>
        r.originalId === item.id ||
        r.id === item.id ||
        r.id === `ledger_${item.id}` ||
        `ledger_${r.originalId}` === item.id ||
        (rawId && (r.rawId === rawId || r.originalId === rawId || r.id === rawId || r.id === `ledger_${rawId}`))
    );

    if (isAlready) {
      if (window.confirm(`[${item.title}]\n\n항목을 공식 변동점 관리대장에서 등록 해제(삭제)하시겠습니까?`)) {
        const updated = await unregisterFromFourMLedger(item);
        setFourMLedgerRecords(updated || []);
        alert(`[${item.title}]\n\n변동점 관리대장에서 정상적으로 등록 해제되었습니다.`);
      }
    } else {
      const newItem = await registerToFourMLedger(
        {
          ...item,
          classifiedBy: currentProfile?.name || "이창엽",
          registeredBy: currentProfile?.name || "이창엽",
          isQualityClassified: true,
          isOfficialLedger: true
        },
        currentProfile?.name || "이창엽"
      );
      if (newItem) {
        setFourMLedgerRecords((prev) => [
          newItem,
          ...prev.filter((it) => it.id !== newItem.id && it.originalId !== newItem.originalId)
        ]);
        if (internalMgmtMap[item.id]) {
          const nextMap = { ...internalMgmtMap };
          delete nextMap[item.id];
          setInternalMgmtMap(nextMap);
          try {
            localStorage.setItem("factory_internal_mgmt_registry_v1", JSON.stringify(nextMap));
          } catch {}
        }
        alert(`[${item.title}]\n\n항목이 공식 변동점 관리대장에 복사본으로 저장되었습니다.`);
      }
    }
  };

  // 사내관리등록
  const handleRegisterAsInternalMgmt = async (item) => {
    if (!item) return;
    const rawId = item.raw?.id || "";
    const isAlreadyIn4M = fourMLedgerRecords.some(
      (r) =>
        r.originalId === item.id ||
        r.id === item.id ||
        r.id === `ledger_${item.id}` ||
        `ledger_${r.originalId}` === item.id ||
        (rawId && (r.rawId === rawId || r.originalId === rawId || r.id === rawId || r.id === `ledger_${rawId}`))
    );
    if (isAlreadyIn4M) {
      const updated = await unregisterFromFourMLedger(item);
      setFourMLedgerRecords(updated || []);
    }
    const nextMap = { ...internalMgmtMap, [item.id]: true };
    setInternalMgmtMap(nextMap);
    try {
      localStorage.setItem("factory_internal_mgmt_registry_v1", JSON.stringify(nextMap));
    } catch {}
  };

  // Detail Modal item updated callback
  const handleItemUpdated = (updatedItem) => {
    setSelectedItemForDetail(updatedItem);
  };

  // Role 판정
  const isExecutiveUser = Boolean(
    currentProfile?.name === "이명재" ||
    currentProfile?.id === "sam_mj" ||
    currentProfile?.name === "김동욱" ||
    currentProfile?.id === "hal_dw" ||
    currentProfile?.name === "권태형" ||
    currentProfile?.id === "admin_kwon" ||
    currentProfile?.name === "최미영" ||
    currentProfile?.id === "admin_choi" ||
    currentProfile?.title === "이사" ||
    currentProfile?.title === "대표이사" ||
    currentProfile?.title === "전무" ||
    currentProfile?.title === "대표(전무)" ||
    currentProfile?.role === "ADMIN"
  );

  const isQualityUser = Boolean(
    currentProfile?.name === "이창엽" ||
    currentProfile?.id === "sam_cy" ||
    currentProfile?.name === "이상기" ||
    currentProfile?.id === "sam_sg" ||
    currentProfile?.assignedProcess === "품질관리" ||
    currentProfile?.department === "품질보증팀"
  );

  const theme = customSettings?.theme || "indigo";
  const themeObj = PANEL_THEMES[theme] || PANEL_THEMES.indigo;
  const borderRadius = customSettings?.borderRadius || "rounded-2xl";
  const borderStyle = customSettings?.borderStyle || "border-2";

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* 1. 상단: 단계별 맞춤 관제 패널 (4단계 경영진 vs 3단계 품질관리자[이창엽의 4M 정식대장] vs 2단계 생산관리자) */}
      {isExecutiveUser ? (
        <Step4ExecutiveApprovalPanel
          currentProfile={currentProfile}
          onOpenIssueModal={onOpenIssueModal}
          onNavigateTab={onNavigateTab}
        />
      ) : isQualityUser ? (
        <Step3QualityControlPanel
          currentProfile={currentProfile}
          onOpenIssueModal={onOpenIssueModal}
          onNavigateTab={onNavigateTab}
          customTitle={customSettings?.customTopTitle || customSettings?.customTitle}
          customBadge={customSettings?.customBadge}
          hideBadge={customSettings?.hideBadge === true}
          hideSubtitle={customSettings?.hideSubtitle !== false}
          theme={theme}
          borderRadius={borderRadius}
          borderStyle={borderStyle}
        />
      ) : (
        <Step2ProductionManagerPanel
          currentProfile={currentProfile}
          onOpenIssueModal={onOpenIssueModal}
          onNavigateTab={onNavigateTab}
        />
      )}

      {/* 2. 하단: [전사 4M 취합대장] 일체형 단일 패널 (헤더 + 5대 KPI + 1줄 대장 목록표가 완전히 하나의 패널로 통합) */}
      <div className={`bg-white dark:bg-slate-900 ${borderRadius} ${borderStyle} ${themeObj.borderClass} shadow-xl p-3.5 sm:p-4 space-y-3.5 text-left transition-all`}>
        <AbnormalityHeader
          currentProfile={currentProfile}
          viewMode={viewMode}
          setViewMode={setViewMode}
          isLoading={isLoading}
          onRefresh={handleManualRefresh}
          onExportExcel={handleExportExcel}
          stats={stats}
          selected4MTab={selected4MTab}
          setSelected4MTab={setSelected4MTab}
          selectedOriginFilter={selectedOriginFilter}
          setSelectedOriginFilter={setSelectedOriginFilter}
          filteredCount={filteredRecords.length}
          customTitle={customSettings?.customBottomTitle || customSettings?.customTitle}
          customBadge={customSettings?.customBadge}
          hideBadge={customSettings?.hideBadge === true}
          hideSubtitle={customSettings?.hideSubtitle !== false}
          theme={theme}
          themeObj={themeObj}
        />

        {/* 3. Table View or Card View (패널 내부 직결 목록) */}
        {viewMode === "table" ? (
          <AbnormalityTableView
            filteredRecords={filteredRecords}
            onOpenDetailModal={(item) => setSelectedItemForDetail(item)}
            onUpdateItemFourM={handleUpdateItemFourM}
            onToggleLedger={handleToggleLedger}
            onRegisterAsInternalMgmt={handleRegisterAsInternalMgmt}
            internalMgmtMap={internalMgmtMap}
            onPreviewImage={(src) => setPreviewImage(src)}
            customTitle={customSettings?.customBottomTitle || customSettings?.customTitle}
            theme={theme}
            themeObj={themeObj}
          />
        ) : (
          <AbnormalityCardView
            filteredRecords={filteredRecords}
            onOpenDetailModal={(item) => setSelectedItemForDetail(item)}
            onUpdateItemFourM={handleUpdateItemFourM}
          />
        )}
      </div>

      {/* 4. Detail & Action Modal */}
      {selectedItemForDetail && (
        <AbnormalityDetailModal
          selectedItem={selectedItemForDetail}
          onClose={() => setSelectedItemForDetail(null)}
          currentProfile={currentProfile}
          onUpdateItemFourM={handleUpdateItemFourM}
          onToggleLedger={handleToggleLedger}
          fourMLedgerRecords={fourMLedgerRecords}
          onPreviewImage={(src) => setPreviewImage(src)}
          onItemUpdated={handleItemUpdated}
        />
      )}

      {/* 5. Lightbox Image Preview Modal */}
      {previewImage && (
        <ImagePreviewModal
          previewImage={previewImage}
          onClose={() => setPreviewImage(null)}
        />
      )}
    </div>
  );
};

export default UnifiedAbnormalityControlPanel;
