import { useState, useMemo, useEffect } from "react";
import { getKSTDateString } from "../../../utils/dateUtils";
import { isExcludedFromWorkReport, subscribeHanulWorkReports, getLocalHanulWorkReports } from "../../../services/hanulWorkReportService";
import { BLADE_RESET_KEY, BLADE_LIMIT } from "../hanulReportHelpers";

/**
 * useHanulBladeTracker
 * 9BQC 칼날 수명 관리, 누적 생산량 계산(5만개 주기 알림) 및 교체 리셋 관리 서브 훅
 */
export const useHanulBladeTracker = ({
  project,
  totals,
  customWorker,
  worker,
  editReport
}) => {
  const [allReports, setAllReports] = useState(() => getLocalHanulWorkReports());
  const [bladeResetInfo, setBladeResetInfo] = useState(() => {
    try {
      const raw = localStorage.getItem(BLADE_RESET_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  });
  const [isBladeTestMode, setIsBladeTestMode] = useState(false);
  const [bladeChangeTime, setBladeChangeTime] = useState(() => editReport?.bladeChangeTime || "");

  useEffect(() => {
    const unsub = subscribeHanulWorkReports((list) => {
      setAllReports(list || []);
    });
    return () => unsub();
  }, []);

  // 9BQC 누적 생산량 (저장된 9BQC 일보들의 총생산량)
  const past9BQCGross = useMemo(() => {
    return (allReports || []).reduce((acc, r) => {
      if (r.project === "9BQC" && !isExcludedFromWorkReport(r.worker)) {
        const g = Number(r.totals?.gross) || ((Number(r.totals?.genuine) || 0) + (Number(r.totals?.bad) || 0));
        return acc + g;
      }
      return acc;
    }, 0);
  }, [allReports]);

  // 현재 모달에서 작성 중인 실적
  const currentGross = useMemo(() => {
    if (project !== "9BQC") return 0;
    return Number(totals?.gross) || 0;
  }, [project, totals?.gross]);

  // 총 누적 생산량 (최근 교체 리셋 기준량 차감 반영)
  const totalCumulativeQty = useMemo(() => {
    if (isBladeTestMode) return 52450;
    const grossTotal = past9BQCGross + currentGross;
    const resetOffset = Number(bladeResetInfo?.resetGross) || 0;
    return Math.max(0, grossTotal - resetOffset);
  }, [past9BQCGross, currentGross, bladeResetInfo, isBladeTestMode]);

  const isBladeOverdue = totalCumulativeQty >= BLADE_LIMIT;
  const bladeLifePercent = Math.min(100, (totalCumulativeQty / BLADE_LIMIT) * 100);

  // 칼날 교체 완료 및 누적 리셋 핸들러
  const handleRecordBladeChangeNow = () => {
    const kstTime = new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false });
    const kstDate = getKSTDateString();
    setBladeChangeTime(kstTime);
    const newReset = {
      resetDate: kstDate,
      resetTime: kstTime,
      resetGross: past9BQCGross + currentGross,
      worker: customWorker?.trim() || worker
    };
    setBladeResetInfo(newReset);
    try {
      localStorage.setItem(BLADE_RESET_KEY, JSON.stringify(newReset));
    } catch (e) {}
  };

  const handleClearBladeReset = () => {
    setBladeResetInfo(null);
    try {
      localStorage.removeItem(BLADE_RESET_KEY);
    } catch (e) {}
  };

  return {
    allReports,
    setAllReports,
    bladeChangeTime,
    setBladeChangeTime,
    bladeResetInfo,
    setBladeResetInfo,
    isBladeTestMode,
    setIsBladeTestMode,
    totalCumulativeQty,
    isBladeOverdue,
    bladeLifePercent,
    BLADE_LIMIT,
    handleRecordBladeChangeNow,
    handleClearBladeReset
  };
};
