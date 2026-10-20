import { doc, getDoc, setDoc, onSnapshot, runTransaction } from "firebase/firestore";
import { db } from "../firebase.js";
import * as XLSX from "xlsx";

const INCIDENT_STORAGE_KEY = "oryuk_system_incident_logs_v5";
const INCIDENT_DOC_PATH = ["system_management", "incident_logs"];

// 간결하고 명확한 일자별 누적 오더 및 조치 결과 데이터 (핵심 로직 수정 전·후 비교 포함)
export const DEFAULT_INCIDENT_LOGS = [
  // ─── 2026-10-20 (오늘 오더 및 조치 내역) ───
  {
    id: "inc_20261020_08",
    incidentNo: 17,
    workDate: "2026-10-20",
    category: "품질/변동점",
    severity: "P1",
    isLogicFix: true,
    title: "백엔드 비즈니스 검증 레이어(Firestore Rules 불변 락) 및 원자적 트랜잭션(Race Condition 방어) 구축",
    plant: "전사 공통",
    reporter: "대표이사 (권태형)",
    orderContent: "백엔드 비즈니스 검증 레이어 부재와 브라우저 로컬 스토리지 과다 의존으로 인한 동시 수정 경합(P2 취약점 2종)을 즉시 수정하여 데이터 무결성 보장 요청",
    actionResult: "Firestore Security Rules에 발생일자/기안자 불변 락 규칙 신설 및 클라우드 배포 완료, runTransaction 기반 원자적 트랜잭션 머지 파이프라인 구축 완료",
    logicBefore: "1) Firestore Rules가 전면 개방되어 있어 클라이언트 우회 호출 시 발생일자 변조 가능, 2) 로컬스토리지 배열을 먼저 덮어쓰고 setDoc으로 Firestore 전체 배열을 덮어써서 동시 접속 시 다른 관리자의 수정 내역이 유실되던 Last-Write-Wins 경합 결함",
    logicAfter: "1) Firestore Security Rules에 request.resource.data.date == resource.data.date 불변 락 규칙을 클라우드 레벨에 강제 배포, 2) runTransaction을 적용하여 클라우드 최신 원장을 Single Source of Truth로 읽고 원자적으로 머지하여 동시 수정 시에도 데이터 유실이 원천 발생하지 않도록 개선",
    prevention: "Firestore 보안 규칙 클라우드 배포 완료 및 동시 수정 트랜잭션 머지 원자성 검증 완료",
    status: "RESOLVED",
    statusLabel: "조치완료",
    mondayChecked: true,
    resolver: "시스템 관리자",
    createdAt: "2026-10-20T12:30:00+09:00",
    resolvedAt: "2026-10-20T12:40:00+09:00",
    notes: "P2 취약점 2종(서버 검증 레이어 + 트랜잭션 동시성) 조치 완료"
  },
  {
    id: "inc_20261020_07",
    incidentNo: 16,
    workDate: "2026-10-20",
    category: "화면/패널개편",
    severity: "P2",
    isLogicFix: false,
    title: "TEST 뱃지 레고블록 작업일보 빌더 1줄 바 개편 및 시인성 개선",
    plant: "전사 공통",
    reporter: "현장 관리자",
    orderContent: "TEST 뱃지의 레고블록 작업일보 빌더 패널이 화면을 너무 많이 차지하고 시인성이 떨어지므로, 1줄짜리 슬림한 바(Bar) 형태로 단순하고 깔끔하게 재구성 요청",
    actionResult: "거대 배너와 세로 찌그러짐을 제거하고 [🧱 레고블록 작업일보 빌더]를 1줄 슬림 바 형태로 전면 개편. 버튼 크기 및 폰트 가독성을 대폭 향상시켜 시인성 개선 완료",
    status: "RESOLVED",
    statusLabel: "조치완료",
    mondayChecked: true,
    resolver: "시스템 관리자",
    createdAt: "2026-10-20T11:00:00+09:00",
    resolvedAt: "2026-10-20T11:15:00+09:00",
    notes: "LegoWorkReportBuilderBar 컴포넌트 신설 및 1줄 고시인성 바 레이아웃 적용 완료"
  },
  {
    id: "inc_20261020_06",
    incidentNo: 15,
    workDate: "2026-10-20",
    category: "화면/패널개편",
    severity: "P1",
    isLogicFix: false,
    title: "ADMIN 일보양식관리 메뉴 삭제 및 TEST 뱃지 전담 이관",
    plant: "본사 • 전사",
    reporter: "대표이사 (권태형)",
    orderContent: "ADMIN 사이드바 메뉴에서 '일보 양식 관리'를 삭제하고, TEST 뱃지에서만 전담하여 관리할 수 있도록 메뉴 정리 요청",
    actionResult: "ADMIN 사이드바 탭 및 관리자 화면에서 '일보 양식 관리' 메뉴를 완전히 삭제 완료. TEST 뱃지 화면에서만 안전하게 일보 양식을 편집/관리하도록 단독 이관 완료",
    status: "RESOLVED",
    statusLabel: "조치완료",
    mondayChecked: true,
    resolver: "시스템 관리자",
    createdAt: "2026-10-20T10:40:00+09:00",
    resolvedAt: "2026-10-20T10:55:00+09:00",
    notes: "ADMIN 사이드바 탭 7개로 슬림화, TEST 뱃지에서 일보양식관리 단독 유지"
  },
  {
    id: "inc_20261020_05",
    incidentNo: 14,
    workDate: "2026-10-20",
    category: "화면/패널개편",
    severity: "P1",
    isLogicFix: false,
    title: "TEST 뱃지 1·2·3·5 패널 삭제 및 일보양식관리 연동",
    plant: "전사 공통",
    reporter: "대표이사 (권태형)",
    orderContent: "TEST 뱃지 첫 화면의 1번(생산목표), 2번(설비가동), 3번(품질현황), 5번(종합일지) 패널을 삭제하고 ADMIN에 있던 일보양식관리를 배치하여 관리하도록 수정 요청",
    actionResult: "TEST 뱃지에서 불필요한 1, 2, 3, 5번 패널을 완전히 삭제 정리하고, 일보 양식 관리 뷰와 바로 연결하여 깔끔한 단일 작업 워크스페이스 구축 완료",
    status: "RESOLVED",
    statusLabel: "조치완료",
    mondayChecked: true,
    resolver: "시스템 관리자",
    createdAt: "2026-10-20T10:15:00+09:00",
    resolvedAt: "2026-10-20T10:30:00+09:00",
    notes: "TEST 뱃지 화면 최적화 완료"
  },
  {
    id: "inc_20261020_04",
    incidentNo: 13,
    workDate: "2026-10-20",
    category: "계정/권한",
    severity: "P2",
    isLogicFix: false,
    title: "첫 로그인 화면 정현규 뱃지 영구 삭제 및 작업자 인원수 정비",
    plant: "한림공장",
    reporter: "대표이사 (권태형)",
    orderContent: "첫 로그인 화면에서 정현규 뱃지를 완전히 삭제하고 관련 인원수 및 알림 정비 요청",
    actionResult: "첫 화면 관리자/작업자 뱃지 목록에서 정현규 계정 제거 완료. 한림공장 작업자 카운트를 5명으로 재조정하고 텔레그램 연동 알림 대상에서도 안전하게 제외",
    status: "RESOLVED",
    statusLabel: "조치완료",
    mondayChecked: true,
    resolver: "시스템 관리자",
    createdAt: "2026-10-20T09:45:00+09:00",
    resolvedAt: "2026-10-20T09:55:00+09:00",
    notes: "한림공장 현장 인원 5명 일치화 검증 완료"
  },
  {
    id: "inc_20261020_03",
    incidentNo: 12,
    workDate: "2026-10-20",
    category: "화면/패널개편",
    severity: "P1",
    isLogicFix: false,
    title: "이창엽 책임 전용 화면 개편 (품질 밑 변동점 배치 및 불필요 패널 삭제)",
    plant: "삼랑진공장",
    reporter: "대표이사 (권태형)",
    orderContent: "이창엽 책임 로그인 화면에서 중대재해 한줄 패널, 근태현황 패널, 압출동 주간 비가동 패널을 삭제하고, TEST에 있던 4M 변동점 패널을 [3. 중요ITEM 품질현황] 바로 밑으로 이동 배치 요청",
    actionResult: "이창엽 책임 화면에서 요청한 3개 패널 삭제 완료. TEST 뱃지의 4M 변동점 패널을 삭제하고 이창엽 책임 화면의 품질현황 바로 아래로 이동 배치하여 품질과 변동점을 집중 관리하도록 최적화 완료",
    status: "RESOLVED",
    statusLabel: "조치완료",
    mondayChecked: true,
    resolver: "시스템 관리자",
    createdAt: "2026-10-20T09:20:00+09:00",
    resolvedAt: "2026-10-20T09:35:00+09:00",
    notes: "이창엽 책임 전용 맞춤 화면 구성 완료"
  },
  {
    id: "inc_20261020_02",
    incidentNo: 11,
    workDate: "2026-10-20",
    category: "품질/변동점",
    severity: "P0",
    isLogicFix: true,
    title: "부적합경보 및 4M 변동점 발생일자 임의수정 원천 차단 및 등록일시 고정 로직 적용",
    plant: "삼랑진 / 한림공장",
    reporter: "대표이사 (권태형)",
    orderContent: "부적합경보 및 변동점(LQ2 천공간격불량 등 9/30 발생건)의 발생일자가 앱에서 임의로 수정되어 재등록되는 현상을 원천 차단하고, 목록 화면에 실제 등록일자도 명확히 보이도록 수정 요청",
    actionResult: "발생일자 입력란 잠금(Disabled/Read-Only) 및 불변(Immutable) 보존 로직 적용 완료. 화면 목록에 최초 등록일시(createdAt) 분리 표출 완료",
    logicBefore: "조치 등록 및 수정 모달에서 발생일자(issueDate) 입력 필드가 수정 가능한 활성 상태여서, 작업자가 조치 저장 시 현재 폼의 날짜로 발생일자가 덮어씌워져 9/30 발생건이 당일 발생건으로 변조 등록되던 결함 로직",
    logicAfter: "1) UI 입력단에서 발생일자 필드를 완전 Read-Only/Disabled 처리하여 수정 불가능하도록 잠금, 2) 저장 서비스 함수에서 전달된 날짜를 무시하고 원본 발생일자(original.issueDate)를 강제 유지하는 불변 락(Immutable Lock) 로직 적용, 3) 최초 생성 시 시스템 타임스탬프인 등록일시(createdAt)를 영구 분리 표출하는 로직 구현",
    prevention: "작업자가 수정 폼을 열어도 발생일자는 수정이 불가하며, 저장 시에도 최초 발생일과 시스템 등록일시가 100% 영구 보존됨을 검증 완료",
    status: "RESOLVED",
    statusLabel: "조치완료",
    mondayChecked: true,
    resolver: "시스템 관리자",
    createdAt: "2026-10-20T08:50:00+09:00",
    resolvedAt: "2026-10-20T09:10:00+09:00",
    notes: "임의 수정 차단 및 데이터 무결성 검증 완료"
  },
  {
    id: "inc_20261020_01",
    incidentNo: 10,
    workDate: "2026-10-20",
    category: "근태관리",
    severity: "P0",
    isLogicFix: true,
    title: "근태현황 더미 데이터 자동 생성 및 자동 복구(Auto-Heal) 파이프라인 영구 파기",
    plant: "본사 • 전사",
    reporter: "대표이사 (권태형)",
    orderContent: "근태현황에 남아있던 불필요한 더미 데이터를 삭제하고, 삭제 후에도 더미가 다시 자동 생성되지 않도록 배관 구조 정비 요청",
    actionResult: "더미 생성 로직 및 자동 복구 파이프라인 완전 제거 완료. 실제 현장 입력 데이터만 보존되도록 단방향 안전 배관 구조 확립",
    logicBefore: "과거 데모 화면용으로 작성되었던 '더미 자동 주입(Mock Seed Auto-Injection)' 로직이 상주하여, 관리자가 더미 데이터를 삭제하더라도 원장에 빈 셀이 감지되면 시스템이 데이터 유실로 오판하여 이전 더미를 다시 생성해 채워 넣는 악순환 로직 작동",
    logicAfter: "더미 자동 주입 함수를 완전히 파기하고, 데이터가 비어있을 경우 인위적인 복구를 수행하지 않고 빈 상태를 정상 유지하며, 오직 현장 작업자나 관리자가 직접 등록한 실데이터만 Firestore에 단방향으로 기록·조회되도록 배관 로직 전면 교체",
    prevention: "더미 데이터 삭제 후 새로고침 및 재로그인 시에도 더미가 절대 부활하지 않고 실제 현장 데이터만 100% 온전히 유지됨 검증 완료",
    status: "RESOLVED",
    statusLabel: "조치완료",
    mondayChecked: true,
    resolver: "시스템 관리자",
    createdAt: "2026-10-20T08:20:00+09:00",
    resolvedAt: "2026-10-20T08:40:00+09:00",
    notes: "실데이터 보존 및 배관 구조 정상화 완료"
  },

  // ─── 2026-10-19 오더 및 조치 내역 ───
  {
    id: "inc_20261019_01",
    incidentNo: 9,
    workDate: "2026-10-19",
    category: "일일생산정보",
    severity: "P1",
    isLogicFix: false,
    title: "레고블록 작업일보 빌더 17종 서식 블록 모듈화 엔진 구축",
    plant: "삼랑진 / 한림공장",
    reporter: "현장 관리자",
    orderContent: "공장 현장 일보 서식 17종의 실물 디자인을 정밀 분석하여 블록 조합형 레고 작업일보 빌더 구축 요청",
    actionResult: "17종 전체 서식 블록(공정실적, 비가동, 특이사항, 서명란 등)을 모듈화하여 자유롭게 조립·저장하는 레고 빌더 엔진 개발 완료",
    status: "RESOLVED",
    statusLabel: "조치완료",
    mondayChecked: true,
    resolver: "시스템 관리자",
    createdAt: "2026-10-19T14:00:00+09:00",
    resolvedAt: "2026-10-19T16:00:00+09:00",
    notes: "17종 레고 블록 카탈로그화 및 프리셋 저장 기능 탑재"
  },

  // ─── 2026-10-18 오더 및 조치 내역 ───
  {
    id: "inc_20261018_01",
    incidentNo: 8,
    workDate: "2026-10-18",
    category: "일일생산정보",
    severity: "P1",
    isLogicFix: false,
    title: "SQ 심사 대비 진행상황 현황표 구축 및 텔레그램 실시간 알림 연동",
    plant: "본사 • 전사",
    reporter: "대표이사 (권태형)",
    orderContent: "SQ 심사 준비를 위한 공정/품질 항목별 진행상황 현황표를 구축하고 주요 변동 시 텔레그램 알림 발송 요청",
    actionResult: "SQ 레벨업 현황표 및 심사 항목 체크리스트 구축, 텔레그램 봇 자동 알림 연동 완료",
    status: "RESOLVED",
    statusLabel: "조치완료",
    mondayChecked: true,
    resolver: "시스템 관리자",
    createdAt: "2026-10-18T10:00:00+09:00",
    resolvedAt: "2026-10-18T11:30:00+09:00",
    notes: "SQ 평가항목 실시간 추적 체계 완료"
  },

  // ─── 2026-10-16 오더 및 조치 내역 ───
  {
    id: "inc_20261016_05",
    incidentNo: 7,
    workDate: "2026-10-16",
    category: "일일생산정보",
    severity: "P0",
    isLogicFix: true,
    title: "외주 지출 및 비가동 연산 시 비배열 데이터 유입 방어 로직(Array.isArray) 적용",
    plant: "한림공장 (한울)",
    reporter: "한울 (hal_hu)",
    orderContent: "한울 관리자 계정이나 모바일로 접속 시 화면이 멈추거나 중단되는 현상 해결 요청",
    actionResult: "비배열 데이터 유입 시에도 안전하게 빈 목록으로 대체하고 reduce 연산을 건너뛰는 Array.isArray() 방어 로직 적용 완료",
    logicBefore: "외주 지출 및 비가동 목록 집계 시 서버에서 데이터가 null, undefined 또는 단일 객체 형태로 반환되었을 때, 데이터 타입 검증 없이 즉시 `records.reduce()`를 호출하여 `TypeError: E.reduce is not a function` 크래시가 발생하는 결함 로직",
    logicAfter: "`Array.isArray(records) ? records.reduce(...) : 0` 형태의 안전 삼항 방어 로직을 전 공정 통계 연산부에 일괄 주입하고, 비정상 데이터가 유입되더라도 화면 크래시 없이 안전하게 기본값(0 또는 빈 배열)으로 폴백 처리하도록 로직 수정",
    prevention: "네트워크 결측이나 비정상 응답 시에도 화면이 멈추지 않고 안전하게 복구 렌더링됨 확인",
    status: "RESOLVED",
    statusLabel: "조치완료",
    mondayChecked: true,
    resolver: "시스템 관리자",
    createdAt: "2026-10-16T08:30:00+09:00",
    resolvedAt: "2026-10-16T08:50:00+09:00",
    notes: "배열 안전 검증 및 크래시 가드 적용"
  },
  {
    id: "inc_20261016_04",
    incidentNo: 6,
    workDate: "2026-10-16",
    category: "화면/패널개편",
    severity: "P1",
    isLogicFix: true,
    title: "협력사 관리자 과도 격리 해제 및 공통사항 병렬 표출 로직 적용",
    plant: "삼랑진 / 한림공장 (외주협력사)",
    reporter: "대표이사 (권태형)",
    orderContent: "협력사 관리자 로그인 시 공통 지표(전사 5개사 근태, 품질, 비가동)와 각 사별 커스텀 메뉴가 모두 정상 표출되도록 개편 요청",
    actionResult: "단일 회사 과도 필터링을 해제하고 전사 공통 지표와 협력사별 커스텀 메뉴를 병렬 렌더링하는 역할 기반 분리 로직 적용 완료",
    logicBefore: "협력사 관리자 로그인 시 소속 1개사로 대시보드 전체 데이터를 강제 필터링(`filteredCompanyOverviewStats = [1개사]`)하여, 협력사 관리자에게도 반드시 보여야 하는 전사 근태 종합 현황판 및 공통 품질/비가동 섹션까지 통째로 증발하던 로직 결함",
    logicAfter: "역할 기반 대시보드(HanulManager, PartnerManager 등)를 분리하고, 1) 상단 공통 섹션은 필터링 없이 전사 5개사 전체 데이터를 바인딩하고, 2) 하단 업무 섹션만 해당 협력사의 커스텀 기능(한울 정산, 부적합경보 등)으로 분기 렌더링하는 병렬 데이터 로직 구축",
    prevention: "한울, 유성, 부림텍 관리자 로그인 시 전사 근태 5개사와 본인 회사 특화 메뉴가 완벽히 병렬 표출됨 확인",
    status: "RESOLVED",
    statusLabel: "조치완료",
    mondayChecked: true,
    resolver: "시스템 관리자",
    createdAt: "2026-10-16T12:00:00+09:00",
    resolvedAt: "2026-10-16T12:20:00+09:00",
    notes: "협력사 관리자 공통지표 및 커스텀 분리 정상화"
  },
  {
    id: "inc_20261016_03",
    incidentNo: 5,
    workDate: "2026-10-16",
    category: "근태관리",
    severity: "P0",
    isLogicFix: true,
    title: "10/16 전사 5개사 근태 보고서 제출 판정 및 매트릭스 이중 검증(Dual Check) 로직 적용",
    plant: "삼랑진 / 한림공장 (전사)",
    reporter: "대표이사 (권태형)",
    orderContent: "10/16 근태보고서 등록 후 유성만 작성완료로 뜨고 다른 4개사는 작성전으로 표기되는 현상 수정 및 전사 143명 근태 매트릭스 일치화 요청",
    actionResult: "원장 셀과 보고서 제출 상태를 모두 교차 검증하는 이중 안전 판정 로직 적용 및 전사 143명 근태 데이터 100% 동기화 완료",
    logicBefore: "대시보드가 협력사의 보고서 제출 여부를 무시하고, 원장 매트릭스 셀의 `enteredCount > 0` 여부만 단독 검사하는 편향 로직이어서, 10/16 당일 오륙, 조영, 한울, 부림텍이 보고서를 정상 제출했음에도 대시보드 검사를 통과하지 못해 '작성전'으로 오표기되는 결함 발생",
    logicAfter: "`enteredCount > 0 || hasDirectReport || hasSubmittedReport`로 판정 로직을 개편하여 원장 셀과 보고서 제출 상태 중 하나라도 유효하면 즉시 '작성완료'로 판정하고, 보고서 저장 시 소속 143명 인원의 근태가 원장 매트릭스로 즉시 주입·동기화되도록 데이터 파이프라인 일원화 로직 구현",
    prevention: "전사 5개사 보고서 등록 시 즉시 [전사 완료 5/5] 표기 및 143명 출근 141명 / 1,359 M/H 기준치 100% 일치 확인",
    status: "RESOLVED",
    statusLabel: "조치완료",
    mondayChecked: true,
    resolver: "시스템 관리자",
    createdAt: "2026-10-16T10:40:00+09:00",
    resolvedAt: "2026-10-16T11:00:00+09:00",
    notes: "전사 143명 출근 및 특근 M/H 100% 일치"
  },
  {
    id: "inc_20261016_02",
    incidentNo: 4,
    workDate: "2026-10-16",
    category: "화면/패널개편",
    severity: "P1",
    isLogicFix: false,
    title: "ADMIN 관리자 대시보드 불필요 패널 4개 삭제 및 패널 추가 금지 동결 정책 수립",
    plant: "본사 • 전사",
    reporter: "대표이사 (권태형)",
    orderContent: "ADMIN 대시보드에서 불필요한 패널 4개를 영구 삭제하고 임의로 패널이 추가되지 않도록 동결 조치 요청",
    actionResult: "ADMIN 1, 4, 5, 6번 패널 완전 삭제 및 패널 추가 금지 코드 동결 정책 적용 완료",
    status: "RESOLVED",
    statusLabel: "조치완료",
    mondayChecked: true,
    resolver: "시스템 관리자",
    createdAt: "2026-10-16T09:40:00+09:00",
    resolvedAt: "2026-10-16T10:00:00+09:00",
    notes: "ADMIN 대시보드 레이아웃 고정 및 불필요 패널 차단"
  },
  {
    id: "inc_20261016_01",
    incidentNo: 3,
    workDate: "2026-10-16",
    category: "전자결재",
    severity: "P0",
    isLogicFix: true,
    title: "전자결재 결재대기 목록 및 상단 배지 동기화 복구 및 실시간 트리거 로직 적용",
    plant: "본사 (대표 결재함)",
    reporter: "대표이사 (권태형)",
    orderContent: "주말 특근 결재 문서 2건이 대기함 및 상단 배지([전자결재 2])에 정상 표시되도록 복구 요청",
    actionResult: "Firestore 실시간 스냅샷 리스너 연동 및 결재대기 카운트 즉시 재계산 트리거 로직 적용 완료",
    logicBefore: "문서 상태 변경 시 상단 헤더 배지 카운트 연산 로직이 Firestore 실시간 이벤트를 구독하지 않고 정적 캐시 값만 참조하여, 주말 특근 결재 문서 승인/반려 시 상단 카운트와 실제 대기함 목록 간 데이터 불일치 및 누락 발생",
    logicAfter: "1) approvalService 내 Firestore `onSnapshot` 실시간 리스너를 헤더 배지와 직결, 2) 문서 상태 변동 시 결재대기 카운트를 1초 내에 자동 재연산하는 동적 이벤트 트리거 로직을 구축하여 결재 문서 상태와 배지 카운트 완벽 일치화",
    prevention: "특근 결재 문서 2건 안전 복구 및 대표 결재함 실시간 배지 연동 검증 완료",
    status: "RESOLVED",
    statusLabel: "조치완료",
    mondayChecked: true,
    resolver: "시스템 관리자",
    createdAt: "2026-10-16T10:05:00+09:00",
    resolvedAt: "2026-10-16T10:20:00+09:00",
    notes: "주말 결재대기 2건 정상 연동 확인"
  },

  // ─── 2026-10-15 오더 및 조치 내역 ───
  {
    id: "inc_20261015_02",
    incidentNo: 2,
    workDate: "2026-10-15",
    category: "일일생산정보",
    severity: "P1",
    isLogicFix: false,
    title: "현장 작업자 로그인 시 작업일보 전용 초슬림 화면 제공",
    plant: "삼랑진 / 한림공장",
    reporter: "현장 작업자 및 대표",
    orderContent: "현장 작업자가 로그인하면 관리자 지표를 숨기고 작업일보 작성 및 본인 결재 확인에만 집중할 수 있는 단순 화면 제공 요청",
    actionResult: "작업자 전용 단독 모드 구축. 사이드바를 작업일보 전용으로 슬림화하고 원클릭 일보작성 연동 완료",
    status: "RESOLVED",
    statusLabel: "조치완료",
    mondayChecked: true,
    resolver: "시스템 관리자",
    createdAt: "2026-10-15T10:00:00+09:00",
    resolvedAt: "2026-10-15T10:15:00+09:00",
    notes: "현장 작업자 전용 슬림 화면 완성"
  },
  {
    id: "inc_20261015_01",
    incidentNo: 1,
    workDate: "2026-10-15",
    category: "근태관리",
    severity: "P0",
    isLogicFix: true,
    title: "근태 최종 저장 함수 내 변수 참조 순서 정상화 및 평일 정시 자동완성 로직 적용",
    plant: "삼랑진 / 한림공장",
    reporter: "공장 현장관리자",
    orderContent: "근태 보고서 등록 시 저장 실패 현상 해결 및 평일 미선택 인원 자동 보정 요청",
    actionResult: "변수 선언문 최상단 재배치로 호이스팅 에러 차단 완료, 평일 미선택 인원 '정시(🟢)' 원클릭 자동 보정 확인창 적용 완료",
    logicBefore: "보고서 저장 함수 내부에서 관리자 서명 정보 `compMeta.author`를 호출하는 코드가 변수 선언문(`const compMeta = ...`)보다 윗라인에 위치하여 브라우저에서 'Cannot access before initialization' 중단 오류 발생 및 평일 미선택 인원 존재 시 저장이 강제 차단되는 결함 로직",
    logicAfter: "1) `compMeta` 선언문을 함수 최상단으로 재배치하여 자바스크립트 변수 참조 순서 오류를 원천 차단, 2) 평일 미입력 인원이 감지되면 '정시(🟢)'로 자동 채울 것인지 묻는 원클릭 확인창(window.confirm) 자동 보정 로직을 추가하여 저장 편의성 극대화",
    prevention: "평일 미입력자가 있어도 원클릭 자동 정시 채우기 후 원스톱 정상 등록 검증 완료",
    status: "RESOLVED",
    statusLabel: "조치완료",
    mondayChecked: true,
    resolver: "시스템 관리자",
    createdAt: "2026-10-15T09:10:00+09:00",
    resolvedAt: "2026-10-15T09:20:00+09:00",
    notes: "평일 미선택자 정시 자동채우기 확인창 제공"
  }
];

