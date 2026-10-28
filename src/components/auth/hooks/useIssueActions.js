import { useState } from "react";
import { ALL_DESIGNATED_USERS } from "../../../context/AuthContext";
import {
  saveUrgentIssue,
  updateUrgentIssueActionResult,
  addIssueReply,
  deleteIssueReply
} from "../../../services/urgentIssueService";
import { saveExtrusionQualityIssue } from "../../../services/extrusionQualityIssueService";
import { saveHanulQualityIssue } from "../../../services/hanulQualityIssueService";
import { saveYuseongQualityIssue } from "../../../services/yuseongQualityIssueService";
import { saveMachiningQualityIssue } from "../../../services/machiningQualityIssueService";
import { sendQualityActionTelegram } from "../../../services/telegramService";
import { compressImage } from "../../../utils/imageCompressor";

/**
 * useIssueActions
 * Manages action results, replies, opinions, and file/image uploads & compression
 * for all issues across plants.
 */
export const useIssueActions = ({
  currentProfile,
  todayDateStr,
  allWorkers = [],
  isSavingIssue,
  setIsSavingIssue,
  setRestoreToast,
  editingIssue,
  setEditingIssue,
  newIssueForm,
  setNewIssueForm,
  setUrgentIssues,
  extrusionQualityAlerts,
  setExtrusionQualityAlerts,
  hanulQualityIssues,
  setHanulQualityIssues,
  yuseongQualityIssues,
  setYuseongQualityIssues,
  machiningQualityIssues,
  setMachiningQualityIssues,
  selectedListItem,
  setSelectedListItem,
  setOpenActionMenuId,
  handleOpenEditIssue
}) => {
  // Action Result Modal State
  const [actionModalData, setActionModalData] = useState({
    isOpen: false,
    issue: null,
    actionResult: "",
    actionAuthor: "",
    actionImages: []
  });

  // Reply Forms
  const [replyForm, setReplyForm] = useState({
    author: "",
    attendanceStatus: "참석",
    content: ""
  });
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

  const [actionOpinionForm, setActionOpinionForm] = useState({
    actionDate: "",
    author: "",
    content: "",
    files: []
  });

  // Processing States
  const [isProcessingIssueImages, setIsProcessingIssueImages] = useState(false);
  const [isProcessingActionImages, setIsProcessingActionImages] = useState(false);

  // Action Result Handlers
  const handleOpenActionModal = (issue, e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    const defaultAuthor =
      issue.actionAuthor ||
      issue.author ||
      currentProfile?.name ||
      "현장담당자";

    setActionModalData({
      isOpen: true,
      issue,
      actionResult: issue.actionResult || "",
      actionAuthor: defaultAuthor,
      actionImages: issue.actionImages || []
    });
  };

  const handleCloseActionModal = () => {
    setActionModalData({
      isOpen: false,
      issue: null,
      actionResult: "",
      actionAuthor: "",
      actionImages: []
    });
  };

  const handleSaveActionResult = async (extraData = null, e = null) => {
    if (e && e.preventDefault) e.preventDefault();
    if (extraData && extraData.preventDefault) {
      e = extraData;
      extraData = null;
    }
    if (isSavingIssue) return;
    if (!actionModalData.issue) return;

    const issue = actionModalData.issue;
    const isMeetingAction = issue.category === "회의일정" || String(issue.category || "").includes("회의");
    const rawResult = (extraData?.actionResult !== undefined ? extraData.actionResult : (actionModalData.actionResult || "")).trim();
    const actionImagesList = extraData?.actionImages || actionModalData.actionImages || [];

    // 원문 수정 필드 (수정등록 버튼에서 전달된 경우)
    const editedTitle = (extraData?.title || "").trim();
    const editedContent = (extraData?.content || "").trim();

    // 내용 또는 사진, 또는 원문 수정 제목/내용 중 최소 1개는 있어야 저장 가능
    if (!rawResult && actionImagesList.length === 0 && !editedTitle && !editedContent) {
      alert(isMeetingAction ? "회의 결과 내용을 입력해 주세요." : "조치결과 내용 또는 조치 후 사진을 등록해 주세요.");
      return;
    }

    const hasAction = Boolean(rawResult || actionImagesList.length > 0);
    const actionResultText = rawResult || (actionImagesList.length > 0 ? "조치 후 사진 등록 완료 (현장 조치 완료)" : "");
    const effectiveAuthor = (extraData?.actionAuthor && extraData.actionAuthor.trim())
      || (actionModalData.actionAuthor && actionModalData.actionAuthor.trim())
      || (issue.actionAuthor && issue.actionAuthor.trim())
      || (issue.author && issue.author.trim())
      || (currentProfile?.name && currentProfile.name.trim())
      || "현장담당자";

    setIsSavingIssue(true);
    try {
      const idStr = String(issue.id || issue._docId || "");
      const nowStr = new Date().toISOString();
      const finalTitle = editedTitle || issue.title || issue.content || "";
      const finalContent = editedContent !== "" ? editedContent : (issue.content || "");

      if (idStr.startsWith("ext_q_")) {
        const rawAlert = issue.raw || extrusionQualityAlerts.find((a) => `ext_q_${a.id}` === idStr || String(a.id) === String(issue.rawId)) || {};
        const targetId = issue.rawId || idStr.replace("ext_q_", "");
        const updatedObj = {
          ...rawAlert,
          ...issue,
          id: targetId,
          title: finalTitle,
          content: finalContent,
          defectType: finalTitle,
          details: finalContent,
          ...(hasAction ? {
            actionResult: actionResultText,
            actionAuthor: effectiveAuthor,
            actionImages: actionImagesList,
            status: "RESOLVED",
            isResolved: true
          } : {}),
          updatedAt: nowStr
        };
        await saveExtrusionQualityIssue(updatedObj);
        setExtrusionQualityAlerts((prev) => prev.map((a) => String(a.id) === String(targetId) ? updatedObj : a));
        if (hasAction) {
          sendQualityActionTelegram({ ...issue, category: "부적합경보" }, {
            actionAuthor: effectiveAuthor,
            actionContent: actionResultText,
            images: actionImagesList
          }).catch((err) => {
            console.warn("Telegram action notification error:", err);
          });
        }
      } else if (idStr.startsWith("hanul_q_")) {
        const rawAlert = issue.raw || hanulQualityIssues.find((a) => `hanul_q_${a.id}` === idStr || String(a.id) === String(issue.rawId)) || {};
        const targetId = issue.rawId || idStr.replace("hanul_q_", "");
        const updatedObj = {
          ...rawAlert,
          ...issue,
          id: targetId,
          title: finalTitle,
          content: finalContent,
          defectType: finalTitle,
          ...(hasAction ? {
            actionResult: actionResultText,
            actionAuthor: effectiveAuthor,
            actionImages: actionImagesList,
            status: "RESOLVED",
            isResolved: true
          } : {}),
          updatedAt: nowStr
        };
        await saveHanulQualityIssue(updatedObj);
        setHanulQualityIssues((prev) => prev.map((a) => String(a.id) === String(targetId) ? updatedObj : a));
        if (hasAction) {
          sendQualityActionTelegram({ ...issue, category: "부적합경보" }, {
            actionAuthor: effectiveAuthor,
            actionContent: actionResultText,
            images: actionImagesList
          }).catch((err) => {
            console.warn("Telegram action notification error:", err);
          });
        }
      } else if (idStr.startsWith("ys_q_")) {
        const rawAlert = issue.raw || yuseongQualityIssues.find((a) => `ys_q_${a.id}` === idStr || String(a.id) === String(issue.rawId)) || {};
        const targetId = issue.rawId || idStr.replace("ys_q_", "");
        const updatedObj = {
          ...rawAlert,
          ...issue,
          id: targetId,
          title: finalTitle,
          content: finalContent,
          description: finalContent,
          ...(hasAction ? {
            actionResult: actionResultText,
            actionAuthor: effectiveAuthor,
            actionImages: actionImagesList,
            status: "RESOLVED",
            isResolved: true
          } : {}),
          updatedAt: nowStr
        };
        await saveYuseongQualityIssue(updatedObj);
        setYuseongQualityIssues((prev) => prev.map((a) => String(a.id) === String(targetId) ? updatedObj : a));
        if (hasAction) {
          sendQualityActionTelegram({ ...issue, category: "부적합경보" }, {
            actionAuthor: effectiveAuthor,
            actionContent: actionResultText,
            images: actionImagesList
          }).catch((err) => {
            console.warn("Telegram action notification error:", err);
          });
        }
      } else if (idStr.startsWith("mach_q_")) {
        const rawAlert = issue.raw || machiningQualityIssues.find((a) => `mach_q_${a.id}` === idStr || String(a.id) === String(issue.rawId)) || {};
        const targetId = issue.rawId || idStr.replace("mach_q_", "");
        const updatedObj = {
          ...rawAlert,
          ...issue,
          id: targetId,
          title: finalTitle,
          content: finalContent,
          defectType: finalTitle,
          ...(hasAction ? {
            actionResult: actionResultText,
            actionAuthor: effectiveAuthor,
            actionImages: actionImagesList,
            status: "RESOLVED",
            isResolved: true
          } : {}),
          updatedAt: nowStr
        };
        await saveMachiningQualityIssue(updatedObj);
        setMachiningQualityIssues((prev) => prev.map((a) => String(a.id) === String(targetId) ? updatedObj : a));
        if (hasAction) {
          sendQualityActionTelegram({ ...issue, category: "부적합경보" }, {
            actionAuthor: effectiveAuthor,
            actionContent: actionResultText,
            images: actionImagesList
          }).catch((err) => {
            console.warn("Telegram action notification error:", err);
          });
        }
      } else {
        const targetBase = {
          ...issue,
          title: finalTitle,
          content: finalContent,
          expireDate: extraData?.expireDate || issue.expireDate,
          meetingTime: extraData?.meetingTime || issue.meetingTime,
          meetingLocation: extraData?.meetingLocation || issue.meetingLocation
        };

        let updated;
        if (hasAction) {
          updated = await updateUrgentIssueActionResult(
            issue.id,
            actionResultText,
            effectiveAuthor,
            actionImagesList,
            targetBase
          );
        } else {
          updated = await saveUrgentIssue({
            ...targetBase,
            updatedAt: nowStr
          }, { isNew: false, skipTelegram: true });
        }

        if (updated && !Array.isArray(updated)) {
          setUrgentIssues((prev) => {
            const hasMatch = prev.some((it) => (
              String(it.id) === String(issue.id) ||
              (it._docId && String(it._docId) === String(issue.id)) ||
              (it.customId && String(it.customId) === String(issue.id))
            ));
            return hasMatch
              ? prev.map((it) => (
                  String(it.id) === String(issue.id) ||
                  (it._docId && String(it._docId) === String(issue.id)) ||
                  (it.customId && String(it.customId) === String(issue.id))
                    ? updated
                    : it
                ))
              : [updated, ...prev];
          });
          if (selectedListItem && (String(selectedListItem.id) === String(issue.id) || selectedListItem._docId === issue.id)) {
            setSelectedListItem(updated);
          }
          if (editingIssue && (String(editingIssue.id) === String(issue.id) || editingIssue._docId === issue.id)) {
            setEditingIssue(updated);
          }
        }
      }

      handleCloseActionModal();
      const toastMsg = hasAction
        ? (isMeetingAction ? "✅ 회의 결과가 성공적으로 저장되었습니다." : "✅ 부적합경보 조치결과가 성공적으로 등록되었습니다.")
        : `✅ [${finalTitle}] 항목이 성공적으로 수정·재등록되었습니다.`;
      setRestoreToast(toastMsg);
      setTimeout(() => setRestoreToast(""), 3500);
    } catch (err) {
      console.error("Save action error:", err);
      alert("저장 처리 중 오류가 발생했습니다: " + err.message);
    } finally {
      setIsSavingIssue(false);
    }
  };

  // 🌟 [제1안] 원문 내용 수정 및 재등록 처리
  const handleSaveIssueEdit = async (editedData) => {
    return handleSaveActionResult(editedData);
  };

  // Ledger Action Menu Handlers
  const handleExecuteMeetingResult = (item, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    handleOpenActionModal(item, e);
    setTimeout(() => setOpenActionMenuId(null), 100);
  };

  const handleExecuteEditContent = (item, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    handleOpenEditIssue(item, e, true, false);
    setTimeout(() => setOpenActionMenuId(null), 100);
  };

  // Opinions & Replies Handlers
  const handleModalAddOpinion = async (e) => {
    if (e) e.preventDefault();
    const content = actionOpinionForm.content.trim();
    const opinionFiles = actionOpinionForm.files || [];
    const isQualityAlert = (editingIssue?.category || newIssueForm.category) === "품질경보" || (editingIssue?.category || newIssueForm.category) === "부적합경보";
    if (!content && opinionFiles.length === 0) {
      alert(isQualityAlert ? "조치결과 내용 또는 첨부파일을 입력해 주세요." : "조치 의견 내용 또는 첨부파일을 입력해 주세요.");
      return;
    }
    const authorName = (actionOpinionForm.author && actionOpinionForm.author.trim())
      || (editingIssue?.actionAuthor && editingIssue.actionAuthor.trim())
      || (editingIssue?.author && editingIssue.author.trim())
      || (currentProfile?.name && currentProfile.name.trim())
      || "현장담당자";
    const authorObj = allWorkers.find((w) => w.name === authorName);
    const targetDate = actionOpinionForm.actionDate || todayDateStr;
    const nowStr = new Date().toLocaleString("ko-KR", {
      year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false
    }).replace(/\. /g, "-").replace(/\./g, "");

    if (editingIssue?.id) {
      try {
        const idStr = String(editingIssue.id);
        const newReplyObj = {
          id: `rep_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          author: authorName,
          authorTitle: authorObj?.title || "선임",
          plant: authorObj?.plantName || editingIssue.plant || "삼랑진공장",
          attendanceStatus: "확인",
          actionDate: targetDate,
          content: content || "파일이 첨부되었습니다.",
          files: opinionFiles,
          createdAt: nowStr
        };
        const nextReplies = [...(editingIssue.replies || []), newReplyObj];
        const nextActionImages = Array.from(new Set([...(editingIssue.actionImages || []), ...opinionFiles]));
        const nextActionResult = content || editingIssue.actionResult || "조치 사진 첨부 완료";

        if (idStr.startsWith("ext_q_") || idStr.startsWith("hanul_q_") || idStr.startsWith("ys_q_") || idStr.startsWith("mach_q_")) {
          const { raw: _ignoreRaw, ...restEditing } = editingIssue;
          const baseRaw = editingIssue.raw || {};
          if (idStr.startsWith("ext_q_")) {
            const targetId = editingIssue.rawId || idStr.replace("ext_q_", "");
            const updatedObj = {
              ...baseRaw,
              ...restEditing,
              id: targetId,
              actionResult: nextActionResult,
              actionAuthor: authorName,
              actionAt: nowStr,
              actionImages: nextActionImages,
              replies: nextReplies,
              status: "RESOLVED",
              isResolved: true,
              updatedAt: new Date().toISOString()
            };
            await saveExtrusionQualityIssue(updatedObj);
            setExtrusionQualityAlerts((prev) => prev.map((a) => (String(a.id) === String(targetId) ? updatedObj : a)));
            setEditingIssue({ ...editingIssue, ...updatedObj, id: idStr, rawId: targetId, raw: updatedObj });
          } else if (idStr.startsWith("hanul_q_")) {
            const targetId = editingIssue.rawId || idStr.replace("hanul_q_", "");
            const updatedObj = {
              ...baseRaw,
              ...restEditing,
              id: targetId,
              actionResult: nextActionResult,
              actionAuthor: authorName,
              actionAt: nowStr,
              actionImages: nextActionImages,
              replies: nextReplies,
              status: "RESOLVED",
              isResolved: true,
              updatedAt: new Date().toISOString()
            };
            await saveHanulQualityIssue(updatedObj);
            setHanulQualityIssues((prev) => prev.map((a) => (String(a.id) === String(targetId) ? updatedObj : a)));
            setEditingIssue({ ...editingIssue, ...updatedObj, id: idStr, rawId: targetId, raw: updatedObj });
          } else if (idStr.startsWith("ys_q_")) {
            const targetId = editingIssue.rawId || idStr.replace("ys_q_", "");
            const updatedObj = {
              ...baseRaw,
              ...restEditing,
              id: targetId,
              actionResult: nextActionResult,
              actionAuthor: authorName,
              actionAt: nowStr,
              actionImages: nextActionImages,
              replies: nextReplies,
              status: "RESOLVED",
              isResolved: true,
              updatedAt: new Date().toISOString()
            };
            await saveYuseongQualityIssue(updatedObj);
            setYuseongQualityIssues((prev) => prev.map((a) => (String(a.id) === String(targetId) ? updatedObj : a)));
            setEditingIssue({ ...editingIssue, ...updatedObj, id: idStr, rawId: targetId, raw: updatedObj });
          } else if (idStr.startsWith("mach_q_")) {
            const targetId = editingIssue.rawId || idStr.replace("mach_q_", "");
            const updatedObj = {
              ...baseRaw,
              ...restEditing,
              id: targetId,
              actionResult: nextActionResult,
              actionAuthor: authorName,
              actionAt: nowStr,
              actionImages: nextActionImages,
              replies: nextReplies,
              status: "RESOLVED",
              isResolved: true,
              updatedAt: new Date().toISOString()
            };
            await saveMachiningQualityIssue(updatedObj);
            setMachiningQualityIssues((prev) => prev.map((a) => (String(a.id) === String(targetId) ? updatedObj : a)));
            setEditingIssue({ ...editingIssue, ...updatedObj, id: idStr, rawId: targetId, raw: updatedObj });
          }

          sendQualityActionTelegram({ ...editingIssue, category: "부적합경보" }, {
            actionAuthor: authorName,
            actionContent: nextActionResult,
            images: nextActionImages
          }).catch((err) => {
            console.warn("Telegram action notification error:", err);
          });

          setNewIssueForm((prev) => ({
            ...prev,
            replies: nextReplies,
            isResolved: true,
            actionResult: nextActionResult,
            actionAuthor: authorName,
            actionImages: nextActionImages
          }));
          setActionOpinionForm((prev) => ({ ...prev, content: "", files: [] }));
          setRestoreToast("✅ 부적합경보 조치결과가 성공적으로 등록되었습니다.");
          setTimeout(() => setRestoreToast(""), 3500);
          return;
        }

        const updated = await addIssueReply(editingIssue.id, {
          author: authorName,
          authorTitle: authorObj?.title || "선임",
          plant: authorObj?.plantName || editingIssue.plant || "삼랑진공장",
          attendanceStatus: "확인",
          actionDate: targetDate,
          content: content || "파일이 첨부되었습니다.",
          files: opinionFiles
        }, editingIssue);
        if (updated) {
          setUrgentIssues((prev) => {
            const hasMatch = prev.some((it) => String(it.id) === String(editingIssue.id) || (it._docId && String(it._docId) === String(editingIssue.id)));
            return hasMatch
              ? prev.map((it) => (String(it.id) === String(editingIssue.id) || (it._docId && String(it._docId) === String(editingIssue.id)) ? updated : it))
              : [updated, ...prev];
          });
          setEditingIssue(updated);
          setNewIssueForm((prev) => ({
            ...prev,
            replies: updated.replies || [],
            isResolved: updated.isResolved,
            actionResult: updated.actionResult,
            actionAuthor: updated.actionAuthor || prev.actionAuthor,
            actionImages: updated.actionImages || prev.actionImages
          }));
          setActionOpinionForm((prev) => ({ ...prev, content: "", files: [] }));
          setRestoreToast(isQualityAlert ? "✅ 부적합경보 조치결과가 성공적으로 등록되었습니다." : "✅ 의견이 성공적으로 등록되었습니다.");
          setTimeout(() => setRestoreToast(""), 3500);
        }
      } catch (err) {
        console.error("Add opinion error:", err);
        alert(isQualityAlert ? "조치결과 등록 중 오류가 발생했습니다." : "의견 등록 중 오류가 발생했습니다.");
      }
    } else {
      const newOp = {
        id: `rep_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        author: authorName,
        authorTitle: authorObj?.title || "선임",
        plant: authorObj?.plantName || newIssueForm.plant || "삼랑진공장",
        attendanceStatus: "확인",
        actionDate: targetDate,
        content: content || "파일이 첨부되었습니다.",
        files: opinionFiles,
        createdAt: nowStr
      };

      setNewIssueForm((prev) => ({
        ...prev,
        replies: [...(prev.replies || []), newOp],
        ...(isQualityAlert ? { actionResult: newOp.content, actionAuthor: newOp.author, actionAt: targetDate, isResolved: true } : {})
      }));
      setActionOpinionForm((prev) => ({ ...prev, content: "", files: [], author: "" }));
    }
  };

  const handleModalDeleteOpinion = async (opId, e) => {
    if (e) e.stopPropagation();
    const isQualityAlert = (editingIssue?.category || newIssueForm.category) === "품질경보" || (editingIssue?.category || newIssueForm.category) === "부적합경보";
    const targetReply = (editingIssue?.replies || newIssueForm.replies || []).find((r) => r.id === opId);
    const authorName = targetReply?.author || "";

    // 🔒 의견등록자 본인 확인 (작성자 본인만 삭제 가능)
    if (currentProfile) {
      const isAuthor = currentProfile.name === authorName;
      const isAdmin = currentProfile.role === "ADMIN" || currentProfile.name === "권태형" || currentProfile.name === "최미영";
      const isCeoOpinion = authorName === "대표이사" || authorName === "권태형" || authorName === "최미영" || authorName === "ADMIN";

      if (!isAuthor && !(isAdmin && isCeoOpinion)) {
        alert(`❌ 의견 삭제 권한이 없습니다.\n해당 의견을 작성한 [${authorName || "등록자"}] 본인만 삭제할 수 있습니다.`);
        return;
      }
      if (!confirm(isQualityAlert ? "해당 조치결과를 삭제하시겠습니까?" : `[${authorName}] 님이 작성한 의견을 삭제하시겠습니까?`)) return;
    } else {
      // 로그인 전 첫 화면: 작성자 본인 확인용 PIN 검증
      const inputPin = prompt(`[${authorName}] 님이 작성한 의견을 삭제하시겠습니까?\n작성자 본인 확인을 위해 [${authorName}] 님의 PIN 번호를 입력해 주세요:`);
      if (inputPin === null) return;
      const trimmedPin = inputPin.trim();
      const authorUser = ALL_DESIGNATED_USERS.find((u) => u.name === authorName);
      const isCeoOrAdmin = authorName === "권태형" || authorName === "최미영" || authorName === "대표이사" || authorName === "ADMIN";
      const expectedPin = isCeoOrAdmin ? "0090" : (authorUser?.pin || "11");

      const isValid = trimmedPin === expectedPin || trimmedPin === "0090";
      if (!isValid) {
        alert(`❌ PIN 번호가 일치하지 않습니다.\n해당 의견을 작성한 [${authorName}] 본인만 삭제할 수 있습니다.`);
        return;
      }
    }

    if (editingIssue?.id) {
      try {
        const updated = await deleteIssueReply(editingIssue.id, opId);
        if (updated) {
          setUrgentIssues((prev) => prev.map((it) => (it.id === editingIssue.id ? updated : it)));
          setEditingIssue(updated);
          setNewIssueForm((prev) => ({ ...prev, replies: updated.replies || [], isResolved: updated.isResolved, actionResult: updated.actionResult }));
          setRestoreToast("🗑️ 의견이 성공적으로 삭제되었습니다.");
          setTimeout(() => setRestoreToast(""), 3000);
        }
      } catch (err) {
        console.error("Delete opinion error:", err);
      }
    } else {
      setNewIssueForm((prev) => ({ ...prev, replies: (prev.replies || []).filter((r) => r.id !== opId) }));
    }
  };

  const handleModalAddReply = async (e) => {
    if (e) e.preventDefault();
    if (!replyForm.author || !replyForm.author.trim()) {
      alert("회신 작성자를 직접 선택해 주세요.");
      return;
    }
    if (!replyForm.content.trim()) {
      alert("회신 내용을 입력해 주세요.");
      return;
    }
    setIsSubmittingReply(true);
    try {
      const authorObj = allWorkers.find((w) => w.name === replyForm.author);
      if (editingIssue?.id) {
        const updated = await addIssueReply(editingIssue.id, {
          author: replyForm.author.trim(),
          authorTitle: authorObj?.title || "선임",
          plant: authorObj?.plantName || "삼랑진공장",
          attendanceStatus: replyForm.attendanceStatus,
          content: replyForm.content.trim()
        });
        if (updated) {
          setUrgentIssues((prev) => prev.map((it) => (it.id === editingIssue.id ? updated : it)));
          setEditingIssue(updated);
          setNewIssueForm((prev) => ({ ...prev, replies: updated.replies || [] }));
          setReplyForm((prev) => ({ ...prev, content: "", author: "" }));
          setRestoreToast("✅ 회신이 성공적으로 등록되었습니다.");
          setTimeout(() => setRestoreToast(""), 3500);
        }
      } else {
        const nowStr = new Date().toLocaleString("ko-KR", {
          year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false
        }).replace(/\. /g, "-").replace(/\./g, "");

        const newRep = {
          id: `rep_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          author: replyForm.author.trim(),
          authorTitle: authorObj?.title || "선임",
          plant: authorObj?.plantName || newIssueForm.plant || "삼랑진공장",
          attendanceStatus: replyForm.attendanceStatus,
          content: replyForm.content.trim(),
          createdAt: nowStr
        };
        setNewIssueForm((prev) => ({ ...prev, replies: [...(prev.replies || []), newRep] }));
        setReplyForm((prev) => ({ ...prev, content: "", author: "" }));
      }
    } catch (err) {
      console.error("Add reply error:", err);
      alert("회신 등록 중 오류가 발생했습니다.");
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const handleModalDeleteReply = async (repId, e) => {
    if (e) e.stopPropagation();
    const targetReply = (editingIssue?.replies || newIssueForm.replies || []).find((r) => r.id === repId);
    const authorName = targetReply?.author || "";

    // 🔒 회신등록자 본인 확인 (작성자 본인만 삭제 가능)
    if (currentProfile) {
      const isAuthor = currentProfile.name === authorName;
      const isAdmin = currentProfile.role === "ADMIN" || currentProfile.name === "권태형" || currentProfile.name === "최미영";
      const isCeoOpinion = authorName === "대표이사" || authorName === "권태형" || authorName === "최미영" || authorName === "ADMIN";

      if (!isAuthor && !(isAdmin && isCeoOpinion)) {
        alert(`❌ 회신 삭제 권한이 없습니다.\n해당 회신을 작성한 [${authorName || "등록자"}] 본인만 삭제할 수 있습니다.`);
        return;
      }
      if (!confirm(`[${authorName}] 님이 작성한 회신을 삭제하시겠습니까?`)) return;
    } else {
      const inputPin = prompt(`[${authorName}] 님이 작성한 회신을 삭제하시겠습니까?\n작성자 본인 확인을 위해 [${authorName}] 님의 PIN 번호를 입력해 주세요:`);
      if (inputPin === null) return;
      const trimmedPin = inputPin.trim();
      const authorUser = ALL_DESIGNATED_USERS.find((u) => u.name === authorName);
      const isCeoOrAdmin = authorName === "권태형" || authorName === "최미영" || authorName === "대표이사" || authorName === "ADMIN";
      const expectedPin = isCeoOrAdmin ? "0090" : (authorUser?.pin || "11");

      const isValid = trimmedPin === expectedPin || trimmedPin === "0090";
      if (!isValid) {
        alert(`❌ PIN 번호가 일치하지 않습니다.\n해당 회신을 작성한 [${authorName}] 본인만 삭제할 수 있습니다.`);
        return;
      }
    }

    if (editingIssue?.id) {
      try {
        const updated = await deleteIssueReply(editingIssue.id, repId);
        if (updated) {
          setUrgentIssues((prev) => prev.map((it) => (it.id === editingIssue.id ? updated : it)));
          setEditingIssue(updated);
          setNewIssueForm((prev) => ({ ...prev, replies: updated.replies || [] }));
          setRestoreToast("🗑️ 회신이 성공적으로 삭제되었습니다.");
          setTimeout(() => setRestoreToast(""), 3000);
        }
      } catch (err) {
        console.error("Delete reply error:", err);
      }
    } else {
      setNewIssueForm((prev) => ({ ...prev, replies: (prev.replies || []).filter((r) => r.id !== repId) }));
    }
  };

  // File & Image Upload Handlers (Photos & Excel)
  const handleIssueFiles = async (files) => {
    if (!files || files.length === 0) return;
    setIsProcessingIssueImages(true);
    const filesArray = Array.from(files);

    try {
      const processed = await Promise.all(
        filesArray.map(async (file) => {
          if (file.type.startsWith("image/")) {
            const compressed = await compressImage(file, 1200, 1200, 0.8);
            return compressed ? { ...compressed, fileType: "image" } : null;
          } else {
            return new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onerror = reject;
              reader.onload = (e) => {
                const isExcel =
                  file.name.endsWith(".xlsx") ||
                  file.name.endsWith(".xls") ||
                  file.name.endsWith(".csv") ||
                  file.type.includes("sheet") ||
                  file.type.includes("excel") ||
                  file.type.includes("csv");
                resolve({
                  id: `file_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
                  name: file.name,
                  size: (file.size / 1024).toFixed(1) + " KB",
                  fileType: isExcel ? "excel" : "file",
                  dataUrl: e.target.result
                });
              };
              reader.readAsDataURL(file);
            });
          }
        })
      );
      const valid = processed.filter(Boolean);
      setNewIssueForm((prev) => ({
        ...prev,
        images: [...(prev.images || []), ...valid]
      }));
    } catch (err) {
      console.error("File processing error:", err);
      alert("파일을 처리하는 중 오류가 발생했습니다.");
    } finally {
      setIsProcessingIssueImages(false);
    }
  };

  const handleOpinionFiles = async (files) => {
    if (!files || files.length === 0) return;
    const filesArray = Array.from(files);
    try {
      const processed = await Promise.all(
        filesArray.map(async (file) => {
          if (file.type.startsWith("image/")) {
            const compressed = await compressImage(file, 1200, 1200, 0.8);
            return compressed ? { ...compressed, fileType: "image" } : null;
          } else {
            return new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onerror = reject;
              reader.onload = (e) => {
                const isExcel =
                  file.name.endsWith(".xlsx") ||
                  file.name.endsWith(".xls") ||
                  file.name.endsWith(".csv") ||
                  file.type.includes("sheet") ||
                  file.type.includes("excel") ||
                  file.type.includes("csv");
                resolve({
                  id: `op_file_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
                  name: file.name,
                  size: (file.size / 1024).toFixed(1) + " KB",
                  fileType: isExcel ? "excel" : "file",
                  dataUrl: e.target.result
                });
              };
              reader.readAsDataURL(file);
            });
          }
        })
      );
      const valid = processed.filter(Boolean);
      setActionOpinionForm((prev) => ({
        ...prev,
        files: [...(prev.files || []), ...valid]
      }));
    } catch (err) {
      console.error("Opinion file processing error:", err);
      alert("의견 첨부파일을 처리하는 중 오류가 발생했습니다.");
    }
  };

  const handleRemoveOpinionFile = (idx) => {
    setActionOpinionForm((prev) => ({
      ...prev,
      files: (prev.files || []).filter((_, i) => i !== idx)
    }));
  };

  const handleActionImageFiles = async (files) => {
    if (!files || files.length === 0) return;
    setIsProcessingActionImages(true);
    const availableSlots = 3 - (actionModalData.actionImages?.length || 0);
    const filesToProcess = Array.from(files).slice(0, availableSlots);

    try {
      const compressedImages = await Promise.all(
        filesToProcess.map((f) => compressImage(f, 800, 800, 0.65))
      );
      const valid = compressedImages.filter(Boolean);
      setActionModalData((prev) => ({
        ...prev,
        actionImages: [...(prev.actionImages || []), ...valid]
      }));
    } catch (err) {
      console.error("Action image compression error:", err);
      alert("사진을 처리하는 중 오류가 발생했습니다.");
    } finally {
      setIsProcessingActionImages(false);
    }
  };

  const handleNewIssueActionImageFiles = async (files) => {
    if (!files || files.length === 0) return;
    setIsProcessingActionImages(true);
    const availableSlots = 3 - (newIssueForm.actionImages?.length || 0);
    const filesToProcess = Array.from(files).slice(0, availableSlots);

    try {
      const compressedImages = await Promise.all(
        filesToProcess.map((f) => compressImage(f, 800, 800, 0.65))
      );
      const valid = compressedImages.filter(Boolean);
      setNewIssueForm((prev) => ({
        ...prev,
        actionImages: [...(prev.actionImages || []), ...valid]
      }));
    } catch (err) {
      console.error("New issue action image error:", err);
      alert("사진을 처리하는 중 오류가 발생했습니다.");
    } finally {
      setIsProcessingActionImages(false);
    }
  };

  const handleRemoveIssueImage = (idx) => {
    setNewIssueForm((prev) => ({
      ...prev,
      images: (prev.images || []).filter((_, i) => i !== idx)
    }));
  };

  const handleRemoveActionImage = (idx) => {
    setActionModalData((prev) => ({
      ...prev,
      actionImages: (prev.actionImages || []).filter((_, i) => i !== idx)
    }));
  };

  const handleRemoveNewIssueActionImage = (idx) => {
    setNewIssueForm((prev) => ({
      ...prev,
      actionImages: (prev.actionImages || []).filter((_, i) => i !== idx)
    }));
  };

  return {
    actionModalData,
    setActionModalData,
    replyForm,
    setReplyForm,
    isSubmittingReply,
    setIsSubmittingReply,
    actionOpinionForm,
    setActionOpinionForm,
    isProcessingIssueImages,
    setIsProcessingIssueImages,
    isProcessingActionImages,
    setIsProcessingActionImages,
    handleOpenActionModal,
    handleCloseActionModal,
    handleSaveActionResult,
    handleSaveIssueEdit,
    handleExecuteMeetingResult,
    handleExecuteEditContent,
    handleModalAddOpinion,
    handleModalDeleteOpinion,
    handleModalAddReply,
    handleModalDeleteReply,
    handleIssueFiles,
    handleOpinionFiles,
    handleRemoveOpinionFile,
    handleActionImageFiles,
    handleNewIssueActionImageFiles,
    handleRemoveIssueImage,
    handleRemoveActionImage,
    handleRemoveNewIssueActionImage
  };
};
