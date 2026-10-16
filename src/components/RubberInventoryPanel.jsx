import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Barcode,
  Camera,
  Download,
  Printer,
  Package,
  ArrowDownLeft,
  ArrowUpRight,
  Search,
  Trash2,
  X,
  Sparkles,
  CheckCircle2,
  Calendar,
  Layers,
  Clock
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import {
  subscribeRubberLedger,
  addRubberLedgerEntry,
  deleteRubberLedgerEntry,
  parseRubberBarcode,
  playBeepSound,
  calculateRubberStockSummary
} from "../services/rubberLedgerService";

export const RubberInventoryPanel = () => {
  const { currentProfile } = useAuth();
  const defaultWorkerName = currentProfile?.name
    ? `${currentProfile.name} ${currentProfile.title || "책임"}`.trim()
    : "설유설 책임";

  // 실시간 입출고 대장 데이터
  const [ledgerEntries, setLedgerEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  // 폼 입력 상태
  const [barcodeInput, setBarcodeInput] = useState("");
  const [parsedInfo, setParsedInfo] = useState(null);
  const [entryType, setEntryType] = useState("IN"); // "IN" | "OUT"
  const [qty, setQty] = useState(1);
  const [unit, setUnit] = useState("kg");
  const [processLocation, setProcessLocation] = useState("원자재 1창고 (입고 보관)");
  const [workerName, setWorkerName] = useState(defaultWorkerName);
  const [notes, setNotes] = useState("");
  const [toastMessage, setToastMessage] = useState("");

  // 필터 상태
  const [typeFilter, setTypeFilter] = useState("ALL"); // "ALL" | "IN" | "OUT"
  const [periodFilter, setPeriodFilter] = useState("TODAY"); // "TODAY" | "7DAYS" | "MONTH" | "ALL"
  const [searchQuery, setSearchQuery] = useState("");

  // 카메라 바코드 스캐너 모달 상태
  const [cameraModalOpen, setCameraModalOpen] = useState(false);
  const videoRef = useRef(null);
  const barcodeInputRef = useRef(null);

  // Firestore & LocalStorage 실시간 구독
  useEffect(() => {
    const unsub = subscribeRubberLedger((data) => {
      setLedgerEntries(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // 토스트 메시지 헬퍼
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3500);
  };

  // 바코드 해독 처리
  const handleParseBarcode = (rawVal) => {
    const code = (rawVal !== undefined ? rawVal : barcodeInput).trim();
    if (!code) {
      setParsedInfo(null);
      return;
    }
    const parsed = parseRubberBarcode(code);
    setParsedInfo(parsed);

    // 출고 시 6호기 등이 감지되면 공정 자동 추천
    if (parsed.lineNo && parsed.lineNo.includes("6호기") && entryType === "OUT") {
      setProcessLocation("압출 6호기 (투입)");
    }
  };

  // 바코드 입력창 변경
  const handleBarcodeChange = (e) => {
    const val = e.target.value;
    setBarcodeInput(val);
    handleParseBarcode(val);
  };

  // 바코드 스캐너 엔터 키 지원
  const handleBarcodeKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleParseBarcode();
      playBeepSound("success");
      showToast("바코드 인식 완료");
    }
  };

  // 퀵 수량 추가 버튼 (+1, +5, +10, +50)
  const handleQuickQty = (addVal) => {
    setQty((prev) => {
      const num = Number(prev) || 0;
      return Math.max(0.1, num + addVal);
    });
  };

  // 신규 입/출고 등록
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    const barcode = barcodeInput.trim();
    const numQty = parseFloat(qty);

    if (!barcode) {
      alert("바코드를 먼저 스캔하거나 입력해 주세요.");
      barcodeInputRef.current?.focus();
      return;
    }
    if (isNaN(numQty) || numQty <= 0) {
      alert("올바른 수량을 입력해 주세요.");
      return;
    }

    const parsed = parseRubberBarcode(barcode);
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const timeStr = now.toTimeString().slice(0, 8);

    const newEntry = {
      type: entryType,
      rawBarcode: barcode,
      itemCode: parsed.itemCode || "연고무",
      lotDate: parsed.lotDate || barcode,
      lotFormatted: parsed.lotFormatted || dateStr,
      lineNo: parsed.lineNo || "기본라인",
      cavity: parsed.cavity || "",
      qty: numQty,
      unit: unit,
      process: processLocation,
      workerName: workerName || defaultWorkerName,
      notes: notes.trim(),
      date: dateStr,
      createdAt: `${dateStr} ${timeStr}`
    };

    try {
      await addRubberLedgerEntry(newEntry);
      playBeepSound("success");
      showToast(`[${entryType === "IN" ? "입고" : "출고"}] ${numQty} ${unit} 정상 등록 완료!`);

      // 폼 초기화
      setBarcodeInput("");
      setNotes("");
      setParsedInfo(null);
      setQty(1);
      barcodeInputRef.current?.focus();
    } catch (err) {
      alert("등록 중 오류가 발생했습니다: " + err.message);
    }
  };

  // 삭제 처리
  const handleDelete = async (id) => {
    if (window.confirm("해당 연고무 입출고 내역을 삭제하시겠습니까?")) {
      await deleteRubberLedgerEntry(id);
      showToast("내역이 삭제되었습니다.");
    }
  };

  // 카메라 바코드 스캐너 실행
  useEffect(() => {
    let stream = null;
    let scanInterval = null;

    if (cameraModalOpen) {
      (async () => {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } }
          });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            await videoRef.current.play();
          }

          if ("BarcodeDetector" in window) {
            // @ts-ignore
            const detector = new window.BarcodeDetector({
              formats: ["code_128", "code_39", "ean_13", "qr_code"]
            });
            scanInterval = setInterval(async () => {
              try {
                if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
                  const barcodes = await detector.detect(videoRef.current);
                  if (barcodes.length > 0) {
                    const detected = barcodes[0].rawValue;
                    setBarcodeInput(detected);
                    handleParseBarcode(detected);
                    playBeepSound("success");
                    showToast(`바코드 감지: ${detected}`);
                    setCameraModalOpen(false);
                  }
                }
              } catch (err) {
                // scanning frame error
              }
            }, 300);
          }
        } catch (err) {
          alert("카메라를 실행할 수 없습니다: " + err.message);
          setCameraModalOpen(false);
        }
      })();
    }

    return () => {
      if (scanInterval) clearInterval(scanInterval);
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [cameraModalOpen]);

  // 통계 요약 계산 (k5604.kr 동일)
  const stats = useMemo(() => {
    return calculateRubberStockSummary(ledgerEntries);
  }, [ledgerEntries]);

  // 필터링된 대장 목록
  const filteredEntries = useMemo(() => {
    let list = [...ledgerEntries];

    // 1. 구분 필터
    if (typeFilter !== "ALL") {
      list = list.filter((e) => e.type === typeFilter);
    }

    // 2. 기간 필터
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);

    if (periodFilter === "TODAY") {
      list = list.filter((e) => (e.date || e.createdAt || "").startsWith(todayStr));
    } else if (periodFilter === "7DAYS") {
      const past7 = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
      list = list.filter((e) => (e.date || e.createdAt || "") >= past7);
    } else if (periodFilter === "MONTH") {
      const monthPrefix = todayStr.slice(0, 7);
      list = list.filter((e) => (e.date || e.createdAt || "").startsWith(monthPrefix));
    }

    // 3. 검색어 필터
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (e) =>
          (e.rawBarcode || "").toLowerCase().includes(q) ||
          (e.lotDate || "").toLowerCase().includes(q) ||
          (e.itemCode || "").toLowerCase().includes(q) ||
          (e.process || "").toLowerCase().includes(q) ||
          (e.workerName || "").toLowerCase().includes(q) ||
          (e.notes || "").toLowerCase().includes(q)
      );
    }

    return list;
  }, [ledgerEntries, typeFilter, periodFilter, searchQuery]);

  // CSV 엑셀 내보내기
  const exportToCSV = () => {
    if (filteredEntries.length === 0) {
      alert("내보낼 데이터가 없습니다.");
      return;
    }

    const headers = [
      "등록일시",
      "구분",
      "바코드원문",
      "품목코드",
      "생산LOT",
      "설비/호기",
      "캐비티/순번",
      "수량",
      "단위",
      "투입공정/위치",
      "담당자",
      "비고"
    ];

    const rows = filteredEntries.map((e) => [
      e.createdAt || e.date,
      e.type === "IN" ? "입고" : "출고",
      e.rawBarcode || "",
      e.itemCode || "",
      e.lotDate || "",
      e.lineNo || "",
      e.cavity || "",
      e.qty || 0,
      e.unit || "kg",
      e.process || "",
      e.workerName || "",
      e.notes || ""
    ]);

    const csvContent =
      "\uFEFF" +
      [headers.join(","), ...rows.map((row) => row.map((c) => `"${String(c || "").replace(/"/g, '""')}"`).join(","))].join(
        "\n"
      );

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `연고무_입출고대장_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-12 font-sans">
      {/* 🌟 1. Top Title & Action Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>🧪</span> 연고무 입출고대장
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
              바코드 연동 실시간 재고 관리
            </span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
              삼랑진공장 설유설 책임 모드
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            고객용(HKMC)/코퍼/사내 바코드를 스캔하여 연고무(조인트고무, EPDM 컴파운드, 압출 원소재)의 입고·출고 및 잔여 재고를 실시간으로 추적 관리합니다.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={exportToCSV}
            className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            엑셀 다운로드 (CSV)
          </button>
          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            대장 인쇄
          </button>
        </div>
      </div>

      {/* 🌟 2. KPI Summary Cards (k5604.kr 정밀 동일 카드) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* 현재고 (실시간 잔량) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1.5">
            <Package className="w-4 h-4 text-sky-500" /> 현재고 (실시간 잔량)
          </p>
          <p className="text-2xl font-black text-sky-600 dark:text-sky-400">
            {stats.currentStock.toLocaleString("ko-KR", { maximumFractionDigits: 1 })}{" "}
            <span className="text-xs font-normal text-slate-500">kg</span>
          </p>
          <p className="text-[11px] text-slate-400 mt-1">총 입고량 - 총 출고량</p>
        </div>

        {/* 금일 입고 수량 */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1.5">
            <ArrowDownLeft className="w-4 h-4 text-emerald-500" /> 금일 입고 수량
          </p>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {stats.todayInQty.toLocaleString("ko-KR", { maximumFractionDigits: 1 })}{" "}
            <span className="text-xs font-normal text-slate-500">kg</span>
          </p>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
            오늘 입고: {stats.todayInCount}건
          </p>
        </div>

        {/* 금일 출고 수량 */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1.5">
            <ArrowUpRight className="w-4 h-4 text-rose-500" /> 금일 출고 수량
          </p>
          <p className="text-2xl font-black text-rose-600 dark:text-rose-400">
            {stats.todayOutQty.toLocaleString("ko-KR", { maximumFractionDigits: 1 })}{" "}
            <span className="text-xs font-normal text-slate-500">kg</span>
          </p>
          <p className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold mt-1">
            오늘 출고: {stats.todayOutCount}건
          </p>
        </div>

        {/* 총 입출고 등록 건수 */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-purple-500" /> 총 입출고 등록 건수
          </p>
          <p className="text-2xl font-black text-purple-600 dark:text-purple-400">
            {stats.totalRecords.toLocaleString("ko-KR")}{" "}
            <span className="text-xs font-normal text-slate-500">건</span>
          </p>
          <p className="text-[11px] text-slate-400 mt-1">누적 이력 데이터</p>
        </div>
      </div>

      {/* 🌟 3. Barcode Input & Registration Section */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-sky-500/60 dark:border-sky-500/40 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-sky-500/10 via-sky-500/5 to-transparent border-b border-sky-200 dark:border-sky-900/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Barcode className="w-5 h-5 text-sky-600 dark:text-sky-400" />
            <span className="font-extrabold text-sm text-sky-900 dark:text-sky-300">
              ⚡ 바코드 스캔 및 입/출고 즉시 등록
            </span>
          </div>
          <button
            type="button"
            onClick={() => setCameraModalOpen(true)}
            className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
          >
            <Camera className="w-4 h-4" />
            카메라 바코드 스캔
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* 토스트 알림 */}
          {toastMessage && (
            <div className="p-3 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-xs font-bold text-teal-800 dark:text-teal-200 flex items-center gap-2 animate-fadeIn">
              <Sparkles className="w-4 h-4 text-teal-600 animate-pulse" />
              {toastMessage}
            </div>
          )}

          {/* Barcode Input Line */}
          <div>
            <label className="block text-xs font-extrabold text-slate-800 dark:text-slate-200 mb-1.5">
              🔍 바코드 스캔 또는 직접 입력 (스캐너 인식 시 자동 줄바꿈/등록 지원)
            </label>
            <div className="flex gap-2">
              <input
                ref={barcodeInputRef}
                type="text"
                value={barcodeInput}
                onChange={handleBarcodeChange}
                onKeyDown={handleBarcodeKeyDown}
                placeholder="바코드를 스캔하거나 입력하세요 (예: FFW26A14W60712$2+02 또는 코퍼/사내 바코드)"
                autoFocus
                className="flex-1 px-4 py-2.5 rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-sm font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 shadow-inner"
              />
              <button
                type="button"
                onClick={() => {
                  handleParseBarcode();
                  playBeepSound("success");
                }}
                className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold text-xs text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 cursor-pointer"
              >
                해독 확인
              </button>
            </div>
          </div>

          {/* Barcode Auto-Parsed Preview Card (k5604.kr 동일) */}
          {parsedInfo && (
            <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 space-y-2 animate-fadeIn">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-700 dark:text-purple-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> ✨ 바코드 자동 해독 결과
                </span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                  {parsedInfo.barcodeType}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] text-slate-400 block font-semibold">품목/구분</span>
                  <strong className="text-sky-600 dark:text-sky-400 font-bold text-xs truncate block">
                    {parsedInfo.itemCode || "-"}
                  </strong>
                </div>
                <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] text-slate-400 block font-semibold">생산 LOT (일자)</span>
                  <strong className="text-slate-800 dark:text-slate-200 font-bold text-xs block">
                    {parsedInfo.lotFormatted ? `${parsedInfo.lotDate} (${parsedInfo.lotFormatted})` : parsedInfo.lotDate || "-"}
                  </strong>
                </div>
                <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] text-slate-400 block font-semibold">생산 설비/호기</span>
                  <strong className="text-purple-600 dark:text-purple-400 font-bold text-xs block">
                    {parsedInfo.lineNo || "-"}
                  </strong>
                </div>
                <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] text-slate-400 block font-semibold">근무조 / 시간</span>
                  <strong className="text-slate-800 dark:text-slate-200 font-bold text-xs block">
                    {parsedInfo.shift || ""} {parsedInfo.time || "-"}
                  </strong>
                </div>
                <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] text-slate-400 block font-semibold">캐비티 / 순번</span>
                  <strong className="text-emerald-600 dark:text-emerald-400 font-bold text-xs block">
                    {parsedInfo.cavity || "-"}
                  </strong>
                </div>
              </div>
            </div>
          )}

          {/* Form Fields Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 text-xs">
            {/* ① 입출고 구분 토글 */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                ① 입출고 구분 <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEntryType("IN");
                    setProcessLocation("원자재 1창고 (입고 보관)");
                  }}
                  className={`py-2 px-3 rounded-xl font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                    entryType === "IN"
                      ? "bg-emerald-600 text-white shadow-md border-2 border-emerald-600"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700"
                  }`}
                >
                  🟢 입고 (Stock In)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEntryType("OUT");
                    setProcessLocation("압출 6호기 (투입)");
                  }}
                  className={`py-2 px-3 rounded-xl font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                    entryType === "OUT"
                      ? "bg-rose-600 text-white shadow-md border-2 border-rose-600"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700"
                  }`}
                >
                  🔴 출고 (Stock Out)
                </button>
              </div>
            </div>

            {/* ② 수량 및 단위 */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                ② 수량 및 단위 <span className="text-rose-500">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  step="any"
                  min="0.1"
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                  className="w-3/5 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-extrabold text-sm text-right text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-2/5 px-2.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-slate-800 dark:text-slate-200"
                >
                  <option value="kg">kg</option>
                  <option value="롤(Roll)">롤(Roll)</option>
                  <option value="BOX">BOX</option>
                  <option value="EA">EA</option>
                </select>
              </div>
              {/* Quick Qty Buttons */}
              <div className="flex gap-1 mt-1.5">
                {[1, 5, 10, 50].map((addNum) => (
                  <button
                    key={addNum}
                    type="button"
                    onClick={() => handleQuickQty(addNum)}
                    className="flex-1 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[10px] font-bold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 cursor-pointer"
                  >
                    +{addNum}
                  </button>
                ))}
              </div>
            </div>

            {/* ③ 공정 / 입출고처 */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                ③ 공정 / 입출고처
              </label>
              <select
                value={processLocation}
                onChange={(e) => setProcessLocation(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500"
              >
                <option value="원자재 1창고 (입고 보관)">원자재 1창고 (입고 보관)</option>
                <option value="압출 6호기 (투입)">압출 6호기 (투입)</option>
                <option value="압출 2호기 (투입)">압출 2호기 (투입)</option>
                <option value="압출 1호기 (투입)">압출 1호기 (투입)</option>
                <option value="가공공장 - 조인트 사출 (투입)">가공공장 - 조인트 사출 (투입)</option>
                <option value="가공공장 - 소재준비 (투입)">가공공장 - 소재준비 (투입)</option>
                <option value="소재준비실 (보관)">소재준비실 (보관)</option>
                <option value="불량/폐기 처리">불량/폐기 처리</option>
                <option value="기타">기타</option>
              </select>
            </div>

            {/* ④ 처리 담당자 */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                ④ 처리 담당자
              </label>
              <input
                type="text"
                value={workerName}
                onChange={(e) => setWorkerName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-slate-800 dark:text-slate-200"
              />
            </div>
          </div>

          {/* ⑤ 특이사항 및 제출 버튼 */}
          <div className="flex flex-col sm:flex-row gap-3 items-end pt-1">
            <div className="flex-1 w-full">
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 text-xs">
                ⑤ 특이사항 / 비고 (선택)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="비고 메모 (예: 외관 양호, 긴급 공정 투입, 품질 체크 완료 등)"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              className={`w-full sm:w-auto px-6 py-2.5 rounded-xl text-white font-extrabold text-sm shadow-md transition-all active:scale-95 cursor-pointer whitespace-nowrap flex items-center justify-center gap-2 ${
                entryType === "IN"
                  ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20"
                  : "bg-rose-600 hover:bg-rose-700 shadow-rose-500/20"
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              {entryType === "IN" ? "💾 [입고 등록 완료]" : "💾 [출고 등록 완료]"}
            </button>
          </div>
        </div>
      </div>

      {/* 🌟 4. Ledger History & Filter Section */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {/* Table Header Filter Toolbar */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-sky-600" /> 연고무 입출고 상세 이력 대장
            </span>
            <span className="font-bold text-sky-600 dark:text-sky-400">
              (조회: {filteredEntries.length}건)
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* 구분 필터 */}
            <div className="flex rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden font-bold">
              <button
                type="button"
                onClick={() => setTypeFilter("ALL")}
                className={`px-2.5 py-1 transition-colors cursor-pointer ${
                  typeFilter === "ALL" ? "bg-sky-600 text-white" : "text-slate-600 dark:text-slate-300"
                }`}
              >
                전체
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter("IN")}
                className={`px-2.5 py-1 transition-colors cursor-pointer ${
                  typeFilter === "IN" ? "bg-emerald-600 text-white" : "text-slate-600 dark:text-slate-300"
                }`}
              >
                🟢 입고만
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter("OUT")}
                className={`px-2.5 py-1 transition-colors cursor-pointer ${
                  typeFilter === "OUT" ? "bg-rose-600 text-white" : "text-slate-600 dark:text-slate-300"
                }`}
              >
                🔴 출고만
              </button>
            </div>

            {/* 기간 필터 */}
            <div className="flex rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden font-bold">
              {[
                { key: "TODAY", label: "오늘" },
                { key: "7DAYS", label: "최근 7일" },
                { key: "MONTH", label: "이번 달" },
                { key: "ALL", label: "전체" }
              ].map((p) => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => setPeriodFilter(p.key)}
                  className={`px-2.5 py-1 transition-colors cursor-pointer ${
                    periodFilter === p.key ? "bg-purple-600 text-white" : "text-slate-600 dark:text-slate-300"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* 검색창 */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="바코드, LOT, 공정, 담당자 검색"
                className="pl-8 pr-3 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs w-44 focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto max-h-[550px]">
          <table className="w-full text-center text-xs">
            <thead className="bg-slate-100/90 dark:bg-slate-800/90 sticky top-0 z-10 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-2.5 px-3 whitespace-nowrap">등록 일시</th>
                <th className="py-2.5 px-2 whitespace-nowrap">구분</th>
                <th className="py-2.5 px-3 text-left whitespace-nowrap">바코드 원문</th>
                <th className="py-2.5 px-3 whitespace-nowrap">생산 LOT</th>
                <th className="py-2.5 px-2 whitespace-nowrap">설비/호기</th>
                <th className="py-2.5 px-2 whitespace-nowrap">캐비티/순번</th>
                <th className="py-2.5 px-3 text-right whitespace-nowrap">수량</th>
                <th className="py-2.5 px-2 whitespace-nowrap">단위</th>
                <th className="py-2.5 px-3 text-left whitespace-nowrap">투입공정 / 위치</th>
                <th className="py-2.5 px-3 whitespace-nowrap">담당자</th>
                <th className="py-2.5 px-3 text-left">비고</th>
                <th className="py-2.5 px-2 whitespace-nowrap">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={12} className="py-12 text-center text-slate-400">
                    데이터를 불러오는 중입니다...
                  </td>
                </tr>
              ) : filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-12 text-center text-slate-400 font-medium">
                    일치하는 입출고 내역 데이터가 없습니다.
                  </td>
                </tr>
              ) : (
                filteredEntries.map((e) => (
                  <tr
                    key={e.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-slate-700 dark:text-slate-200"
                  >
                    <td className="py-2 px-3 text-[11px] text-slate-400 font-mono whitespace-nowrap">
                      {e.createdAt || e.date}
                    </td>
                    <td className="py-2 px-2 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          e.type === "IN"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                            : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                        }`}
                      >
                        {e.type === "IN" ? "🟢 입고" : "🔴 출고"}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-left font-mono font-bold text-sky-700 dark:text-sky-300 whitespace-nowrap">
                      {e.rawBarcode || "-"}
                    </td>
                    <td className="py-2 px-3 font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                      {e.lotDate || "-"}
                    </td>
                    <td className="py-2 px-2 whitespace-nowrap">
                      <span className="px-1.5 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-semibold text-[11px]">
                        {e.lineNo || "-"}
                      </span>
                    </td>
                    <td className="py-2 px-2 text-[11px] text-slate-500 whitespace-nowrap">
                      {e.cavity || "-"}
                    </td>
                    <td className="py-2 px-3 text-right font-black font-mono whitespace-nowrap">
                      <span className={e.type === "IN" ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}>
                        {Number(e.qty || 0).toLocaleString("ko-KR", { maximumFractionDigits: 1 })}
                      </span>
                    </td>
                    <td className="py-2 px-2 text-slate-400 font-medium whitespace-nowrap">
                      {e.unit || "kg"}
                    </td>
                    <td className="py-2 px-3 text-left font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                      {e.process || "-"}
                    </td>
                    <td className="py-2 px-3 text-slate-600 dark:text-slate-300 font-semibold whitespace-nowrap">
                      {e.workerName || "-"}
                    </td>
                    <td className="py-2 px-3 text-left text-slate-500 max-w-xs truncate">
                      {e.notes || "-"}
                    </td>
                    <td className="py-2 px-2 whitespace-nowrap">
                      <button
                        onClick={() => handleDelete(e.id)}
                        className="px-2 py-0.5 rounded text-[11px] bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950 dark:hover:bg-rose-900 dark:text-rose-300 font-bold transition-colors cursor-pointer"
                      >
                        삭제
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 🌟 5. Camera Barcode Scanner Modal (k5604.kr 정밀 동일 모달) */}
      {cameraModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-700 animate-scaleUp">
            {/* Modal Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Camera className="w-4 h-4 text-sky-400" />
                실시간 카메라 바코드 스캐너
              </h3>
              <button
                type="button"
                onClick={() => setCameraModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Video Viewport with Red Target Viewfinder */}
            <div className="relative bg-black h-72 flex items-center justify-center overflow-hidden">
              <video ref={videoRef} playsInline autoPlay className="w-full h-full object-cover" />
              {/* Red Viewfinder Target Box */}
              <div className="absolute w-3/4 h-28 border-2 border-red-500 rounded-lg shadow-[0_0_0_9999px_rgba(0,0,0,0.45)] pointer-events-none flex items-center justify-center">
                <div className="w-full h-0.5 bg-red-500 animate-pulse shadow-[0_0_8px_#ef4444]"></div>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-800 text-center text-xs text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-700">
              빨간색 박스 안에 바코드를 평평하게 맞추면 자동으로 인식됩니다.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RubberInventoryPanel;
