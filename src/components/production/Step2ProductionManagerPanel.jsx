import React, { useState, useEffect, useMemo } from "react";
import { Factory } from "lucide-react";
import { subscribeMachiningWorkReports } from "../../services/machiningWorkReportService";
import { subscribeToExtrusionReports } from "../../services/extrusionProductionService";
import { subscribeHanulWorkReports } from "../../services/hanulWorkReportService";
import { subscribeYuseongWorkReports } from "../../services/yuseongWorkReportService";
import { subscribeWorkLogs } from "../../services/workLogService";
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
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase";
import {
  unregisterFromFourMLedger,
  getFourMRecordCompany
} from "../../services/fourMChangePointService";
import { useCapaActionModalState } from "../quality/step3/useCapaActionModalState";
import Step3CapaActionModal from "../quality/step3/Step3CapaActionModal";
import { ImagePreviewModal } from "../common/ImagePreviewModal";

import Step2OrderAttainmentSection from "./step2/Step2OrderAttainmentSection";
import Step2IncidentSortingBar from "./step2/Step2IncidentSortingBar";
import Step2ProductionOrderModal from "./step2/Step2ProductionOrderModal";

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
  const [selectedCompanyFilter, setSelectedCompanyFilter] = useState("ALL"); // "ALL" | "오륙" | "한울" | "유성" | "조영" | "부림텍"
  const [previewImg, setPreviewImg] = useState(null);

  // Order edit modal
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [orderModalKey, setOrderModalKey] = useState("");
  const [orderModalInput, setOrderModalInput] = useState("");
  const [orderModalDivision, setOrderModalDivision] = useState("machining");
  const [toastMessage, setToastMessage] = useState("");

  // Raw data subscriptions (5개사 전사 작업일보 연동)
  const [machiningReports, setMachiningReports] = useState([]);
  const [extrusionReports, setExtrusionReports] = useState([]);
  const [hanulReports, setHanulReports] = useState([]);
  const [yuseongReports, setYuseongReports] = useState([]);
  const [workLogs, setWorkLogs] = useState([]);
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

  // Subscriptions (5개사 전사 실시간 연동)
  useEffect(() => {
    const unsubMachining = subscribeMachiningWorkReports((reps) => {
      setMachiningReports(reps || []);
    });
    const unsubExtrusion = subscribeToExtrusionReports((reps) => {
      setExtrusionReports(reps || []);
    });
    const unsubHanul = subscribeHanulWorkReports((reps) => {
      setHanulReports(reps || []);
    });
    const unsubYuseong = subscribeYuseongWorkReports((reps) => {
      setYuseongReports(reps || []);
    });
    const unsubWorkLogs = subscribeWorkLogs((logs) => {
      setWorkLogs(logs || []);
    });
    const unsubOrders = subscribeProductionOrders("", (orders) => {
      setProductionOrders(orders || getLocalProductionOrders());
    });

    const handleLedgerUpdate = (e) => {
      if (e.detail) setLedgerState(e.detail);
    };
    window.addEventListener("work_report_nc_ledger_updated", handleLedgerUpdate);

    let unsubFirestoreLedger = () => {};
    if (db) {
      try {
        unsubFirestoreLedger = onSnapshot(
          doc(db, "app_settings", WORK_REPORT_NC_STORAGE_KEY),
          (snap) => {
            if (snap.exists()) {
              const data = snap.data();
              const nextState = {
                overrides: data?.overrides || {},
                manualItems: Array.isArray(data?.manualItems) ? data.manualItems : []
              };
              try {
                localStorage.setItem(WORK_REPORT_NC_STORAGE_KEY, JSON.stringify(nextState));
              } catch (err) {}
              setLedgerState(nextState);
            }
          }
        );
      } catch (err) {
        console.warn("Step 2 ledger onSnapshot error:", err);
      }
    }

    return () => {
      if (unsubMachining) unsubMachining();
      if (unsubExtrusion) unsubExtrusion();
      if (unsubHanul) unsubHanul();
      if (unsubYuseong) unsubYuseong();
      if (unsubWorkLogs) unsubWorkLogs();
      if (unsubOrders) unsubOrders();
      if (unsubFirestoreLedger) unsubFirestoreLedger();
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

  // 3. Extract all nonconformance incidents for Step 2 (5개사 전사 통합)
  const allIncidents = useMemo(() => {
    return extractWorkReportNonconformances({
      extrusionReports,
      machiningReports,
      hanulReports,
      yuseongReports,
      workLogs,
      ledgerState
    });
  }, [extrusionReports, machiningReports, hanulReports, yuseongReports, workLogs, ledgerState]);

  // Filter incidents for current company, process & selected item badge
  const filteredIncidents = useMemo(() => {
    return allIncidents.filter((inc) => {
      // 5개사 소속사 필터
      if (selectedCompanyFilter !== "ALL") {
        const comp = getFourMRecordCompany(inc);
        if (comp !== selectedCompanyFilter) return false;

        // 오륙 선택 시 세부 공정(가공 vs 압출) 필터 적용 가능
        if (selectedCompanyFilter === "오륙") {
          if (activeProcessTab === "machining") {
            const isMach = String(inc.line || "").includes("가공") || String(inc.line || "").includes("JA") || String(inc.line || "").includes("HR") || String(inc.line || "").includes("NX5") || inc.id.includes("mach");
            if (!isMach) return false;
          } else if (activeProcessTab === "extrusion") {
            const isExt = String(inc.line || "").includes("호기") || String(inc.line || "").includes("PCM") || String(inc.line || "").includes("TPE") || String(inc.line || "").includes("PVC") || inc.id.includes("ext");
            if (!isExt) return false;
          }
        }
      }

      // Item badge filter
      if (selectedItemBadge !== "ALL") {
        const targetStr = `${inc.line || ""} ${inc.carModel || ""} ${inc.defectType || ""} ${inc.content || ""}`.toUpperCase();
        if (!targetStr.includes(selectedItemBadge.toUpperCase())) return false;
      }

      // Incident sorting badge filter
      if (selectedIncidentBadge === "UNSORTED" && inc.registrationType && inc.registrationType !== "UNREGISTERED") return false;
      if (selectedIncidentBadge === "INTERNAL" && inc.registrationType !== "INTERNAL") return false;
      if (selectedIncidentBadge === "QUALITY" && inc.registrationType !== "CHANGE_POINT") return false;

      return true;
    });
  }, [allIncidents, activeProcessTab, selectedCompanyFilter, selectedItemBadge, selectedIncidentBadge]);

  // Incident counts
  const incidentCounts = useMemo(() => {
    const list = allIncidents.filter((inc) => {
      if (selectedCompanyFilter !== "ALL") {
        const comp = getFourMRecordCompany(inc);
        if (comp !== selectedCompanyFilter) return false;
        if (selectedCompanyFilter === "오륙") {
          if (activeProcessTab === "machining") {
            const isMach = String(inc.line || "").includes("가공") || String(inc.line || "").includes("JA") || String(inc.line || "").includes("HR") || String(inc.line || "").includes("NX5") || inc.id.includes("mach");
            if (!isMach) return false;
          } else if (activeProcessTab === "extrusion") {
            const isExt = String(inc.line || "").includes("호기") || String(inc.line || "").includes("PCM") || String(inc.line || "").includes("TPE") || String(inc.line || "").includes("PVC") || inc.id.includes("ext");
            if (!isExt) return false;
          }
        }
      }
      return true;
    });
    return {
      total: list.length,
      unsorted: list.filter((i) => !i.registrationType || i.registrationType === "UNREGISTERED").length,
      internal: list.filter((i) => i.registrationType === "INTERNAL").length,
      quality: list.filter((i) => i.registrationType === "CHANGE_POINT").length
    };
  }, [allIncidents, selectedCompanyFilter, activeProcessTab]);

  const capaModalState = useCapaActionModalState({
    managerName: managerName || "생산관리자",
    defaultPlant: managerPlant || "삼랑진공장",
    ledgerState,
    setLedgerState,
    onAfterSave: (item) => {
      setToastMessage(`🚨 [${item.line || "생산라인"}] 조치결과가 전체취합대장(품질 이관)으로 정상 등록되었습니다.`);
      setTimeout(() => setToastMessage(""), 4000);
    }
  });

  // Handler: 1st Sorting action
  const handleSortIncident = async (item, targetType) => {
    if (targetType === "CHANGE_POINT") {
      // ⭐ 품질변동점이관 탭 시: 이창엽의 수정&결재 팝업창과 동일한 CAPA 모달을 열어 조치결과까지 입력 후 전체취합대장으로 이관
      capaModalState.handleOpenCapaModal(item, managerName);
      return;
    }

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

    if (targetType === "INTERNAL") {
      await unregisterFromFourMLedger(item.id);
      await unregisterFromFourMLedger(`ledger_${item.id}`);
      setToastMessage(`🟢 [${item.line}] 항목이 [사내관리 종결]로 소팅 완료되었습니다.`);
    } else {
      await unregisterFromFourMLedger(item.id);
      await unregisterFromFourMLedger(`ledger_${item.id}`);
      setToastMessage(`↩️ [${item.line}] 항목이 [분류 대기 상태]로 재설정되었습니다.`);
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-3.5 sm:p-4 rounded-2xl border border-indigo-500/40 shadow-md">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500 text-white text-[10px] font-black tracking-wide shadow-xs border border-indigo-400/40">
                생산·공정관리자
              </span>
              <h2 className="text-sm sm:text-base font-black text-white tracking-tight flex items-center gap-1.5">
                <Factory className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400 shrink-0" />
                <span>{effectiveProcess === "machining" ? "삼랑진 가공동 생산오더 & 비가동 1차 소팅 센터" : "삼랑진 압출동 압출오더 & 비가동 1차 소팅 센터"}</span>
              </h2>
            </div>
            <p className="text-xs text-indigo-200/90 mt-1">
              관리자: <strong className="text-white font-black">{managerName} {currentProfile?.title || "책임"}</strong> • {effectiveProcess === "machining" ? "가공 3대 아이템(HR · JA G/RUN, NX5a PTR)" : "압출 1~4호기 라인"} 오더/실적 달성률 관리 및 당일 비가동/부적합 1차 분류
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
      <Step2OrderAttainmentSection
        effectiveProcess={effectiveProcess}
        selectedItemBadge={selectedItemBadge}
        setSelectedItemBadge={setSelectedItemBadge}
        machiningStats={machiningStats}
        extrusionStats={extrusionStats}
        onOpenOrderEdit={handleOpenOrderEdit}
      />

      {/* ========================================================================= */}
      {/* ⏱️ SECTION 2: 당일 비가동 · 부적합 1차 소팅 바 (5개사 전사 관리자 1차 분류 및 품질이관) */}
      {/* ========================================================================= */}
      <Step2IncidentSortingBar
        selectedCompanyFilter={selectedCompanyFilter}
        setSelectedCompanyFilter={setSelectedCompanyFilter}
        allIncidents={allIncidents}
        filteredIncidents={filteredIncidents}
        incidentCounts={incidentCounts}
        selectedIncidentBadge={selectedIncidentBadge}
        setSelectedIncidentBadge={setSelectedIncidentBadge}
        selectedItemBadge={selectedItemBadge}
        onPreviewImg={(src) => setPreviewImg(src)}
        onSortIncident={handleSortIncident}
      />

      {/* ========================================================================= */}
      {/* 🌟 2단계 관리자: 생산오더 간편 수정 모달 */}
      {/* ========================================================================= */}
      <Step2ProductionOrderModal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        orderModalKey={orderModalKey}
        orderModalDivision={orderModalDivision}
        orderModalInput={orderModalInput}
        setOrderModalInput={setOrderModalInput}
        onSaveOrder={handleSaveOrder}
      />

      {/* ⭐ 4M 시정조치 수정&결재 및 전체취합대장 이관 모달 (2단계 생산관리자 - 이창엽 수정&결재 팝업과 100% 동일) */}
      {capaModalState.capaModalItem && (
        <Step3CapaActionModal
          capaModalItem={capaModalState.capaModalItem}
          setCapaModalItem={capaModalState.setCapaModalItem}
          capaForm={capaModalState.capaForm}
          setCapaForm={capaModalState.setCapaForm}
          modalApproverInfo={capaModalState.modalApproverInfo}
          checkIsCeoApproved={capaModalState.checkIsCeoApproved}
          handleAddBeforePhotos={capaModalState.handleAddBeforePhotos}
          handleSetBeforePhotoSlot={capaModalState.handleSetBeforePhotoSlot}
          handleRemoveBeforePhoto={capaModalState.handleRemoveBeforePhoto}
          handleAddAfterPhotos={capaModalState.handleAddAfterPhotos}
          handleSetAfterPhotoSlot={capaModalState.handleSetAfterPhotoSlot}
          handleRemoveAfterPhoto={capaModalState.handleRemoveAfterPhoto}
          handleSaveProgress={() => capaModalState.handleSaveAndTransferToUnifiedLedger(managerName)}
          handleSubmitToElectronicApproval={() => capaModalState.handleSaveAndTransferToUnifiedLedger(managerName)}
          isSubmittingCapa={capaModalState.isSubmittingCapa}
          setPreviewImage={(src) => setPreviewImg(src)}
          modalTitle="4M 시정조치 수정&결재"
          submitButtonText="전체취합대장 이관 등록"
          saveButtonText="수정"
        />
      )}

      {/* Image Preview Modal */}
      {(previewImg || capaModalState.previewImage) && (
        <ImagePreviewModal
          previewImage={previewImg || capaModalState.previewImage}
          onClose={() => {
            setPreviewImg(null);
            capaModalState.setPreviewImage(null);
          }}
        />
      )}
    </div>
  );
}
