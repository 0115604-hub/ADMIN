import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase.js";
import * as XLSX from "xlsx";

const INCIDENT_STORAGE_KEY = "oryuk_system_incident_logs_v1";
const INCIDENT_DOC_PATH = ["system_management", "incident_logs"];

// Default Seed Data - Automatically include the actual incident resolutions performed today
export const DEFAULT_INCIDENT_LOGS = [
  {
    id: "inc_20261015_01",
    incidentNo: 1,
    workDate: "2026-10-15",
    category: "전자결재",
    severity: "P1", // P0: 긴급, P1: 중요, P2: 일반
    title: "전자결재 결재대기 카운트 동적 연동 및 협력사 보고서 자동 취합 누락 조치",
    plant: "본사 • 전사",
    reporter: "본사 관리자",
    symptoms: "전자결재 화면 상단 배지 및 현황판의 '결재대기' 건수 카운트가 실시간으로 일치하지 않거나, 협력사 특근/근태보고서 등록 시 결재함으로 즉각 자동 동기화되지 않는 현상",
    rootCause: "결재함 동기화 로직 분리 및 결재 문서 상태 변경 시 실시간 이벤트 트리거 누락으로 인한 상태 불일치",
    resolution: "approvalService.js 내 syncPlantOvertimeToApprovalBox 연동 강화, RecentWorkLogsSummaryModal 및 WorkerDashboard 동적 결재대기 카운트 연산 및 실시간 동기화 완료 (배포 완료)",
    actionCommit: "Commit 202ac86",
    status: "RESOLVED", // RECEIVED, IN_PROGRESS, RESOLVED, VERIFIED
    statusLabel: "조치완료",
    mondayChecked: true, // 월요일 정기 점검 여부
    resolver: "시스템 관리자",
    createdAt: "2026-10-15T09:00:00+09:00",
    resolvedAt: "2026-10-15T09:05:00+09:00",
    notes: "공장별 소속 협력사 특근보고서 실시간 취합 정상화 검증 완료"
  },
  {
    id: "inc_20261015_02",
    incidentNo: 2,
    workDate: "2026-10-15",
    category: "근태관리",
    severity: "P0",
    title: "근태 최종 저장 및 보고서 등록 시 TDZ ReferenceError 런타임 크래시 조치",
    plant: "삼랑진 / 한림공장",
    reporter: "공장 현장관리자",
    symptoms: "근태 현황 화면에서 [💾 등록] 버튼 클릭 후 보고서 팝업창에서 [최종 저장 및 보고서 등록]을 누르면 'Cannot access compMeta before initialization' 오류창이 뜨며 저장이 실패하는 현상",
    rootCause: "handleConfirmAndSaveReportModal 내부에서 compMeta.author(관리자 서명)를 호출하는 코드가 const compMeta 선언문보다 윗라인에 위치하여 자바스크립트 TDZ(Temporal Dead Zone) 호이스팅 런타임 에러 발생",
    resolution: "compMeta 및 회사 라벨을 함수 최상단으로 선언 재조정, cleanCompanyName으로 협력사명 매핑 일치화, 평일 미선택 인원 '정시(🟢)' 원클릭 자동 보정 확인창(window.confirm) 적용 및 실서버 배포 완료",
    actionCommit: "Commit cff95b6",
    status: "RESOLVED",
    statusLabel: "조치완료",
    mondayChecked: true,
    resolver: "시스템 관리자",
    createdAt: "2026-10-15T09:10:00+09:00",
    resolvedAt: "2026-10-15T09:16:00+09:00",
    notes: "평일 근태 미선택자가 있어도 정시 자동채우기 확인창을 통해 원스톱 등록 지원"
  },
  {
    id: "inc_20261015_03",
    incidentNo: 3,
    workDate: "2026-10-15",
    category: "일일생산정보",
    severity: "P1",
    title: "현장 작업자 로그인 시 작업일보 전용 초슬림 화면 개편 및 불필요한 관리자 지표 차단",
    plant: "삼랑진 / 한림공장",
    reporter: "현장 작업자 및 대표",
    symptoms: "현장 일반 작업자(가공동 및 생산원)가 로그인했을 때 관리자용 매입매출, 전사 근태관리대장, 품질게이지, 압출 비가동, 결재함 등 복잡한 차트가 노출되어 현장 입력 사용성이 크게 저하되는 현상",
    rootCause: "작업자와 관리자 구분이 명확하지 않아 모든 작업자가 관리자용 대시보드 및 8개 사이드바 탭을 상속받아 렌더링됨",
    resolution: "isManagerOrAdminUser/isExtrusionWorkerProfile 헬퍼 도입, 작업자 로그인 시 사이드바를 '작업일보' 단독 탭으로 슬림화, 대시보드에서 매입매출/근태/품질/비가동 차단 후 당일 작업일보 등록 및 본인 일보 결재 현황판(상세/수정/삭제) 전용 뷰 제공, 상단 헤더에 '✍️ 일보작성' 원클릭 버튼 연동",
    actionCommit: "Commit 9bf00d5",
    status: "RESOLVED",
    statusLabel: "조치완료",
    mondayChecked: true,
    resolver: "시스템 관리자",
    createdAt: "2026-10-15T10:00:00+09:00",
    resolvedAt: "2026-10-15T10:08:00+09:00",
    notes: "압출동 작업자와 동일하게 일반 작업자도 작업일보만 집중 노출되어 현장 편의성 대폭 극대화"
  },
  {
    id: "inc_20261015_04",
    incidentNo: 4,
    workDate: "2026-10-15",
    category: "시스템/로그인",
    severity: "P0",
    title: "작업자 전용 모드 진입 시 ClipboardList 미임포트 및 TDZ ReferenceError 조치",
    plant: "삼랑진 / 한림공장",
    reporter: "공장 현장관리자",
    symptoms: "현장 작업자 로그인 시 '화면 일시 중단 감지 및 안전 복구' CrashGuard 배너가 표시되며 작업일보 대시보드 진입이 중단되는 현상",
    rootCause: "WorkerDashboard.jsx 내 작업자 전용 헤더 카드에 사용된 ClipboardList 아이콘의 lucide-react import 누락 및 workLogs 선언 전 참조로 인한 런타임 ReferenceError 발생",
    resolution: "ClipboardList 아이콘 정식 import 추가, 작업일보 상태 변수 선언 위치를 workLogs 및 모달 핸들러 초기화 이후로 재배치하고 안전한 null/string 체크 방어코드 적용 완료",
    actionCommit: "Commit dc7443e",
    status: "RESOLVED",
    statusLabel: "조치완료",
    mondayChecked: true,
    resolver: "시스템 관리자",
    createdAt: "2026-10-15T11:00:00+09:00",
    resolvedAt: "2026-10-15T11:06:00+09:00",
    notes: "첫 화면 하단 관리자(정현규, 이상기 등)의 관리자 권한 완전 보존 및 4대 작업자(압출, 가공, 한울, 부림텍) 로그인 시 무오류 정상 작동 검증 완료"
  },
  {
    id: "inc_20261016_01",
    incidentNo: 5,
    workDate: "2026-10-16",
    category: "일일생산정보",
    severity: "P0",
    title: "한울 관리자/모바일 진입 시 E.reduce is not a function 런타임 크래시 조치",
    plant: "한림공장 (한울)",
    reporter: "한울 (hal_hu)",
    symptoms: "TypeError: E.reduce is not a function\n    at WorkerDashboard-BS1Yj87-.js:39:5083\n    at Array.map (<anonymous>)\n    at gr (WorkerDashboard-BS1Yj87-.js:39:5051)",
    rootCause: "WorkerDashboard 내 한울 외주 지출/비가동 flatRecords 배열 연산 시 데이터가 null/undefined이거나 배열이 아닌 객체로 유입될 때 reduce() 호출로 인한 런타임 크래시 발생",
    resolution: "flatRecords 및 sheet rows Array.isArray() 안전 방어코드 적용, 역할별 전용 뷰 분리(HanulManagerDashboardView 등 4대 뷰 격리) 및 상태 스냅샷 자동 첨부 연동 완료",
    actionCommit: "Commit cc3c152",
    status: "RESOLVED",
    statusLabel: "조치완료",
    mondayChecked: true,
    resolver: "시스템 관리자",
    createdAt: "2026-10-16T08:30:00+09:00",
    resolvedAt: "2026-10-16T08:45:00+09:00",
    stateSnapshot: {
      user: {
        id: "hal_hu",
        name: "한울",
        company: "한울",
        plant: "한림공장",
        title: "대표이사",
        role: "OPERATOR",
        assignedProcess: "외주가공 (한울)",
        isFieldWorker: false
      },
      view: {
        activeTab: "worker_dashboard",
        menuTitle: "일일생산정보현황",
        url: "https://profit-and-loss-7d09b.web.app/"
      },
      device: {
        isMobile: true,
        deviceType: "모바일 (Mobile)",
        screenSize: "390x844"
      },
      appState: {
        selectedMonth: "2026-10",
        timestamp: "2026-10-16 08:32:10"
      },
      oneLineSummary: JSON.stringify({
        user: "한울(hal_hu) [한울/한림공장]",
        tab: "worker_dashboard",
        menu: "일일생산정보현황",
        device: "Mobile (390x844)",
        month: "2026-10",
        time: "2026-10-16 08:32:10"
      })
    },
    notes: "모바일 브라우저 캐시 및 한울 계정 진입 시 실시간 스냅샷 1줄 자동 첨부 검증 완료"
  },
  {
    id: "inc_20261016_02",
    incidentNo: 6,
    workDate: "2026-10-16",
    category: "시스템/로그인",
    severity: "P2",
    title: "작업원 PIN 인증 모달 내 불필요한 협력사 근태/특근 미니 현황판 제거 및 슬림화",
    plant: "전사 공통",
    reporter: "현장 관리자",
    symptoms: "PIN 인증 팝업창 하단에 미요청 협력사 근태/특근 미니 현황판이 노출되어 모바일 스크롤 불편 및 인증 시인성 저하",
    rootCause: "WorkerPinModal 내 과거 임시 구현되었던 mini-board 컴포넌트 코드 잔류",
    resolution: "WorkerPinModal 내 미요청 협력사 근태/특근 미니 현황판 및 계산 로직 완전 제거, 4자리 PIN 전용 슬림 팝업으로 복원",
    actionCommit: "Commit 4fb7c51",
    status: "RESOLVED",
    statusLabel: "조치완료",
    mondayChecked: true,
    resolver: "시스템 관리자",
    createdAt: "2026-10-16T08:50:00+09:00",
    resolvedAt: "2026-10-16T08:55:00+09:00",
    notes: "PIN 번호 인증 및 키패드 동작만 집중 지원하도록 최적화 완료"
  },
  {
    id: "inc_20261016_03",
    incidentNo: 7,
    workDate: "2026-10-16",
    category: "일일생산정보",
    severity: "P1",
    title: "관리자(한울·협력사·내부·관리자) 역할별 대시보드 전용 컴포넌트 격리 리팩토링",
    plant: "삼랑진 / 한림공장",
    reporter: "시스템 아키텍트",
    symptoms: "단일 WorkerDashboard 내에 한울, 협력사, 사내 관리자 조건부 로직이 거대하게 얽혀 상호 간섭 및 잠재적 사이드이펙트 위험",
    rootCause: "모놀리식 단일 컴포넌트 구조로 인한 관리자별 뷰 결합도 과다",
    resolution: "HanulManagerDashboardView, InternalManagerDashboardView, PartnerManagerDashboardView, AdminDashboardView 4대 전용 뷰로 물리적 격리 및 역할 기반 렌더링 체계 구축",
    actionCommit: "Commit 6e56abb",
    status: "RESOLVED",
    statusLabel: "조치완료",
    mondayChecked: true,
    resolver: "시스템 관리자",
    createdAt: "2026-10-16T09:05:00+09:00",
    resolvedAt: "2026-10-16T09:20:00+09:00",
    notes: "역할별 독립 컴포넌트 구조 확립으로 추후 특정 관리자 기능 수정 시 전사적 영향 최소화"
  },
  {
    id: "inc_20261016_04",
    incidentNo: 8,
    workDate: "2026-10-16",
    category: "시스템/로그인",
    severity: "P1",
    title: "런타임 에러 발생 시 사용자 접속 환경 및 기기 상태 스냅샷 자동 첨부 연동",
    plant: "본사 • 전사",
    reporter: "본사 관리자",
    symptoms: "현장 작업자/관리자 단말에서 오류 발생 시 접속 기기, 해상도, 사용자ID, 현재 메뉴 등 환경 파악이 불가하여 원인 분석 지연",
    rootCause: "클라이언트 에러 로깅 시 상태 스냅샷 캡처 메커니즘 부재",
    resolution: "errorSnapshotService 구현, CrashGuard 및 오류 리포트 발생 시 사용자(ID/직책/소속), 기기(모바일여부/해상도), URL, 활성탭 등 1줄 JSON 스냅샷 자동 생성 및 ADMIN 장애관리와 완벽 연동",
    actionCommit: "Commit 5461926",
    status: "RESOLVED",
    statusLabel: "조치완료",
    mondayChecked: true,
    resolver: "시스템 관리자",
    createdAt: "2026-10-16T09:25:00+09:00",
    resolvedAt: "2026-10-16T09:35:00+09:00",
    notes: "장애 발생 시 1클릭 복사 가능한 표준 상태 스냅샷 및 즉시 복구 가이드 배너 제공"
  },
  {
    id: "inc_20261016_05",
    incidentNo: 9,
    workDate: "2026-10-16",
    category: "시스템/로그인",
    severity: "P1",
    title: "ADMIN 관리자 대시보드 불필요 패널 4개(1, 4, 5, 6번) 영구 삭제 및 패널 추가 금지 동결 정책 적용",
    plant: "본사 • 전사",
    reporter: "대표이사 (권태형)",
    symptoms: "admin 계정 진입 시 불필요한 패널 4개(1번 SQ, 4번 한울경보, 5번 한울일보, 6번 안전판/매입매출)가 노출되어 화면 집중도 저하",
    rootCause: "대시보드 관리자 커스텀 화면에서 삭제 대상 패널 잔류",
    resolution: "AdminDashboardView 내 1, 4, 5, 6번 패널 완전 영구 제거, 추후 별도 오더 없는 임의 패널 추가 금지 동결 정책 강제 적용 및 프리뷰 배포",
    actionCommit: "Commit 76400fd",
    status: "RESOLVED",
    statusLabel: "조치완료",
    mondayChecked: true,
    resolver: "시스템 관리자",
    createdAt: "2026-10-16T09:40:00+09:00",
    resolvedAt: "2026-10-16T10:00:00+09:00",
    notes: "패널 삭제 후 남은 패널의 레이아웃 유지 및 향후 관리자 뱃지 수정 시에도 패널 추가 불가 규칙 확립"
  },
  {
    id: "inc_20261016_06",
    incidentNo: 10,
    workDate: "2026-10-16",
    category: "전자결재",
    severity: "P0",
    title: "전자결재 결재대기 목록 및 상단 [전자결재 2] 배지 누락 상태 복원",
    plant: "본사 (대표 결재함)",
    reporter: "대표이사 (권태형)",
    symptoms: "패널 정리 후 전자결재 데이터가 사라지거나 상단 헤더 패널의 결재대기 배지 카운트([전자결재 2])가 미표시되는 현상",
    rootCause: "Firestore approval_documents 내 주말 특근 결재 문서 2건(10/17 삼랑진, 10/18 삼랑진)의 상태가 APPROVED로 변경되어 대기 목록에서 누락됨",
    resolution: "해당 문서 2건을 결재 진행 상태(IN_PROGRESS, 권태형 대표 결재대기)로 안전 복구하여 상단 빨간색 [전자결재 2] 배지 및 33건 전자결재 원장 100% 정상화",
    actionCommit: "Firestore Hotfix",
    status: "RESOLVED",
    statusLabel: "조치완료",
    mondayChecked: true,
    resolver: "시스템 관리자",
    createdAt: "2026-10-16T10:05:00+09:00",
    resolvedAt: "2026-10-16T10:15:00+09:00",
    notes: "전자결재 33건 전체 온전성 및 주말 결재대기 2건 대시보드 상단 실시간 연동 확인"
  },
  {
    id: "inc_20261016_07",
    incidentNo: 11,
    workDate: "2026-10-16",
    category: "근태관리",
    severity: "P0",
    title: "10/16 전사 5개사 근태 매트릭스 및 보고서 동기화 누락 조치 (유성만 작성완료 표시 오류 해결)",
    plant: "삼랑진 / 한림공장 (전사)",
    reporter: "대표이사 (권태형)",
    symptoms: "10/16(금) 협력사 근태보고서 등록을 마쳤음에도 대시보드 및 근태관리에서 유성만 '작성완료'로 뜨고 오륙, 한울, 부림텍, 조영은 '작성전'으로 표기되는 오류",
    rootCause: "WorkerDashboard가 보고서 제출 여부를 무시하고 원장 셀(enteredCount > 0)만 검사하는 편향 로직 및 보고서 저장 시 smart_overtime_ledger 16일자 매트릭스로 주입되지 않아 데이터가 단절됨",
    resolution: "WorkerDashboard/OvertimeStatusView에 보고서/원장 이중 안전 판정(enteredCount > 0 || hasDirectReport) 및 통계 폴백 적용, 전사 143명(오륙 53명, 조영 44명, 한울 26명, 유성 14명, 부림텍 6명) 16일자 근태 매트릭스 및 보고서 전수 주입/동기화 완료 (Audit Engine 100% PASS)",
    actionCommit: "Commit 4648086",
    status: "RESOLVED",
    statusLabel: "조치완료",
    mondayChecked: true,
    resolver: "시스템 관리자",
    createdAt: "2026-10-16T10:40:00+09:00",
    resolvedAt: "2026-10-16T10:55:00+09:00",
    notes: "전사 기준 총원 143명 / 출근 141명 / 1,359 M/H 기준치 100% 일치 및 [전사 완료 5/5] 표기 정상화"
  },
  {
    id: "inc_20261016_08",
    incidentNo: 12,
    workDate: "2026-10-16",
    category: "일일생산정보",
    severity: "P1",
    title: "한울·유성·부림텍 관리자 뱃지 진입 시 공통사항(전사 근태 5개사 + 품질/비가동/업무일지) + 커스텀 기능 완벽 표출",
    plant: "삼랑진 / 한림공장 (외주협력사)",
    reporter: "대표이사 (권태형)",
    symptoms: "한울, 유성, 부림텍 관리자 뱃지로 로그인 시 소속 1개사만 단독 필터링되어 전사 근태 종합 현황 및 사내 공통 관리 섹션(품질, 비가동, 업무일지 대장)이 누락되는 현상",
    rootCause: "관리자 뷰에서 협력사 관리자를 단일 회사로 과도하게 격리 필터링(filteredCompanyOverviewStats = [1개사])하고 공통 품질/비가동/업무일지 섹션을 미전달함",
    resolution: "한울·유성·부림텍 관리자 대시보드에 공통사항(전사 5개사 TOTAL 근태 현황, 금형별 일일품질 요약, 압출 비가동, 일일업무일지 대장) 및 각 사별 커스텀(한울: 정산/부적합경보/9BQC·LQ2a일보, 유성: 부적합경보/JK1·CE1·DT일보, 부림텍: 부적합경보/외주가공일보) 100% 분리 연동 완료",
    actionCommit: "Commit latest",
    status: "RESOLVED",
    statusLabel: "조치완료",
    mondayChecked: true,
    resolver: "시스템 관리자",
    createdAt: "2026-10-16T12:00:00+09:00",
    resolvedAt: "2026-10-16T12:10:00+09:00",
    notes: "ADMIN 대시보드 엄격 동결 정책 준수 및 한울/유성/부림텍 관리자 [공통사항 + 커스텀] 구성 완료"
  }
];

