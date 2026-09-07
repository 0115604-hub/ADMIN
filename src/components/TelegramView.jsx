import React, { useState, useEffect, useMemo } from "react";
import {
  Send,
  Check,
  CheckCircle2,
  AlertTriangle,
  Flame,
  ShieldCheck,
  Clock,
  Bell,
  MessageSquare,
  Lock,
  Building2,
  ExternalLink,
  Users,
  Briefcase,
  CalendarDays,
  DollarSign,
  TrendingUp,
  Sparkles,
  RotateCw,
  Layers,
  FileText,
  HelpCircle,
  FileCheck,
  Palmtree,
  CheckSquare,
  Crown,
  FileSpreadsheet,
  Megaphone,
  CheckCircle,
  Edit3,
  Eye,
  Copy,
  BookmarkCheck,
  Save
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useMonth } from "../context/MonthContext";
import {
  getLocalTelegramConfig,
  saveTelegramConfig,
  subscribeTelegramConfig,
  testTelegramConnection,
  sendTelegramMessage,
  getLocalTelegramTemplates,
  saveTelegramCustomTemplate,
  subscribeTelegramCustomTemplates
} from "../services/telegramService";
import {
  getKSTDateString,
  getKSTFormattedString
} from "../utils/dateUtils";
import {
  getLocalCommonSchedules,
  subscribeCommonSchedules
} from "../services/commonScheduleService";
import { getLocalAnnualLeaves } from "../services/annualLeaveService";
import { getLocalApprovalDocs } from "../services/approvalService";
import { getLocalWorkLogs } from "../services/workLogService";
import { getLocalUrgentIssues } from "../services/urgentIssueService";

