// Telegram Notification & Briefing Service Facade
// Re-exports all core Telegram Bot functionalities from modular Lego services under ./telegram/

export {
  getKSTDateString,
  getKSTFormattedString,
  getKSTTimeString,
  getKSTTimeInfo,
  getKoreanTodayDateStr,
  isThisWeek,
  getThisWeekDateRange,
  formatMMDDWithWeekday,
  formatYYYYMMDDWithWeekday
} from "../utils/dateUtils";

export {
  buildDailyMorningBriefingText,
  buildDailyClosingBriefingText
} from "./telegramAggregator";

export {
  TELEGRAM_CONFIG_KEY,
  CONFIG_DOC_PATH,
  BRIEFING_DOC_PATH,
  TEMPLATES_DOC_PATH,
  TELEGRAM_TEMPLATES_KEY,
  isDuplicateMessage,
  normalizeOryukChatId,
  DEFAULT_TELEGRAM_CONFIG,
  getLocalTelegramConfig,
  saveTelegramConfig,
  setTelegramEnabled,
  toggleTelegramEnabled,
  subscribeTelegramConfig,
  sanitizeTelegramTemplateText,
  sanitizeTelegramMessageText,
  sanitizeTelegramTemplates,
  getLocalTelegramTemplates,
  saveTelegramCustomTemplate,
  deleteTelegramCustomTemplate,
  subscribeTelegramCustomTemplates,
  getClientInstanceId,
  getBriefingFieldNames,
  acquireBriefingLock,
  completeBriefingLock
} from "./telegram/telegramConfig";

export {
  sendTelegramMessage,
  sendTelegramPhoto,
  sendTelegramMediaGroup,
  formatKoreanCurrency,
  dispatchToTelegramRooms,
  testTelegramConnection
} from "./telegram/telegramSender";

export {
  sendQualityAlertTelegram,
  sendQualityOpinionTelegram,
  sendQualityActionTelegram,
  sendOpenIssueAlertTelegram,
  sendOpenIssueReplyTelegram,
  sendMeetingNoticeAlertTelegram,
  sendMeetingNoticeReplyTelegram,
  sendMeetingReplyTelegram,
  sendQualityDeleteTelegram,
  sendApprovalDraftTelegram,
  sendApprovalStepTelegram,
  sendApprovalRejectTelegram,
  sendApprovalHoldTelegram,
  sendWorkLogApprovedTelegram
} from "./telegram/telegramNotifications";

export {
  sendDailyMorningBriefingTelegram,
  sendDailyLeaveBriefingTelegram,
  getLivePnLSummaryData,
  sendDailyPnLMorningBriefingTelegram,
  sendCommonScheduleCommentTelegram,
  sendTodayCommonScheduleReminderTelegram,
  checkAndAutoSendDailyMorningBriefing,
  checkAndAutoSendDailyLeaveBriefing,
  formatDailyClosingBriefing,
  sendDailyClosingBriefingTelegram,
  checkAndAutoSendDailyClosingBriefing,
  sendCommonScheduleRegisteredTelegram
} from "./telegram/telegramBriefings";