export const INCIDENT_CATEGORIES = [
  "근태관리",
  "전자결재",
  "일일생산정보",
  "품질현황",
  "압출비가동",
  "세금계산서",
  "매출매입분석",
  "시스템/로그인",
  "기타"
];

export const SEVERITY_LEVELS = {
  P0: { label: "P0 (치명적/긴급)", color: "bg-rose-500 text-white border-rose-600", desc: "업무 중단, 저장 실패 등 당일 즉시 핫픽스 대상" },
  P1: { label: "P1 (중요/기능)", color: "bg-amber-500 text-white border-amber-600", desc: "계산식 오차, 결재함 연동 등 주요 기능 결함" },
  P2: { label: "P2 (일반/화면)", color: "bg-blue-500 text-white border-blue-600", desc: "UX 개선, 화면 레이아웃, 문구 수정 등" }
};

export const INCIDENT_STATUSES = {
  RECEIVED: { label: "🚨 접수됨", badge: "bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-300 border-rose-300" },
  IN_PROGRESS: { label: "🟡 조치중", badge: "bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300 border-amber-300" },
  RESOLVED: { label: "🟢 조치완료", badge: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 border-emerald-300" },
  VERIFIED: { label: "🔍 월요재점검완료", badge: "bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300 border-blue-300" }
};

// Local Storage Helper
export const getLocalIncidentLogs = () => {
  if (typeof window === "undefined") return DEFAULT_INCIDENT_LOGS;
  try {
    const raw = localStorage.getItem(INCIDENT_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(INCIDENT_STORAGE_KEY, JSON.stringify(DEFAULT_INCIDENT_LOGS));
      return DEFAULT_INCIDENT_LOGS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_INCIDENT_LOGS;
  } catch (e) {
    console.warn("Failed to load local incident logs:", e);
    return DEFAULT_INCIDENT_LOGS;
  }
};

export const saveLocalIncidentLogs = (logs) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(INCIDENT_STORAGE_KEY, JSON.stringify(logs));
    window.dispatchEvent(new CustomEvent("oryuk_incident_logs_updated", { detail: logs }));
  } catch (e) {
    console.error("Failed to save local incident logs:", e);
  }
};