export const TelegramView = () => {
  const { isAdmin, currentProfile } = useAuth();
  const { selectedMonth, currentMonthData, allMonthlyData } = useMonth();

  // 🌟 Main 2 Tabs: "unified" (오륙통합방) | "management" (경영총괄)
  const [activeMainTab, setActiveMainTab] = useState("unified");

  // Sub-tab for 오륙통합방: "briefing" | "quality" | "notice_meeting" | "approval"
  const [unifiedMsgType, setUnifiedMsgType] = useState("briefing");
  const [qualityStage, setQualityStage] = useState("1"); // "1": 신규발령, "2": 조치완료, "3": 종결삭제
  const [noticeMeetingType, setNoticeMeetingType] = useState("notice"); // "notice" | "meeting" | "meeting_result" | "meeting_reply"
  const [approvalType, setApprovalType] = useState("draft"); // "draft" | "approve" | "reject" | "worklog"

  // Preview Mode: "edit" (직접 텍스트 편집) vs "preview" (렌더링 미리보기)
  const [unifiedViewMode, setUnifiedViewMode] = useState("edit");
  const [managementViewMode, setManagementViewMode] = useState("edit");

  // Saved Custom Templates State
  const [savedTemplates, setSavedTemplates] = useState(() => getLocalTelegramTemplates());
  const [templateSavedToast, setTemplateSavedToast] = useState(false);

  // Editable Message Texts (Direct In-Place Editing)
  const [editableUnifiedText, setEditableUnifiedText] = useState("");
  const [editableManagementText, setEditableManagementText] = useState("");

  // Telegram Config State
  const [telegramConfig, setTelegramConfig] = useState(() => getLocalTelegramConfig());
  const [testingTelegram, setTestingTelegram] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [savedConfigToast, setSavedConfigToast] = useState(false);

  // Common Schedules
  const [commonSchedules, setCommonSchedules] = useState(() => getLocalCommonSchedules());

  useEffect(() => {
    const unsub = subscribeCommonSchedules((scheds) => {
      setCommonSchedules(scheds);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = subscribeTelegramConfig((cfg) => {
      setTelegramConfig(cfg);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = subscribeTelegramCustomTemplates((templates) => {
      setSavedTemplates(templates || {});
    });
    return () => unsub();
  }, []);

  const todayDateStr = getKSTDateString();
  const dateFormatted = `${getKSTFormattedString(todayDateStr).split(" ")[0]} 07:30`;

  // Current Template Key for Unified Room
  const currentUnifiedTemplateKey = useMemo(() => {
    if (unifiedMsgType === "briefing") return "unified_briefing";
    if (unifiedMsgType === "quality") return `unified_quality_${qualityStage}`;
    if (unifiedMsgType === "notice_meeting") return `unified_${noticeMeetingType}`;
    return `unified_approval_${approvalType}`;
  }, [unifiedMsgType, qualityStage, noticeMeetingType, approvalType]);

  const currentManagementTemplateKey = "management_pnl";

  // Check if current text has a custom saved template
  const isUnifiedTemplateCustom = Boolean(savedTemplates[currentUnifiedTemplateKey]?.text);
  const isManagementTemplateCustom = Boolean(savedTemplates[currentManagementTemplateKey]?.text);

  // ----------------------------------------------------
  // 1. 오륙통합방 실시간 데이터 (Unified Room Live Data)
  // ----------------------------------------------------
  const [sendingUnified, setSendingUnified] = useState(false);
  const [unifiedToast, setUnifiedToast] = useState(false);
  const [copyToast, setCopyToast] = useState(false);

  // Live leaves
  const morningLeaves = useMemo(() => {
    const leaves = getLocalAnnualLeaves();
    return leaves.filter((l) => {
      if (!l.startDate) return false;
      const start = l.startDate;
      const end = l.endDate || l.startDate;
      return start <= todayDateStr && todayDateStr <= end;
    });
  }, [todayDateStr]);

  const morningLeaveSummary = useMemo(() => {
    if (morningLeaves.length === 0) return "없음 (전원 정상 출근)";
    return morningLeaves.map((l) => {
      const plantShort = l.plant?.includes("한림") ? "한림" : "삼랑진";
      const typeShort = l.leaveType || "연차";
      return `${l.userName} ${l.title || "선임"}(${plantShort}/${typeShort})`;
    }).join(", ");
  }, [morningLeaves]);

  // Live approvals
  const morningApprovalDocs = useMemo(() => {
    const docs = getLocalApprovalDocs();
    return docs.filter((d) => d.status === "IN_PROGRESS" || d.status === "HOLD");
  }, []);

  const morningWorkLogs = useMemo(() => {
    const logs = getLocalWorkLogs();
    return logs.filter((l) => l.approvalStatus !== "결재완료" && l.approvalStatus !== "반려");
  }, []);

  const morningApprovalSummary = useMemo(() => {
    const total = morningApprovalDocs.length + morningWorkLogs.length;
    if (total === 0) return "없음 (전건 결재완료)";
    const docTitles = morningApprovalDocs.map((d) => d.title).filter(Boolean);
    const logTitles = morningWorkLogs.map((l) => `${l.writer} 업무일지`).filter(Boolean);
    const previewList = [...docTitles, ...logTitles].slice(0, 3);
    const moreText = total > 3 ? ` 외 ${total - 3}건` : "";
    return `총 ${total}건 (${previewList.join(", ")}${moreText})`;
  }, [morningApprovalDocs, morningWorkLogs]);

  // Live active urgent issues (삭제 및 조치완료 항목 제외)
  const morningUrgentIssues = useMemo(() => {
    return getLocalUrgentIssues().filter((i) => !i.isDeleted && !i.isResolved);
  }, []);

  const morningUrgentSummary = useMemo(() => {
    if (morningUrgentIssues.length === 0) return "없음 (전건 종결완료)";
    const issueTitles = morningUrgentIssues.map((i) => i.title || i.content).filter(Boolean);
    const previewList = issueTitles.slice(0, 2);
    const moreText = morningUrgentIssues.length > 2 ? ` 외 ${morningUrgentIssues.length - 2}건` : "";
    return `미조치 ${morningUrgentIssues.length}건 (${previewList.join(", ")}${moreText})`;
  }, [morningUrgentIssues]);

  // Unified Default Message Generator
  const generateDefaultUnifiedText = () => {
    const nowTime = new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });

    if (unifiedMsgType === "briefing") {
      return `<b>⬛ [오륙 생산관리] 일일 모닝 브리핑</b>\n<b>${dateFormatted} 기준</b>\n━━━━━━━━━━━━━━━━━━━━━\n<b>[1] 근태 / 휴가 현황</b>\n• ${morningLeaveSummary}\n\n<b>[2] 미결재 현황</b>\n• ${morningApprovalSummary}\n\n<b>[3] 품질경보 / 공지 현황</b>\n• ${morningUrgentSummary}\n━━━━━━━━━━━━━━━━━━━━━\n<a href="https://profit-and-loss-7d09b.web.app">생산관리시스템 바로가기</a>`;
    }

    if (unifiedMsgType === "quality") {
      if (qualityStage === "1") {
        return `<b>🟥 [품질경보] 긴급 확인 및 점검 요망</b>\n━━━━━━━━━━━━━━━━━━━━━\n• <b>공장:</b> 삼랑진공장\n• <b>작성자:</b> <b>${currentProfile?.name || "이명재 이사"}</b>\n• <b>불량제목:</b> <b>[긴급] 소폭 원단 표면 이물 혼입 및 폭 치수 편차 발생</b>\n\n<b>[전달 내용]</b>\n압출 2라인 생산 중 폭 편차(±3mm 초과) 및 미세 흑점 이물 발견되어 즉시 점검 요망\n\n• <b>발령일시:</b> ${todayDateStr} ${nowTime}\n━━━━━━━━━━━━━━━━━━━━━\n※ 조치 완료 후 시스템에서 [조치결과]를 등록해 주세요.\n<a href="https://profit-and-loss-7d09b.web.app">생산관리시스템 바로가기</a>`;
      }
      if (qualityStage === "2") {
        return `<b>🟥 [품질경보 조치완료 보고]</b>\n━━━━━━━━━━━━━━━━━━━━━\n• <b>공장:</b> 삼랑진공장\n• <b>대상:</b> <b>소폭 원단 표면 이물 혼입 및 폭 치수 편차</b>\n• <b>조치자:</b> <b>${currentProfile?.name || "이명재 이사"}</b>\n\n<b>[조치 내용]</b>\n압출 2라인 다이스 클리닝 및 스크류 필터 80mesh 교체 완료, 치수 정상 범위 복구됨 (조치율 100%)\n\n• <b>완료일시:</b> ${todayDateStr} ${nowTime}\n━━━━━━━━━━━━━━━━━━━━━\n<a href="https://profit-and-loss-7d09b.web.app">생산관리시스템 바로가기</a>`;
      }
      return `<b>🟥 [품질경보 종결/삭제 알림]</b>\n━━━━━━━━━━━━━━━━━━━━━\n• <b>공장:</b> 삼랑진공장\n• <b>대상:</b> <b>소폭 원단 표면 이물 혼입 및 폭 치수 편차</b>\n• <b>삭제권한자:</b> <b>${currentProfile?.name || "이명재 이사"}</b>\n• <b>종결사유:</b> 현장 정상화 확인 및 최종 검사 통과로 종결 처리\n• <b>삭제일시:</b> ${todayDateStr} ${nowTime}\n━━━━━━━━━━━━━━━━━━━━━\n<a href="https://profit-and-loss-7d09b.web.app">생산관리시스템 바로가기</a>`;
    }

    if (unifiedMsgType === "notice_meeting") {
      if (noticeMeetingType === "notice") {
        return `<b>🟩 [사내 공지사항] 업무 협조 안내</b>\n━━━━━━━━━━━━━━━━━━━━━\n• <b>대상:</b> 삼랑진 / 한림 전 공장\n• <b>공지자:</b> <b>${currentProfile?.name || "이명재 이사"}</b>\n• <b>공지제목:</b> <b>현장 안전보호구 착용 및 정리정돈 협조 요청</b>\n\n<b>[공지 내용]</b>\n공장 내 안전화/보안경 착용 철저 및 작업 후 라인 청소 철저 협조 부탁드립니다.\n\n• <b>등록일시:</b> ${todayDateStr} ${nowTime}\n━━━━━━━━━━━━━━━━━━━━━\n<a href="https://profit-and-loss-7d09b.web.app">생산관리시스템 바로가기</a>`;
      }
      if (noticeMeetingType === "meeting") {
        return `<b>🟪 [사내 회의일정] 회의 및 일정 안내</b>\n━━━━━━━━━━━━━━━━━━━━━\n• <b>대상:</b> 삼랑진공장\n• <b>등록자:</b> <b>김동욱 부장</b>\n• <b>회의제목:</b> <b>2026년 9월 생산품질 향상 대책회의</b>\n\n<b>[회의 일정/안건]</b>\n일시: 오늘 14:00 (대회의실)\n안건: 생산 라인별 수율 개선 및 9월 납품계획 논의\n\n• <b>등록일시:</b> ${todayDateStr} ${nowTime}\n━━━━━━━━━━━━━━━━━━━━━\n※ 관련 작업자분들은 시스템에서 [회신]을 등록해 주세요.\n<a href="https://profit-and-loss-7d09b.web.app">생산관리시스템 바로가기</a>`;
      }
      if (noticeMeetingType === "meeting_result") {
        return `<b>🟪 [사내 회의결과 보고]</b>\n━━━━━━━━━━━━━━━━━━━━━\n• <b>대상:</b> 삼랑진공장\n• <b>회의제목:</b> <b>2026년 9월 생산품질 향상 대책회의</b>\n• <b>기록/작성자:</b> <b>김동욱 부장</b>\n\n<b>[회의 결과 및 결정사항]</b>\n1. 압출 라인 필터 교체 주기 2주 단축\n2. 불량 발생 시 즉시 생산 중단 및 알림 발령\n\n• <b>완료일시:</b> ${todayDateStr} ${nowTime}\n━━━━━━━━━━━━━━━━━━━━━\n<a href="https://profit-and-loss-7d09b.web.app">생산관리시스템 바로가기</a>`;
      }
      return `<b>🟪 [회의일정 회신 등록]</b>\n━━━━━━━━━━━━━━━━━━━━━\n• <b>회의:</b> <b>2026년 9월 생산품질 향상 대책회의</b> (삼랑진공장)\n• <b>회신자:</b> <b>${currentProfile?.name || "이명재"} [참석]</b>\n• <b>회신내용:</b> 회의 참석 및 품질 분석 자료 준비 완료\n• <b>회신일시:</b> ${todayDateStr} ${nowTime}\n━━━━━━━━━━━━━━━━━━━━━\n<a href="https://profit-and-loss-7d09b.web.app">생산관리시스템 바로가기</a>`;
    }

    // Approval / WorkLog
    if (approvalType === "draft") {
      return `<b>🟦 [전자결재 기안 상신]</b>\n----------------------------------------\n• <b>공장:</b> 삼랑진공장\n• <b>기안자:</b> 김동욱 부장\n• <b>결재제목:</b> <b>압출 2라인 다이스 및 스크류 보수 신청서</b>\n• <b>다음 결재자:</b> <b>${currentProfile?.name || "이명재 이사"}</b>\n• <b>일시:</b> ${todayDateStr} ${nowTime}\n----------------------------------------\n<a href="https://profit-and-loss-7d09b.web.app">전자결재 바로가기</a>`;
    }
    if (approvalType === "approve") {
      return `<b>🟦 [전자결재 최종 승인 완료]</b>\n----------------------------------------\n• <b>공장:</b> 삼랑진공장\n• <b>기안자:</b> 김동욱 부장\n• <b>결재제목:</b> <b>압출 2라인 다이스 및 스크류 보수 신청서</b>\n• <b>승인자:</b> <b>권태형 대표이사</b>\n• <b>일시:</b> ${todayDateStr} ${nowTime}\n----------------------------------------\n<a href="https://profit-and-loss-7d09b.web.app">전자결재 바로가기</a>`;
    }
    if (approvalType === "reject") {
      return `<b>🟦 [전자결재 반려 알림]</b>\n----------------------------------------\n• <b>공장:</b> 삼랑진공장\n• <b>기안자:</b> 김동욱 부장\n• <b>결재제목:</b> <b>자재 추가 구매 품의서</b>\n• <b>반려자:</b> <b>최미영 전무</b>\n• <b>반려사유:</b> 단가 재검토 및 대체 업체 비교견적 첨부 요망\n• <b>일시:</b> ${todayDateStr} ${nowTime}\n----------------------------------------\n<a href="https://profit-and-loss-7d09b.web.app">전자결재 바로가기</a>`;
    }
    return `<b>⬛ [일일업무일지 결재 승인]</b>\n----------------------------------------\n• <b>공장:</b> 삼랑진공장\n• <b>작성자:</b> 김동욱 부장 (생산)\n• <b>결재자:</b> <b>${currentProfile?.name || "이명재 이사"}</b>\n• <b>지시사항:</b> 수고하셨습니다. 익일 야간조 인수인계 철저\n• <b>업무일자:</b> ${todayDateStr}\n----------------------------------------\n<a href="https://profit-and-loss-7d09b.web.app">생산관리시스템 바로가기</a>`;
  };

  // Load custom template if exists, else load default text
  useEffect(() => {
    const saved = savedTemplates[currentUnifiedTemplateKey]?.text;
    if (saved) {
      setEditableUnifiedText(saved);
    } else {
      setEditableUnifiedText(generateDefaultUnifiedText());
    }
  }, [currentUnifiedTemplateKey, savedTemplates, morningLeaveSummary, morningApprovalSummary, morningUrgentSummary]);

  // ----------------------------------------------------
  // 2. 경영총괄 실시간 데이터 (Management Room Live Data)
  // ----------------------------------------------------
  const [selectedPnLChannel, setSelectedPnLChannel] = useState("-1003939516875"); // Default: 경영방
  const [sendingDailyPnL, setSendingDailyPnL] = useState(false);
  const [dailyPnLToast, setDailyPnLToast] = useState(false);

  const todayCommonSchedules = useMemo(() => {
    if (!commonSchedules || !Array.isArray(commonSchedules)) return [];
    return commonSchedules.filter((s) => s.date === todayDateStr);
  }, [commonSchedules, todayDateStr]);

  const totalSales = currentMonthData?.salesSummary?.totalSales || 1756104735;
  const totalPurchases = currentMonthData?.purchaseSummary?.ledgerBenchmark || currentMonthData?.jajaeSummary?.totalAmount || 1248400884.5;

  const prevMonthKey = useMemo(() => {
    if (!selectedMonth) return "2026-08";
    const [y, m] = selectedMonth.split("-").map(Number);
    const prevD = new Date(y, m - 2, 1);
    const prevY = prevD.getFullYear();
    const prevM = String(prevD.getMonth() + 1).padStart(2, "0");
    return `${prevY}-${prevM}`;
  }, [selectedMonth]);

  const prevMonthData = useMemo(() => {
    return allMonthlyData?.[prevMonthKey] || null;
  }, [allMonthlyData, prevMonthKey]);

  const prevSales = prevMonthData?.salesSummary?.totalSales || 1714856000;
  const prevPurchases = prevMonthData?.purchaseSummary?.ledgerBenchmark || prevMonthData?.jajaeSummary?.totalAmount || 1264841000;

  const salesAchievementPct = prevSales > 0 ? ((totalSales / prevSales) * 100).toFixed(1) : "102.4";
  const purchaseAchievementPct = prevPurchases > 0 ? ((totalPurchases / prevPurchases) * 100).toFixed(1) : "98.7";
  const costRatio = totalSales > 0 ? ((totalPurchases / totalSales) * 100).toFixed(1) : "71.1";

  const todaySchedsText = todayCommonSchedules.length > 0
    ? todayCommonSchedules.map((s) => `• ${s.time && s.time !== "종일" ? `[${s.time}] ` : ""}${s.target ? `[${s.target}] ` : ""}${s.title}`).join("\n")
    : "• 등록된 전사 공통일정이 없습니다. (정상 생산 가동)";

  // Management Default Message Generator
  const generateDefaultManagementText = () => {
    const isMgmtRoom = selectedPnLChannel === "-1003939516875" || selectedPnLChannel === "290615483";
    const salesAchTxt = `${salesAchievementPct}% (${Number(salesAchievementPct) >= 100 ? `▲ +${(Number(salesAchievementPct) - 100).toFixed(1)}% 초과` : `▼ ${(Number(salesAchievementPct) - 100).toFixed(1)}%`})`;
    const purchAchTxt = `${purchaseAchievementPct}% (${Number(purchaseAchievementPct) <= 100 ? `▼ ${(100 - Number(purchaseAchievementPct)).toFixed(1)}% 절감` : `▲ +${(Number(purchaseAchievementPct) - 100).toFixed(1)}% 증가`})`;

    return `<b>⬛ [오륙 ${isMgmtRoom ? "경영진/임원" : "경영정보"}] 일일 아침 손익결산 브리핑</b>\n<b>${dateFormatted} 기준</b>\n━━━━━━━━━━━━━━━━━━━━━\n<b>[1] 당월 매입 / 매출 결산 현황</b>\n• <b>매출액:</b> ₩${Number(totalSales).toLocaleString()}원\n• <b>매입액:</b> ₩${Number(totalPurchases).toLocaleString()}원\n• <b>매출대비 원가율:</b> ${costRatio}%\n\n<b>[2] 전월 실적 대비 달성율</b> (${prevMonthKey?.split("-")[1] || "8"}월 실적 대비)\n• <b>전월대비 매출 달성율:</b> <b>${salesAchTxt}</b>\n• <b>전월대비 매입 달성율:</b> <b>${purchAchTxt}</b>\n\n<b>[3] 오늘의 전사 공통일정</b>\n${todaySchedsText}\n━━━━━━━━━━━━━━━━━━━━━\n<a href="https://profit-and-loss-7d09b.web.app">손익관리시스템 바로가기</a>`;
  };

  // Load custom management template if exists, else load default text
  useEffect(() => {
    const saved = savedTemplates[currentManagementTemplateKey]?.text;
    if (saved) {
      setEditableManagementText(saved);
    } else {
      setEditableManagementText(generateDefaultManagementText());
    }
  }, [currentManagementTemplateKey, savedTemplates, totalSales, totalPurchases, salesAchievementPct, purchaseAchievementPct, todaySchedsText, selectedPnLChannel]);

  // Access Control: Admin only
  if (!isAdmin) {
    return (
      <div className="p-8 max-w-xl mx-auto my-12 bg-white dark:bg-slate-900 rounded-3xl border border-rose-200 dark:border-rose-900/50 text-center space-y-4 shadow-xl animate-fadeIn">
        <div className="w-16 h-16 rounded-3xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto shadow-inner">
          <Lock className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-black text-slate-900 dark:text-white">
          접근 권한이 제한되었습니다
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          텔레그램 연동 관리(telegram) 메뉴는 <strong>관리자(Admin)</strong> 전용 설정입니다.<br />
          일반 작업자 계정으로는 접근할 수 없습니다.
        </p>
      </div>
    );
  }

  // Handlers
  const handleSaveTelegramConfig = async (e) => {
    if (e) e.preventDefault();
    await saveTelegramConfig(telegramConfig);
    setSavedConfigToast(true);
    setTimeout(() => setSavedConfigToast(false), 2500);
  };

  const handleTestTelegram = async (customChatId = null) => {
    const targetChat = customChatId || telegramConfig.chatId;
    if (!telegramConfig.botToken || !targetChat) {
      alert("Bot Token과 Chat ID를 모두 입력해주세요.");
      return;
    }
    setTestingTelegram(true);
    setTestResult(null);
    try {
      const res = await testTelegramConnection(telegramConfig.botToken, targetChat);
      setTestResult(res);
      if (res.success) {
        await saveTelegramConfig(telegramConfig);
      }
    } catch (err) {
      setTestResult({ success: false, error: err.message });
    } finally {
      setTestingTelegram(false);
    }
  };

  // 🌟 Save current modified text as persistent template ("앞으로도 계속 적용")
  const handleSaveUnifiedTemplate = async () => {
    if (!editableUnifiedText.trim()) {
      alert("저장할 메시지 내용이 비어 있습니다.");
      return;
    }
    await saveTelegramCustomTemplate(currentUnifiedTemplateKey, editableUnifiedText);
    setTemplateSavedToast(true);
    setTimeout(() => setTemplateSavedToast(false), 3000);
  };

  const handleSaveManagementTemplate = async () => {
    if (!editableManagementText.trim()) {
      alert("저장할 메시지 내용이 비어 있습니다.");
      return;
    }
    await saveTelegramCustomTemplate(currentManagementTemplateKey, editableManagementText);
    setTemplateSavedToast(true);
    setTimeout(() => setTemplateSavedToast(false), 3000);
  };

  // 1. 오륙통합방 직접 편집 텍스트 발송
  const handleSendUnifiedMessage = async () => {
    if (!editableUnifiedText.trim()) {
      alert("발송할 메시지 내용이 비어 있습니다.");
      return;
    }
    setSendingUnified(true);
    try {
      const targetChat = telegramConfig.chatId || "-4186792536";
      const res = await sendTelegramMessage(editableUnifiedText, {
        ...telegramConfig,
        chatId: targetChat
      });

      if (res?.success) {
        setUnifiedToast(true);
        setTimeout(() => setUnifiedToast(false), 3500);
      } else {
        alert("전송 실패: " + (res?.error || "설정을 확인해주세요."));
      }
    } catch (err) {
      alert("오류 발생: " + err.message);
    } finally {
      setSendingUnified(false);
    }
  };

  // 2. 경영총괄 직접 편집 텍스트 발송
  const handleSendManagementMessage = async () => {
    if (!editableManagementText.trim()) {
      alert("발송할 메시지 내용이 비어 있습니다.");
      return;
    }
    setSendingDailyPnL(true);
    try {
      const targetChat = selectedPnLChannel || telegramConfig.pnlChatId || "-1003939516875";
      const res = await sendTelegramMessage(editableManagementText, {
        ...telegramConfig,
        chatId: targetChat
      });

      if (res?.success) {
        setDailyPnLToast(true);
        setTimeout(() => setDailyPnLToast(false), 3500);
      } else {
        alert("전송 실패: " + (res?.error || "설정을 확인해주세요."));
      }
    } catch (err) {
      alert("오류 발생: " + err.message);
    } finally {
      setSendingDailyPnL(false);
    }
  };

  const handleCopyText = (text) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopyToast(true);
      setTimeout(() => setCopyToast(false), 2000);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 animate-fadeIn">
      {/* ========================================================================= */}
      {/* 🚀 발송관리 통합 헤더 & [오륙통합방] vs [경영총괄] 2대 탭 */}
      {/* ========================================================================= */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-600 via-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Send className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                  텔레그램 발송 관리
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                  변경내용 영구 적용 지원
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                예시창에서 문구를 수정한 후 <strong>[위 예시내용을 앞으로도 계속 적용]</strong>을 누르면 변경된 텍스트가 기본 서식으로 영구 저장되어 계속 발송됩니다.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black ${
              telegramConfig.enabled
                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800"
                : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
            }`}>
              <span className={`w-2 h-2 rounded-full ${telegramConfig.enabled ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
              {telegramConfig.enabled ? "텔레그램 연동 가동 중" : "알림 연동 꺼짐"}
            </span>
          </div>
        </div>

        {/* 🌟 2대 메인 탭: [📢 오륙통합방] & [👑 경영총괄] */}
        <div className="grid grid-cols-2 gap-3 p-1.5 rounded-2xl bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80">
          <button
            type="button"
            onClick={() => setActiveMainTab("unified")}
            className={`flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-xl font-black text-xs sm:text-base transition-all cursor-pointer ${
              activeMainTab === "unified"
                ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-sky-400 shadow-md border border-slate-200/80 dark:border-slate-700"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Users className="w-5 h-5 shrink-0 text-blue-500" />
            <div className="text-left">
              <div className="leading-tight">오륙통합방</div>
              <div className="text-[10px] opacity-75 font-normal">현장•품질•공지•모닝브리핑 (-4186792536)</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveMainTab("management")}
            className={`flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-xl font-black text-xs sm:text-base transition-all cursor-pointer ${
              activeMainTab === "management"
                ? "bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-md border border-slate-200/80 dark:border-slate-700"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Crown className="w-5 h-5 shrink-0 text-purple-500" />
            <div className="text-left">
              <div className="leading-tight">경영총괄</div>
              <div className="text-[10px] opacity-75 font-normal">대표·전무 손익결산 브리핑 (-1003939516875)</div>
            </div>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 📢 TAB 1: 오륙통합방 (현장/품질/공지/결재/07:30 일반 모닝브리핑) */}
      {/* ========================================================================= */}
      {activeMainTab === "unified" && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-blue-500/40 dark:border-blue-600/40 shadow-xl space-y-5 animate-fadeIn">
          {/* Channel Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-blue-500 animate-pulse"></span>
                <h4 className="font-black text-slate-900 dark:text-white text-base">
                  📢 오륙통합방 발송 메시지 관리
                </h4>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                  단톡방: -4186792536
                </span>
                {isUnifiedTemplateCustom && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                    📌 사용자 지정 서식 적용 중
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                예시창에서 텍스트를 수정한 후 <strong>[위 예시내용을 앞으로도 계속 적용]</strong>을 누르면 저장되어 계속 발송됩니다.
              </p>
            </div>

            <span className="px-3 py-1 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-black">
              {todayDateStr} ({dayName})
            </span>
          </div>

          {/* Sub Message Type Selector */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: "briefing", label: "📋 07:30 모닝브리핑", desc: "근태/미결재/품질" },
              { id: "quality", label: "🟥 품질경보 3단계", desc: "발령/조치/종결" },
              { id: "notice_meeting", label: "🟩 공지 & 🟪 회의", desc: "사내공지/회의일정" },
              { id: "approval", label: "🟦 전자결재/일지", desc: "기안/승인/반려" }
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setUnifiedMsgType(t.id)}
                className={`p-3 rounded-2xl text-center border transition-all cursor-pointer ${
                  unifiedMsgType === t.id
                    ? "bg-blue-600 text-white border-blue-600 shadow-md font-black"
                    : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-400"
                }`}
              >
                <div className="text-xs">{t.label}</div>
                <div className="text-[10px] opacity-80 mt-0.5">{t.desc}</div>
              </button>
            ))}
          </div>

          {/* Sub-level selectors based on unifiedMsgType */}
          {unifiedMsgType === "quality" && (
            <div className="p-3 rounded-2xl bg-rose-50/50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 flex items-center justify-between gap-2 flex-wrap">
              <span className="text-xs font-bold text-rose-800 dark:text-rose-300">품질경보 알림 단계 서식:</span>
              <div className="flex items-center gap-1.5">
                {[
                  { key: "1", label: "1단계 (신규 발령)" },
                  { key: "2", label: "2단계 (조치완료 보고)" },
                  { key: "3", label: "3단계 (종결/삭제 알림)" }
                ].map((st) => (
                  <button
                    key={st.key}
                    type="button"
                    onClick={() => setQualityStage(st.key)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      qualityStage === st.key
                        ? "bg-rose-600 text-white border-rose-600 shadow-xs"
                        : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {unifiedMsgType === "notice_meeting" && (
            <div className="p-3 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 flex items-center justify-between gap-2 flex-wrap">
              <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">공지/회의 서식:</span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {[
                  { key: "notice", label: "🟩 사내 공지사항" },
                  { key: "meeting", label: "🟪 사내 회의일정" },
                  { key: "meeting_result", label: "🟪 회의결과 보고" },
                  { key: "meeting_reply", label: "🟪 회의일정 회신" }
                ].map((nt) => (
                  <button
                    key={nt.key}
                    type="button"
                    onClick={() => setNoticeMeetingType(nt.key)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      noticeMeetingType === nt.key
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                        : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    {nt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {unifiedMsgType === "approval" && (
            <div className="p-3 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/50 flex items-center justify-between gap-2 flex-wrap">
              <span className="text-xs font-bold text-indigo-800 dark:text-indigo-300">전자결재/일지 서식:</span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {[
                  { key: "draft", label: "🟦 기안 상신" },
                  { key: "approve", label: "🟦 최종 승인 완료" },
                  { key: "reject", label: "🟦 반려 알림" },
                  { key: "worklog", label: "⬛ 업무일지 결재 승인" }
                ].map((ap) => (
                  <button
                    key={ap.key}
                    type="button"
                    onClick={() => setApprovalType(ap.key)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      approvalType === ap.key
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                        : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    {ap.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 🌟 예시창 스마트폰 프레임 (직접 편집 가능한 텍스트 상자 & 렌더링 미리보기 탭) */}
          <div className="bg-slate-950 text-slate-100 rounded-3xl p-5 border border-slate-800 shadow-2xl space-y-3 font-sans">
            {/* Top Toolbar in Smartphone frame */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800 text-xs">
              <div className="flex items-center gap-2 font-bold text-sky-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>📢 오륙 통합방 (수신처: -4186792536)</span>
                {isUnifiedTemplateCustom && (
                  <span className="text-[11px] font-bold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-800/80">
                    저장된 커스텀 템플릿 활성
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                {/* Mode Switcher: Edit vs Preview */}
                <div className="flex items-center bg-slate-900 rounded-xl p-0.5 border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setUnifiedViewMode("edit")}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      unifiedViewMode === "edit"
                        ? "bg-blue-600 text-white shadow-xs"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>✏️ 텍스트 직접 수정</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setUnifiedViewMode("preview")}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      unifiedViewMode === "preview"
                        ? "bg-blue-600 text-white shadow-xs"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>👁️ 수신 화면 뷰</span>
                  </button>
                </div>

                {/* Reset to system default button */}
                <button
                  type="button"
                  onClick={() => setEditableUnifiedText(generateDefaultUnifiedText())}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-bold transition-all cursor-pointer"
                  title="시스템 실시간 데이터 기본 서식으로 초기화"
                >
                  <RotateCw className="w-3.5 h-3.5 text-sky-400" />
                  <span>기본서식 리셋</span>
                </button>

                {/* Copy button */}
                <button
                  type="button"
                  onClick={() => handleCopyText(editableUnifiedText)}
                  className="flex items-center gap-1 px-2 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 text-xs font-bold transition-all cursor-pointer"
                  title="클립보드에 복사"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* In-Place Editable Message Box */}
            {unifiedViewMode === "edit" ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                  <span>💡 <strong>예시창 텍스트 수정:</strong> 원하는 내용을 자유롭게 수정한 후, <strong>[위 예시내용을 앞으로도 계속 적용]</strong>을 누르면 저장되어 계속 발송됩니다.</span>
                  <span className="font-mono text-slate-500">{editableUnifiedText.length}자</span>
                </div>
                <textarea
                  rows="12"
                  value={editableUnifiedText}
                  onChange={(e) => setEditableUnifiedText(e.target.value)}
                  className="w-full p-4 rounded-2xl bg-slate-900/95 border border-blue-500/50 font-mono text-xs sm:text-sm text-slate-100 leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-inner"
                  placeholder="발송할 텔레그램 메시지 내용을 입력하세요..."
                ></textarea>
              </div>
            ) : (
              /* Rendered HTML Telegram Bubble */
              <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-700/80 space-y-3.5 text-xs sm:text-sm leading-relaxed shadow-lg">
                <div
                  className="whitespace-pre-wrap text-slate-100 font-sans"
                  dangerouslySetInnerHTML={{ __html: editableUnifiedText.replace(/\n/g, "<br/>") }}
                />
              </div>
            )}

            {/* Bottom Action Footer with [위 예시내용을 앞으로도 계속 적용] + [즉시 발송] */}
            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-800/80">
              <div className="text-[11px] text-slate-400">
                수신처: <strong>오륙 통합방</strong> (-4186792536)
              </div>

              <div className="flex items-center gap-2.5 flex-wrap justify-end">
                {copyToast && (
                  <span className="text-xs font-bold text-sky-400 flex items-center gap-1 animate-fadeIn">
                    <Check className="w-3.5 h-3.5" /> 복사 완료!
                  </span>
                )}
                {templateSavedToast && (
                  <span className="text-xs font-bold text-amber-400 flex items-center gap-1 animate-fadeIn">
                    <BookmarkCheck className="w-4 h-4 text-amber-400" /> 앞으로도 계속 적용 저장 완료!
                  </span>
                )}
                {unifiedToast && (
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1 animate-fadeIn">
                    <CheckCircle2 className="w-4 h-4" /> 오륙통합방 전송 완료!
                  </span>
                )}

                {/* 🌟 1. [위 예시내용을 앞으로도 계속 적용] 확인/저장 탭 */}
                <button
                  type="button"
                  onClick={handleSaveUnifiedTemplate}
                  className="flex items-center gap-1.5 px-4 sm:px-5 py-3 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/50 font-black text-xs sm:text-sm shadow-md active:scale-95 transition-all cursor-pointer"
                  title="현재 수정된 텍스트를 기본 서식으로 저장하여 앞으로 자동/수동 발송 시 계속 적용합니다."
                >
                  <BookmarkCheck className="w-4 h-4 text-amber-400" />
                  <span>💾 위 예시내용을 앞으로도 계속 적용</span>
                </button>

                {/* 🌟 2. [내용 즉시 발송] 버튼 */}
                <button
                  type="button"
                  disabled={sendingUnified}
                  onClick={handleSendUnifiedMessage}
                  className="flex items-center gap-2 px-5 sm:px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-xs sm:text-sm shadow-xl shadow-blue-500/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-4 h-4 text-sky-200" />
                  <span>{sendingUnified ? "발송 중..." : "🚀 [오륙통합방]으로 예시 내용 즉시 발송"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 👑 TAB 2: 경영총괄 (대표·전무 경영방 아침 손익결산 브리핑) */}
      {/* ========================================================================= */}
      {activeMainTab === "management" && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-purple-500/40 dark:border-purple-600/40 shadow-xl space-y-5 animate-fadeIn">
          {/* Channel Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-purple-500 animate-pulse"></span>
                <h4 className="font-black text-slate-900 dark:text-white text-base">
                  👑 경영총괄 발송 메시지 관리
                </h4>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                  경영방: -1003939516875
                </span>
                {isManagementTemplateCustom && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                    📌 사용자 지정 서식 적용 중
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                손익결산 브리핑 문구를 예시창에서 수정한 후 <strong>[위 예시내용을 앞으로도 계속 적용]</strong>을 누르면 저장되어 매일 07:30 발송 시 계속 적용됩니다.
              </p>
            </div>

            {/* Destination Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400">수신처:</span>
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-0.5 border border-slate-200 dark:border-slate-700">
                {[
                  { id: "-1003939516875", label: "👑 경영방" },
                  { id: "290615483", label: "👤 대표님 1:1" }
                ].map((ch) => (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => setSelectedPnLChannel(ch.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      selectedPnLChannel === ch.id
                        ? "bg-purple-600 text-white shadow-xs"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    {ch.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 🌟 예시창 스마트폰 프레임 (직접 편집 가능한 텍스트 상자 & 렌더링 미리보기 탭) */}
          <div className="bg-slate-950 text-slate-100 rounded-3xl p-5 border border-slate-800 shadow-2xl space-y-3 font-sans">
            {/* Top Toolbar in Smartphone frame */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800 text-xs">
              <div className="flex items-center gap-2 font-bold text-purple-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>
                  {selectedPnLChannel === "-1003939516875"
                    ? "👑 경영방 (대표·전무 전용 채널: -1003939516875)"
                    : "👤 권태형 대표님 1:1 개인톡 (290615483)"}
                </span>
                {isManagementTemplateCustom && (
                  <span className="text-[11px] font-bold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-800/80">
                    저장된 커스텀 템플릿 활성
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                {/* Mode Switcher: Edit vs Preview */}
                <div className="flex items-center bg-slate-900 rounded-xl p-0.5 border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setManagementViewMode("edit")}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      managementViewMode === "edit"
                        ? "bg-purple-600 text-white shadow-xs"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>✏️ 텍스트 직접 수정</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setManagementViewMode("preview")}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      managementViewMode === "preview"
                        ? "bg-purple-600 text-white shadow-xs"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>👁️ 수신 화면 뷰</span>
                  </button>
                </div>

                {/* Reset to system default button */}
                <button
                  type="button"
                  onClick={() => setEditableManagementText(generateDefaultManagementText())}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-bold transition-all cursor-pointer"
                  title="시스템 실시간 손익 데이터 기본 서식으로 초기화"
                >
                  <RotateCw className="w-3.5 h-3.5 text-purple-400" />
                  <span>기본서식 리셋</span>
                </button>

                {/* Copy button */}
                <button
                  type="button"
                  onClick={() => handleCopyText(editableManagementText)}
                  className="flex items-center gap-1 px-2 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 text-xs font-bold transition-all cursor-pointer"
                  title="클립보드에 복사"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* In-Place Editable Message Box */}
            {managementViewMode === "edit" ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                  <span>💡 <strong>손익결산 브리핑 텍스트 수정:</strong> 매출액, 매입액, 달성율, 공통일정을 자유롭게 수정한 후, <strong>[위 예시내용을 앞으로도 계속 적용]</strong>을 누르면 저장됩니다.</span>
                  <span className="font-mono text-slate-500">{editableManagementText.length}자</span>
                </div>
                <textarea
                  rows="14"
                  value={editableManagementText}
                  onChange={(e) => setEditableManagementText(e.target.value)}
                  className="w-full p-4 rounded-2xl bg-slate-900/95 border border-purple-500/50 font-mono text-xs sm:text-sm text-slate-100 leading-relaxed focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-inner"
                  placeholder="발송할 손익결산 브리핑 메시지 내용을 입력하세요..."
                ></textarea>
              </div>
            ) : (
              /* Rendered HTML Telegram Bubble */
              <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-700/80 space-y-3.5 text-xs sm:text-sm leading-relaxed shadow-lg">
                <div
                  className="whitespace-pre-wrap text-slate-100 font-sans"
                  dangerouslySetInnerHTML={{ __html: editableManagementText.replace(/\n/g, "<br/>") }}
                />
              </div>
            )}

            {/* Bottom Action Footer with [위 예시내용을 앞으로도 계속 적용] + [즉시 발송] */}
            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-800/80">
              <div className="text-[11px] text-slate-400">
                수신처: <strong>{selectedPnLChannel === "-1003939516875" ? "경영방" : "대표님 1:1"}</strong> ({selectedPnLChannel})
              </div>

              <div className="flex items-center gap-2.5 flex-wrap justify-end">
                {copyToast && (
                  <span className="text-xs font-bold text-purple-400 flex items-center gap-1 animate-fadeIn">
                    <Check className="w-3.5 h-3.5" /> 복사 완료!
                  </span>
                )}
                {templateSavedToast && (
                  <span className="text-xs font-bold text-amber-400 flex items-center gap-1 animate-fadeIn">
                    <BookmarkCheck className="w-4 h-4 text-amber-400" /> 앞으로도 계속 적용 저장 완료!
                  </span>
                )}
                {dailyPnLToast && (
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1 animate-fadeIn">
                    <CheckCircle2 className="w-4 h-4" /> 경영방 전송 완료!
                  </span>
                )}

                {/* 🌟 1. [위 예시내용을 앞으로도 계속 적용] 확인/저장 탭 */}
                <button
                  type="button"
                  onClick={handleSaveManagementTemplate}
                  className="flex items-center gap-1.5 px-4 sm:px-5 py-3 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/50 font-black text-xs sm:text-sm shadow-md active:scale-95 transition-all cursor-pointer"
                  title="현재 수정된 손익결산 텍스트를 기본 서식으로 저장하여 매일 07:30 발송 시 계속 적용합니다."
                >
                  <BookmarkCheck className="w-4 h-4 text-amber-400" />
                  <span>💾 위 예시내용을 앞으로도 계속 적용</span>
                </button>

                {/* 🌟 2. [내용 즉시 발송] 버튼 */}
                <button
                  type="button"
                  disabled={sendingDailyPnL}
                  onClick={handleSendManagementMessage}
                  className="flex items-center gap-2 px-5 sm:px-6 py-3 rounded-2xl bg-gradient-to-r from-slate-900 via-purple-900 to-indigo-900 hover:from-black hover:to-purple-950 text-white font-black text-xs sm:text-sm shadow-xl shadow-purple-500/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-4 h-4 text-purple-300" />
                  <span>{sendingDailyPnL ? "발송 중..." : "🚀 [경영방]으로 손익결산 즉시 발송"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ⚙️ 하단: 텔레그램 Bot API 및 채널 ID 시스템 설정 */}
      {/* ========================================================================= */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white text-base">
                텔레그램 Bot API 및 채널 ID 설정
              </h4>
              <p className="text-xs text-slate-400">
                오륙 통합방(현장·품질·공지)과 경영방(대표·전무 손익)의 수신 채널 ID를 구분하여 관리합니다.
              </p>
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={telegramConfig.enabled}
              onChange={(e) => setTelegramConfig({ ...telegramConfig, enabled: e.target.checked })}
              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
            />
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {telegramConfig.enabled ? "알림 켜짐" : "알림 꺼짐"}
            </span>
          </label>
        </div>

        <form onSubmit={handleSaveTelegramConfig} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                텔레그램 Bot Token (API 토큰)
              </label>
              <input
                type="text"
                placeholder="예: 8544872588:AAFb..."
                value={telegramConfig.botToken || ""}
                onChange={(e) => setTelegramConfig({ ...telegramConfig, botToken: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              />
              <p className="text-[10px] text-slate-400">
                @BotFather 발급 API Token
              </p>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                오륙 통합방 Chat ID
              </label>
              <input
                type="text"
                placeholder="예: -4186792536 (오륙 통합방)"
                value={telegramConfig.chatId || ""}
                onChange={(e) => setTelegramConfig({ ...telegramConfig, chatId: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              />
              <p className="text-[10px] text-slate-400">
                품질경보 3단계 / 사내공지 / 회의일정 / 07:30 모닝브리핑
              </p>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                경영방 (대표·전무) Chat ID
              </label>
              <input
                type="text"
                placeholder="예: -1003939516875 (경영방)"
                value={telegramConfig.pnlChatId || ""}
                onChange={(e) => setTelegramConfig({ ...telegramConfig, pnlChatId: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              />
              <p className="text-[10px] text-slate-400">
                매일 아침 07:30 손익결산(매출/매입/달성율/공통일정) 브리핑
              </p>
            </div>
          </div>

          {/* Test Status Feedback */}
          {testResult && (
            <div className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
              testResult.success
                ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 text-emerald-800 dark:text-emerald-200"
                : "bg-rose-50 dark:bg-rose-950/40 border-rose-300 text-rose-800 dark:text-rose-200"
            }`}>
              {testResult.success ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>✅ 텔레그램 연결 테스트 메시지가 성공적으로 발송되었습니다!</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>❌ 전송 실패: {testResult.error || "Token 또는 Chat ID를 다시 확인해주세요."}</span>
                </>
              )}
            </div>
          )}

          {/* Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                disabled={testingTelegram}
                onClick={() => handleTestTelegram(telegramConfig.chatId)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5 text-sky-500" />
                <span>{testingTelegram ? "전송 중..." : "통합방 연결 테스트 발송"}</span>
              </button>

              <button
                type="button"
                disabled={testingTelegram}
                onClick={() => handleTestTelegram(telegramConfig.pnlChatId)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5 text-purple-500" />
                <span>{testingTelegram ? "전송 중..." : "경영방 연결 테스트 발송"}</span>
              </button>
            </div>

            <div className="flex items-center gap-3">
              {savedConfigToast && (
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> 설정 저장 완료!
                </span>
              )}
              <button
                type="submit"
                className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 active:scale-95 transition-all cursor-pointer"
              >
                <span>설정 저장하기</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
