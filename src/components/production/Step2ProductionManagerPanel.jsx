import React, { useState, useEffect, useMemo } from "react";
import {
  Factory,
  Wrench,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Filter,
  Search,
  RefreshCw,
  Camera,
  ChevronDown,
  ChevronUp,
  X,
  Upload,
  ArrowRight,
  Edit3,
  Calendar,
  Layers,
  Sparkles,
  Info,
  Check,
  RotateCcw,
  SlidersHorizontal,
  TrendingUp,
  ShieldAlert
} from "lucide-react";
import { subscribeMachiningWorkReports } from "../../services/machiningWorkReportService";
import { subscribeToExtrusionReports } from "../../services/extrusionProductionService";
import {
  subscribeProductionOrders,
  saveProductionOrder,
  getLocalProductionOrders
} from "../../services/productionOrderService";
import {
  getLocalWorkReportNcLedger,
  saveWorkReportNcLedger,
  extractWorkReportNonconformances,
  WORK_REPORT_NC_STORAGE_KEY
} from "../common/WorkReportNonconformanceLedgerPanel";
import {
  registerToFourMLedger,
  unregisterFromFourMLedger,
  determineFourMCategory
} from "../../services/fourMChangePointService";
import { ImagePreviewModal } from "../common/ImagePreviewModal";

/**
 * 🏭 2단계: 공정·생산관리자 전용 생산오더 관리 & 비가동·부적합 1차 소팅 패널
 * 
 * 담당: 설유철 책임(압출동), 윤경수 책임 · 양인나 선임(가공동), 오상민 선임(한림)
 * 1. 담당 공정 아이템별 생산오더(목표) ↔ 실시간 실적(양품/불량) 달성률 관리
 * 2. 아이템 뱃지 클릭 시 해당 아이템 전용 비가동 및 작업일보 즉시 필터링
 * 3. 당일 비가동/부적합 발생 건 [🟢 사내관리] vs [🚨 4M 변동점 품질이관] 원클릭 1차 소팅
 * 4. [🚨 품질이관] 시 3단계 품질관리자(이창엽 책임) 접수함으로 실시간 이관
 */