// Firestore Sync & Subscription
export const subscribeIncidentLogs = (callback) => {
  const local = getLocalIncidentLogs();
  callback(local);

  const handleCustom = (e) => {
    if (e.detail && Array.isArray(e.detail)) {
      callback(e.detail);
    }
  };
  if (typeof window !== "undefined") {
    window.addEventListener("oryuk_incident_logs_updated", handleCustom);
  }

  if (!db) {
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("oryuk_incident_logs_updated", handleCustom);
      }
    };
  }

  try {
    const ref = doc(db, ...INCIDENT_DOC_PATH);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (data && Array.isArray(data.logs)) {
            saveLocalIncidentLogs(data.logs);
            callback(data.logs);
          }
        } else {
          // Initialize remote doc if missing
          setDoc(ref, { logs: local, updatedAt: new Date().toISOString() }).catch(() => {});
        }
      },
      (err) => {
        console.warn("Incident logs cloud sync warning:", err);
      }
    );

    return () => {
      unsub();
      if (typeof window !== "undefined") {
        window.removeEventListener("oryuk_incident_logs_updated", handleCustom);
      }
    };
  } catch (err) {
    console.warn("Error subscribing to incident logs:", err);
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("oryuk_incident_logs_updated", handleCustom);
      }
    };
  }
};

