import { useState } from "react";
import {
  deleteUrgentIssue,
  hardDeleteUrgentIssue,
  restoreUrgentIssue,
  cancelRestoreUrgentIssue,
  sortIssuesByCustomPriority
} from "../../../services/urgentIssueService";
import {
  saveExtrusionQualityIssue,
  deleteExtrusionQualityIssue
} from "../../../services/extrusionQualityIssueService";
import {
  saveHanulQualityIssue,
  deleteHanulQualityIssue
} from "../../../services/hanulQualityIssueService";
import {
  saveYuseongQualityIssue,
  deleteYuseongQualityIssue
} from "../../../services/yuseongQualityIssueService";
import {
  saveMachiningQualityIssue,
  deleteMachiningQualityIssue
} from "../../../services/machiningQualityIssueService";

/**
 * useIssueLifecycle
 * Handles deletion (soft delete & hard delete) with PIN/role verification,
 * and restore / cancel-restore functionality for all issue sources.
 */
export const useIssueLifecycle = ({
  currentProfile,
  extrusionQualityAlerts,
  setExtrusionQualityAlerts,
  hanulQualityIssues,
  setHanulQualityIssues,
  yuseongQualityIssues,
  setYuseongQualityIssues,
  machiningQualityIssues,
  setMachiningQualityIssues,
  urgentIssues,
  setUrgentIssues,
  editingIssue,
  setEditingIssue,
  setIsIssueModalOpen,
  setOpenActionMenuId
}) => {
  const [restoreToast, setRestoreToast] = useState("");

  // Delete Authorization Modal State
  const [deleteModalData, setDeleteModalData] = useState({
    isOpen: false,
    issue: null,
    pinInput: "",
    errorMsg: "",
    isHardDelete: false,
    isDeleting: false
  });

  const handleOpenDeleteModal = (issue, e, forceHardDelete = false) => {
    if (e) e.stopPropagation();
    setIsIssueModalOpen(false);
    setEditingIssue(null);
    const isHard = Boolean(forceHardDelete || issue?.isDeleted || issue?.isClosedByAdmin);
    setDeleteModalData({
      isOpen: true,
      issue,
      pinInput: "",
      errorMsg: "",
      isHardDelete: isHard,
      isDeleting: false
    });
  };

  const handleConfirmDelete = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (deleteModalData.isDeleting) return;
    const issue = deleteModalData.issue;
    if (!issue) {
      setDeleteModalData({ isOpen: false, issue: null, pinInput: "", errorMsg: "", isHardDelete: false, isDeleting: false });
      return;
    }

    const isHardDelete = Boolean(deleteModalData.isHardDelete);
    const inputPin = String(deleteModalData.pinInput || "").trim();

    if (isHardDelete) {
      const isAdminAuthorized = inputPin === "0090" || currentProfile?.role === "ADMIN";
      if (!isAdminAuthorized) {
        setDeleteModalData((prev) => ({
          ...prev,
          errorMsg: "관리대장 영구삭제는 최고관리자(권태형 대표이사, PIN 0090) 전용 기능입니다."
        }));
        return;
      }
    } else {
      // 🌟 첫 화면 [이 항목 삭제] 권한: 권태형(Admin, 0090), 이명재(11), 김동욱(11) 전용
      const isAuthorizedProfile =
        currentProfile?.role === "ADMIN" ||
        ["권태형", "이명재", "김동욱"].includes(currentProfile?.name);
      const isAuthorizedPin = inputPin === "0090" || inputPin === "11";

      if (!isAuthorizedProfile && !inputPin) {
        setDeleteModalData((prev) => ({
          ...prev,
          errorMsg: "관리자 확인 PIN 번호(권태형 대표이사 / 이명재 이사 / 김동욱 책임)를 입력해 주세요."
        }));
        return;
      }
      if (!isAuthorizedProfile && !isAuthorizedPin) {
        setDeleteModalData((prev) => ({
          ...prev,
          errorMsg: "PIN 번호가 일치하지 않습니다. 삭제 권한은 권태형 대표이사, 이명재 이사, 김동욱 책임에게만 있습니다."
        }));
        return;
      }
    }

    setDeleteModalData((prev) => ({ ...prev, isDeleting: true, errorMsg: "" }));

    try {
      const idStr = String(issue.id || "");
      const deleter =
        (currentProfile && ["권태형", "이명재", "김동욱"].includes(currentProfile.name))
          ? currentProfile.name
          : inputPin === "0090" || currentProfile?.role === "ADMIN"
          ? "권태형"
          : issue.plant === "한림공장"
          ? "김동욱"
          : "이명재";

      if (idStr.startsWith("ext_q_")) {
        const targetId = issue.rawId || idStr.replace("ext_q_", "");
        if (isHardDelete) {
          await deleteExtrusionQualityIssue(targetId);
          setExtrusionQualityAlerts((prev) => prev.filter((a) => String(a.id) !== String(targetId)));
          setRestoreToast(`🗑️ [${issue.title || issue.content}] 항목이 영구 삭제되었습니다.`);
        } else {
          const rawAlert = issue.raw || extrusionQualityAlerts.find((a) => String(a.id) === String(targetId)) || {};
          const updatedObj = { ...rawAlert, id: targetId, isClosedByAdmin: true, deletedBy: deleter, updatedAt: new Date().toISOString() };
          await saveExtrusionQualityIssue(updatedObj);
          setExtrusionQualityAlerts((prev) => prev.map((a) => (String(a.id) === String(targetId) ? updatedObj : a)));
          setRestoreToast(`🗑️ [${issue.title || issue.content}] 항목이 첫 화면에서 내려가 관리목록에 보존되었습니다.`);
        }
      } else if (idStr.startsWith("hanul_q_")) {
        const targetId = issue.rawId || idStr.replace("hanul_q_", "");
        if (isHardDelete) {
          await deleteHanulQualityIssue(targetId);
          setHanulQualityIssues((prev) => prev.filter((a) => String(a.id) !== String(targetId)));
          setRestoreToast(`🗑️ [${issue.title || issue.content}] 항목이 영구 삭제되었습니다.`);
        } else {
          const rawAlert = issue.raw || hanulQualityIssues.find((a) => String(a.id) === String(targetId)) || {};
          const updatedObj = { ...rawAlert, id: targetId, isClosedByAdmin: true, deletedBy: deleter, updatedAt: new Date().toISOString() };
          await saveHanulQualityIssue(updatedObj);
          setHanulQualityIssues((prev) => prev.map((a) => (String(a.id) === String(targetId) ? updatedObj : a)));
          setRestoreToast(`🗑️ [${issue.title || issue.content}] 항목이 첫 화면에서 내려가 관리목록에 보존되었습니다.`);
        }
      } else if (idStr.startsWith("ys_q_")) {
        const targetId = issue.rawId || idStr.replace("ys_q_", "");
        if (isHardDelete) {
          await deleteYuseongQualityIssue(targetId);
          setYuseongQualityIssues((prev) => prev.filter((a) => String(a.id) !== String(targetId)));
          setRestoreToast(`🗑️ [${issue.title || issue.content}] 항목이 영구 삭제되었습니다.`);
        } else {
          const rawAlert = issue.raw || yuseongQualityIssues.find((a) => String(a.id) === String(targetId)) || {};
          const updatedObj = { ...rawAlert, id: targetId, isClosedByAdmin: true, deletedBy: deleter, updatedAt: new Date().toISOString() };
          await saveYuseongQualityIssue(updatedObj);
          setYuseongQualityIssues((prev) => prev.map((a) => (String(a.id) === String(targetId) ? updatedObj : a)));
          setRestoreToast(`🗑️ [${issue.title || issue.content}] 항목이 첫 화면에서 내려가 관리목록에 보존되었습니다.`);
        }
      } else if (idStr.startsWith("mach_q_")) {
        const targetId = issue.rawId || idStr.replace("mach_q_", "");
        if (isHardDelete) {
          await deleteMachiningQualityIssue(targetId);
          setMachiningQualityIssues((prev) => prev.filter((a) => String(a.id) !== String(targetId)));
          setRestoreToast(`🗑️ [${issue.title || issue.content}] 항목이 영구 삭제되었습니다.`);
        } else {
          const rawAlert = issue.raw || machiningQualityIssues.find((a) => String(a.id) === String(targetId)) || {};
          const updatedObj = { ...rawAlert, id: targetId, isClosedByAdmin: true, deletedBy: deleter, updatedAt: new Date().toISOString() };
          await saveMachiningQualityIssue(updatedObj);
          setMachiningQualityIssues((prev) => prev.map((a) => (String(a.id) === String(targetId) ? updatedObj : a)));
          setRestoreToast(`🗑️ [${issue.title || issue.content}] 항목이 첫 화면에서 내려가 관리목록에 보존되었습니다.`);
        }
      } else {
        if (isHardDelete) {
          await hardDeleteUrgentIssue(issue.id);
          setUrgentIssues((prev) => prev.filter((i) => i.id !== issue.id));
          setRestoreToast(`🗑️ [${issue.title || issue.content}] 항목이 데이터베이스에서 영구 삭제되었습니다.`);
        } else {
          await deleteUrgentIssue(issue.id, deleter);
          setUrgentIssues((prev) => prev.map((i) => (i.id === issue.id ? { ...i, isDeleted: true, deletedBy: deleter } : i)));
          setRestoreToast(`🗑️ [${issue.title || issue.content}] 항목이 첫 화면에서 내려가 관리목록에 보존되었습니다.`);
        }
      }
      setTimeout(() => setRestoreToast(""), 3500);
      setDeleteModalData({ isOpen: false, issue: null, pinInput: "", errorMsg: "", isHardDelete: false, isDeleting: false });
    } catch (err) {
      console.error("Delete issue error:", err);
      setDeleteModalData((prev) => ({
        ...prev,
        isDeleting: false,
        errorMsg: "삭제 처리 중 오류가 발생했습니다."
      }));
    }
  };

  // Restore & Cancel Restore
  const handleRestoreIssue = async (idOrItem, e) => {
    if (e) e.stopPropagation();
    const id = typeof idOrItem === "object" && idOrItem !== null ? idOrItem.id : idOrItem;
    const idStr = String(id || "");
    try {
      if (idStr.startsWith("ext_q_")) {
        const targetId = idStr.replace("ext_q_", "");
        const rawAlert = extrusionQualityAlerts.find((a) => String(a.id) === String(targetId));
        if (rawAlert) {
          const updatedObj = { ...rawAlert, isClosedByAdmin: false, isManuallyRestored: true, isDeleted: false, deletedBy: "" };
          await saveExtrusionQualityIssue(updatedObj);
          setExtrusionQualityAlerts((prev) => prev.map((a) => (String(a.id) === String(targetId) ? updatedObj : a)));
          setRestoreToast(`✅ [${rawAlert.title || rawAlert.defectType || "부적합경보"}] 항목이 첫 화면에 재등록되었습니다.`);
          setTimeout(() => setRestoreToast(""), 3500);
        }
        return;
      }
      if (idStr.startsWith("hanul_q_")) {
        const targetId = idStr.replace("hanul_q_", "");
        const rawAlert = hanulQualityIssues.find((a) => String(a.id) === String(targetId));
        if (rawAlert) {
          const updatedObj = { ...rawAlert, isClosedByAdmin: false, isManuallyRestored: true, isDeleted: false, deletedBy: "" };
          await saveHanulQualityIssue(updatedObj);
          setHanulQualityIssues((prev) => prev.map((a) => (String(a.id) === String(targetId) ? updatedObj : a)));
          setRestoreToast(`✅ [${rawAlert.title || rawAlert.defectType || "부적합경보"}] 항목이 첫 화면에 재등록되었습니다.`);
          setTimeout(() => setRestoreToast(""), 3500);
        }
        return;
      }
      if (idStr.startsWith("ys_q_")) {
        const targetId = idStr.replace("ys_q_", "");
        const rawAlert = yuseongQualityIssues.find((a) => String(a.id) === String(targetId));
        if (rawAlert) {
          const updatedObj = { ...rawAlert, isClosedByAdmin: false, isManuallyRestored: true, isDeleted: false, deletedBy: "" };
          await saveYuseongQualityIssue(updatedObj);
          setYuseongQualityIssues((prev) => prev.map((a) => (String(a.id) === String(targetId) ? updatedObj : a)));
          setRestoreToast(`✅ [${rawAlert.title || rawAlert.defectType || "부적합경보"}] 항목이 첫 화면에 재등록되었습니다.`);
          setTimeout(() => setRestoreToast(""), 3500);
        }
        return;
      }
      if (idStr.startsWith("mach_q_")) {
        const targetId = idStr.replace("mach_q_", "");
        const rawAlert = machiningQualityIssues.find((a) => String(a.id) === String(targetId));
        if (rawAlert) {
          const updatedObj = { ...rawAlert, isClosedByAdmin: false, isManuallyRestored: true, isDeleted: false, deletedBy: "" };
          await saveMachiningQualityIssue(updatedObj);
          setMachiningQualityIssues((prev) => prev.map((a) => (String(a.id) === String(targetId) ? updatedObj : a)));
          setRestoreToast(`✅ [${rawAlert.title || rawAlert.defectType || "부적합경보"}] 항목이 첫 화면에 재등록되었습니다.`);
          setTimeout(() => setRestoreToast(""), 3500);
        }
        return;
      }

      const updated = await restoreUrgentIssue(id);
      if (updated && updated.id) {
        setUrgentIssues((prev) => {
          const idx = prev.findIndex((it) => it.id === id || it._docId === id);
          if (idx >= 0) {
            const up = [...prev];
            up[idx] = updated;
            return sortIssuesByCustomPriority(up);
          }
          return sortIssuesByCustomPriority([updated, ...prev]);
        });
        setRestoreToast(`✅ [${updated.title || updated.content}] 항목이 첫 화면에 복구되었습니다.`);
        setTimeout(() => setRestoreToast(""), 3500);
      }
    } catch (err) {
      console.error("Restore error:", err);
      alert("복구 처리 중 오류가 발생했습니다.");
    }
  };

  const handleCancelRestore = async (item, e) => {
    if (e) e.stopPropagation();
    if (!confirm(`[${item.title || item.content}] 항목을 첫 화면에서 내리고 관리목록(대장)으로 보관하시겠습니까?`)) {
      return;
    }
    try {
      const updated = await cancelRestoreUrgentIssue(item.id);
      if (updated) {
        setUrgentIssues((prev) => prev.map((it) => (it.id === item.id ? updated : it)));
        if (editingIssue && editingIssue.id === item.id) {
          setEditingIssue(updated);
        }
        setRestoreToast(`↩️ [${updated.title || updated.content}] 항목이 첫 화면에서 내려가 관리목록으로 보관되었습니다.`);
        setTimeout(() => setRestoreToast(""), 3500);
      }
    } catch (err) {
      console.error("Cancel restore error:", err);
      alert("복구 취소 처리 중 오류가 발생했습니다.");
    }
  };

  const handleExecuteRestore = async (item, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const targetId = typeof item === "object" && item !== null ? item.id : item;
    await handleRestoreIssue(targetId, e);
    setTimeout(() => setOpenActionMenuId(null), 100);
  };

  const handleExecuteCancelRestore = async (item, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const targetItem = typeof item === "object" && item !== null ? item : urgentIssues.find((i) => i.id === item);
    if (targetItem) {
      await handleCancelRestore(targetItem, e);
    }
    setTimeout(() => setOpenActionMenuId(null), 100);
  };

  return {
    deleteModalData,
    setDeleteModalData,
    restoreToast,
    setRestoreToast,
    handleOpenDeleteModal,
    handleConfirmDelete,
    handleRestoreIssue,
    handleCancelRestore,
    handleExecuteRestore,
    handleExecuteCancelRestore
  };
};
