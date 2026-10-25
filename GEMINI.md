# (주)오륙 생산관리 통합시스템 (ADMIN) 핵심 개발 규칙

## 1. 관리자 뱃지 커스터마이징 적용 위치 원칙 (필수 준수)
앱의 화면 진입 단계는 다음 3단계로 구분된다:
1. **1번째 페이지 (로그인 창)**: 사용자/관리자 뱃지 선택 화면 (`src/components/AuthModal.jsx`)
2. **2번째 페이지 (로그인 후 중대재해창)**: PIN 번호 입력 직후 표시되는 중대재해공유판·일정·근태 확인 모달 (`src/components/auth/WorkerPinModal.jsx`)
3. **3번째 페이지 (요약본 페이지)**: `[확인 완료 및 업무 시작]` 클릭 후 진입하는 관리자 대시보드 요약본 화면 (`src/components/dashboard/managers/InternalManagerDashboardView.jsx` 및 `src/utils/roleLayoutConfig.js`)

### 절대 규칙:
- 사용자가 **관리자 뱃지(예: `TEST`, `권태형`, `이명재`, `김동욱` 등)의 커스터마이징(패널 삽입, 위치 이동, 숨김, 레이아웃 변경 등)**을 지시할 때는 **반드시 3번째 페이지(요약본 페이지: `InternalManagerDashboardView.jsx` / `roleLayoutConfig.js`)에만 적용**한다.
- 사용자가 명시적으로 "중대재해창(2번째 페이지)에 적용하라"고 지정하지 않는 한, **절대 2번째 페이지(`WorkerPinModal.jsx`)에 관리자 대시보드 패널을 중복 삽입하지 않는다.**

## 2. 빌드 및 실서버 배포 원칙
- 기능 수정 완료 시 반드시 `npm run build`로 빌드를 검증하고, Firebase Hosting (`npx firebase deploy --only hosting`) 및 GitHub Pages (`npx gh-pages -d dist`)에 모두 배포한다.
