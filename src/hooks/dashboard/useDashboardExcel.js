import { useState, useRef } from "react";
import { parseQualityExcelFiles, saveQualityRecordsBatch } from "../../services/qualityService";
import { parseExcelFile } from "../../utils/excelHelper";
import { formatCommonSchedulesForTelegram } from "../../services/commonScheduleService";
import { sendDailyPnLMorningBriefingTelegram } from "../../services/telegramService";
import { useModalHistory } from "../../utils/modalHistory";

/**
 * Custom hook for dashboard Excel operations:
 * - Quality inspection multi-Excel parser and uploader (이창엽/이상기)
 * - PnL & general ledger Excel parser and uploader (조인주)
 * - Morning briefing Telegram sender (권태형/최미영)
 */
export function useDashboardExcel({
  workerFullName,
  workerPlant,
  selectedMonth,
  currentYearMonth,
  uploadMonthlyData,
  onBulkUpload,
  changeMonth,
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
