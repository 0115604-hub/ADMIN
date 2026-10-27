import { useMemo } from "react";
import {
  approveWorkLog,
  batchApproveWorkLogs,
  rejectWorkLog
} from "../../services/workLogService";

export function useWorkLogApproval({
  workLogs,
  setWorkLogs,
  selectedLogDetail,
  setSelectedLogDetail,
  approvalCommentInput,
  currentProfile,
  workerPlant,
  setToastMessage,
  setLogSavedToast
}) {
  const pendingSamrangjinCount = useMemo(() => {
    return workLogs.filter((l) => l.plant === "삼랑진공장" && l.approvalStatus === "결재대기" && !l.isDeleted).length;
  }, [workLogs]);

  const pendingHallimCount = useMemo(() => {
    return workLogs.filter((l) => l.plant === "한림공장" && l.approvalStatus === "결재대기" && !l.isDeleted).length;
  }, [workLogs]);

  const handleApproveLog = async (logId, customComment) => {
    const finalComment = (typeof customComment === "string" && customComment.trim())
      ? customComment.trim()
      : (approvalCommentInput.trim() || "확인 및 전자결재 승인 완료");

    const targetLog = workLogs.find((l) => String(l.id) === String(logId));
    const targetPlant = targetLog?.plant || (["김동욱", "TEST", "오상민", "정현규", "부림텍", "한울"].includes(targetLog?.writer) ? "한림공장" : (currentProfile?.plant || workerPlant));
    const approver = {
      name: currentProfile?.name || (targetPlant === "한림공장" ? "김동욱" : "이명재"),
      title: currentProfile?.title || (targetPlant === "한림공장" ? "책임" : "이사"),
      plant: currentProfile?.plant || targetPlant,
      comment: finalComment
    };

    const nowFormatted = new Date().toLocaleString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });

    const approvedLog = {
      ...(targetLog || {}),
      id: String(logId),
      plant: targetPlant,
      approvalStatus: "결재완료",
      approverName: approver.name,
      approverTitle: approver.title,
      approverPlant: targetPlant,
      approvedAt: nowFormatted,
      approvalComment: finalComment,
      updatedAt: new Date().toISOString()
    };

    setWorkLogs((prev) => {
      const exists = prev.some((l) => String(l.id) === String(logId));
      if (exists) {
        return prev.map((l) => (String(l.id) === String(logId) ? approvedLog : l));
      }
      return [approvedLog, ...prev];
    });

    if (selectedLogDetail && String(selectedLogDetail.id) === String(logId)) {
      setSelectedLogDetail(approvedLog);
    }

    try {
      await approveWorkLog(logId, approver, targetLog);
    } catch (e) {
      console.error("Cloud approval error:", e);
    }

    if (typeof setToastMessage === "function") setToastMessage("결재 및 지시사항 코멘트가 정상적으로 등록되었습니다.");
    if (typeof setLogSavedToast === "function") {
      setLogSavedToast(true);
      setTimeout(() => setLogSavedToast(false), 3000);
    }
  };

  const handleBatchApproveLogs = async (logIds) => {
    if (!Array.isArray(logIds) || logIds.length === 0) return;
    const nowFormatted = new Date().toLocaleString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });

    const targetIds = new Set(logIds.map(String));
    const updated = workLogs.map((l) => {
      if (targetIds.has(String(l.id))) {
        const targetPlant = l.plant || (["김동욱", "TEST", "오상민", "정현규", "부림텍", "한울"].includes(l.writer) ? "한림공장" : (currentProfile?.plant || workerPlant));
        const approverName = currentProfile?.name || (targetPlant === "한림공장" ? "김동욱" : "이명재");
        const approverTitle = currentProfile?.title || (targetPlant === "한림공장" ? "책임" : "이사");
        return {
          ...l,
          plant: targetPlant,
          approvalStatus: "결재완료",
          approverName,
          approverTitle,
          approverPlant: targetPlant,
          approvedAt: nowFormatted,
          approvalComment: `${targetPlant} 일괄 확인 및 전자결재 승인 완료`,
          updatedAt: new Date().toISOString()
        };
      }
      return l;
    });

    setWorkLogs(updated);

    try {
      await batchApproveWorkLogs(logIds, {
        name: currentProfile?.name,
        title: currentProfile?.title,
        plant: currentProfile?.plant || workerPlant
      });
    } catch (e) {
      console.error("Batch approve work logs error:", e);
    }

    if (typeof setToastMessage === "function") setToastMessage(`선택된 ${logIds.length}건의 업무일지가 일괄 결재 승인되었습니다.`);
    if (typeof setLogSavedToast === "function") {
      setLogSavedToast(true);
      setTimeout(() => setLogSavedToast(false), 3000);
    }
  };

  const handleRejectLog = async (logId) => {
    const reason = window.prompt("반려 사유 또는 보완 요청 사항을 입력해주세요:", "내용 보완 후 재상신 요망");
    if (!reason) return;

    const targetLog = workLogs.find((l) => String(l.id) === String(logId));
    const targetPlant = targetLog?.plant || (["김동욱", "TEST", "오상민", "정현규", "부림텍", "한울"].includes(targetLog?.writer) ? "한림공장" : (currentProfile?.plant || workerPlant));
    const approver = {
      name: currentProfile?.name || (targetPlant === "한림공장" ? "김동욱" : "이명재"),
      title: currentProfile?.title || (targetPlant === "한림공장" ? "책임" : "이사"),
      plant: currentProfile?.plant || targetPlant
    };

    const nowFormatted = new Date().toLocaleString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });

    const rejectedLog = {
      ...(targetLog || {}),
      id: String(logId),
      plant: targetPlant,
      approvalStatus: "반려",
      approverName: approver.name,
      approverTitle: approver.title,
      approverPlant: targetPlant,
      approvedAt: nowFormatted,
      approvalComment: reason,
      updatedAt: new Date().toISOString()
    };

    setWorkLogs((prev) => {
      const exists = prev.some((l) => String(l.id) === String(logId));
      if (exists) {
        return prev.map((l) => (String(l.id) === String(logId) ? rejectedLog : l));
      }
      return [rejectedLog, ...prev];
    });

    if (selectedLogDetail && String(selectedLogDetail.id) === String(logId)) {
      setSelectedLogDetail(rejectedLog);
    }

    try {
      await rejectWorkLog(logId, approver, reason, targetLog);
    } catch (e) {
      console.error("Cloud reject error:", e);
    }

    if (typeof setToastMessage === "function") setToastMessage("업무일지가 반려 처리되었습니다.");
    if (typeof setLogSavedToast === "function") {
      setLogSavedToast(true);
      setTimeout(() => setLogSavedToast(false), 3000);
    }
  };

  return {
    pendingSamrangjinCount,
    pendingHallimCount,
    handleApproveLog,
    handleBatchApproveLogs,
    handleRejectLog
  };
}

export default useWorkLogApproval;
