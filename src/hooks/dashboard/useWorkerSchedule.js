import { useState, useEffect, useMemo, useRef } from "react";
import { PLANTS } from "../../context/AuthContext";
import {
  getAnnualLeaves,
  subscribeAnnualLeaves,
  saveAnnualLeave,
  deleteAnnualLeave,
  completeOrDismissAnnualLeave,
  reactivateAnnualLeave,
  getUserLeaveStatus,
  replyToSharedLeave,
  confirmSharedLeaveReplies
} from "../../services/annualLeaveService";
import { getKSTDateString, formatKSTDate } from "../../utils/dateUtils";
import { compressImage } from "../../utils/imageCompressor";

/**
 * Custom hook for managing worker individual & shared schedules, annual leaves, and weekly calendar days.
 */
export function useWorkerSchedule({
  currentProfile,
  workerFullName,
  workerPlant,
  officialTitle,
  isAdmin,
  todayDateStr,
  setToastMessage,
  setLogSavedToast
}) {
  // Annual Leaves State & Real-time Cloud Subscription
  const [annualLeaves, setAnnualLeaves] = useState(() => getAnnualLeaves());
  const [leaveForm, setLeaveForm] = useState({
    startDate: getKSTDateString(),
    endDate: getKSTDateString(),
    leaveType: "연차(하루)",
    reason: ""
  });
  const [leaveSaving, setLeaveSaving] = useState(false);

  useEffect(() => {
    const unsub = subscribeAnnualLeaves((leaves) => {
      setAnnualLeaves(leaves);
    });
    return () => unsub();
  }, []);

  const myLeaveStatus = useMemo(() => {
    return getUserLeaveStatus(currentProfile?.id, workerFullName, annualLeaves || [], { excludeTodo: false });
  }, [currentProfile, workerFullName, annualLeaves]);

  const myLeaves = useMemo(() => {
    if (!annualLeaves || !Array.isArray(annualLeaves)) return [];
    return annualLeaves.filter(
      (l) => Boolean(l && (((currentProfile?.id && l.userId === currentProfile.id) || (workerFullName && l.userName === workerFullName))))
    );
  }, [annualLeaves, currentProfile, workerFullName]);

  const handleRegisterLeave = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!leaveForm.startDate) {
      alert("일자를 선택해 주세요.");
      return;
    }
    setLeaveSaving(true);
    try {
      const newLeave = {
        userId: currentProfile?.id || `user_${workerFullName}`,
        userName: workerFullName,
        plant: workerPlant,
        title: officialTitle,
        startDate: leaveForm.startDate,
        endDate: leaveForm.endDate || leaveForm.startDate,
        leaveType: leaveForm.leaveType,
        reason: leaveForm.reason || leaveForm.leaveType
      };
      await saveAnnualLeave(newLeave);
      setToastMessage(`${leaveForm.leaveType} 일정이 정상적으로 등록되었습니다.`);
      setLogSavedToast(true);
      setTimeout(() => setLogSavedToast(false), 3000);
      setLeaveForm({
        startDate: getKSTDateString(),
        endDate: getKSTDateString(),
        leaveType: "연차(하루)",
        reason: ""
      });
    } catch (err) {
      alert("일정 등록 중 오류 발생: " + err.message);
    } finally {
      setLeaveSaving(false);
    }
  };

  const handleDeleteLeave = async (leaveId, originLeaveId) => {
    const targetId = originLeaveId || leaveId;
    const leave = (annualLeaves || []).find((l) => l.id === targetId || l.originLeaveId === targetId || l.id === leaveId);
    if (!isAdmin && leave && leave.workerId && leave.workerId !== currentProfile?.id && leave.workerName !== currentProfile?.name) {
      alert("본인이 등록한 일정만 삭제할 수 있습니다.");
      return;
    }
    if (!window.confirm("이 일정을 영구 삭제하시겠습니까?\n(공유된 모든 작업자의 일정에서도 함께 자동 삭제됩니다)")) return;
    await deleteAnnualLeave(targetId, true);
    setToastMessage("일정이 삭제되었습니다. (공유 작업자 일정에서도 자동 삭제 완료)");
    setLogSavedToast(true);
    setTimeout(() => setLogSavedToast(false), 3000);
  };

  // -------------------------------------------------------------------------
  // 🗓️ 전작업자 공통 스마트 일정 관리 States & Handlers
  // -------------------------------------------------------------------------
  const [scheduleSelectedDate, setScheduleSelectedDate] = useState(() => getKSTDateString());
  const [scheduleLeaveType, setScheduleLeaveType] = useState("할일");
  const [scheduleReasonInput, setScheduleReasonInput] = useState("");
  const [sharedWorkers, setSharedWorkers] = useState([]); // 전작업자 선택 목록
  const [isShareDropdownOpen, setIsShareDropdownOpen] = useState(false);
  const shareDropdownRef = useRef(null);
  const [scheduleSaving, setScheduleSaving] = useState(false);
  const [showMiniCalendar, setShowMiniCalendar] = useState(false);
  const [scheduleDetailModal, setScheduleDetailModal] = useState(null); // { selectedDate, dayName, filterTab: 'day'|'week'|'all' }

  // 📸 & 📁 일정 등록 사진/파일 첨부 State & Handlers
  const [scheduleAttachedFiles, setScheduleAttachedFiles] = useState([]); // [{ id, name, size, dataUrl, fileType: 'image'|'file' }]
  const [isProcessingScheduleFiles, setIsProcessingScheduleFiles] = useState(false);
  const scheduleCameraInputRef = useRef(null);
  const scheduleFileInputRef = useRef(null);

  const handleScheduleFiles = async (e) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    if (scheduleAttachedFiles.length >= 10) {
      alert("일정 첨부 파일은 최대 10개까지 등록 가능합니다.");
      return;
    }

    const remainingSlots = 10 - scheduleAttachedFiles.length;
    const filesToProcess = Array.from(selectedFiles).slice(0, remainingSlots);

    setIsProcessingScheduleFiles(true);
    try {
      const processedList = [];
      for (const file of filesToProcess) {
        if (file.type.startsWith("image/")) {
          // 사진 압축 (카메라 촬영 / 앨범 사진)
          const compressed = await compressImage(file, 1200, 1200, 0.75);
          processedList.push({
            id: compressed.id,
            name: compressed.name || file.name,
            size: compressed.size,
            dataUrl: compressed.dataUrl,
            fileType: "image"
          });
        } else {
          // 문서 및 일반 파일 (PDF, Excel, Word 등)
          const base64Data = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
          processedList.push({
            id: `file_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            name: file.name,
            size: (file.size / 1024).toFixed(1) + " KB",
            dataUrl: base64Data,
            fileType: "file"
          });
        }
      }

      setScheduleAttachedFiles((prev) => [...prev, ...processedList].slice(0, 10));
    } catch (err) {
      console.error("일정 첨부파일 처리 오류:", err);
      alert("파일을 처리하는 중 오류가 발생했습니다: " + err.message);
    } finally {
      setIsProcessingScheduleFiles(false);
      e.target.value = "";
    }
  };

  const handleRemoveScheduleFile = (idx) => {
    setScheduleAttachedFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  // 💬 공유 일정 답장(회신) 및 확인 모달 States
  const [sharedReplyModalItem, setSharedReplyModalItem] = useState(null); // 받은 작업자 답장 모달
  const [replyTextInput, setReplyTextInput] = useState("확인했습니다 👍");
  const [replySubmitting, setReplySubmitting] = useState(false);

  const [sharedSenderConfirmModalItem, setSharedSenderConfirmModalItem] = useState(null); // 보낸 작업자 회신확인 모달
  const [confirmSubmitting, setConfirmSubmitting] = useState(false);

  // Click outside to close share dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (shareDropdownRef.current && !shareDropdownRef.current.contains(e.target)) {
        setIsShareDropdownOpen(false);
      }
    };
    if (isShareDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isShareDropdownOpen]);

  const toggleSharedWorker = (worker) => {
    setSharedWorkers((prev) => {
      const exists = prev.some((w) => w.id === worker.id);
      if (exists) {
        return prev.filter((w) => w.id !== worker.id);
      } else {
        return [...prev, worker];
      }
    });
  };

  const togglePlantSharedWorkers = (plantIndex) => {
    const targetPlantWorkers =
      PLANTS[plantIndex]?.workers?.filter(
        (w) => w.id !== currentProfile?.id && w.name !== workerFullName
      ) || [];
    if (targetPlantWorkers.length === 0) return;

    setSharedWorkers((prev) => {
      const allSelected = targetPlantWorkers.every((pw) => prev.some((sw) => sw.id === pw.id));
      if (allSelected) {
        // 해당 공장 전체 작업자 선택 해제
        const targetIds = new Set(targetPlantWorkers.map((pw) => pw.id));
        return prev.filter((sw) => !targetIds.has(sw.id));
      } else {
        // 해당 공장 전체 작업자 선택 (기존 선택 유지하며 추가)
        const currentMap = new Map(prev.map((w) => [w.id, w]));
        targetPlantWorkers.forEach((pw) => {
          currentMap.set(pw.id, pw);
        });
        return Array.from(currentMap.values());
      }
    });
  };

  const [scheduleWeekAnchor, setScheduleWeekAnchor] = useState(() => getKSTDateString());

  const handlePrevWeek = () => {
    setScheduleWeekAnchor((prev) => {
      const d = new Date(prev + "T00:00:00+09:00");
      d.setDate(d.getDate() - 7);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    });
  };

  const handleNextWeek = () => {
    setScheduleWeekAnchor((prev) => {
      const d = new Date(prev + "T00:00:00+09:00");
      d.setDate(d.getDate() + 7);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    });
  };

  const handleResetToToday = () => {
    const today = getKSTDateString();
    setScheduleWeekAnchor(today);
    setScheduleSelectedDate(today);
  };

  // 🗓️ 현재 로그인한 작업자의 활성 등록 일정 (등록일부터 완료 또는 지정날짜까지 노출)
  const myActiveLeaves = useMemo(() => {
    if (!annualLeaves || !Array.isArray(annualLeaves)) return [];
    const myId = currentProfile?.id;
    const myName = workerFullName;

    return annualLeaves
      .filter((l) => {
        if (!l) return false;
        const matchUser = (myId && l.userId === myId) || (myName && l.userName === myName);
        if (!matchUser) return false;
        if (l.isCompleted || l.isDismissed) return false;

        const regDate = l.createdAt ? formatKSTDate(l.createdAt) : (l.createdDate || l.startDate || "");
        const startDate = l.startDate || l.date || regDate;
        const targetEndDate = l.endDate || l.startDate || l.date || regDate;
        const effectiveStart = regDate && regDate <= startDate ? regDate : startDate;

        // 노출기간: 등록일부터 지정날짜까지
        return Boolean(effectiveStart && targetEndDate && effectiveStart <= todayDateStr && todayDateStr <= targetEndDate);
      })
      .sort((a, b) => {
        const aDate = a.startDate || "";
        const bDate = b.startDate || "";
        return aDate.localeCompare(bDate);
      });
  }, [annualLeaves, todayDateStr, currentProfile?.id, workerFullName]);

  const handleDismissMyLeave = async (leaveId) => {
    try {
      await completeOrDismissAnnualLeave(leaveId);
      setToastMessage("일정이 완료되었습니다. (완료 탭에서 확인 가능)");
      setLogSavedToast(true);
      setTimeout(() => setLogSavedToast(false), 3000);
    } catch (err) {
      alert("일정 완료 처리 중 오류: " + err.message);
    }
  };

  const handleReactivateLeave = async (item) => {
    if (!item) return;
    try {
      await reactivateAnnualLeave(item.id);
      setToastMessage(`[${item.leaveType}] 일정을 다시 '진행중'으로 복구하였습니다.`);
      setLogSavedToast(true);
      setTimeout(() => setLogSavedToast(false), 3000);
    } catch (err) {
      alert("일정 복구 중 오류 발생: " + err.message);
    }
  };

  // 💬 공유 일정 삭제/완료 요청 통합 핸들러
  const handleRequestDismissOrDelete = (item, actionType = "dismiss") => {
    if (!item) return;

    // 1. 공유받은 일정인 경우 (받은 작업자는 보낸 작업자에게 답장을 보내거나 직접 삭제 가능)
    if (item.isSharedRecipient || item.sharedBy) {
      if (actionType === "direct_delete" || actionType === "delete") {
        handleDeleteLeave(item.id);
        return;
      }
      setReplyTextInput("확인했습니다 👍");
      setSharedReplyModalItem(item);
      return;
    }

    // 2. 작성자(보낸 사람)인 경우: X 버튼 또는 삭제 시 공유된 대상자들의 일정까지 모두 자동 삭제
    handleDeleteLeave(item.id, item.originLeaveId);
  };

  // 💬 받은 작업자: 답장 전송 및 내 일정 삭제/완료 처리
  const handleSendSharedReply = async () => {
    if (!sharedReplyModalItem) return;
    if (!replyTextInput.trim()) {
      alert("보낸 작업자에게 전달할 답장 내용을 입력해주세요.");
      return;
    }
    setReplySubmitting(true);
    try {
      await replyToSharedLeave(sharedReplyModalItem.id, replyTextInput.trim(), currentProfile);
      setToastMessage(
        `💬 [${sharedReplyModalItem.sharedBy || "보낸작업자"}]님에게 답장을 전송하고 내 일정에서 완전 삭제하였습니다.`
      );
      setLogSavedToast(true);
      setTimeout(() => setLogSavedToast(false), 3500);
      setSharedReplyModalItem(null);
      setReplyTextInput("");
    } catch (err) {
      alert("답장 전송 중 오류 발생: " + err.message);
    } finally {
      setReplySubmitting(false);
    }
  };

  // ✓ 보낸 작업자: 회신 확인 완료 및 최종 삭제/완료 처리 (공유 작업자 일정에서도 자동 삭제)
  const handleConfirmSenderDismiss = async (actionType = "delete") => {
    if (!sharedSenderConfirmModalItem) return;
    setConfirmSubmitting(true);
    try {
      await confirmSharedLeaveReplies(sharedSenderConfirmModalItem.id, currentProfile, actionType || "delete");
      setToastMessage("공유 일정이 삭제되었습니다. (공유 작업자 일정에서도 자동 삭제 완료)");
      setLogSavedToast(true);
      setTimeout(() => setLogSavedToast(false), 3500);
      setSharedSenderConfirmModalItem(null);
    } catch (err) {
      alert("일정 처리 중 오류 발생: " + err.message);
    } finally {
      setConfirmSubmitting(false);
    }
  };

  // Weekly Calendar Days (주차별 7일 계산)
  const myWeeklyCalendarDays = useMemo(() => {
    if (!scheduleWeekAnchor) return [];
    const baseDate = new Date(scheduleWeekAnchor + "T00:00:00+09:00");
    const dayOfWeek = baseDate.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
    const sundayDate = new Date(baseDate);
    sundayDate.setDate(baseDate.getDate() - dayOfWeek);

    const dayNames = ["일", "월", "화", "수", "목", "금", "토"];
    const weekDays = [];
    const myId = currentProfile?.id;
    const myName = workerFullName;

    for (let i = 0; i < 7; i++) {
      const d = new Date(sundayDate);
      d.setDate(sundayDate.getDate() + i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      const dateStr = `${yyyy}-${mm}-${dd}`;
      const isToday = dateStr === todayDateStr;
      const isSelected = dateStr === scheduleSelectedDate;

      const dayEvents = (annualLeaves || []).filter((l) => {
        if (!l) return false;
        const matchUser = (myId && l.userId === myId) || (myName && l.userName === myName);
        if (!matchUser) return false;
        return (l.startDate || "") <= dateStr && (l.endDate || l.startDate || "") >= dateStr;
      });

      // 진행중인 일정을 우선 노출하고, 완료된 일정은 뒤로 정렬
      dayEvents.sort((a, b) => {
        const aDone = a.isCompleted || a.isDismissed ? 1 : 0;
        const bDone = b.isCompleted || b.isDismissed ? 1 : 0;
        if (aDone !== bDone) return aDone - bDone;
        return (a.startDate || "").localeCompare(b.startDate || "");
      });

      weekDays.push({
        dateStr,
        year: yyyy,
        month: parseInt(mm, 10),
        dayNumber: parseInt(dd, 10),
        dayName: dayNames[i],
        dayOfWeek: i,
        isToday,
        isSelected,
        events: dayEvents
      });
    }

    return weekDays;
  }, [scheduleWeekAnchor, scheduleSelectedDate, annualLeaves, todayDateStr, currentProfile?.id, workerFullName]);

  const handleRegisterSchedule = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!scheduleSelectedDate) {
      alert("일정을 등록할 일자를 선택해주세요.");
      return;
    }
    setScheduleSaving(true);
    try {
      const nowIso = new Date().toISOString();
      const baseReason = scheduleReasonInput.trim() || scheduleLeaveType;
      const myId = currentProfile?.id || `user_${workerFullName}`;
      const myName = workerFullName;
      const myPlant = workerPlant;
      const myTitle = officialTitle;
      const originLeaveId = `leave_${Date.now()}_${myId}`;

      const sharedWithDetails = (sharedWorkers || []).map((w) => ({
        id: w.id,
        name: w.name,
        plant: w.plant || myPlant,
        title: w.title || "선임",
        status: "PENDING",
        replyText: "",
        replyAt: null
      }));

      // 첨부된 사진/파일 데이터 복사
      const attachedFiles = [...scheduleAttachedFiles];
      const attachedImages = attachedFiles.filter(
        (f) => f.fileType === "image" || f.dataUrl?.startsWith("data:image")
      );

      // 1. 현재 로그인한 작업자(보낸이) 원본 일정 등록
      const newLeave = {
        id: originLeaveId,
        originLeaveId: originLeaveId,
        userId: myId,
        userName: myName,
        plant: myPlant,
        title: myTitle,
        startDate: scheduleSelectedDate,
        endDate: scheduleSelectedDate,
        leaveType: scheduleLeaveType,
        reason: baseReason,
        sharedWith: sharedWorkers.map((w) => w.name),
        sharedWithDetails: sharedWithDetails,
        replies: [],
        files: attachedFiles,
        images: attachedImages,
        isSharedOrigin: sharedWorkers.length > 0,
        hasNewReply: false,
        createdAt: nowIso,
        createdDate: todayDateStr,
        isCompleted: false,
        isDismissed: false
      };
      await saveAnnualLeave(newLeave);

      // 2. 선택된 공유작업자(받은이) 각각의 일정 등록
      if (sharedWorkers.length > 0) {
        for (let i = 0; i < sharedWorkers.length; i++) {
          const sw = sharedWorkers[i];
          const sharedLeave = {
            id: `leave_${Date.now()}_${sw.id}_${i}`,
            originLeaveId: originLeaveId,
            userId: sw.id,
            userName: sw.name,
            plant: sw.plant || myPlant,
            title: sw.title || "선임",
            startDate: scheduleSelectedDate,
            endDate: scheduleSelectedDate,
            leaveType: scheduleLeaveType,
            reason: `${baseReason} (${myName} 공유)`,
            sharedBy: myName,
            sharedById: myId,
            sharedByPlant: myPlant,
            sharedByTitle: myTitle,
            isSharedRecipient: true,
            replyStatus: "PENDING",
            replyText: "",
            replyAt: null,
            files: attachedFiles,
            images: attachedImages,
            createdAt: nowIso,
            createdDate: todayDateStr,
            isCompleted: false,
            isDismissed: false
          };
          await saveAnnualLeave(sharedLeave);
        }
      }

      const shareNames = sharedWorkers.map((w) => w.name).join(", ");
      const attachCountMsg = attachedFiles.length > 0 ? ` (사진/파일 ${attachedFiles.length}개 첨부)` : "";
      setToastMessage(
        `[${myName} ${myTitle}] ${scheduleSelectedDate} ${scheduleLeaveType} 일정이 등록되었습니다.${
          shareNames ? ` (공유 작업자: ${shareNames} 자동 등록)` : ""
        }${attachCountMsg}`
      );
      setLogSavedToast(true);
      setTimeout(() => setLogSavedToast(false), 3500);
      setScheduleReasonInput("");
      setSharedWorkers([]);
      setScheduleAttachedFiles([]);
      setIsShareDropdownOpen(false);
    } catch (err) {
      alert("일정 등록 중 오류가 발생했습니다: " + err.message);
    } finally {
      setScheduleSaving(false);
    }
  };

  return {
    annualLeaves,
    setAnnualLeaves,
    leaveForm,
    setLeaveForm,
    leaveSaving,
    myLeaveStatus,
    myLeaves,
    myActiveLeaves,
    handleRegisterLeave,
    handleDeleteLeave,
    handleDismissMyLeave,
    handleReactivateLeave,
    scheduleSelectedDate,
    setScheduleSelectedDate,
    scheduleLeaveType,
    setScheduleLeaveType,
    scheduleReasonInput,
    setScheduleReasonInput,
    sharedWorkers,
    setSharedWorkers,
    isShareDropdownOpen,
    setIsShareDropdownOpen,
    shareDropdownRef,
    scheduleSaving,
    showMiniCalendar,
    setShowMiniCalendar,
    scheduleDetailModal,
    setScheduleDetailModal,
    scheduleAttachedFiles,
    setScheduleAttachedFiles,
    isProcessingScheduleFiles,
    scheduleCameraInputRef,
    scheduleFileInputRef,
    handleScheduleFiles,
    handleRemoveScheduleFile,
    sharedReplyModalItem,
    setSharedReplyModalItem,
    replyTextInput,
    setReplyTextInput,
    replySubmitting,
    sharedSenderConfirmModalItem,
    setSharedSenderConfirmModalItem,
    confirmSubmitting,
    toggleSharedWorker,
    togglePlantSharedWorkers,
    scheduleWeekAnchor,
    setScheduleWeekAnchor,
    handlePrevWeek,
    handleNextWeek,
    handleResetToToday,
    myWeeklyCalendarDays,
    handleRequestDismissOrDelete,
    handleSendSharedReply,
    handleConfirmSenderDismiss,
    handleRegisterSchedule
  };
}
