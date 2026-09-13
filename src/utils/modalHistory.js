// Utility for handling Browser/App Back Button (뒤로가기) with Popups & Initial Screen Navigation
import { useEffect } from "react";

export const CLOSE_ALL_MODALS_EVENT = "app:closeAllModals";

let activeModalCount = 0;

// Push a modal history state onto browser history stack
export const pushModalHistory = (modalName = "modal") => {
  try {
    activeModalCount++;
    if (typeof window !== "undefined" && window.history) {
      window.history.pushState(
        { modalOpen: true, modalName, timestamp: Date.now() },
        ""
      );
    }
  } catch (e) {
    console.warn("pushModalHistory error:", e);
  }
};

// Dispatch event to close all modals across the app
export const closeAllModals = () => {
  const hadModals = activeModalCount > 0;
  activeModalCount = 0;
  try {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(CLOSE_ALL_MODALS_EVENT));
    }
  } catch (e) {
    console.warn("closeAllModals error:", e);
  }
  return hadModals;
};

// Check if any modal is currently recorded as open
export const hasOpenModals = () => {
  return activeModalCount > 0 || (typeof window !== "undefined" && Boolean(window.history?.state?.modalOpen));
};

// Decrement modal counter when closed normally by close button
export const popModalCount = () => {
  if (activeModalCount > 0) activeModalCount--;
};

// Subscribe to closeAllModals event
export const subscribeCloseAllModals = (callback) => {
  if (typeof window === "undefined" || typeof callback !== "function") return () => {};
  const handler = () => {
    try {
      callback();
    } catch (e) {
      console.warn("Error in closeAllModals callback:", e);
    }
  };
  window.addEventListener(CLOSE_ALL_MODALS_EVENT, handler);
  return () => window.removeEventListener(CLOSE_ALL_MODALS_EVENT, handler);
};

// Custom React Hook to register modal with browser history & auto-close on Back button
export const useModalHistory = (isOpen, onClose, modalName = "modal") => {
  useEffect(() => {
    if (isOpen) {
      pushModalHistory(modalName);
    }
  }, [Boolean(isOpen), modalName]);

  useEffect(() => {
    const unsub = subscribeCloseAllModals(() => {
      if (isOpen && typeof onClose === "function") {
        onClose();
      }
    });
    return () => unsub();
  }, [isOpen, onClose]);
};
