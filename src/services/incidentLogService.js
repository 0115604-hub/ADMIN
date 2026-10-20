import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase.js";
import * as XLSX from "xlsx";

const INCIDENT_STORAGE_KEY = "oryuk_system_incident_logs_v3";
const INCIDENT_DOC_PATH = ["system_management", "incident_logs"];

// 간결하고 알기 쉬운 일자별 누적 오더 및 조치 결과 기본 데이터 (작업자 친화적 서식)
export const DEFAULT_INCIDENT_LOGS = [
  // ─── 2026-10-20 (오늘 오더 및 조치 내역) ───
  {
    id: "inc_20261020_07",
    incidentNo: 15,
    workDate: "2026-10-20",
    category: "화면/패널개편",
    severity: "P2",
    title: "TEST 뱃지 레고블록 작업일보 빌더 1줄 바 개편 및 시인성 개선",
    plant: "전사 공통",
    reporter: "현장 관리자",
    orderContent: "TEST 뱃지의 레고블록 작업일보 빌더 패널이 화면을 너무 많이 차지하고 시인성이 떨어지므로, 1줄짜리 슬림한 바(Bar) 형태로 단순하고 깔끔하게 재구성 요청",
    symptoms: "TEST 뱃지의 레고블록 작업일보 빌더 패널이 화면을 너무 많이 차지하고 시인성이 떨어지므로, 1줄짜리 슬림한 바(Bar) 형태로 단순하고 깔끔하게 재구성 요청",
    actionResult: "거대 배너와 세로 찌그러짐을 제거하고 [🧱 레고블록 작업일보 빌더]를 1줄 슬림 바 형태로 전면 개편. 버튼 크기 및 폰트 가독성을 대폭 향상시켜 시인성 개선 완료",
    resolution: "거대 배너와 세로 찌그러짐을 제거하고 [🧱 레고블록 작업일보 빌더]를 1줄 슬림 바 형태로 전면 개편. 버튼 크기 및 폰트 가독성을 대폭 향상시켜 시인성 개선 완료",
    rootCause: "기존 빌더 배너 높이가 320px로 과다하여 첫 화면 시인성 저하 및 레이아웃 왜곡 발생",
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
    incidentNo: 14,
    workDate: "2026-10-20",
    category: "화면/패널개편",
    severity: "P1",
    title: "ADMIN 일보양식관리 메뉴 삭제 및 TEST 뱃지 전담 이관",
    plant: "본사 • 전사",
    reporter: "대표이사 (권태형)",
    orderContent: "ADMIN 사이드바 메뉴에서 '일보 양식 관리'를 삭제하고, TEST 뱃지에서만 전담하여 관리할 수 있도록 메뉴 정리 요청",
    symptoms: "ADMIN 사이드바 메뉴에서 '일보 양식 관리'를 삭제하고, TEST 뱃지에서만 전담하여 관리할 수 있도록 메뉴 정리 요청",
    actionResult: "ADMIN 사이드바 탭 및 관리자 화면에서 '일보 양식 관리' 메뉴를 완전히 삭제 완료. TEST 뱃지 화면에서만 안전하게 일보 양식을 편집/관리하도록 단독 이관 완료",
    resolution: "ADMIN 사이드바 탭 및 관리자 화면에서 '일보 양식 관리' 메뉴를 완전히 삭제 완료. TEST 뱃지 화면에서만 안전하게 일보 양식을 편집/관리하도록 단독 이관 완료",
    rootCause: "ADMIN과 TEST 뱃지 양쪽에 메뉴가 중복 노출되어 관리 주체 혼선 발생",
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
    incidentNo: 13,
    workDate: "2026-10-20",
    category: "화면/패널개편",
    severity: "P1",
    title: "TEST 뱃지 1·2·3·5 패널 삭제 및 일보양식관리 연동",
    plant: "전사 공통",
    reporter: "대표이사 (권태형)",
    orderContent: "TEST 뱃지 첫 화면의 1번(생산목표), 2번(설비가동), 3번(품질현황), 5번(종합일지) 패널을 삭제하고 ADMIN에 있던 일보양식관리를 배치하여 관리하도록 수정 요청",
    symptoms: "TEST 뱃지 첫 화면의 1번(생산목표), 2번(설비가동), 3번(품질현황), 5번(종합일지) 패널을 삭제하고 ADMIN에 있던 일보양식관리를 배치하여 관리하도록 수정 요청",
    actionResult: "TEST 뱃지에서 불필요한 1, 2, 3, 5번 패널을 완전히 삭제 정리하고, 일보 양식 관리 뷰와 바로 연결하여 깔끔한 단일 작업 워크스페이스 구축 완료",
    resolution: "TEST 뱃지에서 불필요한 1, 2, 3, 5번 패널을 완전히 삭제 정리하고, 일보 양식 관리 뷰와 바로 연결하여 깔끔한 단일 작업 워크스페이스 구축 완료",
    rootCause: "TEST 뱃지 화면에 현장과 무관한 일반 지표 패널들이 다수 배치되어 작업 집중도 저하",
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
    incidentNo: 12,
    workDate: "2026-10-20",
    category: "계정/권한",
    severity: "P2",
    title: "첫 로그인 화면 정현규 뱃지 영구 삭제 및 작업자 인원수 정비",
    plant: "한림공장",
    reporter: "대표이사 (권태형)",
    orderContent: "첫 로그인 화면에서 정현규 뱃지를 완전히 삭제하고 관련 인원수 및 알림 정비 요청",
    symptoms: "첫 로그인 화면에서 정현규 뱃지를 완전히 삭제하고 관련 인원수 및 알림 정비 요청",
    actionResult: "첫 화면 관리자/작업자 뱃지 목록에서 정현규 계정 제거 완료. 한림공장 작업자 카운트를 5명으로 재조정하고 텔레그램 연동 알림 대상에서도 안전하게 제외",
    resolution: "첫 화면 관리자/작업자 뱃지 목록에서 정현규 계정 제거 완료. 한림공장 작업자 카운트를 5명으로 재조정하고 텔레그램 연동 알림 대상에서도 안전하게 제외",
    rootCause: "퇴사 인원 계정이 첫 화면 로그인 뱃지 및 인원수 집계에 계속 잔류함",
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
    incidentNo: 11,
    workDate: "2026-10-20",
    category: "화면/패널개편",
    severity: "P1",
    title: "이창엽 책임 전용 화면 개편 (품질 밑 변동점 배치 및 불필요 패널 삭제)",
    plant: "삼랑진공장",
    reporter: "대표이사 (권태형)",
    orderContent: "이창엽 책임 로그인 화면에서 중대재해 한줄 패널, 근태현황 패널, 압출동 주간 비가동 패널을 삭제하고, TEST에 있던 4M 변동점 패널을 [3. 중요ITEM 품질현황] 바로 밑으로 이동 배치 요청",
    symptoms: "이창엽 책임 로그인 화면에서 중대재해 한줄 패널, 근태현황 패널, 압출동 주간 비가동 패널을 삭제하고, TEST에 있던 4M 변동점 패널을 [3. 중요ITEM 품질현황] 바로 밑으로 이동 배치 요청",
    actionResult: "이창엽 책임 화면에서 요청한 3개 패널 삭제 완료. TEST 뱃지의 4M 변동점 패널을 삭제하고 이창엽 책임 화면의 품질현황 바로 아래로 이동 배치하여 품질과 변동점을 집중 관리하도록 최적화 완료",
    resolution: "이창엽 책임 화면에서 요청한 3개 패널 삭제 완료. TEST 뱃지의 4M 변동점 패널을 삭제하고 이창엽 책임 화면의 품질현황 바로 아래로 이동 배치하여 품질과 변동점을 집중 관리하도록 최적화 완료",
    rootCause: "이창엽 책임 업무 영역에 맞지 않는 근태/비가동 패널 노출 및 변동점 패널의 TEST 뱃지 분산",
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
    incidentNo: 10,
    workDate: "2026-10-20",
    category: "품질/변동점",
    severity: "P0",
    title: "부적합경보 및 4M 변동점 발생일자 임의수정 절대금지 및 등록일시 표기",
    plant: "삼랑진 / 한림공장",
    reporter: "대표이사 (권태형)",
    orderContent: "부적합경보 및 변동점(LQ2 천공간격불량 등 9/30 발생건)의 발생일자가 임의 수정되어 재등록되는 현상 원천 차단 및 목록에 실제 등록일자도 함께 표기 요청",
    symptoms: "부적합경보 및 변동점(LQ2 천공간격불량 등 9/30 발생건)의 발생일자가 임의 수정되어 재등록되는 현상 원천 차단 및 목록에 실제 등록일자도 함께 표기 요청",
    actionResult: "발생일자 임의 변경 방지 락(Lock) 로직 적용 완료. 부적합경보 목록 카드 및 테이블에 최초 등록일시(createdAt)를 명확하게 표기하여 데이터 임의 수정 원천 방지 완료",
    resolution: "발생일자 임의 변경 방지 락(Lock) 로직 적용 완료. 부적합경보 목록 카드 및 테이블에 최초 등록일시(createdAt)를 명확하게 표기하여 데이터 임의 수정 원천 방지 완료",
    rootCause: "조치 및 수정 폼에서 발생일자 입력 필드가 활성화되어 작업자가 당일 날짜로 덮어쓰기 저장되는 허점 존재",
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
    incidentNo: 9,
    workDate: "2026-10-20",
    category: "근태관리",
    severity: "P0",
    title: "근태현황 더미 데이터 삭제 및 자동복구(더미 재생성) 오류 차단",
    plant: "본사 • 전사",
    reporter: "대표이사 (권태형)",
    orderContent: "근태현황에 남아있던 불필요한 더미 데이터를 삭제하고, 삭제 후에도 더미가 다시 자동 생성되지 않도록 배관 구조 정비 요청",
    symptoms: "근태현황에 남아있던 불필요한 더미 데이터를 삭제하고, 삭제 후에도 더미가 다시 자동 생성되지 않도록 배관 구조 정비 요청",
    actionResult: "더미 생성 로직 및 자동 복구 파이프라인 완전 제거 완료. 실제 현장 입력 데이터만 보존되도록 안전 배관 구조 확립 완료",
    resolution: "더미 생성 로직 및 자동 복구 파이프라인 완전 제거 완료. 실제 현장 입력 데이터만 보존되도록 안전 배관 구조 확립 완료",
    rootCause: "과거 데모용으로 작성되었던 더미 데이터 자동 주입 코드가 원장에 빈 셀 감지 시 작동함",
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
    incidentNo: 8,
    workDate: "2026-10-19",
    category: "일일생산정보",
    severity: "P1",
    title: "레고블록 작업일보 빌더 17종 서식 블록 모듈화 엔진 구축",
    plant: "삼랑진 / 한림공장",
    reporter: "현장 관리자",
    orderContent: "공장 현장 일보 서식 17종의 실물 디자인을 정밀 분석하여 블록 조합형 레고 작업일보 빌더 구축 요청",
    symptoms: "공장 현장 일보 서식 17종의 실물 디자인을 정밀 분석하여 블록 조합형 레고 작업일보 빌더 구축 요청",
    actionResult: "17종 전체 서식 블록(공정실적, 비가동, 특이사항, 서명란 등)을 모듈화하여 자유롭게 조립·저장하는 레고 빌더 엔진 개발 완료",
    resolution: "17종 전체 서식 블록(공정실적, 비가동, 특이사항, 서명란 등)을 모듈화하여 자유롭게 조립·저장하는 레고 빌더 엔진 개발 완료",
    rootCause: "고정된 단일 서식으로는 협력사별 다양한 일보 양식을 수용하기 어려움",
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
    incidentNo: 7,
    workDate: "2026-10-18",
    category: "일일생산정보",
    severity: "P1",
    title: "SQ 심사 대비 진행상황 현황표 구축 및 텔레그램 실시간 알림 연동",
    plant: "본사 • 전사",
    reporter: "대표이사 (권태형)",
    orderContent: "SQ 심사 준비를 위한 공정/품질 항목별 진행상황 현황표를 구축하고 주요 변동 시 텔레그램 알림 발송 요청",
    symptoms: "SQ 심사 준비를 위한 공정/품질 항목별 진행상황 현황표를 구축하고 주요 변동 시 텔레그램 알림 발송 요청",
    actionResult: "SQ 레벨업 현황표 및 심사 항목 체크리스트 구축, 텔레그램 봇 자동 알림 연동 완료",
    resolution: "SQ 레벨업 현황표 및 심사 항목 체크리스트 구축, 텔레그램 봇 자동 알림 연동 완료",
    rootCause: "SQ 심사 준비 진행률을 사내 및 메신저로 즉시 파악할 수 있는 일원화 창구 부재",
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
    id: "inc_20261016_04",
    incidentNo: 6,
    workDate: "2026-10-16",
    category: "화면/패널개편",
    severity: "P1",
    title: "협력사(한울·유성·부림텍) 관리자 전용 화면 분리 및 공통 관리사항 표출",
    plant: "삼랑진 / 한림공장 (외주협력사)",
    reporter: "대표이사 (권태형)",
    orderContent: "협력사 관리자 로그인 시 공통 지표(전사 5개사 근태, 품질, 비가동)와 각 사별 커스텀 메뉴가 모두 정상 표출되도록 개편 요청",
    symptoms: "협력사 관리자 로그인 시 공통 지표(전사 5개사 근태, 품질, 비가동)와 각 사별 커스텀 메뉴가 모두 정상 표출되도록 개편 요청",
    actionResult: "역할 기반 4대 전용 뷰 분리 구축 완료. 공통 지표(전사 근태 5개사, 일일품질, 비가동)와 각 협력사별 커스텀 메뉴 완벽 분리 연동 완료",
    resolution: "역할 기반 4대 전용 뷰 분리 구축 완료. 공통 지표(전사 근태 5개사, 일일품질, 비가동)와 각 협력사별 커스텀 메뉴 완벽 분리 연동 완료",
    rootCause: "단일 대시보드에서 협력사를 1개사로 과도하게 필터링하여 전사 공통 지표가 함께 누락됨",
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
    title: "10/16 전사 5개사 143명 근태 매트릭스 및 보고서 동기화",
    plant: "삼랑진 / 한림공장 (전사)",
    reporter: "대표이사 (권태형)",
    orderContent: "10/16 근태보고서 등록 후 특정 회사만 작성완료로 뜨는 현상 수정 및 전사 143명 근태 매트릭스 전수 일치화 요청",
    symptoms: "10/16 근태보고서 등록 후 특정 회사만 작성완료로 뜨는 현상 수정 및 전사 143명 근태 매트릭스 전수 일치화 요청",
    actionResult: "전사 143명 근태 데이터 및 보고서 100% 동기화 완료. 전사 5개사 완료율 정상 표기 달성",
    resolution: "전사 143명 근태 데이터 및 보고서 100% 동기화 완료. 전사 5개사 완료율 정상 표기 달성",
    rootCause: "보고서 제출 여부와 원장 셀 작성 여부의 판정 불일치로 인한 표기 오류",
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
    title: "ADMIN 관리자 대시보드 불필요 패널 4개 삭제 및 패널 추가 금지 동결 정책 수립",
    plant: "본사 • 전사",
    reporter: "대표이사 (권태형)",
    orderContent: "ADMIN 대시보드에서 불필요한 패널 4개를 영구 삭제하고 임의로 패널이 추가되지 않도록 동결 조치 요청",
    symptoms: "ADMIN 대시보드에서 불필요한 패널 4개를 영구 삭제하고 임의로 패널이 추가되지 않도록 동결 조치 요청",
    actionResult: "ADMIN 1, 4, 5, 6번 패널 완전 삭제 및 패널 추가 금지 코드 동결 정책 적용 완료",
    resolution: "ADMIN 1, 4, 5, 6번 패널 완전 삭제 및 패널 추가 금지 코드 동결 정책 적용 완료",
    rootCause: "관리자 화면에 사용 빈도가 낮은 이전 패널들이 방치되어 화면 가독성 저하",
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
    title: "전자결재 결재대기 목록 및 상단 배지 동기화 복구",
    plant: "본사 (대표 결재함)",
    reporter: "대표이사 (권태형)",
    orderContent: "주말 특근 결재 문서 2건이 대기함 및 상단 배지([전자결재 2])에 정상 표시되도록 복구 요청",
    symptoms: "주말 특근 결재 문서 2건이 대기함 및 상단 배지([전자결재 2])에 정상 표시되도록 복구 요청",
    actionResult: "결재함 실시간 연동 강화 및 결재대기 문서 2건 안전 복구 완료",
    resolution: "결재함 실시간 연동 강화 및 결재대기 문서 2건 안전 복구 완료",
    rootCause: "문서 상태 변경 시 대기 카운트 이벤트 트리거 누락으로 인한 일시적 불일치",
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
    title: "현장 작업자 로그인 시 작업일보 전용 초슬림 화면 제공",
    plant: "삼랑진 / 한림공장",
    reporter: "현장 작업자 및 대표",
    orderContent: "현장 작업자가 로그인하면 관리자 지표를 숨기고 작업일보 작성 및 본인 결재 확인에만 집중할 수 있는 단순 화면 제공 요청",
    symptoms: "현장 작업자가 로그인하면 관리자 지표를 숨기고 작업일보 작성 및 본인 결재 확인에만 집중할 수 있는 단순 화면 제공 요청",
    actionResult: "작업자 전용 단독 모드 구축. 사이드바를 작업일보 전용으로 슬림화하고 원클릭 일보작성 연동 완료",
    resolution: "작업자 전용 단독 모드 구축. 사이드바를 작업일보 전용으로 슬림화하고 원클릭 일보작성 연동 완료",
    rootCause: "작업자와 관리자 화면 분리가 안 되어 작업자에게 관리자용 복잡한 지표가 노출됨",
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
    title: "근태 최종 저장 및 보고서 등록 시 런타임 오류 방어 및 평일 정시 자동완성 적용",
    plant: "삼랑진 / 한림공장",
    reporter: "공장 현장관리자",
    orderContent: "근태 보고서 등록 시 저장 실패 현상 해결 및 평일 미선택 인원 자동 보정 요청",
    symptoms: "근태 보고서 등록 시 저장 실패 현상 해결 및 평일 미선택 인원 자동 보정 요청",
    actionResult: "저장 로직 안전 선언 처리 완료, 평일 미선택 인원 '정시(🟢)' 원클릭 자동 보정 확인창 적용 완료",
    resolution: "저장 로직 안전 선언 처리 완료, 평일 미선택 인원 '정시(🟢)' 원클릭 자동 보정 확인창 적용 완료",
    rootCause: "보고서 서명 변수 선언 순서 불일치로 인한 오류 발생",
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
    // 개발자 전문용어 버전이거나 orderContent가 없는 구버전인 경우 신규 기본 데이터로 자동 갱신
    if (!Array.isArray(parsed) || parsed.length === 0 || !parsed[0].orderContent) {
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
          if (data && Array.isArray(data.logs) && data.logs.length > 0 && data.logs[0].orderContent) {
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

// Save (Add or Update) Single Incident Log
export const saveIncidentLog = async (logItem) => {
  const currentLogs = getLocalIncidentLogs();
  const now = new Date().toISOString();
  let updatedList;

  const orderText = logItem.orderContent || logItem.symptoms || "";
  const actionText = logItem.actionResult || logItem.resolution || "";

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
      updatedList = [
        {
          ...logItem,
          orderContent: orderText,
          actionResult: actionText,
          symptoms: orderText,
          resolution: actionText,
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
      category: logItem.category || "화면/패널개편",
      severity: logItem.severity || "P1",
      title: logItem.title || "신규 작업 오더",
      plant: logItem.plant || "본사 • 전사",
      reporter: logItem.reporter || "관리자",
      orderContent: orderText,
      symptoms: orderText,
      actionResult: actionText,
      resolution: actionText,
      rootCause: logItem.rootCause || "",
      status: logItem.status || "RESOLVED",
      statusLabel: INCIDENT_STATUSES[logItem.status]?.label || "조치완료",
      mondayChecked: Boolean(logItem.mondayChecked),
      resolver: logItem.resolver || "시스템 관리자",
      createdAt: now,
      resolvedAt: logItem.status === "RESOLVED" || logItem.status === "VERIFIED" ? (logItem.resolvedAt || now) : null,
      updatedAt: now,
      notes: logItem.notes || ""
    };
    updatedList = [newItem, ...currentLogs];
  }

  // Sort: by workDate descending, then incidentNo descending
  updatedList.sort((a, b) => {
    const dateA = a.workDate || "";
    const dateB = b.workDate || "";
    if (dateB !== dateA) return dateB.localeCompare(dateA);
    return (b.incidentNo || 0) - (a.incidentNo || 0);
  });

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

// Export to Excel for Easy Viewing
export const exportIncidentLogsToExcel = (logs = []) => {
  const targetLogs = logs.length > 0 ? logs : getLocalIncidentLogs();
  
  const rows = targetLogs.map((l, idx) => ({
    "No": l.incidentNo || (idx + 1),
    "일자": l.workDate || "",
    "업무분류": l.category || "",
    "진행상태": INCIDENT_STATUSES[l.status]?.label || l.status || "조치완료",
    "오더 제목": l.title || "",
    "📋 [요청 오더 내용]": l.orderContent || l.symptoms || "",
    "✅ [조치 및 반영 결과]": l.actionResult || l.resolution || "",
    "사업장/제보자": `${l.plant || ""} / ${l.reporter || ""}`,
    "조치담당자": l.resolver || "시스템 관리자",
    "조치일시": l.resolvedAt ? l.resolvedAt.replace("T", " ").slice(0, 16) : "",
    "비고": l.notes || ""
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "일일오더_조치관리대장");

  const todayStr = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(workbook, `오륙_일일오더_및_조치결과대장_${todayStr}.xlsx`);
};
