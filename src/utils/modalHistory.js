// Utility for handling Browser/App Back Button (뒤로가기) with Nested Popups & Modals LIFO Stack
import { useEffect, useRef } from "react";

export const CLOSE_ALL_MODALS_EVENT = "app:closeAllModals";

// In-memory modal stack: Array of { id, name, onClose }
const modalStack = [];

// Flag to ignore popstate triggered by programmatic history.back()
let isProgrammaticBack = false;

// Global popstate handler attachment tracking
let isGlobalPopStateAttached = false;
let lastPoppedTime = 0;

/**
 * Pop the topmost modal from stack.
 * Returns true if a modal was popped and its onClose callback executed.
 */
export const popTopModal = () => {
  if (modalStack.length === 0) return false;
  const top = modalStack.pop();
  lastPoppedTime = Date.now();
  if (top && typeof top.onClose === "function") {
    try {
      top.onClose();
    } catch (e) {
      console.warn("popTopModal onClose error:", e);
    }
  }
  return true;
};

/**
 * Check if a modal was just popped recently (within 150ms) to prevent double-action
 */
export const wasModalJustPopped = () => {
  return Date.now() - lastPoppedTime < 150;
};

export const attachGlobalPopState = () => {
  if (isGlobalPopStateAttached || typeof window === "undefined") return;
  isGlobalPopStateAttached = true;

  window.addEventListener("popstate", (event) => {
    // If popstate was triggered by our own history.back() cleanup, ignore it
    if (isProgrammaticBack) {
      isProgrammaticBack = false;
      return;
    }

    // Pop and close ONLY the topmost modal from the stack
    popTopModal();
  });
};

if (typeof window !== "undefined") {
  attachGlobalPopState();
}

/**
 * Register a modal into the stack and push state to history
 */
export const pushModalToStack = (modalName = "modal", onClose = null) => {
  if (typeof window === "undefined") return "modal";
  attachGlobalPopState();

  const id = `${modalName}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  modalStack.push({ id, name: modalName, onClose });

  try {
    window.history.pushState(
      { modalOpen: true, modalId: id, modalName, timestamp: Date.now() },
      ""
    );
  } catch (e) {
    console.warn("pushModalToStack error:", e);
  }

  return id;
};

/**
 * Remove a specific modal by ID from stack if closed from UI (e.g. X button, backdrop)
 */
export const removeModalFromStack = (modalId) => {
  const index = modalStack.findIndex((m) => m.id === modalId);
  if (index === -1) return;

  const isTop = index === modalStack.length - 1;
  modalStack.splice(index, 1);

  // If the modal was at the top of the history stack, rewind history without triggering popstate modal close
  if (isTop && typeof window !== "undefined" && window.history?.state?.modalOpen) {
    try {
      isProgrammaticBack = true;
      window.history.back();
    } catch (e) {
      isProgrammaticBack = false;
    }
  }
};

/**
 * Push a modal history state (wrapper for pushModalToStack)
 */
export const pushModalHistory = (modalName = "modal", onClose = null) => {
  return pushModalToStack(modalName, onClose);
};

/**
 * Close all modals across the app (used on full reset / logout / route transition)
 */
export const closeAllModals = () => {
  const hadModals = modalStack.length > 0;
  while (modalStack.length > 0) {
    const top = modalStack.pop();
    if (top && typeof top.onClose === "function") {
      try {
        top.onClose();
      } catch (e) {}
    }
  }

  try {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(CLOSE_ALL_MODALS_EVENT));
    }
  } catch (e) {
    console.warn("closeAllModals error:", e);
  }
  return hadModals;
};

/**
 * Check if any modal is currently recorded as open
 */
export const hasOpenModals = () => {
  return modalStack.length > 0 || (typeof window !== "undefined" && Boolean(window.history?.state?.modalOpen));
};

/**
 * Legacy subscribe to closeAllModals event
 */
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

/**
 * Custom React Hook to register modal with browser history & auto-close on Back button
 * Supports multiple nested modals (LIFO stack)
 */
export const useModalHistory = (isOpen, onClose, modalName = "modal") => {
  const modalIdRef = useRef(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      const id = pushModalToStack(modalName, () => {
        if (typeof onCloseRef.current === "function") {
          onCloseRef.current();
        }
      });
      modalIdRef.current = id;

      return () => {
        if (modalIdRef.current) {
          removeModalFromStack(modalIdRef.current);
          modalIdRef.current = null;
        }
      };
    } else {
      if (modalIdRef.current) {
        removeModalFromStack(modalIdRef.current);
        modalIdRef.current = null;
      }
    }
  }, [Boolean(isOpen), modalName]);
};