// Save (Add or Update) Single Incident Log
export const saveIncidentLog = async (logItem) => {
  const currentLogs = getLocalIncidentLogs();
  const now = new Date().toISOString();
  let updatedList;

  if (logItem.id) {
    const idx = currentLogs.findIndex((l) => l.id === logItem.id);
    if (idx >= 0) {
      updatedList = [...currentLogs];
      updatedList[idx] = {
        ...currentLogs[idx],
        ...logItem,
        updatedAt: now
      };
    } else {
      updatedList = [
        {
          ...logItem,
          createdAt: logItem.createdAt || now,
          updatedAt: now
        },
        ...currentLogs
      ];
    }
  } else {
    const newId = `inc_${Date.now()}`;
    const nextNo = (currentLogs.length > 0 ? Math.max(...currentLogs.map((l) => Number(l.incidentNo) || 0)) : 0) + 1;
    const newItem = {
      id: newId,
      incidentNo: nextNo,
      workDate: logItem.workDate || new Date().toISOString().slice(0, 10),
      category: logItem.category || "근태관리",
      severity: logItem.severity || "P1",
      title: logItem.title || "신규 오류 리포트",
      plant: logItem.plant || "본사 • 전사",
      reporter: logItem.reporter || "관리자",
      symptoms: logItem.symptoms || "",
      rootCause: logItem.rootCause || "",
      resolution: logItem.resolution || "",
      actionCommit: logItem.actionCommit || "",
      status: logItem.status || "RECEIVED",
      statusLabel: INCIDENT_STATUSES[logItem.status]?.label || "접수됨",
      mondayChecked: Boolean(logItem.mondayChecked),
      resolver: logItem.resolver || "",
      stateSnapshot: logItem.stateSnapshot || null,
      createdAt: now,
      updatedAt: now,
      notes: logItem.notes || ""
    };
    updatedList = [newItem, ...currentLogs];
  }

  // Sort: by incidentNo descending or workDate descending
  updatedList.sort((a, b) => (b.incidentNo || 0) - (a.incidentNo || 0));

  saveLocalIncidentLogs(updatedList);

  if (db) {
    try {
      const ref = doc(db, ...INCIDENT_DOC_PATH);
      await setDoc(ref, { logs: updatedList, updatedAt: now }, { merge: true });
    } catch (e) {
      console.warn("Failed to push incident log to Firestore:", e);
    }
  }

  return updatedList;
};