export const INCIDENT_CATEGORIES = [
  "화면/패널개편",
  "품질/변동점",
  "근태관리",
  "일일생산정보",
  "전자결재",
  "계정/권한",
  "압출비가동",
  "세금계산서",
  "매출매입분석",
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

// Local Storage Helper (Mirror Replica of Cloud SSOT)
export const getLocalIncidentLogs = () => {
  if (typeof window === "undefined") return DEFAULT_INCIDENT_LOGS;
  try {
    const raw = localStorage.getItem(INCIDENT_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(INCIDENT_STORAGE_KEY, JSON.stringify(DEFAULT_INCIDENT_LOGS));
      return DEFAULT_INCIDENT_LOGS;
    }
    const parsed = JSON.parse(raw);
    // isLogicFix 필드가 없는 구버전인 경우 신규 기본 데이터로 자동 갱신
    if (!Array.isArray(parsed) || parsed.length === 0 || parsed[0].isLogicFix === undefined) {
      localStorage.setItem(INCIDENT_STORAGE_KEY, JSON.stringify(DEFAULT_INCIDENT_LOGS));
      return DEFAULT_INCIDENT_LOGS;
    }
    return parsed;
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
          if (data && Array.isArray(data.logs) && data.logs.length > 0 && data.logs[0].isLogicFix !== undefined) {
            saveLocalIncidentLogs(data.logs);
            callback(data.logs);
          } else {
            // 구버전 클라우드 데이터인 경우 신규 기본 데이터로 업그레이드
            setDoc(ref, { logs: DEFAULT_INCIDENT_LOGS, updatedAt: new Date().toISOString() }, { merge: true }).catch(() => {});
          }
        } else {
          // Initialize remote doc if missing
          setDoc(ref, { logs: DEFAULT_INCIDENT_LOGS, updatedAt: new Date().toISOString() }).catch(() => {});
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

// 🔒 [P2-5 & P2-6] 원자적 트랜잭션 (runTransaction) 기반 일일 오더 저장 (동시 수정 경합 완벽 방어)
export const saveIncidentLog = async (logItem) => {
  const now = new Date().toISOString();
  const orderText = logItem.orderContent || logItem.symptoms || "";
  const actionText = logItem.actionResult || logItem.resolution || "";

  // 1. [P2-6] 클라우드 DB 원자적 트랜잭션 실행 (클라우드 데이터를 Single Source of Truth로 락 처리)
  if (db) {
    try {
      const ref = doc(db, ...INCIDENT_DOC_PATH);
      const updatedList = await runTransaction(db, async (transaction) => {
        const snap = await transaction.get(ref);
        let cloudLogs = [];
        if (snap.exists()) {
          const data = snap.data();
          if (Array.isArray(data.logs)) {
            cloudLogs = data.logs;
          }
        }
        if (cloudLogs.length === 0) {
          cloudLogs = getLocalIncidentLogs();
        }

        let merged;
        if (logItem.id) {
          const idx = cloudLogs.findIndex((l) => l.id === logItem.id);
          if (idx >= 0) {
            const existing = cloudLogs[idx];
            merged = [...cloudLogs];
            merged[idx] = {
              ...existing,
              ...logItem,
              orderContent: orderText,
              actionResult: actionText,
              symptoms: orderText,
              resolution: actionText,
              // [P2-5] 불변 필드 보존 (생성일시 및 원래 발생일자는 사후 덮어쓰기 방어)
              workDate: existing.workDate || logItem.workDate || now.slice(0, 10),
              createdAt: existing.createdAt || now,
              updatedAt: now
            };
          } else {
            merged = [
              {
                ...logItem,
                orderContent: orderText,
                actionResult: actionText,
                symptoms: orderText,
                resolution: actionText,
                createdAt: logItem.createdAt || now,
                updatedAt: now
              },
              ...cloudLogs
            ];
          }
        } else {
          const newId = `inc_${Date.now()}`;
          const nextNo = (cloudLogs.length > 0 ? Math.max(...cloudLogs.map((l) => Number(l.incidentNo) || 0)) : 0) + 1;
          const newItem = {
            ...logItem,
            id: newId,
            incidentNo: nextNo,
            workDate: logItem.workDate || now.slice(0, 10),
            category: logItem.category || "화면/패널개편",
            severity: logItem.severity || "P1",
            title: logItem.title || "신규 작업 오더",
            plant: logItem.plant || "본사 • 전사",
            reporter: logItem.reporter || "대표이사",
            orderContent: orderText,
            symptoms: orderText,
            actionResult: actionText,
            resolution: actionText,
            isLogicFix: Boolean(logItem.isLogicFix),
            logicBefore: logItem.logicBefore || "",
            logicAfter: logItem.logicAfter || "",
            prevention: logItem.prevention || "",
            status: logItem.status || "RESOLVED",
            statusLabel: INCIDENT_STATUSES[logItem.status]?.label || "조치완료",
            mondayChecked: Boolean(logItem.mondayChecked),
            resolver: logItem.resolver || "시스템 관리자",
            createdAt: now,
            resolvedAt: logItem.status === "RESOLVED" || logItem.status === "VERIFIED" ? (logItem.resolvedAt || now) : null,
            updatedAt: now,
            notes: logItem.notes || ""
          };
          merged = [newItem, ...cloudLogs];
        }

        merged.sort((a, b) => {
          const dateA = a.workDate || "";
          const dateB = b.workDate || "";
          if (dateB !== dateA) return dateB.localeCompare(dateA);
          return (b.incidentNo || 0) - (a.incidentNo || 0);
        });

        transaction.set(ref, { logs: merged, updatedAt: now }, { merge: true });
        return merged;
      });

      // 클라우드 원장 반영 완료 후 로컬 캐시 동기화
      saveLocalIncidentLogs(updatedList);
      return updatedList;
    } catch (err) {
      console.warn("Firestore transaction failed, fallback to local:", err);
    }
  }

  // 2. 오프라인 폴백
  const currentLogs = getLocalIncidentLogs();
  let updatedList;
  if (logItem.id) {
    const idx = currentLogs.findIndex((l) => l.id === logItem.id);
    if (idx >= 0) {
      updatedList = [...currentLogs];
      updatedList[idx] = {
        ...currentLogs[idx],
        ...logItem,
        orderContent: orderText,
        actionResult: actionText,
        symptoms: orderText,
        resolution: actionText,
        updatedAt: now
      };
    } else {
      updatedList = [{ ...logItem, createdAt: now, updatedAt: now }, ...currentLogs];
    }
  } else {
    const newId = `inc_${Date.now()}`;
    const nextNo = (currentLogs.length > 0 ? Math.max(...currentLogs.map((l) => Number(l.incidentNo) || 0)) : 0) + 1;
    const newItem = {
      ...logItem,
      id: newId,
      incidentNo: nextNo,
      createdAt: now,
      updatedAt: now
    };
    updatedList = [newItem, ...currentLogs];
  }

  updatedList.sort((a, b) => (b.workDate || "").localeCompare(a.workDate || "") || (b.incidentNo || 0) - (a.incidentNo || 0));
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

// Reset to Fresh Default Logs
export const resetToDefaultIncidentLogs = async () => {
  saveLocalIncidentLogs(DEFAULT_INCIDENT_LOGS);
  if (db) {
    try {
      const ref = doc(db, ...INCIDENT_DOC_PATH);
      await setDoc(ref, { logs: DEFAULT_INCIDENT_LOGS, updatedAt: new Date().toISOString() });
    } catch (e) {
      console.warn("Failed to reset Firestore incident logs:", e);
    }
  }
  return DEFAULT_INCIDENT_LOGS;
};

// 🔒 [P2-6] 원자적 트랜잭션 (runTransaction) 기반 오더 삭제
export const deleteIncidentLog = async (id) => {
  if (db) {
    try {
      const ref = doc(db, ...INCIDENT_DOC_PATH);
      const updatedList = await runTransaction(db, async (transaction) => {
        const snap = await transaction.get(ref);
        let cloudLogs = [];
        if (snap.exists() && Array.isArray(snap.data().logs)) {
          cloudLogs = snap.data().logs;
        } else {
          cloudLogs = getLocalIncidentLogs();
        }
        const filtered = cloudLogs.filter((l) => l.id !== id);
        transaction.set(ref, { logs: filtered, updatedAt: new Date().toISOString() }, { merge: true });
        return filtered;
      });

      saveLocalIncidentLogs(updatedList);
      return updatedList;
    } catch (err) {
      console.warn("Firestore delete transaction fallback to local:", err);
    }
  }

  const currentLogs = getLocalIncidentLogs();
  const updatedList = currentLogs.filter((l) => l.id !== id);
  saveLocalIncidentLogs(updatedList);
  return updatedList;
};

// 🛡️ [P1] 엑셀 수식 주입(Formula Injection) 방어 살균 함수
const sanitizeForExcel = (val) => {
  if (val === null || val === undefined) return "";
  const str = String(val);
  // 문자열이 =, +, -, @ 로 시작하면 작은따옴표(')를 붙여 순수 텍스트로 강제 변환
  if (/^[=+\-@]/.test(str)) {
    return `'${str}`;
  }
  return str;
};

// Export to Excel for Easy Viewing (CSV/Excel Formula Injection Defended)
export const exportIncidentLogsToExcel = (logs = []) => {
  const targetLogs = logs.length > 0 ? logs : getLocalIncidentLogs();
  
  const rows = targetLogs.map((l, idx) => ({
    "No": l.incidentNo || (idx + 1),
    "일자": sanitizeForExcel(l.workDate || ""),
    "업무분류": sanitizeForExcel(l.category || ""),
    "로직수정여부": l.isLogicFix ? "🔧 핵심 로직 수정" : "일반 화면/배치 개편",
    "진행상태": sanitizeForExcel(INCIDENT_STATUSES[l.status]?.label || l.status || "조치완료"),
    "오더 제목": sanitizeForExcel(l.title || ""),
    "📋 [요청 오더 내용]": sanitizeForExcel(l.orderContent || l.symptoms || ""),
    "✅ [조치 및 반영 결과]": sanitizeForExcel(l.actionResult || l.resolution || ""),
    "⚠️ [기존 문제 로직]": sanitizeForExcel(l.logicBefore || "-"),
    "🛡️ [수정 변경 로직]": sanitizeForExcel(l.logicAfter || "-"),
    "재발방지 검증": sanitizeForExcel(l.prevention || "-"),
    "사업장/제보자": sanitizeForExcel(`${l.plant || ""} / ${l.reporter || ""}`),
    "조치담당자": sanitizeForExcel(l.resolver || "시스템 관리자"),
    "조치일시": sanitizeForExcel(l.resolvedAt ? l.resolvedAt.replace("T", " ").slice(0, 16) : ""),
    "비고": sanitizeForExcel(l.notes || "")
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "일일오더_조치관리대장");

  const todayStr = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(workbook, `오륙_일일오더_및_조치결과대장_${todayStr}.xlsx`);
};
