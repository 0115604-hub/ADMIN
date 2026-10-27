import { useState, useEffect, useMemo } from "react";
import { isWorkLogApproved } from "../../services/workLogService";
import { getKSTDateString } from "../../utils/dateUtils";
import { LOGS_PER_PAGE } from "./workLogConstants.js";

export function useWorkLogPagination({
  workLogs,
  workerFullName,
  currentProfile,
  workerLogScope,
  workerPlant,
  workerLogApprovalFilter,
  searchTerm,
  filterPlant
}) {
  const [currentLogPage, setCurrentLogPage] = useState(1);

  const todayDateStr = useMemo(() => getKSTDateString(), []);

  const todayLog = useMemo(() => {
    return (workLogs || []).find(
      (l) =>
        Boolean(l) &&
        l.date === todayDateStr &&
        (l.writer === workerFullName ||
          l.writer === currentProfile?.name ||
          l.author === currentProfile?.name ||
          (currentProfile?.name && typeof l.writer === "string" && l.writer.includes(currentProfile.name)))
    );
  }, [workLogs, todayDateStr, workerFullName, currentProfile?.name]);

  const workerLogsList = useMemo(() => {
    return (workLogs || [])
      .filter((log) => {
        if (!log) return false;
        if (workerLogScope === "my") {
          const isMy =
            log.writer === workerFullName ||
            log.writer === currentProfile?.name ||
            log.author === currentProfile?.name ||
            (currentProfile?.name && typeof log.writer === "string" && log.writer.includes(currentProfile.name));
          if (!isMy) return false;
        } else if (workerLogScope === "plant") {
          if (workerPlant && log.plant && log.plant !== workerPlant) return false;
        }

        if (workerLogApprovalFilter === "대기") {
          if (isWorkLogApproved(log)) return false;
        } else if (workerLogApprovalFilter === "승인") {
          if (!isWorkLogApproved(log)) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (a.date !== b.date) return (b.date || "").localeCompare(a.date || "");
        return (b.createdAt || "").localeCompare(a.createdAt || "");
      });
  }, [workLogs, workerLogScope, workerFullName, currentProfile?.name, workerPlant, workerLogApprovalFilter]);

  const filteredLogs = useMemo(() => {
    const term = (searchTerm || "").trim().toLowerCase();
    return (workLogs || [])
      .filter((log) => {
        if (!log || typeof log !== "object") return false;
        const writerWithTitle = `${log.writer || ""} ${log.title || ""} ${log.process || ""}`.toLowerCase();
        const content = String(log.workContent || "").toLowerCase();
        const line = String(log.line || "").toLowerCase();
        const issues = String(log.issues || "").toLowerCase();

        const matchSearch =
          !term ||
          writerWithTitle.includes(term) ||
          content.includes(term) ||
          line.includes(term) ||
          issues.includes(term);

        const logPlant =
          log.plant ||
          log.approverPlant ||
          (["김동욱", "TEST", "오상민", "정현규", "부림텍", "한울"].includes(log.writer)
            ? "한림공장"
            : ["권태형", "최미영"].includes(log.writer) || log.department === "본사 관리팀"
            ? "본사"
            : "삼랑진공장");

        const matchPlant =
          filterPlant === "all" ||
          logPlant === filterPlant ||
          (filterPlant === "한림공장" && (logPlant.includes("한림") || logPlant === "한림")) ||
          (filterPlant === "삼랑진공장" && (logPlant.includes("삼랑진") || logPlant === "삼랑진")) ||
          (filterPlant === "본사" && (logPlant.includes("본사") || logPlant === "본사"));

        return matchSearch && matchPlant;
      })
      .sort(
        (a, b) =>
          (b.date || "").localeCompare(a.date || "") ||
          (b.createdAt || "").localeCompare(a.createdAt || "") ||
          String(b.id || "").localeCompare(String(a.id || ""))
      );
  }, [workLogs, searchTerm, filterPlant]);

  useEffect(() => {
    setCurrentLogPage(1);
  }, [searchTerm, filterPlant]);

  const totalLogPages = useMemo(() => {
    return Math.ceil(filteredLogs.length / LOGS_PER_PAGE) || 1;
  }, [filteredLogs.length]);

  const safeLogPage = Math.min(Math.max(1, currentLogPage), totalLogPages);

  const paginatedLogs = useMemo(() => {
    const startIdx = (safeLogPage - 1) * LOGS_PER_PAGE;
    return filteredLogs.slice(startIdx, startIdx + LOGS_PER_PAGE);
  }, [filteredLogs, safeLogPage]);

  return {
    currentLogPage,
    setCurrentLogPage,
    todayDateStr,
    todayLog,
    workerLogsList,
    filteredLogs,
    totalLogPages,
    safeLogPage,
    paginatedLogs
  };
}

export default useWorkLogPagination;
