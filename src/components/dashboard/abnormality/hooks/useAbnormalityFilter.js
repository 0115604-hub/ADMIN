import { useState, useMemo } from "react";
import * as XLSX from "xlsx";

/**
 * Custom Hook: useAbnormalityFilter
 * Handles filtering, full-text search, O(N) KPI statistics calculation, and Excel export.
 */
export const useAbnormalityFilter = (allUnifiedRecords = [], fourMLedgerRecords = [], todayStr = "") => {
  // View Mode: 'table' (1-line ledger table) vs 'card' (detailed cards)
  const [viewMode, setViewMode] = useState("table");

  // Filter States
  const [selectedPlant, setSelectedPlant] = useState("ALL"); // ALL | 삼랑진공장 | 한림공장
  const [selected4MTab, setSelected4MTab] = useState("ALL"); // ALL | MACHINE | MAN | MATERIAL | METHOD | OFFICIAL_LEDGER
  const [selectedOriginFilter, setSelectedOriginFilter] = useState("ALL"); // ALL | OFFICIAL_LEDGER | 설비수리 | 비가동 | 불량손실 | TPM이상신고 | 품질경보 | 결근발생 | 4M대체투입
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("ALL"); // ALL | PENDING | RESOLVED
  const [selectedPhotoFilter, setSelectedPhotoFilter] = useState("ALL"); // ALL | ONLY_PHOTOS
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDateFilter, setSelectedDateFilter] = useState("ALL"); // ALL | TODAY | WEEK | CUSTOM
  const [customDateInput, setCustomDateInput] = useState("");

  // 필터링 연산
  const filteredRecords = useMemo(() => {
    const ledgerSet = new Set(
      (fourMLedgerRecords || []).flatMap((r) => [
        r.originalId,
        r.id,
        r.rawId,
        `ledger_${r.originalId}`,
        `ledger_${r.id}`
      ].filter(Boolean))
    );

    return allUnifiedRecords.filter((rec) => {
      // 0. 공식 변동점 관리대장 필터
      if (selectedOriginFilter === "OFFICIAL_LEDGER" || selected4MTab === "OFFICIAL_LEDGER") {
        const isRegistered = ledgerSet.has(rec.id) || ledgerSet.has(`ledger_${rec.id}`) || Boolean(rec.raw?.id && ledgerSet.has(rec.raw.id)) || rec.isOfficialLedger;
        const isQualityAlert = rec.origin === "부적합경보" || rec.origin === "품질경보" || rec.sourceType === "QUALITY_ALERT";
        if (!isRegistered && !isQualityAlert) return false;
      }

      // 1. 공장 필터
      if (selectedPlant !== "ALL") {
        const pNorm = (rec.plant || "").toLowerCase();
        const targetP = selectedPlant.replace("공장", "");
        if (targetP === "한림") {
          if (!pNorm.includes("한림") && !pNorm.includes("한울") && !pNorm.includes("부림")) return false;
        } else if (targetP === "삼랑진") {
          if (!pNorm.includes("삼랑진") && !pNorm.includes("압출") && !pNorm.includes("가공") && !pNorm.includes("유성")) return false;
        } else {
          if (!pNorm.includes(targetP)) return false;
        }
      }

      // 2. 4M 구분 탭 필터 (OFFICIAL_LEDGER 제외 시 적용)
      if (selected4MTab !== "ALL" && selected4MTab !== "OFFICIAL_LEDGER") {
        if (rec.fourM.toUpperCase() !== selected4MTab.toUpperCase()) return false;
      }

      // 3. 출처 구분 필터 (OFFICIAL_LEDGER 제외 시 적용)
      if (selectedOriginFilter !== "ALL" && selectedOriginFilter !== "OFFICIAL_LEDGER") {
        if (selectedOriginFilter === "부적합경보" || selectedOriginFilter === "품질경보") {
          if (rec.origin !== "부적합경보" && rec.origin !== "품질경보") return false;
        } else if (rec.origin !== selectedOriginFilter) {
          return false;
        }
      }

      // 4. 조치 상태 필터
      if (selectedStatusFilter === "PENDING" && rec.isResolved) return false;
      if (selectedStatusFilter === "RESOLVED" && !rec.isResolved) return false;

      // 5. 사진 유무 필터
      if (selectedPhotoFilter === "ONLY_PHOTOS") {
        const hasP = (rec.images && rec.images.length > 0) || (rec.actionImages && rec.actionImages.length > 0);
        if (!hasP) return false;
      }

      // 6. 기간 필터
      if (selectedDateFilter === "TODAY") {
        if (rec.date !== todayStr) return false;
      } else if (selectedDateFilter === "WEEK") {
        const d = new Date();
        d.setDate(d.getDate() - 7);
        const weekAgoStr = d.toISOString().slice(0, 10);
        if (rec.date < weekAgoStr) return false;
      } else if (selectedDateFilter === "CUSTOM" && customDateInput) {
        if (rec.date !== customDateInput) return false;
      }

      // 7. 검색어 필터
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = rec.title?.toLowerCase().includes(q);
        const matchContent = rec.content?.toLowerCase().includes(q);
        const matchWriter = rec.writer?.toLowerCase().includes(q);
        const matchLine = rec.line?.toLowerCase().includes(q);
        const matchPlant = rec.plant?.toLowerCase().includes(q);
        const matchOrigin = rec.origin?.toLowerCase().includes(q);
        const matchAction = rec.actionResult?.toLowerCase().includes(q);
        if (!matchTitle && !matchContent && !matchWriter && !matchLine && !matchPlant && !matchOrigin && !matchAction) return false;
      }

      return true;
    });
  }, [
    allUnifiedRecords,
    fourMLedgerRecords,
    selectedPlant,
    selected4MTab,
    selectedOriginFilter,
    selectedStatusFilter,
    selectedPhotoFilter,
    selectedDateFilter,
    customDateInput,
    searchQuery,
    todayStr
  ]);

  // 4M 통계 집계 (단일 루프 O(N))
  const stats = useMemo(() => {
    let machineCount = 0;
    let repairCount = 0;
    let downtimeCount = 0;
    let tpmCount = 0;
    let totalDowntimeMin = 0;
    let manCount = 0;
    let methodCount = 0;
    let methodPending = 0;
    let materialCount = 0;
    let totalScrapKg = 0;
    let totalPhotos = 0;

    const list = Array.isArray(allUnifiedRecords) ? allUnifiedRecords : [];
    for (let i = 0; i < list.length; i++) {
      const r = list[i];
      if (!r) continue;
      const fourM = (r.fourM || "").toUpperCase();
      if (fourM === "MACHINE") {
        machineCount++;
        if (r.origin === "설비수리") repairCount++;
        else if (r.origin === "비가동") downtimeCount++;
        else if (r.origin === "TPM 이상신고") tpmCount++;
        totalDowntimeMin += (r.downtimeMinutes || 0);
      } else if (fourM === "MAN") {
        manCount++;
      } else if (fourM === "METHOD") {
        methodCount++;
        if (!r.isResolved) methodPending++;
      } else if (fourM === "MATERIAL") {
        materialCount++;
        totalScrapKg += (r.scrapKg || 0);
      }
      totalPhotos += (r.images?.length || 0) + (r.actionImages?.length || 0);
    }

    return {
      totalCount: list.length,
      officialLedgerCount: fourMLedgerRecords?.length || 0,
      machineCount,
      repairCount,
      downtimeCount,
      tpmCount,
      totalDowntimeMin,
      manCount,
      materialCount,
      totalScrapKg: Number(totalScrapKg.toFixed(1)),
      methodCount,
      methodPending,
      totalPhotos
    };
  }, [allUnifiedRecords, fourMLedgerRecords]);

  // 4M 변동점 관리대장 엑셀 추출
  const handleExportExcel = () => {
    if (filteredRecords.length === 0) {
      alert("출력할 데이터가 없습니다.");
      return;
    }

    const rows = filteredRecords.map((r, i) => ({
      "NO": i + 1,
      "4M구분": r.fourM,
      "구분": `[${r.fourM}] ${r.origin}`,
      "일시": r.time ? `${r.date} ${r.time}` : r.date,
      "공장": r.plant,
      "변동점내용": r.title,
      "사진": `${(r.images?.length || 0) + (r.actionImages?.length || 0)}장`,
      "진행상태": r.isResolved ? "조치완료" : "진행중",
      "유효성검증": r.validation || (r.isResolved ? "유효성 검증 완료" : "검증 대기"),
      "변동점대장": r.isRegisteredInLedger ? "대장등록됨" : "미등록",
      "상세 내용": r.content || "-",
      "조치 내용": r.actionResult || "-",
      "조치자": r.actionAuthor || "-",
      "보고자": r.writer || "-"
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "4M_변동점_관리대장");
    XLSX.writeFile(wb, `4M_변동점_관리대장_${todayStr || new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return {
    viewMode,
    setViewMode,
    selectedPlant,
    setSelectedPlant,
    selected4MTab,
    setSelected4MTab,
    selectedOriginFilter,
    setSelectedOriginFilter,
    selectedStatusFilter,
    setSelectedStatusFilter,
    selectedPhotoFilter,
    setSelectedPhotoFilter,
    searchQuery,
    setSearchQuery,
    selectedDateFilter,
    setSelectedDateFilter,
    customDateInput,
    setCustomDateInput,
    filteredRecords,
    stats,
    handleExportExcel
  };
};
