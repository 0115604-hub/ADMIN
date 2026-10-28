import { useState, useEffect } from "react";
import {
  getLocalTelegramConfig,
  saveTelegramConfig,
  subscribeTelegramConfig,
  testTelegramConnection,
  sendDailyClosingBriefingTelegram
} from "../../../services/telegramService";

/**
 * useIssueTelegram
 * Manages Telegram bot settings, ADMIN PIN authorization,
 * connection tests, and manual daily closing briefing dispatches.
 */
export const useIssueTelegram = () => {
  const [telegramConfig, setTelegramConfig] = useState(() => getLocalTelegramConfig());
  const [isTelegramModalOpen, setIsTelegramModalOpen] = useState(false);
  const [telegramAdminPinModal, setTelegramAdminPinModal] = useState({
    isOpen: false,
    pinInput: "",
    errorMsg: ""
  });
  const [testingTelegram, setTestingTelegram] = useState(false);
  const [sendingClosingBriefing, setSendingClosingBriefing] = useState(false);
  const [closingBriefingToast, setClosingBriefingToast] = useState(false);
  const [telegramTestResult, setTelegramTestResult] = useState(null);
  const [telegramSavedToast, setTelegramSavedToast] = useState(false);

  useEffect(() => {
    const unsub = subscribeTelegramConfig((cfg) => {
      setTelegramConfig(cfg);
    });
    return () => unsub();
  }, []);

  const handleVerifyTelegramAdmin = (e) => {
    e.preventDefault();
    const inputPin = telegramAdminPinModal.pinInput.trim();
    if (inputPin === "0090") {
      setTelegramAdminPinModal({ isOpen: false, pinInput: "", errorMsg: "" });
      setIsTelegramModalOpen(true);
      setTelegramTestResult(null);
    } else {
      setTelegramAdminPinModal((prev) => ({
        ...prev,
        errorMsg: "ADMIN 관리자 PIN 번호가 일치하지 않습니다."
      }));
    }
  };

  const handleSaveTelegramConfig = async (e) => {
    e.preventDefault();
    const updated = await saveTelegramConfig(telegramConfig);
    setTelegramConfig(updated);
    setTelegramSavedToast(true);
    setTimeout(() => setTelegramSavedToast(false), 3000);
  };

  const handleTestTelegram = async () => {
    setTestingTelegram(true);
    setTelegramTestResult(null);
    try {
      const res = await testTelegramConnection();
      setTelegramTestResult(res);
    } catch (err) {
      setTelegramTestResult({ success: false, error: err.message });
    } finally {
      setTestingTelegram(false);
    }
  };

  const handleSendDailyClosingBriefing = async () => {
    setSendingClosingBriefing(true);
    try {
      const res = await sendDailyClosingBriefingTelegram();
      if (res && res.success) {
        setClosingBriefingToast(true);
        setTimeout(() => setClosingBriefingToast(false), 3500);
      } else {
        alert("일일마감브리핑 발송에 실패했습니다: " + (res?.error || ""));
      }
    } catch (err) {
      console.error("Closing briefing error:", err);
      alert("발송 오류가 발생했습니다: " + err.message);
    } finally {
      setSendingClosingBriefing(false);
    }
  };

  return {
    telegramConfig,
    setTelegramConfig,
    isTelegramModalOpen,
    setIsTelegramModalOpen,
    telegramAdminPinModal,
    setTelegramAdminPinModal,
    testingTelegram,
    sendingClosingBriefing,
    closingBriefingToast,
    telegramTestResult,
    telegramSavedToast,
    handleVerifyTelegramAdmin,
    handleSaveTelegramConfig,
    handleTestTelegram,
    handleSendDailyClosingBriefing
  };
};
