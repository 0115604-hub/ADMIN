# 📊 Profit & Loss (손익 관리) Admin 대시보드

제공해주신 Firebase(`profit-and-loss-7d09b`) 백엔드와 연동된 **관리자 전용 손익(Profit & Loss) 관리 시스템**입니다.

---

## 🌟 주요 기능

1. **실시간 재무 KPI 및 대시보드 (`DashboardOverview`)**
   - 총 매출액 (Total Revenue), 총 지출액 (Total Expenses), 당기순이익 (Net Profit), 영업이익률 (Margin %) 실시간 산출
   - Chart.js 기반 최근 6개월 월별 손익 추이 (Revenue vs Expense Bar Chart)
   - 카테고리별 지출/수익 점유율 도넛 차트 (Donut Chart)
   - 최근 발생 거래 내역 피드 및 재무 건전성 분석 요약

2. **수익/지출 내역 통합 관리 (`TransactionTable`)**
   - 수익(Revenue) / 지출(Expense) 등록, 수정, 삭제
   - 항목명, 거래처, 메모 실시간 검색 및 구분/카테고리별 필터링
   - 날짜순 / 금액순 정렬 및 페이지네이션
   - **CSV 엑셀 내보내기 (Export to CSV)** 기능 내장
   - 원클릭 샘플 데이터 생성 기능 (`Seed Data`)

3. **표준 손익계산서 리포트 (`PnLStatement`)**
   - 기업회계기준(K-IFRS) 포맷의 손익계산서 뷰
   - Ⅰ. 매출액 → Ⅱ. 매출원가 → Ⅲ. 매출총이익 → Ⅳ. 판매비와 관리비(SG&A) → Ⅴ. 영업이익/당기순이익 단계별 산출
   - 인쇄 및 PDF 저장 지원 (`window.print()`)

4. **예산 및 카테고리 관리 (`BudgetAnalysis`)**
   - 카테고리별 월간 목표 예산 설정
   - 실시간 예산 집행률(%) 프로그레스 바 및 초과 경고 표시

5. **Firebase 백엔드 & 멀티 유틸리티 (`SettingsView`)**
   - **Firebase SDK 11.x 연동**: Auth, Firestore, Analytics (`profit-and-loss-7d09b`)
   - Firestore 오류 시 로컬 캐시 자동 백업 & 복구로 무중단 작동 보장
   - 전체 재무 데이터 JSON 백업 다운로드
   - **원화(₩ KRW) / 달러($ USD)** 실시간 환율 통화 변환
   - **다크 모드 / 라이트 모드** 테마 전환

---

## 🛠 기술 스택
- **Frontend**: React 18, Vite, Tailwind CSS, Lucide React, Pretendard Font
- **Visualization**: Chart.js, React-Chartjs-2
- **Backend / Database**: Firebase (Auth, Cloud Firestore, Firebase Analytics)
- **Version Control**: Git (`https://github.com/0115604-hub/ADMIN.git`)

---

## 🚀 로컬 실행 방법

```bash
# 패키지 설치 (이미 완료됨)
npm install

# 개발 서버 실행 (포트 3000)
npm run dev

# 프로덕션 빌드
npm run build
```

---

## 📁 디렉터리 구조
```
ADMIN/
├── index.html
├── package.json
├── tailwind.config.js
├── vite.config.js
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── index.css
    ├── firebase.js               # Firebase 초기화 및 인스턴스
    ├── context/
    │   ├── AuthContext.jsx       # Firebase 인증 및 게스트 모드
    │   ├── ThemeContext.jsx      # 다크/라이트 모드
    │   └── CurrencyContext.jsx   # KRW / USD 통화 변환
    ├── services/
    │   └── dbService.js          # Firestore CRUD & LocalStorage fallback
    └── components/
        ├── Sidebar.jsx           # 네비게이션 메뉴
        ├── Header.jsx            # 상단 헤더 & 유틸리티 버튼
        ├── KPICard.jsx           # 지표 요약 카드
        ├── DashboardOverview.jsx # 메인 대시보드
        ├── TransactionTable.jsx  # 거래 내역 테이블 & CSV 내보내기
        ├── TransactionModal.jsx  # 내역 추가/수정 모달
        ├── PnLStatement.jsx      # 표준 손익계산서 리포트
        ├── BudgetAnalysis.jsx    # 카테고리 예산 관리
        ├── SettingsView.jsx      # Firebase 정보 & 백업
        ├── AuthModal.jsx         # 로그인 & 계정 모달
        └── Charts/
            ├── MonthlyTrendChart.jsx
            └── CategoryDonutChart.jsx
```