export default function Step2ProductionManagerPanel({
  currentProfile,
  onOpenIssueModal,
  onNavigateTab
}) {
  const [activeProcessTab, setActiveProcessTab] = useState("auto"); // "auto" | "machining" | "extrusion"
  const [selectedItemBadge, setSelectedItemBadge] = useState("ALL"); // "ALL" | "HR" | "JA" | "NX5A" | "1호기" ...
  const [selectedIncidentBadge, setSelectedIncidentBadge] = useState("ALL"); // "ALL" | "UNSORTED" | "INTERNAL" | "QUALITY"
  const [previewImg, setPreviewImg] = useState(null);

  // Order edit modal
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [orderModalKey, setOrderModalKey] = useState("");
  const [orderModalInput, setOrderModalInput] = useState("");
  const [orderModalDivision, setOrderModalDivision] = useState("machining");
  const [toastMessage, setToastMessage] = useState("");

  // Raw data subscriptions
  const [machiningReports, setMachiningReports] = useState([]);
  const [extrusionReports, setExtrusionReports] = useState([]);
  const [productionOrders, setProductionOrders] = useState(getLocalProductionOrders());
  const [ledgerState, setLedgerState] = useState(getLocalWorkReportNcLedger());

  const managerName = currentProfile?.name || "공정관리자";
  const managerProcess = currentProfile?.assignedProcess || "";
  const managerPlant = currentProfile?.plant || "삼랑진공장";

  // Determine effective process for this manager
  const isExtrusionManager = Boolean(
    managerName === "설유철" ||
    currentProfile?.id === "sam_yc" ||
    managerProcess.includes("압출")
  );

  const isMachiningManager = Boolean(
    managerName === "윤경수" ||
    currentProfile?.id === "sam_ks" ||
    managerName === "양인나" ||
    currentProfile?.id === "sam_in" ||
    managerName === "유동길" ||
    managerProcess.includes("가공")
  );

  const isAdminOrExecutive = Boolean(
    currentProfile?.role === "ADMIN" ||
    currentProfile?.title === "대표이사" ||
    currentProfile?.title === "이사" ||
    currentProfile?.title === "전무" ||
    managerName === "권태형" ||
    managerName === "최미영" ||
    managerName === "이명재" ||
    managerName === "김동욱" ||
    managerName === "이창엽"
  );

  const effectiveProcess = useMemo(() => {
    if (activeProcessTab !== "auto") return activeProcessTab;
    if (isExtrusionManager) return "extrusion";
    return "machining";
  }, [activeProcessTab, isExtrusionManager]);

  // Subscriptions
  useEffect(() => {
    const unsubMachining = subscribeMachiningWorkReports((reps) => {
      setMachiningReports(reps || []);
    });
    const unsubExtrusion = subscribeToExtrusionReports((reps) => {
      setExtrusionReports(reps || []);
    });
    const unsubOrders = subscribeProductionOrders("", (orders) => {
      setProductionOrders(orders || getLocalProductionOrders());
    });

    const handleLedgerUpdate = (e) => {
      if (e.detail) setLedgerState(e.detail);
    };
    window.addEventListener("work_report_nc_ledger_updated", handleLedgerUpdate);

    return () => {
      if (unsubMachining) unsubMachining();
      if (unsubExtrusion) unsubExtrusion();
      if (unsubOrders) unsubOrders();
      window.removeEventListener("work_report_nc_ledger_updated", handleLedgerUpdate);
    };
  }, []);

  // Today string
  const todayStr = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  }, []);

  // 1. Machining calculations (HR, JA, NX5a)
  const machiningStats = useMemo(() => {
    let hrGross = 0, hrGen = 0, hrBad = 0;
    let jaGross = 0, jaGen = 0, jaBad = 0;
    let nx5Gross = 0, nx5Gen = 0, nx5Bad = 0;

    machiningReports.forEach((r) => {
      if (r.date && r.date !== todayStr) return;
      const g = Number(r.totals?.genuine ?? r.genuineQty ?? 0) || 0;
      const b = Number(r.totals?.bad ?? r.badQty ?? 0) || 0;
      const total = Number(r.totals?.total ?? r.totalQty ?? (g + b)) || (g + b);
      const p = String(r.project || "").toUpperCase();

      if (p.includes("HR") || p.includes("포터")) {
        hrGross += total; hrGen += g; hrBad += b;
      } else if (p.includes("JA") || p.includes("모닝") || p.includes("레이")) {
        jaGross += total; jaGen += g; jaBad += b;
      } else if (p.includes("NX5") || p.includes("NX4") || p.includes("투싼")) {
        nx5Gross += total; nx5Gen += g; nx5Bad += b;
      }
    });

    const machOrders = productionOrders?.machining || { HR: 800, JA: 1200, NX5A: 1500 };
    const hrOrder = Number(machOrders.HR) || 800;
    const jaOrder = Number(machOrders.JA) || 1200;
    const nx5Order = Number(machOrders.NX5A) || 1500;

    const hrAttainment = hrOrder > 0 ? ((hrGen / hrOrder) * 100).toFixed(1) : "100.0";
    const jaAttainment = jaOrder > 0 ? ((jaGen / jaOrder) * 100).toFixed(1) : "100.0";
    const nx5Attainment = nx5Order > 0 ? ((nx5Gen / nx5Order) * 100).toFixed(1) : "100.0";

    return {
      HR: { order: hrOrder, gen: hrGen, bad: hrBad, gross: hrGross, attainment: hrAttainment },
      JA: { order: jaOrder, gen: jaGen, bad: jaBad, gross: jaGross, attainment: jaAttainment },
      NX5A: { order: nx5Order, gen: nx5Gen, bad: nx5Bad, gross: nx5Gross, attainment: nx5Attainment },
      totalGen: hrGen + jaGen + nx5Gen,
      totalOrder: hrOrder + jaOrder + nx5Order
    };
  }, [machiningReports, todayStr, productionOrders]);

  // 2. Extrusion calculations (1호기, 2호기, 3호기, 4호기)
  const extrusionStats = useMemo(() => {
    const lines = {
      "1호기": { outputM: 0, scrapKg: 0, order: 2500 },
      "2호기": { outputM: 0, scrapKg: 0, order: 3000 },
      "3호기": { outputM: 0, scrapKg: 0, order: 2000 },
      "4호기": { outputM: 0, scrapKg: 0, order: 1800 }
    };

    const extOrders = productionOrders?.extrusion || { pcm1: 2500, pcm3: 3000, pvc: 2000, tpe: 1800 };
    lines["1호기"].order = Number(extOrders.pcm1 || extOrders["1호기"]) || 2500;
    lines["2호기"].order = Number(extOrders.pcm3 || extOrders["2호기"]) || 3000;
    lines["3호기"].order = Number(extOrders.pvc || extOrders["3호기"]) || 2000;
    lines["4호기"].order = Number(extOrders.tpe || extOrders["4호기"]) || 1800;

    extrusionReports.forEach((r) => {
      if (r.date && r.date !== todayStr) return;
      const lineName = String(r.line || r.extrusionLine || "1호기");
      const matchedKey = Object.keys(lines).find((k) => lineName.includes(k) || (k === "1호기" && lineName.includes("PCM1")) || (k === "2호기" && lineName.includes("PCM3")) || (k === "3호기" && lineName.includes("PVC")) || (k === "4호기" && lineName.includes("TPE"))) || "1호기";
      const m = Number(r.totals?.outputM || r.totalProductionMeter || r.outputM || 0) || 0;
      const s = Number(r.totals?.scrapKg || r.totalScrapKg || r.scrapKg || 0) || 0;
      lines[matchedKey].outputM += m;
      lines[matchedKey].scrapKg += s;
    });

    Object.keys(lines).forEach((k) => {
      const item = lines[k];
      item.attainment = item.order > 0 ? ((item.outputM / item.order) * 100).toFixed(1) : "100.0";
    });

    return lines;
  }, [extrusionReports, todayStr, productionOrders]);

  // 3. Extract all nonconformance incidents for Step 2
  const allIncidents = useMemo(() => {
    return extractWorkReportNonconformances({
      extrusionReports,
      machiningReports,
      ledgerState
    });
  }, [extrusionReports, machiningReports, ledgerState]);

  // Filter incidents for current process & selected item badge
  const filteredIncidents = useMemo(() => {
    return allIncidents.filter((inc) => {
      // Process filter
      if (effectiveProcess === "machining") {
        const isMach = String(inc.company || "").includes("오륙") || String(inc.line || "").includes("가공") || String(inc.line || "").includes("JA") || String(inc.line || "").includes("HR") || String(inc.line || "").includes("NX5") || String(inc.carModel || "").includes("JA") || String(inc.carModel || "").includes("HR") || String(inc.carModel || "").includes("NX5");
        if (!isMach && !inc.id.includes("mach")) return false;

        // Item filter
        if (selectedItemBadge !== "ALL") {
          const itemKey = selectedItemBadge.toUpperCase();
          const targetStr = `${inc.line} ${inc.carModel} ${inc.defectType} ${inc.content}`.toUpperCase();
          if (itemKey === "HR" && !targetStr.includes("HR") && !targetStr.includes("포터")) return false;
          if (itemKey === "JA" && !targetStr.includes("JA") && !targetStr.includes("모닝") && !targetStr.includes("레이")) return false;
          if (itemKey === "NX5A" && !targetStr.includes("NX5") && !targetStr.includes("NX4") && !targetStr.includes("투싼")) return false;
        }
      } else if (effectiveProcess === "extrusion") {
        const isExt = String(inc.company || "").includes("압출") || String(inc.line || "").includes("호기") || String(inc.line || "").includes("PCM") || String(inc.line || "").includes("TPE") || String(inc.line || "").includes("PVC") || inc.id.includes("ext");
        if (!isExt) return false;

        // Line filter
        if (selectedItemBadge !== "ALL") {
          const targetStr = `${inc.line} ${inc.content}`.toUpperCase();
          if (!targetStr.includes(selectedItemBadge)) return false;
        }
      }

      // Incident sorting badge filter
      if (selectedIncidentBadge === "UNSORTED" && inc.registrationType && inc.registrationType !== "UNREGISTERED") return false;
      if (selectedIncidentBadge === "INTERNAL" && inc.registrationType !== "INTERNAL") return false;
      if (selectedIncidentBadge === "QUALITY" && inc.registrationType !== "CHANGE_POINT") return false;

      return true;
    });
  }, [allIncidents, effectiveProcess, selectedItemBadge, selectedIncidentBadge]);

  // Incident counts
  const incidentCounts = useMemo(() => {
    const list = allIncidents.filter((inc) => {
      if (effectiveProcess === "machining") {
        return String(inc.company || "").includes("오륙") || String(inc.line || "").includes("가공") || String(inc.line || "").includes("JA") || String(inc.line || "").includes("HR") || String(inc.line || "").includes("NX5") || inc.id.includes("mach");
      }
      return String(inc.company || "").includes("압출") || String(inc.line || "").includes("호기") || inc.id.includes("ext");
    });
    return {
      total: list.length,
      unsorted: list.filter((i) => !i.registrationType || i.registrationType === "UNREGISTERED").length,
      internal: list.filter((i) => i.registrationType === "INTERNAL").length,
      quality: list.filter((i) => i.registrationType === "CHANGE_POINT").length
    };
  }, [allIncidents, effectiveProcess]);

  // Handler: 1st Sorting action
  const handleSortIncident = async (item, targetType) => {
    const nextOverrides = {
      ...(ledgerState.overrides || {}),
      [item.id]: {
        ...(ledgerState.overrides?.[item.id] || {}),
        registrationType: targetType,
        registeredBy: managerName,
        registeredAt: new Date().toISOString()
      }
    };
    const nextState = { ...ledgerState, overrides: nextOverrides };
    setLedgerState(nextState);
    await saveWorkReportNcLedger(nextState);

    if (targetType === "CHANGE_POINT") {
      const fourMItem = {
        id: item.id,
        title: `[2단계 ${item.line}] ${item.defectType || item.content}`,
        origin: "작업일보 부적합",
        fourM: determineFourMCategory(item.defectType || item.content),
        content: item.content || item.defectType,
        actionResult: item.actionResult || "2단계 공정관리자 1차 이관 완료",
        date: item.date,
        time: item.time,
        plant: item.plant || managerPlant,
        images: item.beforePhoto ? [item.beforePhoto] : [],
        actionImages: item.afterPhoto ? [item.afterPhoto] : [],
        writer: item.worker || managerName,
        scrapKg: item.scrapKg || 0,
        minutes: item.downtimeMinutes || 0
      };
      await registerToFourMLedger(fourMItem, managerName);
      setToastMessage(`🚨 [${item.line}] 항목이 3단계 품질관리자(이창엽 책임) 접수함으로 이관되었습니다.`);
    } else if (targetType === "INTERNAL") {
      await unregisterFromFourMLedger(item.id);
      await unregisterFromFourMLedger(`ledger_${item.id}`);
      setToastMessage(`🟢 [${item.line}] 항목이 [사내관리 종결]로 소팅 완료되었습니다.`);
    } else {
      await unregisterFromFourMLedger(item.id);
      setToastMessage(`↩️ [${item.line}] 항목이 [미소팅 상태]로 재설정되었습니다.`);
    }
    setTimeout(() => setToastMessage(""), 4000);
  };

  // Open order edit modal
  const handleOpenOrderEdit = (key, currentVal, div = "machining") => {
    setOrderModalDivision(div);
    setOrderModalKey(key);
    setOrderModalInput(String(currentVal || 0));
    setIsOrderModalOpen(true);
  };

  // Save order modal
  const handleSaveOrder = async () => {
    const qty = parseInt(orderModalInput, 10);
    if (isNaN(qty) || qty < 0) {
      alert("유효한 수량을 입력해주세요.");
      return;
    }
    await saveProductionOrder(orderModalDivision, orderModalKey, qty, managerName);
    setProductionOrders((prev) => ({
      ...prev,
      [orderModalDivision]: {
        ...(prev[orderModalDivision] || {}),
        [orderModalKey]: qty
      }
    }));
    setIsOrderModalOpen(false);
    setToastMessage(`✅ [${orderModalKey}] 당일 생산오더가 [${qty.toLocaleString()} ${orderModalDivision === "extrusion" ? "M" : "EA"}]로 설정되었습니다. 1단계 작업일보에 실시간 반영됩니다.`);
    setTimeout(() => setToastMessage(""), 4000);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-indigo-200 dark:border-indigo-900/60 shadow-xl overflow-hidden p-3.5 sm:p-5 space-y-4 text-left animate-fadeIn">
      {/* Toast Banner */}
      {toastMessage && (
        <div className="p-3 rounded-2xl bg-slate-900 text-white font-black text-xs sm:text-sm shadow-xl border border-indigo-400 flex items-center justify-between animate-fadeIn">
          <span>{toastMessage}</span>
          <button type="button" onClick={() => setToastMessage("")} className="cursor-pointer text-slate-400 hover:text-white ml-2">✕</button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. Header Banner & Process Switcher */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-4 rounded-2xl border border-indigo-500/40 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-indigo-800 flex items-center justify-center text-white text-2xl font-black shadow-md shrink-0">
            🏭
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500 text-white text-[10px] font-black tracking-wide shadow-xs border border-indigo-400/40">
                2단계: 생산·공정관리자
              </span>
              <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                {effectiveProcess === "machining" ? "삼랑진 가공동 생산오더 & 비가동 1차 소팅 센터" : "삼랑진 압출동 압출오더 & 비가동 1차 소팅 센터"}
              </h2>
            </div>
            <p className="text-xs text-indigo-200/90 mt-0.5">
              관리자: <strong className="text-white font-black">{managerName} {currentProfile?.title || "책임"}</strong> • {effectiveProcess === "machining" ? "가공 3대 아이템(HR · JA · NX5a)" : "압출 1~4호기 라인"} 오더/실적 달성률 관리 및 당일 비가동/부적합 1차 소팅
            </p>
          </div>
        </div>

        {/* Admin Process Switcher (Admin / Executive only) */}
        {isAdminOrExecutive && (
          <div className="flex items-center gap-1.5 self-start sm:self-auto bg-slate-800/90 p-1 rounded-xl border border-indigo-500/30">
            <button
              type="button"
              onClick={() => { setActiveProcessTab("machining"); setSelectedItemBadge("ALL"); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                effectiveProcess === "machining"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              🚗 가공동 관리
            </button>
            <button
              type="button"
              onClick={() => { setActiveProcessTab("extrusion"); setSelectedItemBadge("ALL"); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                effectiveProcess === "extrusion"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              🏭 압출동 관리
            </button>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 🎯 SECTION 1: 생산오더 ↔ 생산실적 달성률 (인터랙티브 아이템 뱃지 & 카드) */}
      {/* ========================================================================= */}
      <div className="space-y-3">
        {/* Item Selection Badge Bar */}
        <div className="flex items-center justify-between flex-wrap gap-2 pt-1 pb-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-black text-slate-700 dark:text-slate-300 mr-1 flex items-center gap-1">
              <span>🏷️</span> <span>담당 아이템 선택:</span>
            </span>

            {/* Machining Items */}
            {effectiveProcess === "machining" ? (
              <>
                <button
                  type="button"
                  onClick={() => setSelectedItemBadge("ALL")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    selectedItemBadge === "ALL"
                      ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-md ring-2 ring-slate-400"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
                  }`}
                >
                  전체 아이템 보기
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedItemBadge(selectedItemBadge === "HR" ? "ALL" : "HR")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                    selectedItemBadge === "HR"
                      ? "bg-amber-600 text-white shadow-md ring-2 ring-amber-300 scale-105"
                      : "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 hover:bg-amber-100"
                  }`}
                >
                  <span>🚚</span> <span>HR G/RUN</span>
                  {selectedItemBadge === "HR" && <span className="bg-amber-900 text-amber-200 px-1.5 py-0.2 rounded-full text-[9px]">선택됨</span>}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedItemBadge(selectedItemBadge === "JA" ? "ALL" : "JA")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                    selectedItemBadge === "JA"
                      ? "bg-indigo-600 text-white shadow-md ring-2 ring-indigo-300 scale-105"
                      : "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 hover:bg-indigo-100"
                  }`}
                >
                  <span>🚗</span> <span>JA G/RUN</span>
                  {selectedItemBadge === "JA" && <span className="bg-indigo-900 text-indigo-200 px-1.5 py-0.2 rounded-full text-[9px]">선택됨</span>}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedItemBadge(selectedItemBadge === "NX5A" ? "ALL" : "NX5A")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                    selectedItemBadge === "NX5A"
                      ? "bg-teal-600 text-white shadow-md ring-2 ring-teal-300 scale-105"
                      : "bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-200 hover:bg-teal-100"
                  }`}
                >
                  <span>⚡</span> <span>NX5a G/RUN</span>
                  {selectedItemBadge === "NX5A" && <span className="bg-teal-900 text-teal-200 px-1.5 py-0.2 rounded-full text-[9px]">선택됨</span>}
                </button>
              </>
            ) : (
              /* Extrusion Lines */
              <>
                <button
                  type="button"
                  onClick={() => setSelectedItemBadge("ALL")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    selectedItemBadge === "ALL"
                      ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-md ring-2 ring-slate-400"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
                  }`}
                >
                  전체 라인 보기
                </button>
                {["1호기", "2호기", "3호기", "4호기"].map((lineKey) => (
                  <button
                    key={lineKey}
                    type="button"
                    onClick={() => setSelectedItemBadge(selectedItemBadge === lineKey ? "ALL" : lineKey)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                      selectedItemBadge === lineKey
                        ? "bg-indigo-600 text-white shadow-md ring-2 ring-indigo-300 scale-105"
                        : "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 hover:bg-indigo-100"
                    }`}
                  >
                    <span>🏭</span> <span>{lineKey}</span>
                    {selectedItemBadge === lineKey && <span className="bg-indigo-900 text-indigo-200 px-1.5 py-0.2 rounded-full text-[9px]">선택됨</span>}
                  </button>
                ))}
              </>
            )}
          </div>

          {selectedItemBadge !== "ALL" && (
            <button
              type="button"
              onClick={() => setSelectedItemBadge("ALL")}
              className="text-xs text-rose-600 dark:text-rose-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>✕ 필터 해제 (전체 보기)</span>
            </button>
          )}
        </div>

        {/* Machining 3 Item Cards */}
        {effectiveProcess === "machining" ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* HR */}
            <div
              onClick={() => setSelectedItemBadge(selectedItemBadge === "HR" ? "ALL" : "HR")}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer space-y-2 ${
                selectedItemBadge === "HR"
                  ? "bg-amber-100/90 dark:bg-amber-950/80 border-amber-500 ring-4 ring-amber-400 shadow-xl scale-[1.02]"
                  : "bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 border-amber-200/80 dark:border-amber-900/40 hover:shadow-md hover:border-amber-400"
              }`}
              title="클릭 시 HR 전용 비가동 및 작업일보가 필터링됩니다"
            >
              <div className="flex items-center justify-between">
                <span className="font-black text-xs text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                  <span>🚚</span>
                  <span>HR G/RUN (포터)</span>
                  {selectedItemBadge === "HR" && (
                    <span className="px-1.5 py-0.5 rounded-full bg-amber-600 text-white text-[9px] font-black">
                      선택됨
                    </span>
                  )}
                </span>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded border ${Number(machiningStats.HR.attainment) >= 100 ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-400" : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-400"}`}>
                  달성률 {machiningStats.HR.attainment}%
                </span>
              </div>
              <div className="flex items-baseline justify-between text-xs pt-0.5">
                <div className="space-y-0.5">
                  <span className="text-[10.5px] text-slate-500 dark:text-slate-400 block">생산오더 (목표)</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenOrderEdit("HR", machiningStats.HR.order, "machining");
                    }}
                    className="font-mono font-bold text-amber-700 dark:text-amber-300 text-sm hover:underline cursor-pointer flex items-center gap-1 p-1 rounded hover:bg-amber-200/50"
                    title="클릭하여 HR 당일 생산오더를 수정합니다"
                  >
                    <span>{machiningStats.HR.order.toLocaleString()} EA</span>
                    <span className="text-[10px] text-slate-400">✏️</span>
                  </button>
                </div>
                <div className="text-right space-y-0.5">
                  <span className="text-[10.5px] text-slate-500 dark:text-slate-400 block">당일 실적 (양품)</span>
                  <span className="font-mono font-black text-slate-900 dark:text-white text-base">
                    {machiningStats.HR.gen.toLocaleString()} EA
                  </span>
                </div>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${Number(machiningStats.HR.attainment) >= 100 ? "bg-gradient-to-r from-blue-500 to-indigo-500" : "bg-gradient-to-r from-amber-500 to-emerald-500"}`}
                  style={{ width: `${Math.min(100, Math.max(0, Number(machiningStats.HR.attainment)))}%` }}
                ></div>
              </div>
              <div className="flex items-center justify-between text-[10.5px] text-slate-500 dark:text-slate-400 pt-0.5">
                <span>불량: {machiningStats.HR.bad.toLocaleString()} EA</span>
                <span className="font-bold text-slate-600 dark:text-slate-300">총 {machiningStats.HR.gross.toLocaleString()} EA</span>
              </div>
            </div>

            {/* JA */}
            <div
              onClick={() => setSelectedItemBadge(selectedItemBadge === "JA" ? "ALL" : "JA")}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer space-y-2 ${
                selectedItemBadge === "JA"
                  ? "bg-indigo-100/90 dark:bg-indigo-950/80 border-indigo-500 ring-4 ring-indigo-400 shadow-xl scale-[1.02]"
                  : "bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-950/20 border-indigo-200/80 dark:border-indigo-900/40 hover:shadow-md hover:border-indigo-400"
              }`}
              title="클릭 시 JA 전용 비가동 및 작업일보가 필터링됩니다"
            >
              <div className="flex items-center justify-between">
                <span className="font-black text-xs text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5">
                  <span>🚗</span>
                  <span>JA G/RUN (모닝/레이)</span>
                  {selectedItemBadge === "JA" && (
                    <span className="px-1.5 py-0.5 rounded-full bg-indigo-600 text-white text-[9px] font-black">
                      선택됨
                    </span>
                  )}
                </span>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded border ${Number(machiningStats.JA.attainment) >= 100 ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-400" : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-400"}`}>
                  달성률 {machiningStats.JA.attainment}%
                </span>
              </div>
              <div className="flex items-baseline justify-between text-xs pt-0.5">
                <div className="space-y-0.5">
                  <span className="text-[10.5px] text-slate-500 dark:text-slate-400 block">생산오더 (목표)</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenOrderEdit("JA", machiningStats.JA.order, "machining");
                    }}
                    className="font-mono font-bold text-indigo-700 dark:text-indigo-300 text-sm hover:underline cursor-pointer flex items-center gap-1 p-1 rounded hover:bg-indigo-200/50"
                    title="클릭하여 JA 당일 생산오더를 수정합니다"
                  >
                    <span>{machiningStats.JA.order.toLocaleString()} EA</span>
                    <span className="text-[10px] text-slate-400">✏️</span>
                  </button>
                </div>
                <div className="text-right space-y-0.5">
                  <span className="text-[10.5px] text-slate-500 dark:text-slate-400 block">당일 실적 (양품)</span>
                  <span className="font-mono font-black text-slate-900 dark:text-white text-base">
                    {machiningStats.JA.gen.toLocaleString()} EA
                  </span>
                </div>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${Number(machiningStats.JA.attainment) >= 100 ? "bg-gradient-to-r from-blue-500 to-indigo-500" : "bg-gradient-to-r from-indigo-500 to-emerald-500"}`}
                  style={{ width: `${Math.min(100, Math.max(0, Number(machiningStats.JA.attainment)))}%` }}
                ></div>
              </div>
              <div className="flex items-center justify-between text-[10.5px] text-slate-500 dark:text-slate-400 pt-0.5">
                <span>불량: {machiningStats.JA.bad.toLocaleString()} EA</span>
                <span className="font-bold text-slate-600 dark:text-slate-300">총 {machiningStats.JA.gross.toLocaleString()} EA</span>
              </div>
            </div>

            {/* NX5a */}
            <div
              onClick={() => setSelectedItemBadge(selectedItemBadge === "NX5A" ? "ALL" : "NX5A")}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer space-y-2 ${
                selectedItemBadge === "NX5A"
                  ? "bg-teal-100/90 dark:bg-teal-950/80 border-teal-500 ring-4 ring-teal-400 shadow-xl scale-[1.02]"
                  : "bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-950/30 dark:to-emerald-950/20 border-teal-200/80 dark:border-teal-900/40 hover:shadow-md hover:border-teal-400"
              }`}
              title="클릭 시 NX5a 전용 비가동 및 작업일보가 필터링됩니다"
            >
              <div className="flex items-center justify-between">
                <span className="font-black text-xs text-teal-700 dark:text-teal-300 flex items-center gap-1.5">
                  <span>⚡</span>
                  <span>NX5a G/RUN (투싼 PE)</span>
                  {selectedItemBadge === "NX5A" && (
                    <span className="px-1.5 py-0.5 rounded-full bg-teal-600 text-white text-[9px] font-black">
                      선택됨
                    </span>
                  )}
                </span>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded border ${Number(machiningStats.NX5A.attainment) >= 95 ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-400" : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-400"}`}>
                  달성률 {machiningStats.NX5A.attainment}%
                </span>
              </div>
              <div className="flex items-baseline justify-between text-xs pt-0.5">
                <div className="space-y-0.5">
                  <span className="text-[10.5px] text-slate-500 dark:text-slate-400 block">생산오더 (목표)</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenOrderEdit("NX5A", machiningStats.NX5A.order, "machining");
                    }}
                    className="font-mono font-bold text-teal-700 dark:text-teal-300 text-sm hover:underline cursor-pointer flex items-center gap-1 p-1 rounded hover:bg-teal-200/50"
                    title="클릭하여 NX5a 당일 생산오더를 수정합니다"
                  >
                    <span>{machiningStats.NX5A.order.toLocaleString()} EA</span>
                    <span className="text-[10px] text-slate-400">✏️</span>
                  </button>
                </div>
                <div className="text-right space-y-0.5">
                  <span className="text-[10.5px] text-slate-500 dark:text-slate-400 block">당일 실적 (양품)</span>
                  <span className="font-mono font-black text-slate-900 dark:text-white text-base">
                    {machiningStats.NX5A.gen.toLocaleString()} EA
                  </span>
                </div>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${Number(machiningStats.NX5A.attainment) >= 95 ? "bg-gradient-to-r from-teal-500 to-emerald-500" : "bg-gradient-to-r from-amber-500 to-rose-500"}`}
                  style={{ width: `${Math.min(100, Math.max(0, Number(machiningStats.NX5A.attainment)))}%` }}
                ></div>
              </div>
              <div className="flex items-center justify-between text-[10.5px] text-slate-500 dark:text-slate-400 pt-0.5">
                <span>불량: {machiningStats.NX5A.bad.toLocaleString()} EA</span>
                <span className="font-bold text-slate-600 dark:text-slate-300">총 {machiningStats.NX5A.gross.toLocaleString()} EA</span>
              </div>
            </div>
          </div>
        ) : (
          /* Extrusion 4 Lines Cards */
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {Object.keys(extrusionStats).map((lineKey) => {
              const lineData = extrusionStats[lineKey];
              const isSelected = selectedItemBadge === lineKey;
              return (
                <div
                  key={lineKey}
                  onClick={() => setSelectedItemBadge(isSelected ? "ALL" : lineKey)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer space-y-1.5 ${
                    isSelected
                      ? "bg-indigo-100/90 dark:bg-indigo-950/80 border-indigo-500 ring-4 ring-indigo-400 shadow-xl scale-[1.02]"
                      : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:shadow-md hover:border-indigo-400"
                  }`}
                  title={`클릭 시 ${lineKey} 전용 비가동 및 작업일보가 필터링됩니다`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-black text-xs text-indigo-700 dark:text-indigo-300 flex items-center gap-1">
                      <span>🏭</span> <span>{lineKey}</span>
                      {isSelected && <span className="px-1.5 py-0.2 rounded-full bg-indigo-600 text-white text-[9px] font-black">선택</span>}
                    </span>
                    <span className="text-[10.5px] font-bold text-indigo-600 dark:text-indigo-400">
                      {lineData.attainment}%
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block">오더 (m)</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenOrderEdit(lineKey === "1호기" ? "pcm1" : lineKey === "2호기" ? "pcm3" : lineKey === "3호기" ? "pvc" : "tpe", lineData.order, "extrusion");
                        }}
                        className="font-mono font-bold text-indigo-700 dark:text-indigo-300 hover:underline cursor-pointer flex items-center gap-0.5"
                      >
                        <span>{lineData.order.toLocaleString()}</span>
                        <span className="text-[9px] text-slate-400">✏️</span>
                      </button>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block">실적 (m)</span>
                      <span className="font-mono font-black text-slate-900 dark:text-white">
                        {lineData.outputM.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(0, Number(lineData.attainment)))}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* ⏱️ SECTION 2: 당일 비가동 · 부적합 1차 소팅 바 */}
      {/* ========================================================================= */}
      <div className="p-3 sm:p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border-2 border-amber-300 dark:border-amber-700/60 space-y-2.5">
        <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-black text-amber-900 dark:text-amber-300 flex items-center gap-1.5 text-xs sm:text-sm">
              <span>⏱️</span> <span>당일 {effectiveProcess === "machining" ? "가공동" : "압출동"} 비가동 · 부적합 1차 소팅</span>
            </span>

            {/* Sorting Filter Buttons */}
            <button
              type="button"
              onClick={() => setSelectedIncidentBadge("ALL")}
              className={`px-2 py-0.5 rounded-full text-[10.5px] font-bold transition-all cursor-pointer ${
                selectedIncidentBadge === "ALL"
                  ? "bg-slate-800 text-white shadow-xs"
                  : "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300"
              }`}
            >
              전체 {incidentCounts.total}건
            </button>

            <button
              type="button"
              onClick={() => setSelectedIncidentBadge(selectedIncidentBadge === "UNSORTED" ? "ALL" : "UNSORTED")}
              className={`px-2 py-0.5 rounded-full text-[10.5px] font-black transition-all cursor-pointer ${
                selectedIncidentBadge === "UNSORTED"
                  ? "bg-amber-500 text-black ring-2 ring-amber-300 shadow-xs"
                  : incidentCounts.unsorted > 0
                  ? "bg-amber-500 text-black animate-pulse"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              ⏳ 미소팅 {incidentCounts.unsorted}건
            </button>

            <button
              type="button"
              onClick={() => setSelectedIncidentBadge(selectedIncidentBadge === "INTERNAL" ? "ALL" : "INTERNAL")}
              className={`px-2 py-0.5 rounded-full text-[10.5px] font-bold transition-all cursor-pointer ${
                selectedIncidentBadge === "INTERNAL"
                  ? "bg-emerald-600 text-white ring-2 ring-emerald-300 shadow-xs"
                  : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 hover:bg-emerald-200"
              }`}
            >
              🟢 사내종결 {incidentCounts.internal}건
            </button>

            <button
              type="button"
              onClick={() => setSelectedIncidentBadge(selectedIncidentBadge === "QUALITY" ? "ALL" : "QUALITY")}
              className={`px-2 py-0.5 rounded-full text-[10.5px] font-bold transition-all cursor-pointer ${
                selectedIncidentBadge === "QUALITY"
                  ? "bg-rose-600 text-white ring-2 ring-rose-300 shadow-xs"
                  : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 hover:bg-rose-200"
              }`}
            >
              🚨 품질이관 {incidentCounts.quality}건
            </button>
          </div>

          <span className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:inline">
            ※ 관리자 검토 후 원클릭 소팅 ➡️ <strong>[품질이관]</strong> 클릭 시 3단계 품질관리자 대장 자동 이관
          </span>
        </div>

        {/* Incident Items List */}
        {filteredIncidents.length === 0 ? (
          <div className="p-4 bg-white/70 dark:bg-slate-900/50 rounded-xl text-center text-xs text-slate-500 dark:text-slate-400">
            🟢 {selectedItemBadge !== "ALL" ? `[${selectedItemBadge}] 아이템에 ` : ""}현재 조건에 해당하는 비가동 및 부적합 내역이 없습니다. (정상 가동 중)
          </div>
        ) : (
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {filteredIncidents.map((inc) => {
              const isUnsorted = !inc.registrationType || inc.registrationType === "UNREGISTERED";
              const isInternal = inc.registrationType === "INTERNAL";
              const isQuality = inc.registrationType === "CHANGE_POINT";

              return (
                <div
                  key={inc.id}
                  className={`p-2.5 rounded-xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition ${
                    isUnsorted
                      ? "bg-amber-100/70 dark:bg-amber-950/40 border-amber-400 dark:border-amber-600 shadow-xs"
                      : isQuality
                      ? "bg-rose-50/70 dark:bg-rose-950/20 border-rose-300 dark:border-rose-900/60"
                      : "bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-900/60"
                  }`}
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {isUnsorted && (
                        <span className="px-1.5 py-0.5 rounded bg-amber-500 text-black font-black text-[10px]">
                          미소팅
                        </span>
                      )}
                      {isQuality && (
                        <span className="px-1.5 py-0.5 rounded bg-rose-600 text-white font-black text-[10px]">
                          🚨 품질이관됨
                        </span>
                      )}
                      {isInternal && (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-600 text-white font-black text-[10px]">
                          🟢 사내종결
                        </span>
                      )}
                      <span className="font-mono text-slate-500 text-[11px]">{inc.date} {inc.time}</span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {inc.line} ({inc.worker || "작업자"})
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 font-bold text-[10.5px]">
                        {inc.defectType}
                      </span>
                      {inc.downtimeMinutes > 0 && (
                        <span className="text-slate-600 dark:text-slate-300 font-mono text-[11px]">{inc.downtimeMinutes}분</span>
                      )}
                      {inc.scrapKg > 0 && (
                        <span className="text-amber-700 dark:text-amber-300 font-mono text-[11px]">{inc.scrapKg} EA/kg</span>
                      )}
                      {(inc.beforePhoto || inc.afterPhoto) && (
                        <button
                          type="button"
                          onClick={() => setPreviewImg(inc.beforePhoto || inc.afterPhoto)}
                          className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 font-bold hover:underline cursor-pointer"
                        >
                          📷 사진보기
                        </button>
                      )}
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 text-[11.5px] truncate">
                      {inc.content} {inc.actionResult ? `(조치: ${inc.actionResult})` : ""}
                    </p>
                  </div>

                  {/* 1st Sorting Action Buttons */}
                  <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                    {isUnsorted ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleSortIncident(inc, "INTERNAL")}
                          className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-bold transition cursor-pointer"
                        >
                          🟢 사내관리
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSortIncident(inc, "CHANGE_POINT")}
                          className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-black text-xs shadow-xs transition flex items-center gap-1 cursor-pointer"
                        >
                          🚨 품질 변동점 이관 ➡️
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSortIncident(inc, "UNREGISTERED")}
                        className="px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 text-[10.5px] font-bold cursor-pointer"
                        title="소팅 취소 및 재설정"
                      >
                        ↩️ 재소팅
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 🌟 2단계 관리자: 생산오더 간편 수정 모달 */}
      {/* ========================================================================= */}
      {isOrderModalOpen && (
        <div className="fixed inset-0 z-[99999] bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-indigo-400 dark:border-indigo-600 shadow-2xl p-5 w-full max-w-sm space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b pb-2 dark:border-slate-800">
              <span className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>🎯</span>
                <span>[{orderModalKey}] 당일 생산오더 설정</span>
              </span>
              <button
                type="button"
                onClick={() => setIsOrderModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300">
                당일 관리자 생산오더 수량 ({orderModalDivision === "extrusion" ? "M" : "EA"})
              </label>
              <input
                type="number"
                value={orderModalInput}
                onChange={(e) => setOrderModalInput(e.target.value)}
                placeholder="수량 입력"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold text-base focus:ring-2 focus:ring-indigo-500"
                autoFocus
              />
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                💡 입력하신 오더수량은 현장 작업자의 1단계 작업일보 [🎯 목표수량]에 즉시 자동 반영됩니다.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsOrderModalOpen(false)}
                className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleSaveOrder}
                className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-md cursor-pointer"
              >
                오더 저장 적용
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {previewImg && (
        <ImagePreviewModal imageUrl={previewImg} onClose={() => setPreviewImg(null)} />
      )}
    </div>
  );
}
