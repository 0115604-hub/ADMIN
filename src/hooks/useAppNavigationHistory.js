import { useEffect, useRef } from "react";
import { runStorageHealthCheck } from "../utils/storageHealthCheck";
import { isExtrusionWorkerProfile } from "../context/AuthContext";
import { wasModalJustPopped, popTopModal } from "../utils/modalHistory";

/**
 * useAppNavigationHistory
 * - 브라우저 뒤로가기(popstate) 감지 시 자동 로그아웃 방지
 * - 중첩 모달 순차적 닫기 제어
 * - 탭 변경 시 스크롤 최상단 이동
 * - 플로팅 Top 버튼 스크롤 추적
 */
export function useAppNavigationHistory({
  activeTab,
  setActiveTab,
  isAuthenticated,
  currentProfile,
  modalOpen,
  setModalOpen,
  excelModalOpen,
  setExcelModalOpen,
  mobileMenuOpen,
  setMobileMenuOpen,
  editingItem,
  setEditingItem,
  setShowTopBtn
}) {
  const activeTabRef = useRef(activeTab);
  const isAuthenticatedRef = useRef(isAuthenticated);
  const modalOpenRef = useRef(modalOpen);
  const excelModalOpenRef = useRef(excelModalOpen);
  const mobileMenuOpenRef = useRef(mobileMenuOpen);
  const editingItemRef = useRef(editingItem);

  useEffect(() => {
    activeTabRef.current = activeTab;
    try {
      if (typeof window !== "undefined") {
        window.__ORYUK_ACTIVE_TAB__ = activeTab;
        sessionStorage.setItem("oryuk_current_active_tab", activeTab);
      }
    } catch (e) {}
  }, [activeTab]);

  useEffect(() => { isAuthenticatedRef.current = isAuthenticated; }, [isAuthenticated]);
  useEffect(() => { modalOpenRef.current = modalOpen; }, [modalOpen]);
  useEffect(() => { excelModalOpenRef.current = excelModalOpen; }, [excelModalOpen]);
  useEffect(() => { mobileMenuOpenRef.current = mobileMenuOpen; }, [mobileMenuOpen]);
  useEffect(() => { editingItemRef.current = editingItem; }, [editingItem]);

  // 1. Initial State and Login/Logout synchronization
  useEffect(() => {
    runStorageHealthCheck();
    try {
      document.documentElement.style.zoom = "";
      document.body.style.zoom = "";
      localStorage.removeItem("oryuk_screen_zoom_idx");
    } catch (e) {}

    if (currentProfile) {
      const isExtrusionWorker = isExtrusionWorkerProfile(currentProfile);
      if (isExtrusionWorker) {
        try {
          localStorage.setItem("factory_extrusion_active_subtab", "production");
        } catch (e) {}
      }

      const targetTab = "worker_dashboard";
      setActiveTab(targetTab);
      try {
        window.history.pushState({ screen: targetTab, isSummary: true }, "");
      } catch (e) {}
    } else {
      try {
        window.history.replaceState({ screen: "main", isMain: true }, "");
      } catch (e) {}
    }
  }, [currentProfile, setActiveTab]);

  // 2. Tab Navigation History (상세페이지 진입 시 히스토리 스택 푸시)
  useEffect(() => {
    if (isAuthenticated && activeTab !== "worker_dashboard") {
      try {
        window.history.pushState({ screen: activeTab, isDetail: true }, "");
      } catch (e) {}
    }
  }, [activeTab, isAuthenticated]);

  // 3. Global Browser Popstate Handler (뒤로가기 방어 및 모달 순차 닫기)
  useEffect(() => {
    const handlePopState = () => {
      // (1) 팝업 / 모달이 열려 있는 경우
      const hadAppModals =
        modalOpenRef.current ||
        excelModalOpenRef.current ||
        mobileMenuOpenRef.current ||
        editingItemRef.current !== null;

      if (hadAppModals) {
        setModalOpen(false);
        setExcelModalOpen(false);
        setMobileMenuOpen(false);
        setEditingItem(null);
        return;
      }

      // (2) 모달 히스토리 스택에서 최상단 닫기
      if (wasModalJustPopped() || popTopModal()) {
        return;
      }

      const isAuthed = isAuthenticatedRef.current;
      const currentTab = activeTabRef.current;

      // 비로그인 상태는 메인 유지
      if (!isAuthed) {
        try {
          window.history.replaceState({ screen: "main", isMain: true }, "");
        } catch (err) {}
        return;
      }

      const homeTab = "worker_dashboard";

      // 상세 메뉴에서 뒤로가기 누른 경우 홈 대시보드로 이동
      if (currentTab !== homeTab) {
        setActiveTab(homeTab);
        try {
          window.history.replaceState({ screen: homeTab, isSummary: true }, "");
        } catch (err) {}
        return;
      }

      // 홈 화면에서는 뒤로가기 시 로그아웃하지 않고 현재 홈 화면 유지
      try {
        window.history.replaceState({ screen: homeTab, isSummary: true }, "");
      } catch (err) {}
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [setActiveTab, setModalOpen, setExcelModalOpen, setMobileMenuOpen, setEditingItem]);

  // 4. Scroll to top on active tab change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [activeTab]);

  // 5. Track window scroll position for floating Top button
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 280) {
        setShowTopBtn(true);
      } else {
        setShowTopBtn(false);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [setShowTopBtn]);
}
