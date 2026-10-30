import { useEffect } from "react";
import { syncAllOvertimeReportsToApprovalBox } from "../services/approvalService";
import { runStorageHealthCheck } from "../utils/storageHealthCheck";
import {
  checkAndAutoSendDailyMorningBriefing,
  checkAndAutoSendDailyClosingBriefing,
  subscribeTelegramConfig
} from "../services/telegramService";
import { initDailyMaintenanceScheduler } from "../services/dailyMaintenanceService";

/**
 * useAppBackgroundServices
 * - 일일 점검 스케줄러 (새벽 자동 헬스체크 & 무결성)
 * - 브라우저 구버전 캐시 및 폐기 스토리지 자동 청소
 * - 특근 보고서 자동 결재함 동기화
 * - 07:40 아침 브리핑 / 17:30 마감 브리핑 정밀 타이머 및 가시성(포커스) 감지
 * - 실시간 텔레그램 설정 동기화
 */
export function useAppBackgroundServices() {
  // 1. 일일 정기점검 스케줄러 및 스토리지 캐시 청소 등록
  useEffect(() => {
    runStorageHealthCheck();
    const stopScheduler = initDailyMaintenanceScheduler();
    return () => {
      if (stopScheduler) stopScheduler();
    };
  }, []);

  // 2. 특근 보고서 동기화 & 텔레그램 브리핑 주기 실행
  useEffect(() => {
    // 특근 보고서 전자결재함 원격 동기화
    syncAllOvertimeReportsToApprovalBox().catch((e) =>
      console.warn("App mount auto-sync overtime reports to approval box:", e)
    );

    // 07:40 아침 브리핑 & 17:30 마감 브리핑 즉각 체크
    checkAndAutoSendDailyMorningBriefing();
    checkAndAutoSendDailyClosingBriefing();

    // 텔레그램 설정 실시간 수신 구독
    const unsubTelegram = subscribeTelegramConfig();

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkAndAutoSendDailyMorningBriefing();
        checkAndAutoSendDailyClosingBriefing();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleVisibilityChange);

    // 10초 주기 브리핑 정밀 디스패치 감지
    const timer = setInterval(() => {
      checkAndAutoSendDailyMorningBriefing();
      checkAndAutoSendDailyClosingBriefing();
    }, 10000);

    return () => {
      unsubTelegram();
      clearInterval(timer);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleVisibilityChange);
    };
  }, []);
}
