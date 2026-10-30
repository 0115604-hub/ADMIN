import { useState, useEffect, useMemo, useCallback } from "react";
import {
  STUDIO_MANAGERS,
  ALL_DASHBOARD_BLOCKS,
  getPanelsForUser,
  MANAGER_PANEL_CONFIG,
  DEFAULT_INTERNAL_MANAGER_PANELS
} from "../../../config/dashboardPanelConfig";
import {
  saveManagerCustomLayout,
  resetManagerCustomLayout,
  subscribeManagerLayouts,
  getCustomSettingsForManager,
  savePanelCustomSetting,
  resetPanelCustomSetting,
  batchApplyThemeToManagerPanels
} from "../../../services/dashboardLayoutService";

/**
 * useManagerDashboardLayoutState
 * TEST 스튜디오 모드, 관리자별 맞춤 패널 순서, 인패널 실시간 제목/뱃지 편집, Firestore 실시간 동기화 상태 관리
 */
export function useManagerDashboardLayoutState({ currentProfile }) {
  // 🌟 TEST 뱃지 판별
  const isTest = Boolean(
    currentProfile?.id === "hal_test" ||
      currentProfile?.name === "TEST" ||
      currentProfile?.id === "test"
  );

  // TEST 뱃지 전용: 현재 커스터마이징 & 시뮬레이션 중인 관리자 상태
  const initialStudioManagerId = isTest ? "hal_test" : currentProfile?.id || "sam_cy";
  const [selectedStudioManagerId, setSelectedStudioManagerId] = useState(initialStudioManagerId);
  const [studioPanels, setStudioPanels] = useState(() => {
    const targetMgr = isTest
      ? STUDIO_MANAGERS.find((m) => m.id === "hal_test")
      : currentProfile;
    return getPanelsForUser(targetMgr);
  });
  const [isSavingStudio, setIsSavingStudio] = useState(false);
  const [layoutVersionTick, setLayoutVersionTick] = useState(0);

  // 패널별 커스텀 제목 & 디자인 설정 상태
  const [panelCustomSettings, setPanelCustomSettings] = useState(() => {
    const key = isTest ? "hal_test" : currentProfile?.id || currentProfile?.name;
    return getCustomSettingsForManager(key);
  });
  const [editingBlockKeyFromDashboard, setEditingBlockKeyFromDashboard] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [insertTargetIndex, setInsertTargetIndex] = useState(null);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [isTopStudioVisible, setIsTopStudioVisible] = useState(true);

  // 동기화
  useEffect(() => {
    if (currentProfile) {
      if (isTest) {
        setSelectedStudioManagerId("hal_test");
        const testMgr = STUDIO_MANAGERS.find((m) => m.id === "hal_test");
        setStudioPanels(getPanelsForUser(testMgr));
        setPanelCustomSettings(getCustomSettingsForManager("hal_test"));
      } else {
        const mgrKey = currentProfile.id || currentProfile.name;
        setSelectedStudioManagerId(mgrKey);
        setStudioPanels(getPanelsForUser(currentProfile));
        setPanelCustomSettings(getCustomSettingsForManager(mgrKey));
      }
      setLayoutVersionTick((v) => v + 1);
    }
  }, [currentProfile?.id, currentProfile?.name, isTest, currentProfile]);

  // 인패널 편집 상태
  const [inlineEditingBlockKey, setInlineEditingBlockKey] = useState(null);
  const [inlineDraftSettings, setInlineDraftSettings] = useState({});
  const [isSavingInline, setIsSavingInline] = useState(false);
  const [saveSuccessToast, setSaveSuccessToast] = useState(null);

  const handleStartInlineEdit = (blockKey) => {
    setInlineEditingBlockKey(blockKey);
    setInlineDraftSettings({ ...(panelCustomSettings[blockKey] || {}) });
  };

  const handleCancelInlineEdit = () => {
    setInlineEditingBlockKey(null);
    setInlineDraftSettings({});
  };

  const handleUpdateInlineDraft = (updaterOrObj) => {
    setInlineDraftSettings((prev) => {
      if (typeof updaterOrObj === "function") {
        return updaterOrObj(prev);
      }
      return { ...prev, ...updaterOrObj };
    });
  };

  // 패널 제목 & 디자인 단건 저장
  const handleSavePanelSetting = useCallback(async (blockKey, setting) => {
    const targetKey = isTest
      ? selectedStudioManagerId
      : currentProfile?.id || currentProfile?.name;
    const currentMgr = STUDIO_MANAGERS.find((m) => m.id === selectedStudioManagerId);
    await savePanelCustomSetting(targetKey, blockKey, setting, "TEST");
    if (currentMgr?.name && isTest) {
      await savePanelCustomSetting(currentMgr.name, blockKey, setting, "TEST");
    }
    setPanelCustomSettings({ ...getCustomSettingsForManager(targetKey) });
    setLayoutVersionTick((v) => v + 1);
  }, [isTest, selectedStudioManagerId, currentProfile]);

  const handleSaveInlineEdit = async (blockKey) => {
    setIsSavingInline(true);
    try {
      await handleSavePanelSetting(blockKey, inlineDraftSettings);
      setInlineEditingBlockKey(null);
      setInlineDraftSettings({});
      setSaveSuccessToast("✓ 패널 제목 및 뱃지 설정이 저장되었습니다.");
      setTimeout(() => setSaveSuccessToast(null), 3000);
    } catch (err) {
      console.error("Failed to save panel setting inline:", err);
      alert("설정 저장 중 오류가 발생했습니다: " + err.message);
    } finally {
      setIsSavingInline(false);
    }
  };

  // Firestore 실시간 구독
  useEffect(() => {
    const unsub = subscribeManagerLayouts(() => {
      setLayoutVersionTick((v) => v + 1);
    });
    const handleLayoutEvent = (e) => {
      setLayoutVersionTick((v) => v + 1);
      if (
        isTest &&
        e.detail?.managerKey === selectedStudioManagerId &&
        Array.isArray(e.detail?.panels)
      ) {
        setStudioPanels(e.detail.panels);
      }
    };
    const handlePanelSettingsEvent = (e) => {
      const activeKey = isTest
        ? selectedStudioManagerId
        : currentProfile?.id || currentProfile?.name;
      if (e.detail?.managerKey === activeKey || e.detail?.allUpdated) {
        setPanelCustomSettings({ ...getCustomSettingsForManager(activeKey) });
        setLayoutVersionTick((v) => v + 1);
      }
    };

    window.addEventListener("oryuk_dashboard_layout_updated", handleLayoutEvent);
    window.addEventListener("oryuk_panel_settings_updated", handlePanelSettingsEvent);

    return () => {
      unsub();
      window.removeEventListener("oryuk_dashboard_layout_updated", handleLayoutEvent);
      window.removeEventListener("oryuk_panel_settings_updated", handlePanelSettingsEvent);
    };
  }, [isTest, selectedStudioManagerId, currentProfile]);

  const handleSelectStudioManager = (mgrId) => {
    setSelectedStudioManagerId(mgrId);
    const targetMgr = STUDIO_MANAGERS.find((m) => m.id === mgrId);
    setStudioPanels(getPanelsForUser(targetMgr));
    setPanelCustomSettings(getCustomSettingsForManager(mgrId));
  };

  const handleResetPanelSetting = async (blockKey) => {
    const targetKey = isTest
      ? selectedStudioManagerId
      : currentProfile?.id || currentProfile?.name;
    const currentMgr = STUDIO_MANAGERS.find((m) => m.id === selectedStudioManagerId);
    await resetPanelCustomSetting(targetKey, blockKey);
    if (currentMgr?.name && isTest) {
      await resetPanelCustomSetting(currentMgr.name, blockKey);
    }
    setPanelCustomSettings({ ...getCustomSettingsForManager(targetKey) });
    setLayoutVersionTick((v) => v + 1);
  };

  const handleBatchApplyTheme = async (designOptions) => {
    const targetKey = isTest
      ? selectedStudioManagerId
      : currentProfile?.id || currentProfile?.name;
    const currentMgr = STUDIO_MANAGERS.find((m) => m.id === selectedStudioManagerId);
    await batchApplyThemeToManagerPanels(targetKey, studioPanels, designOptions, "TEST");
    if (currentMgr?.name && isTest) {
      await batchApplyThemeToManagerPanels(currentMgr.name, studioPanels, designOptions, "TEST");
    }
    setPanelCustomSettings({ ...getCustomSettingsForManager(targetKey) });
    setLayoutVersionTick((v) => v + 1);
  };

  const handleSaveStudioLayout = async () => {
    const currentMgr = STUDIO_MANAGERS.find((m) => m.id === selectedStudioManagerId);
    setIsSavingStudio(true);
    try {
      await saveManagerCustomLayout(selectedStudioManagerId, studioPanels, "TEST");
      if (currentMgr?.name) {
        await saveManagerCustomLayout(currentMgr.name, studioPanels, "TEST");
      }
      setIsTopStudioVisible(false);
      setSaveSuccessToast(
        `🎉 [${currentMgr?.plant} • ${currentMgr?.name}] 대시보드 설정이 저장되었으며 수정패널을 닫았습니다.`
      );
      setTimeout(() => setSaveSuccessToast(null), 3500);
    } catch (e) {
      alert("설정 저장 중 오류가 발생했습니다: " + e.message);
    } finally {
      setIsSavingStudio(false);
    }
  };

  const handleMoveBlockOnDashboard = (index, direction) => {
    const nextPanels = [...studioPanels];
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= nextPanels.length) return;
    const temp = nextPanels[index];
    nextPanels[index] = nextPanels[targetIdx];
    nextPanels[targetIdx] = temp;
    setStudioPanels(nextPanels);
  };

  const handleRemoveBlockFromDashboard = (blockKey) => {
    const meta = ALL_DASHBOARD_BLOCKS.find((b) => b.key === blockKey);
    const label = panelCustomSettings[blockKey]?.customTitle || meta?.label || blockKey;
    if (window.confirm(`[${label}] 패널을 현재 화면에서 제외(삭제)하시겠습니까?`)) {
      const nextPanels = studioPanels.filter((k) => k !== blockKey);
      setStudioPanels(nextPanels);
    }
  };

  const handleAddBlockToDashboard = (blockKey, targetIndex = null) => {
    if (studioPanels.includes(blockKey)) return;
    const nextPanels = [...studioPanels];
    if (targetIndex !== null && targetIndex >= 0 && targetIndex <= nextPanels.length) {
      nextPanels.splice(targetIndex, 0, blockKey);
    } else {
      nextPanels.push(blockKey);
    }
    setStudioPanels(nextPanels);
  };

  const handleOpenAddModal = (index = null) => {
    setInsertTargetIndex(index);
    setIsAddModalOpen(true);
  };

  const handleResetStudioLayout = async () => {
    const currentMgr = STUDIO_MANAGERS.find((m) => m.id === selectedStudioManagerId);
    if (
      !window.confirm(
        `[${currentMgr?.name || selectedStudioManagerId}] 관리자의 대시보드 블록 구성을 공장 초기 기본값으로 복원하시겠습니까?`
      )
    ) {
      return;
    }

    await resetManagerCustomLayout(selectedStudioManagerId);
    if (currentMgr?.name) {
      await resetManagerCustomLayout(currentMgr.name);
    }
    const defaultPanels =
      MANAGER_PANEL_CONFIG[selectedStudioManagerId] ||
      MANAGER_PANEL_CONFIG[currentMgr?.name] ||
      DEFAULT_INTERNAL_MANAGER_PANELS;
    setStudioPanels(defaultPanels);
    alert(`🔄 [${currentMgr?.name}] 관리자 대시보드가 기본값으로 복원되었습니다.`);
  };

  const activeProfile = useMemo(() => {
    if (!isTest) return currentProfile;
    const found = STUDIO_MANAGERS.find((m) => m.id === selectedStudioManagerId);
    if (!found) return currentProfile;
    return {
      ...currentProfile,
      id: found.id,
      name: found.name,
      title: found.title,
      plant: found.plant,
      assignedProcess: found.process,
      role: found.id.startsWith("admin") ? "ADMIN" : "OPERATOR"
    };
  }, [isTest, selectedStudioManagerId, currentProfile]);

  const activePanelKeys = useMemo(() => {
    if (isTest) return studioPanels;
    return getPanelsForUser(currentProfile);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTest, studioPanels, currentProfile, layoutVersionTick]);

  return {
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
    handleOpenAddModal,
    handleResetStudioLayout,
    activeProfile,
    activePanelKeys
  };
}
