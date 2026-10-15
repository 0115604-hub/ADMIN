import { useState, useRef } from "react";
import { parseExtrusionExcelFile, saveExtrusionDowntimeBatch } from "../../services/extrusionDowntimeService";
import { parseQualityExcelFiles, saveQualityRecordsBatch } from "../../services/qualityService";
import { saveWorkLog } from "../../services/workLogService";
import { parseExcelFile } from "../../utils/excelHelper";
import { formatCommonSchedulesForTelegram } from "../../services/commonScheduleService";
import { sendDailyPnLMorningBriefingTelegram } from "../../services/telegramService";
import { getKSTDateString } from "../../utils/dateUtils";
import { useModalHistory } from "../../utils/modalHistory";

/**
 * Custom hook for dashboard Excel operations:
 * - Extrusion line downtime multi-Excel parser and uploader
 * - Quality inspection multi-Excel parser and uploader
 * - PnL & general ledger Excel parser and uploader
 * - Morning briefing & line match sharing report
 */
export function useDashboardExcel({
  currentProfile,
  workerFullName,
  workerPlant,
  officialTitle,
  selectedMonth,
  currentYearMonth,
  uploadMonthlyData,
  onBulkUpload,
  changeMonth,
  formData,
  setFormData,
  setIsModalOpen,
  uncompletedCommonSchedules,
  todayDateStr,
  totalSales,
  totalPurchases,
  salesAchievementPct,
  purchaseAchievementPct,
  setToastMessage,
  setLogSavedToast
}) {
  // Morning Briefing PnL States & Handlers
  const [dailyPnLModalOpen, setDailyPnLModalOpen] = useState(false);
  useModalHistory(
    dailyPnLModalOpen,
    () => setDailyPnLModalOpen(false),
    "workerDashboardDailyPnLModal"
  );
  const [sendingDailyPnL, setSendingDailyPnL] = useState(false);
  const [customPnLBriefing, setCustomPnLBriefing] = useState(null);
  const [selectedPnLChannel, setSelectedPnLChannel] = useState("-1003939516875"); // Default: 경영방 (대표·전무 전용)

  const handleSendDailyPnLTelegram = async () => {
    setSendingDailyPnL(true);
    try {
      const uncompletedSchedsText = formatCommonSchedulesForTelegram(uncompletedCommonSchedules, todayDateStr);

      const channelName =
        selectedPnLChannel === "-1003939516875"
          ? "경영방 (대표·전무)"
          : selectedPnLChannel === "290615483"
          ? "대표님 1:1"
          : "오륙 통합방";

      const res = await sendDailyPnLMorningBriefingTelegram(
        {
          salesAmount: customPnLBriefing?.salesAmount ?? totalSales,
          purchaseAmount: customPnLBriefing?.purchaseAmount ?? totalPurchases,
          salesAchievementRate:
            customPnLBriefing?.salesAchievementRate ||
            `${salesAchievementPct}% (${
              Number(salesAchievementPct) >= 100
                ? `▲ +${(Number(salesAchievementPct) - 100).toFixed(1)}%`
                : `▼ ${(Number(salesAchievementPct) - 100).toFixed(1)}%`
            })`,
          purchaseAchievementRate:
            customPnLBriefing?.purchaseAchievementRate ||
            `${purchaseAchievementPct}% (${
              Number(purchaseAchievementPct) <= 100
                ? `▼ ${(100 - Number(purchaseAchievementPct)).toFixed(1)}% 절감`
                : `▲ +${(Number(purchaseAchievementPct) - 100).toFixed(1)}% 증가`
            })`,
          commonSchedules: customPnLBriefing?.commonSchedules || uncompletedSchedsText,
          targetChatId: selectedPnLChannel
        },
        selectedPnLChannel
      );

      if (res.success) {
        setToastMessage(`[${channelName}]으로 매출 & 일정공유 브리핑이 발송되었습니다.`);
        setLogSavedToast(true);
        setTimeout(() => setLogSavedToast(false), 3000);
        setDailyPnLModalOpen(false);
      } else {
        alert("전송 실패: " + (res.error || "설정을 확인해주세요."));
      }
    } catch (err) {
      alert("발송 중 오류 발생: " + err.message);
    } finally {
      setSendingDailyPnL(false);
    }
  };

  // Line Match Report Sharing Text & Copy Handlers
  const [lineMatchShareModal, setLineMatchShareModal] = useState(null);
  const [copyToast, setCopyToast] = useState(false);

  const generateLineMatchShareText = (matches, dateStr, writerName) => {
    if (!matches || matches.length === 0) return "";
    const totalMin = matches.reduce((acc, cur) => acc + (cur.totalMinutes || 0), 0);
    let text = `[오륙산업 삼랑진공장 - 압출동 라인별 비가동 엑셀 업로드 및 매칭 내역 공유]\n`;
    text += `• 작성자: ${writerName || "설유철 책임"} (${dateStr || getKSTDateString()})\n`;
    text += `• 업로드 라인: 총 ${matches.length}개 라인 (합계 비가동 ${totalMin}분)\n\n`;

    matches.forEach((m, idx) => {
      text += `${idx + 1}. [${m.lineName}] ${m.fileName} (${m.totalMinutes || 0}분)\n`;
      if (m.records && m.records.length > 0) {
        m.records.forEach((r) => {
          text += `   - ${r.reason} (${r.durationMinutes}분): ${r.details || "-"}\n`;
          if (r.actionTaken) text += `     [조치] ${r.actionTaken}\n`;
        });
      } else {
        text += `   - 비가동 정상 접수 및 가동 완료\n`;
      }
      text += "\n";
    });

    text += `▶ 실시간 시스템 확인: https://profit-and-loss-7d09b.web.app`;
    return text;
  };

  const handleCopyLineMatchText = (matches, dateStr, writerName) => {
    const text = generateLineMatchShareText(matches, dateStr, writerName);
    if (!text) return;
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopyToast(true);
        setTimeout(() => setCopyToast(false), 2500);
      })
      .catch((err) => {
        console.error("Clipboard error:", err);
      });
  };

  // Seol Yoo-cheol Extrusion Multi-Files Handler (4~6 Line Excel Files)
  const [extrusionFiles, setExtrusionFiles] = useState([]);
  const [extrusionDragActive, setExtrusionDragActive] = useState(false);
  const [extrusionParsing, setExtrusionParsing] = useState(false);
  const [extrusionUploading, setExtrusionUploading] = useState(false);
  const [extrusionUploadSuccess, setExtrusionUploadSuccess] = useState(false);
  const [extrusionSuccessMessage, setExtrusionSuccessMessage] = useState("");
  const extrusionFileInputRef = useRef(null);

  const handleExtrusionFiles = async (files) => {
    if (!files || files.length === 0) return;
    setExtrusionParsing(true);
    setExtrusionUploadSuccess(false);
    setExtrusionSuccessMessage("");

    const newParsedList = [...extrusionFiles];
    for (const f of Array.from(files)) {
      try {
        const parsed = await parseExtrusionExcelFile(f);
        const existingIdx = newParsedList.findIndex((item) => item.fileName === f.name);
        if (existingIdx >= 0) {
          newParsedList[existingIdx] = parsed;
        } else {
          newParsedList.push(parsed);
        }
      } catch (err) {
        console.warn("Extrusion file parse warning:", err);
      }
    }

    setExtrusionFiles(newParsedList.slice(0, 8)); // Support up to 6~8 line files
    setExtrusionParsing(false);
  };

  const handleExtrusionDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setExtrusionDragActive(true);
    } else if (e.type === "dragleave") {
      setExtrusionDragActive(false);
    }
  };

  const handleExtrusionDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setExtrusionDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleExtrusionFiles(e.dataTransfer.files);
    }
  };

  const handleRemoveExtrusionFile = (idx) => {
    setExtrusionFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleConfirmExtrusionUpload = async (e) => {
    if (e) e.preventDefault();
    if (extrusionFiles.length === 0 && !formData.workContent.trim()) {
      alert("업무일지 내용을 입력하거나 압출 엑셀 파일을 드래그 업로드해 주세요.");
      return;
    }

    setExtrusionUploading(true);
    try {
      const allDowntimeRecords = extrusionFiles.flatMap((f) => f.records);
      const totalMinutes = extrusionFiles.reduce((acc, cur) => acc + (cur.totalMinutes || 0), 0);
      const lineNames = Array.from(new Set(extrusionFiles.map((f) => f.lineName))).join(", ");

      if (allDowntimeRecords.length > 0) {
        await saveExtrusionDowntimeBatch(allDowntimeRecords);
      }

      const lineFileMatches = extrusionFiles.map((f) => ({
        lineName: f.lineName,
        fileName: f.fileName,
        fileSize: f.fileSize,
        rowCount: f.rowCount,
        totalMinutes: f.totalMinutes,
        records: f.records || []
      }));

      const newLog = {
        id: String(Date.now()),
        date: formData.date,
        plant: "삼랑진공장",
        writer: currentProfile?.name || workerFullName,
        title: officialTitle,
        process: "압출동 관리",
        shift: formData.shift || "주간",
        line: lineNames || "압출 전 라인 (PCM 1호, PCM 3호, TPE 1호, PVC 등)",
        workContent:
          formData.workContent ||
          `압출 라인별 주간 비가동내역 엑셀 파일(${extrusionFiles.length}개 라인) 업로드 및 DB 동기화 완료 (총 ${totalMinutes}분 비가동 분석)`,
        issues:
          formData.issues ||
          (extrusionFiles.length > 0
            ? `업로드 파일: ${extrusionFiles.map((f) => f.fileName).join(", ")}`
            : "정상 가동 완료"),
        images: formData.images || [],
        lineFileMatches: lineFileMatches,
        status: "완료",
        createdAt: new Date().toLocaleString("ko-KR", {
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit"
        })
      };

      await saveWorkLog(newLog);

      setFormData((prev) => ({
        ...prev,
        workContent: "",
        issues: "",
        images: []
      }));

      setExtrusionUploadSuccess(true);
      setExtrusionSuccessMessage(
        `압출 라인별 엑셀 ${extrusionFiles.length}개 파일(총 ${totalMinutes}분 비가동)이 데이터베이스에 정상 반영되었습니다.`
      );
      setLogSavedToast(true);

      // Auto-open Line Match Sharing Report
      setLineMatchShareModal({
        date: formData.date,
        writer: currentProfile?.name || workerFullName,
        matches: lineFileMatches,
        totalMinutes
      });

      setTimeout(() => {
        setLogSavedToast(false);
        setIsModalOpen(false);
        setExtrusionUploadSuccess(false);
      }, 1000);
    } catch (err) {
      alert("압출 비가동 엑셀 업로드 중 오류: " + err.message);
    } finally {
      setExtrusionUploading(false);
    }
  };

  // Changyeop Quality Files Handler
  const [qualityFiles, setQualityFiles] = useState([]);
  const [qualityRawFiles, setQualityRawFiles] = useState([]);
  const [qualityDragActive, setQualityDragActive] = useState(false);
  const [qualityParsing, setQualityParsing] = useState(false);
  const [qualityUploading, setQualityUploading] = useState(false);
  const [qualityUploadSuccess, setQualityUploadSuccess] = useState(false);
  const [qualitySuccessMessage, setQualitySuccessMessage] = useState("");
  const qualityFileInputRef = useRef(null);

  const handleQualityFiles = (files) => {
    if (!files || files.length === 0) return;
    const fileList = Array.from(files);
    setQualityRawFiles(fileList);
    setQualityParsing(true);
    setQualityUploadSuccess(false);
    setQualitySuccessMessage("");

    setTimeout(() => {
      setQualityFiles(
        fileList.map((f, idx) => ({
          id: idx + 1,
          name: f.name,
          size: (f.size / 1024).toFixed(1) + " KB",
          type: f.name.includes("불량")
            ? "불량유형 분석 데이터"
            : f.name.includes("정리")
            ? "최종검사 정리 데이터"
            : "품질 검사실적 데이터"
        }))
      );
      setQualityParsing(false);
    }, 300);
  };

  const handleQualityDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setQualityDragActive(true);
    } else if (e.type === "dragleave") {
      setQualityDragActive(false);
    }
  };

  const handleQualityDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setQualityDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleQualityFiles(e.dataTransfer.files);
    }
  };

  const handleConfirmQualityUpload = async () => {
    if (qualityFiles.length === 0) return;
    setQualityUploading(true);
    try {
      if (qualityRawFiles && qualityRawFiles.length > 0) {
        const { records, count, yearMonth } = await parseQualityExcelFiles(qualityRawFiles);
        if (records && records.length > 0) {
          await saveQualityRecordsBatch(records);
          if (yearMonth && changeMonth && yearMonth !== selectedMonth) {
            changeMonth(yearMonth);
          }
          setQualitySuccessMessage(
            `품질 엑셀 ${qualityFiles.length}개 파일에서 총 ${count}건의 일자별 실적이 중복 없이 데이터베이스에 성공적으로 반영되었습니다!`
          );
          setQualityUploadSuccess(true);
        } else {
          setQualitySuccessMessage("선택하신 엑셀 파일에서 품질 실적 데이터를 찾지 못했습니다. 파일 서식을 확인해 주세요.");
          setQualityUploadSuccess(false);
          alert("선택하신 엑셀 파일에서 유효한 품질 실적 데이터를 찾지 못했습니다. 파일 서식을 확인해 주세요.");
        }
      } else {
        setQualitySuccessMessage("업로드할 파일이 없습니다.");
        setQualityUploadSuccess(false);
      }
    } catch (err) {
      console.error("Quality upload error:", err);
      setQualitySuccessMessage("엑셀 파일 파싱 및 저장 중 오류가 발생했습니다: " + (err.message || ""));
      setQualityUploadSuccess(false);
      alert("품질 엑셀 저장 중 오류 발생: " + (err.message || "파일 형식을 확인해 주세요."));
    } finally {
      setQualityUploading(false);
    }
  };

  // Injoo General PnL / Ledger Excel Process
  const fileInputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [parsedResult, setParsedResult] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const handleExcelFile = async (file) => {
    if (!file) return;
    setParsing(true);
    setUploadSuccess(false);
    setSuccessMessage("");
    try {
      const result = await parseExcelFile(file, selectedMonth);
      setParsedResult({
        file,
        fileName: file.name,
        fileSize: (file.size / 1024).toFixed(1) + " KB",
        ...result
      });
    } catch (err) {
      console.error("Excel parse error:", err);
      alert("엑셀 파일 파싱 오류: " + (err.message || "파일 형식을 확인해 주세요."));
    } finally {
      setParsing(false);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleExcelFile(e.dataTransfer.files[0]);
    }
  };

  const handleConfirmExcelUpload = async () => {
    if (!parsedResult) return;
    setUploading(true);
    try {
      const targetYM = parsedResult.yearMonth || selectedMonth || currentYearMonth || "2026-09";
      await uploadMonthlyData(targetYM, parsedResult, {
        fileName: parsedResult.fileName,
        uploadedBy: `${workerFullName} (${workerPlant})`,
        fileSize: parsedResult.fileSize
      });
      if (onBulkUpload && parsedResult.items && parsedResult.items.length > 0) {
        try {
          await onBulkUpload(parsedResult.items);
        } catch (e) {
          console.warn("Bulk upload secondary sync warning:", e);
        }
      }
      setUploadSuccess(true);
      setSuccessMessage(`${targetYM} 최신 파일(${parsedResult.fileName}) 기준으로 데이터가 갱신되었습니다. (이전 파일 대체 완료)`);
    } catch (err) {
      console.error("Excel upload error:", err);
      alert("업로드 중 오류 발생: " + (err.message || "저장 중 오류가 발생했습니다."));
    } finally {
      setUploading(false);
    }
  };

  return {
    dailyPnLModalOpen,
    setDailyPnLModalOpen,
    sendingDailyPnL,
    customPnLBriefing,
    setCustomPnLBriefing,
    selectedPnLChannel,
    setSelectedPnLChannel,
    handleSendDailyPnLTelegram,
    lineMatchShareModal,
    setLineMatchShareModal,
    copyToast,
    setCopyToast,
    generateLineMatchShareText,
    handleCopyLineMatchText,
    extrusionFiles,
    setExtrusionFiles,
    extrusionDragActive,
    setExtrusionDragActive,
    extrusionParsing,
    extrusionUploading,
    extrusionUploadSuccess,
    extrusionSuccessMessage,
    extrusionFileInputRef,
    handleExtrusionFiles,
    handleExtrusionDrag,
    handleExtrusionDrop,
    handleRemoveExtrusionFile,
    handleConfirmExtrusionUpload,
    qualityFiles,
    setQualityFiles,
    qualityRawFiles,
    setQualityRawFiles,
    qualityDragActive,
    setQualityDragActive,
    qualityParsing,
    qualityUploading,
    qualityUploadSuccess,
    qualitySuccessMessage,
    qualityFileInputRef,
    handleQualityFiles,
    handleQualityDrag,
    handleQualityDrop,
    handleConfirmQualityUpload,
    fileInputRef,
    dragActive,
    setDragActive,
    parsing,
    uploading,
    parsedResult,
    setParsedResult,
    uploadSuccess,
    setUploadSuccess,
    successMessage,
    setSuccessMessage,
    handleExcelFile,
    handleDrag,
    handleDrop,
    handleConfirmExcelUpload
  };
}