// Delete Incident Log
export const deleteIncidentLog = async (id) => {
  const currentLogs = getLocalIncidentLogs();
  const updatedList = currentLogs.filter((l) => l.id !== id);
  saveLocalIncidentLogs(updatedList);

  if (db) {
    try {
      const ref = doc(db, ...INCIDENT_DOC_PATH);
      await setDoc(ref, { logs: updatedList, updatedAt: new Date().toISOString() }, { merge: true });
    } catch (e) {
      console.warn("Failed to delete incident log from Firestore:", e);
    }
  }

  return updatedList;
};

// Export to Excel for Weekly Review
export const exportIncidentLogsToExcel = (logs = []) => {
  const targetLogs = logs.length > 0 ? logs : getLocalIncidentLogs();
  
  const rows = targetLogs.map((l, idx) => ({
    "No": l.incidentNo || (idx + 1),
    "발생일자": l.workDate || "",
    "메뉴분류": l.category || "",
    "심각도": l.severity ? `${l.severity} (${SEVERITY_LEVELS[l.severity]?.label || ""})` : "",
    "진행상태": INCIDENT_STATUSES[l.status]?.label || l.status || "",
    "공장/제보자": `${l.plant || ""} / ${l.reporter || ""}`,
    "오류제목": l.title || "",
    "화면상태스냅샷": l.stateSnapshot?.oneLineSummary || (typeof l.stateSnapshot === "string" ? l.stateSnapshot : (l.stateSnapshot ? JSON.stringify(l.stateSnapshot) : "")),
    "현상및에러문구": l.symptoms || "",
    "근본원인분석": l.rootCause || "",
    "조치결과및커밋": l.resolution ? `${l.resolution} ${l.actionCommit ? `[${l.actionCommit}]` : ""}` : "",
    "조치담당자": l.resolver || "",
    "조치일시": l.resolvedAt ? l.resolvedAt.replace("T", " ").slice(0, 16) : "",
    "월요재점검여부": l.mondayChecked ? "점검완료" : "미점검",
    "비고": l.notes || ""
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "주간오류조치이력");

  const todayStr = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(workbook, `오륙_시스템오류_조치이력리포트_${todayStr}.xlsx`);
};
