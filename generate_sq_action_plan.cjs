const XLSX = require('xlsx');
const ExcelJS = require('exceljs');
const path = require('path');

async function generateSQActionPlan() {
  const srcPath = 'C:\\Users\\k0115\\OneDrive\\바탕 화면\\anti\\260902_[오륙] SQ레벨업 사전점검 진행 현황.xlsx';
  const destPath = 'C:\\Users\\k0115\\OneDrive\\바탕 화면\\anti\\261001_[오륙] SQ레벨업_미완료항목_조치계획대장(담당자_기한지정).xlsx';

  const srcWb = XLSX.readFile(srcPath);
  const srcSheet = srcWb.Sheets['평가항목'];
  const rawData = XLSX.utils.sheet_to_json(srcSheet, {header: 1});

  let currentCategory = '';
  let currentNo = '';
  let currentDetail = '';

  const allItems = [];
  for (let i = 6; i < rawData.length; i++) {
    const row = rawData[i];
    if (!row || typeof row[0] !== 'number') continue;
    if (row[1]) currentNo = String(row[1]).trim();
    if (row[2]) currentCategory = String(row[2]).trim();
    if (row[3]) currentDetail = String(row[3]).trim();

    const seq = row[0];
    const subItem = row[4] ? String(row[4]).trim() : '';
    const statusText = row[5] ? String(row[5]).trim() : '';
    const team = row[6] ? String(row[6]).trim() : '';
    const manager = row[7] ? String(row[7]).trim() : '';
    const doc = row[8] ? String(row[8]).trim() : '';
    const formYn = row[9] ? String(row[9]).trim() : '';
    const schedule = row[10] ? String(row[10]).trim() : '';
    const openClose = row[11] ? String(row[11]).trim() : '';
    const note = row[12] ? String(row[12]).trim() : '';

    allItems.push({
      seq,
      no: currentNo,
      category: currentCategory,
      detailReq: currentDetail,
      subItem,
      statusText,
      team,
      manager,
      doc,
      formYn,
      schedule,
      openClose,
      note
    });
  }

  console.log(`Parsed total ${allItems.length} items.`);

  // Function to enrich OPEN items with detailed action plans, responsible owners, target dates, priorities, subcategories
  function enrichItem(item) {
    let subCategory = '일반관리';
    let priority = 'A';
    let primaryOwner = '설유철 책임';
    let primaryDept = '생산기술팀';
    let supportOwner = '공영국 대리';
    let supportDept = '생산부';
    let targetDate = '2026-10-20';
    let actionPlan = '';
    let deliverable = item.doc || '조치결과보고서 및 관련 표준서';
    let status = '진행중';

    const sub = item.subItem;
    const cat = item.category;
    const no = item.no;
    const stat = item.statusText;

    // 1. 생산조건관리
    if (cat === '생산조건관리') {
      primaryDept = '생산기술팀';
      if (no === '1_1') {
        subCategory = '표준류·FMEA 일치화';
        if (sub.includes('FMEA')) {
          priority = 'S';
          primaryOwner = '설유철 책임';
          supportOwner = '이창엽 책임 (품질)';
          targetDate = '2026-10-10';
          actionPlan = '1) JA PE G/RUN 공정 PFMEA 전면 재검토\n2) 관리계획서(CP)와 항목별 1:1 매칭성 일치화\n3) 특별특성(Critical/Significant) 심벌 일치 반영';
          deliverable = '개정 PFMEA, 관리계획서 일치성 검토표';
        } else if (sub.includes('관리계획서')) {
          priority = 'S';
          primaryOwner = '설유철 책임';
          supportOwner = '이상기 사원 (품질)';
          targetDate = '2026-10-10';
          actionPlan = '1) 관리계획서에 완제품 Point별 치수 및 외관 검사기준 추가\n2) 가류조 온도, 온조기 온도, 코팅분사압력 등 공정조건 스펙 상세 명기\n3) 개정 승인 배포';
          deliverable = '개정 관리계획서(CP), 도면 Point별 치수 매칭표';
        } else if (sub.includes('작업표준')) {
          priority = 'S';
          primaryOwner = '설유철 책임';
          supportOwner = '공영국 대리 (생산)';
          targetDate = '2026-10-10';
          actionPlan = '1) 컴파운드 건조조건(80±10℃, 3hr이상) 원재료 물성 테스트 데이터 근거 수립\n2) 컴파운드 재질/그레이드 변경 시 설비 청소, 퍼지중량(kg), 초품검증 절차 표준화\n3) 작업표준서 개정 및 현장 게시';
          deliverable = '개정 작업표준서, 원재료 건조조건 시험결과서, 퍼지기준표';
        }
      } else if (no === '1_2') {
        subCategory = '설비 재가동 관리';
        priority = 'A';
        primaryOwner = '공영국 대리';
        primaryDept = '생산관리팀';
        supportOwner = '전재율 책임 (설비보전)';
        targetDate = '2026-10-20';
        actionPlan = '1) 비계획 가동중단 발생 시 조치 후 초품 검증 시간 및 결과 기록 양식 정비\n2) 설비 가동중단 이력과 설비이력카드 간 매칭 작성 프로세스 정착\n3) 작업일보 내 재가동 제품검증 란 신설 및 현장 기록 철저';
        deliverable = '설비 재가동 제품검증 체크시트, 설비 가동중단 이력대장';
      } else if (no === '1_3') {
        subCategory = '외국인 표준 다국어화';
        priority = 'A';
        primaryOwner = '공영국 대리';
        primaryDept = '생산관리팀';
        supportOwner = '설유철 책임 (생산기술)';
        targetDate = '2026-10-15';
        actionPlan = '1) 압출/가공 공정 외국인 작업자 국적(베트남/네팔/스리랑카 등) 현황 파악\n2) 작업표준서, 설비일상점검표, 작업일보 현지어 번역본 제작\n3) 공정별 눈높이에 부착 및 작업자 대상 현지어 표준 숙지 교육 실시';
        deliverable = '다국어(베트남어 등) 작업표준서/점검표, 교육일지';
      } else if (no === '1_4') {
        subCategory = '품질취약시간대 관리';
        priority = 'A';
        primaryOwner = '이창엽 책임';
        primaryDept = '품질관리팀';
        supportOwner = '심임대 반장 (생산)';
        targetDate = '2026-10-15';
        actionPlan = '1) 야간/주말특근 취약시간대 품질관리 매뉴얼 및 프로세스 제정\n2) 야간 초/종품 검사 샘플 보관 및 익일 주간 검사원 출근 즉시 교차검증 체계 구축\n3) 교대근무 인수인계 체크리스트 운영';
        deliverable = '품질취약시간대 품질관리 지침서, 인수인계서';
      } else if (no === '1_5') {
        subCategory = '초·중·종물 검사';
        priority = 'S';
        primaryOwner = '이상기 사원';
        primaryDept = '품질관리팀';
        supportOwner = '공영국 대리 (생산)';
        targetDate = '2026-10-20';
        actionPlan = '1) 초/중/종품 검사 기준서 개정 (검사 항목, 주기, 판정기준)\n2) 단면형상, 코팅 두께, 가류 상태 등 중품 검사 주기(Shift당 1회) 준수\n3) 초중종물 검사기록부 현장 배치 및 매일 데이터 기록/승인 누적';
        deliverable = '초·중·종물 검사기준서, 현장 검사기록부(실적)';
      } else if (no === '1_6') {
        subCategory = '공정조건·파라미터 관리';
        priority = 'S';
        primaryOwner = '설유철 책임';
        primaryDept = '생산기술팀';
        supportOwner = '전재율 책임 (설비보전)';
        targetDate = '2026-10-20';
        actionPlan = '1) 압출기 구역별 온도(가류조, 온조기), 스크류 RPM, 라인스피드, 코팅압력 조건표 개정\n2) 설비 터치패널 셋팅값 임의조작 방지 비밀번호/시건장치 관리\n3) 디지털 계측값과 지침계 오차 점검 및 일상 파라미터 점검표 작성';
        deliverable = '공정조건 표준관리표, 파라미터 시건관리 대장';
      } else {
        subCategory = '생산조건 일반';
        priority = 'A';
        primaryOwner = '설유철 책임';
        primaryDept = '생산기술팀';
        supportOwner = '공영국 대리';
        targetDate = '2026-10-20';
        actionPlan = '공정 표준화 지침 수립 및 현장 이행상태 점검';
      }
    }
    // 2. 검사시험
    else if (cat === '검사시험') {
      primaryDept = '품질관리팀';
      if (no === '2_1' || no === '2_2') {
        subCategory = '자주검사·순회검사';
        priority = 'A';
        primaryOwner = '이상기 사원';
        supportOwner = '심임대 반장 (현장)';
        targetDate = '2026-10-20';
        actionPlan = '1) 작업자 자주검사 체크시트 개정 (검사항목 도식화)\n2) 품질 순회검사 주기(2시간/1회) 및 치수/외관 체크포인트 강화\n3) 부적합 발생 시 즉시 라인스톱 및 LOT 분리 보관 규정화';
        deliverable = '자주검사표, 순회검사 일보, 라인스톱 기준서';
      } else if (no === '2_3' || no === '2_4') {
        subCategory = '한도견본 관리';
        priority = 'S';
        primaryOwner = '이창엽 책임';
        supportOwner = '이상기 사원 (품질)';
        targetDate = '2026-10-15';
        actionPlan = '1) JA PE G/RUN 외관 불량유형별(기포, 스크래치, 미성형, 단차, 코팅불량) 한도견본 제작\n2) 고객사(화승/완성차) 날인 승인 획득\n3) 현장 검사대 및 조명하에 한도견본 게시 및 유효기간(1년) 라벨링';
        deliverable = '승인 한도견본(실물), 한도견본 관리대장, 유효기간 라벨';
      } else if (no === '2_5' || no === '2_6') {
        subCategory = '검교정·계측기 관리';
        priority = 'S';
        primaryOwner = '이상기 사원';
        supportOwner = '이창엽 책임 (품질)';
        targetDate = '2026-10-31';
        actionPlan = '1) 사내 모든 계측기(버니어캘리퍼스, 두께게이지, 온도계, 압력계 등) 전수조사 및 대장 최신화\n2) 공인기관 교정 미도래품 전량 외부 교정 의뢰 및 성적서 편철\n3) 합격 검교정 라벨 계측기 본체 부착';
        deliverable = '계측기 관리대장, 공인 교정성적서, 검교정 라벨';
      } else if (no === '2_7' || no === '2_8') {
        subCategory = '측정시스템 분석(Gage R&R)';
        priority = 'S';
        primaryOwner = '이창엽 책임';
        supportOwner = '이상기 사원 (품질)';
        targetDate = '2026-10-31';
        actionPlan = '1) 주요 검사항목(단면치수, 코팅두께 등) 측정기별 Gage R&R 평가 계획 수립\n2) 3인 작업자 10개 시료 3회 반복 측정 데이터 수집\n3) %GRR 10% 미만(또는 30% 이하 조건부 수용) 분석 보고서 작성 및 개선';
        deliverable = 'Gage R&R 분석 보고서, 측정자별 산포 평가표';
      } else if (no === '2_9' || no === '2_10') {
        subCategory = '압출단면치수·산포관리';
        priority = 'S';
        primaryOwner = '이상기 사원';
        supportOwner = '설유철 책임 (생산기술)';
        targetDate = '2026-10-31';
        actionPlan = '1) 압출품 Point별 단면치수 프로젝터/비전 측정 시스템 정비\n2) 매 LOT별 치수 측정 데이터 엑셀 전산화\n3) Xbar-R 관리도 및 산포 추이도(Trend Chart) 작성하여 Cpk 1.33 이상 확보';
        deliverable = '단면 치수 측정성적서, 산포 추이도 관리대장, Cpk 분석서';
      } else {
        subCategory = '검사시험 일반';
        priority = 'A';
        primaryOwner = '이창엽 책임';
        supportOwner = '이상기 사원';
        targetDate = '2026-10-20';
        actionPlan = '검사 기준서 보완 및 시험 기록 관리 철저';
      }
    }
    // 3. 설비관리
    else if (cat === '설비관리') {
      primaryDept = '공무보전팀';
      primaryOwner = '전재율 책임';
      supportOwner = '공영국 대리 (생산)';
      if (no === '3_1') {
        subCategory = 'TPM 일상보전·Fool Proof';
        if (sub.includes('도식화') || sub.includes('번호표') || sub.includes('일상점검')) {
          priority = 'A';
          targetDate = '2026-10-20';
          actionPlan = '1) 압출기, 성형기, 냉각수조, 코팅기 등 설비별 점검포인트 도식화 시트 제작\n2) 점검위치에 식별 번호표(1, 2, 3...) 명판 부착\n3) 게이지류(압력, 온도) 적정범위 녹색/적색 테이프 밴딩 관리';
          deliverable = '도식화 일상점검표, 설비 번호표 부착 사진, 게이지 라벨링';
        } else if (sub.includes('Proof') || sub.includes('F/P') || sub.includes('셋팅값')) {
          priority = 'S';
          targetDate = '2026-10-20';
          actionPlan = '1) 공정별 Fool Proof(코팅액 잔량감지, 가류온도 상하한 알람 등) 전수 점검\n2) F/P 점검 요령서 제정 및 현장 게시\n3) 담당자 시연 가능하도록 이상발생 시모의 테스트 및 작동 실적 기록';
          deliverable = 'F/P 장치 리스트, 점검 요령서, F/P 모의점검 기록부';
        }
      } else if (no === '3_2') {
        subCategory = '설비정기점검·예방보전';
        priority = 'A';
        targetDate = '2026-10-25';
        actionPlan = '1) 전 설비 설비보유 LIST 및 A/B/C 등급분류 평가 실시\n2) 연간 설비정기점검 계획서 수립 및 점검 체크시트 제정\n3) 칠러 및 냉각수 온도센서 교정 일치화 및 보전이력카드 기록 누적';
        deliverable = '설비 등급평가표, 연간 정기점검 계획서, 설비이력카드';
      } else if (no === '3_3') {
        subCategory = '코팅도포·잔량관리';
        priority = 'S';
        targetDate = '2026-10-20';
        actionPlan = '1) 코팅액 자동 도포 상태 감지 센서 또는 수동 UV 검사 체계 구축\n2) 코팅액 잔량 하한 감지 경보(E/Proof) 장치 설치\n3) 코팅분사압력 및 노즐 청소 주기 표준화';
        deliverable = '코팅공정 관리지침서, 잔량센서 설치확인서';
      } else {
        subCategory = '설비관리 일반';
        priority = 'A';
        targetDate = '2026-10-20';
        actionPlan = '설비 보전 기준 수립 및 이력 관리 체계 구축';
      }
    }
    // 4. 금형관리
    else if (cat === '금형관리') {
      primaryDept = '공무보전팀';
      primaryOwner = '전재율 책임';
      supportOwner = '설유철 책임 (생산기술)';
      if (no === '4_1') {
        subCategory = '금형List·누적타수(Meter)';
        priority = 'S';
        targetDate = '2026-10-20';
        actionPlan = '1) 사내 보유 전 다이스(금형) LIST 대장 최신화 (차종, 품명, 캐비티, 보관위치)\n2) 금형 일상점검 체크시트 제정 및 매 작업 전후 점검\n3) 압출 누적 Meter수 카운터 연동 또는 작업일보 연계 누적수명 관리';
        deliverable = '금형 마스터 리스트, 금형 일상점검표, 누적 Meter수 관리대장';
      } else if (no === '4_2' || no === '4_4') {
        subCategory = '금형 세척·보관·식별';
        priority = 'A';
        targetDate = '2026-10-15';
        actionPlan = '1) 다이스 및 금형 세척 작업 표준서(세척액, 초음파, 건조, 방청) 제정\n2) 금형 전용 보관대 제작 및 구역별 다이스 번호 명판 부착\n3) 세척/정비 이력카드 작성 및 방청 보관 상태 관리';
        deliverable = '금형 세척 표준서, 금형 보관대 사진, 세척/수리 이력카드';
      } else if (no === '4_3' || no === '4_5') {
        subCategory = '금형이력·T/O검수';
        priority = 'A';
        targetDate = '2026-10-25';
        actionPlan = '1) 신규 금형 입고 시 T/O(Trial Output) 검수 보고서 및 치수 성적서 편철\n2) 금형별 개조, 수정, 마모 보수 이력카드 100% 매칭 작성\n3) 정기 마모한계 측정 기준 수립';
        deliverable = '금형 T/O 보고서, 금형 이력카드, 마모도 측정기록부';
      } else {
        subCategory = '금형관리 일반';
        priority = 'A';
        targetDate = '2026-10-20';
        actionPlan = '금형 보전 및 식별체계 표준화';
      }
    }
    // 5. 자재관리
    else if (cat === '자재관리') {
      primaryDept = '자재물류팀';
      primaryOwner = '조인주 선임';
      supportOwner = '이상기 사원 (품질)';
      if (no === '5_1' || no === '5_2') {
        subCategory = 'LOT 추적·선입선출(FIFO)';
        priority = 'S';
        targetDate = '2026-10-20';
        actionPlan = '1) 원부자재 입고부터 투입, 공정, 출하까지 LOT 추적 매뉴얼 개정\n2) FMB 및 원자재 보관 렉 선입선출 구조(경사 슬라이딩렉 또는 라인별 순번대차) 정비\n3) 잔량 FMB 밀봉 보관 및 잔량 LOT 식별표 부착 표준화';
        deliverable = 'LOT 추적관리 규정, 선입선출 렉 정비 사진, 잔량자재 식별표';
      } else if (no === '5_3' || no === '5_4') {
        subCategory = '입고검사 식별·공정용기';
        priority = 'A';
        targetDate = '2026-10-15';
        actionPlan = '1) 수입검사 전(검사대기 - 황색), 검사완료(합격 - 녹색) 식별 TAG 부착 제도화\n2) 원자재, FMB, 반제품, 완제품 전용 공정 용기 표준서 제정\n3) 용기별 표준 적재수량 및 식별명판 부착';
        deliverable = '수입검사 식별TAG, 공정용기 관리표준서';
      } else if (no === '5_5' || no === '5_6') {
        subCategory = 'FMB 보관실·온습도 관리';
        priority = 'S';
        primaryOwner = '조인주 선임';
        supportOwner = '전재율 책임 (설비보전)';
        targetDate = '2026-10-20';
        actionPlan = '1) FMB 전용 냉장/항온보관실 온도(기준치 이하) 및 습도 자동기록계 정비\n2) 온습도 상한 이탈 시 비상 경보(알람/경광등 F/Proof) 작동상태 점검\n3) FMB 보관실 일상 온습도 체크시트 최신화 및 이력 보존';
        deliverable = 'FMB 보관관리 지침, 온습도 자동기록 차트, F/P 점검표';
      } else {
        subCategory = '자재관리 일반';
        priority = 'A';
        targetDate = '2026-10-20';
        actionPlan = '원부자재 수불 및 창고 3정5행 관리';
      }
    }
    // 6. 품질경영체제
    else if (cat === '품질경영체제') {
      if (no === '6_1') {
        subCategory = '안전보건관리';
        priority = 'A';
        primaryDept = '관리팀';
        primaryOwner = '윤경수 책임';
        supportOwner = '공영국 대리 (생산)';
        targetDate = '2026-10-15';
        actionPlan = '1) 공정 안전관리 매뉴얼 정비 및 위험성평가 실시\n2) 보호구 착용 기준 및 안전점검 실적표 작성';
        deliverable = '안전관리 지침서, 위험성평가 보고서, 안전교육일지';
      } else if (no === '6_2') {
        subCategory = '4M 변경관리';
        priority = 'S';
        primaryDept = '품질관리팀';
        primaryOwner = '이창엽 책임';
        supportOwner = '설유철 책임 (생산기술)';
        targetDate = '2026-10-10';
        actionPlan = '1) 4M(Man, Machine, Material, Method) 변경점 관리 절차서 개정\n2) 고객사 사전 신고/승인 기준 및 4M 변경 처리대장 작성\n3) 변경 시 초품검사 및 LOT 추적 관리 강화';
        deliverable = '4M 변경관리 규정, 4M 변경승인서(양식/실적), 처리대장';
      } else if (no === '6_3') {
        subCategory = '검사협정서·도면일치성';
        priority = 'S';
        primaryDept = '품질관리팀';
        primaryOwner = '이창엽 책임';
        supportOwner = '설유철 책임 (생산기술)';
        targetDate = '2026-10-15';
        actionPlan = '1) 차종/품목별(JA PE G/RUN 등) 최신 고객사 검사협정서 체결본 바인더 정리\n2) 고객 최신도면과 사내 관리계획서/검사기준서 일치성 정기검증표 작성\n3) E/O(설계변경) 이력 마스터 대장 최신화';
        deliverable = '최신 검사협정서 사본, 도면 일치성 검증 보고서';
      } else if (no === '6_5') {
        subCategory = '교육훈련·자격인증제도';
        priority = 'A';
        primaryDept = '품질관리팀';
        primaryOwner = '이창엽 책임';
        supportOwner = '공영국 대리 (생산)';
        targetDate = '2026-10-20';
        actionPlan = '1) 작업자/검사원 자격인증 부여 매뉴얼 개정 (신규/정기/특별)\n2) 다국어(외국인용) 필기/실기 평가 교안 및 시험지 제작\n3) 자격인증서 발급 및 현장 작업자 명찰/자격현황판 게시';
        deliverable = '자격인증 관리규정, 다국어 교육교안, 자격인증 평가서/명단';
      } else if (no === '6_6') {
        subCategory = '부적합품 관리·격리';
        priority = 'S';
        primaryDept = '품질관리팀';
        primaryOwner = '이상기 사원';
        supportOwner = '공영국 대리 (생산)';
        targetDate = '2026-10-15';
        actionPlan = '1) 공정 부적합품 처리 매뉴얼 개정 및 현장(압출/가공/창고) 처리기준 게시\n2) 부적합품 격리 보관장(빨간색 구획) 지정 및 시건장치(열쇠/비번) 설치\n3) 부적합품 전용 빨간색 TAG 부착 및 부적합품 폐기/재작업 대장 운영';
        deliverable = '부적합품 관리절차서, 부적합 격시장 사진, 부적합품 식별TAG/대장';
      } else if (no === '6_9') {
        subCategory = '3정5행·현장개선';
        priority = 'B';
        primaryDept = '품질관리팀';
        primaryOwner = '이창엽 책임';
        supportOwner = '심임대 반장 (생산)';
        targetDate = '2026-10-20';
        actionPlan = '1) 주간 3정5행 체크시트 점검 실시\n2) 지적사항에 대한 개선 전/후 사진 및 시정조치 결과 보고서 작성\n3) 우수구역 피드백 및 게시판 공유';
        deliverable = '3정5행 점검표, 전/후 개선결과서';
      } else if (no === '6_11') {
        subCategory = '공정이동품 식별';
        priority = 'A';
        primaryDept = '생산관리팀';
        primaryOwner = '공영국 대리';
        supportOwner = '조인주 선임 (자재)';
        targetDate = '2026-10-15';
        actionPlan = '1) 공정간 반제품 이동 시 전용 식별표(품번, 차종, 수량, 공정명, 일자, 작업자) 부착\n2) 이동대차별 지정 구역선 마킹';
        deliverable = '공정이동표(TAG), 대차 식별표';
      } else if (no === '6_12') {
        subCategory = '정성품질 TFT·개선제안';
        priority = 'A';
        primaryDept = '품질관리팀';
        primaryOwner = '이창엽 책임';
        supportOwner = '설유철 책임 (생산기술)';
        targetDate = '2026-10-25';
        actionPlan = '1) 정성품질(감성품질/작업편의/안전품질) TFT 조직도 구성 및 임명장 수여\n2) 전 작업자 정성품질 교육 실시 (불량 감수성 향상 교안)\n3) 월별 정성품질 개선제안 접수, 평가, 우수 제안자 포상 제도 운영 실적 편철';
        deliverable = '정성품질 TFT 조직도, 교육일지, 제안서 및 포상 실적철';
      } else {
        subCategory = '품질경영 일반';
        priority = 'A';
        primaryDept = '품질관리팀';
        primaryOwner = '윤경수 책임';
        supportOwner = '이창엽 책임';
        targetDate = '2026-10-25';
        actionPlan = '품질경영 시스템 표준 준수 및 정기 심사';
      }
    }

    return {
      ...item,
      subCategory,
      priority,
      primaryDept,
      primaryOwner,
      supportDept,
      supportOwner,
      targetDate,
      actionPlan,
      deliverable,
      status
    };
  }

  const enrichedAllItems = allItems.map(enrichItem);
  const openEnriched = enrichedAllItems.filter(x => x.openClose === 'OPEN');

  console.log(`Enriched ${openEnriched.length} open items.`);

  // Create Excel Workbook with ExcelJS
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'SQ레벨업 추진TF';
  workbook.lastModifiedBy = '오륙산업 SQ인증팀';
  workbook.created = new Date();
  workbook.modified = new Date();

  // Colors
  const NAVY_DARK = 'FF1B365D';
  const NAVY_LIGHT = 'FF2A4D7C';
  const TEAL_HEADER = 'FF1E4E5A';
  const TEAL_BG = 'FFEAF2F4';
  const GRAY_BG = 'FFF8FAFC';
  const BORDER_COLOR = 'FFCBD5E1';
  const S_RED_BG = 'FFFEE2E2';
  const S_RED_TXT = 'FF991B1B';
  const A_ORG_BG = 'FFFFEDD5';
  const A_ORG_TXT = 'FF9A3412';
  const B_BLU_BG = 'FFDBEAFE';
  const B_BLU_TXT = 'FF1E40AF';

  // ==========================================
  // SHEET 1: 대시보드
  // ==========================================
  const wsDash = workbook.addWorksheet('📊_추진현황_대시보드', {
    views: [{ showGridLines: true }]
  });

  // Title Banner
  wsDash.mergeCells('A1:L1');
  const titleCell = wsDash.getCell('A1');
  titleCell.value = '▣ 오륙산업 SQ 레벨업 사전점검 미완료 항목 조치 추진계획 대시보드';
  titleCell.font = { name: '맑은 고딕', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY_DARK } };
  wsDash.getRow(1).height = 40;

  // Subtitle / Info
  wsDash.mergeCells('A2:L2');
  const subCell = wsDash.getCell('A2');
  subCell.value = '● 대상공정: 압출/가공 공정 (JA PE G/RUN 외)  |  평가기준: SQ Ver 5.1  |  기준일자: 2026. 10. 01  |  주관: SQ 레벨업 TFT';
  subCell.font = { name: '맑은 고딕', size: 10, italic: true, color: { argb: 'FF475569' } };
  subCell.alignment = { horizontal: 'center', vertical: 'middle' };
  subCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
  wsDash.getRow(2).height = 24;

  // KPI Summary Cards
  wsDash.getRow(4).height = 22;
  wsDash.getRow(5).height = 36;

  const kpis = [
    { rangeTitle: 'B4:C4', rangeVal: 'B5:C5', title: '총 점검 항목', val: '160 건', bg: 'FFF1F5F9', txt: 'FF1E293B' },
    { rangeTitle: 'D4:E4', rangeVal: 'D5:E5', title: '완료 항목 (CLOSE)', val: '28 건 (17.5%)', bg: 'FFD1FAE5', txt: 'FF065F46' },
    { rangeTitle: 'F4:H4', rangeVal: 'F5:H5', title: '🚨 미완료 조치대상 (OPEN)', val: '124 건 (77.5%)', bg: 'FFFEE2E2', txt: 'FF991B1B' },
    { rangeTitle: 'I4:J4', rangeVal: 'I5:J5', title: '해당없음', val: '8 건 (5.0%)', bg: 'FFF1F5F9', txt: 'FF64748B' },
    { rangeTitle: 'K4:L4', rangeVal: 'K5:L5', title: '최종목표 완료일', val: '2026. 10. 31 한', bg: 'FFDBEAFE', txt: 'FF1E40AF' }
  ];

  kpis.forEach(kpi => {
    wsDash.mergeCells(kpi.rangeTitle);
    wsDash.mergeCells(kpi.rangeVal);
    const tCell = wsDash.getCell(kpi.rangeTitle.split(':')[0]);
    tCell.value = kpi.title;
    tCell.font = { name: '맑은 고딕', size: 9, bold: true, color: { argb: 'FF475569' } };
    tCell.alignment = { horizontal: 'center', vertical: 'middle' };
    tCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };

    const vCell = wsDash.getCell(kpi.rangeVal.split(':')[0]);
    vCell.value = kpi.val;
    vCell.font = { name: '맑은 고딕', size: 14, bold: true, color: { argb: kpi.txt } };
    vCell.alignment = { horizontal: 'center', vertical: 'middle' };
    vCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: kpi.bg } };
  });

  // Table 1: 대분류별 미완료 항목 및 목표
  wsDash.mergeCells('B7:L7');
  const t1Header = wsDash.getCell('B7');
  t1Header.value = '【 1. 대분류별 미완료 항목 조치계획 현황 】';
  t1Header.font = { name: '맑은 고딕', size: 11, bold: true, color: { argb: 'FF1E293B' } };
  t1Header.alignment = { vertical: 'middle' };
  wsDash.getRow(7).height = 28;

  const t1Cols = ['대분류', '전체', '완료(C)', '미완료(O)', 'S등급(필수)', 'A등급(중점)', 'B등급(일반)', '주관 부서', '주관 담당자', '1차목표', '최종목표'];
  wsDash.getRow(8).height = 24;
  for (let c = 0; c < t1Cols.length; c++) {
    const cell = wsDash.getCell(8, c + 2);
    cell.value = t1Cols[c];
    cell.font = { name: '맑은 고딕', size: 9, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY_LIGHT } };
  }

  const catSummary = [
    ['1. 생산조건관리', 42, 6, 34, 18, 14, 2, '생산기술팀', '설유철 책임', '10/10 (12건)', '10/20 (22건)'],
    ['2. 검사시험', 36, 6, 27, 14, 13, 0, '품질관리팀', '이창엽 / 이상기', '10/15 (9건)', '10/31 (18건)'],
    ['3. 설비관리', 22, 7, 15, 6, 9, 0, '공무보전팀', '전재율 책임', '10/15 (5건)', '10/25 (10건)'],
    ['4. 금형관리', 16, 4, 12, 5, 7, 0, '공무보전팀', '전재율 책임', '10/15 (4건)', '10/25 (8건)'],
    ['5. 자재관리', 17, 3, 13, 6, 7, 0, '자재물류팀', '조인주 선임', '10/15 (5건)', '10/20 (8건)'],
    ['6. 품질경영체제', 27, 2, 23, 10, 11, 2, '품질관리팀', '윤경수 / 이창엽', '10/10 (8건)', '10/31 (15건)'],
    ['합 계', 160, 28, 124, 59, 61, 4, '전사 TF', '설유철 / 이창엽 外', '10/10 (43건)', '10/31 (81건)']
  ];

  for (let r = 0; r < catSummary.length; r++) {
    const rowIdx = 9 + r;
    wsDash.getRow(rowIdx).height = 22;
    const rowData = catSummary[r];
    const isTotal = r === catSummary.length - 1;
    for (let c = 0; c < rowData.length; c++) {
      const cell = wsDash.getCell(rowIdx, c + 2);
      cell.value = rowData[c];
      cell.font = { name: '맑은 고딕', size: 9, bold: isTotal };
      cell.alignment = { horizontal: c === 0 || c >= 7 ? (c === 0 ? 'left' : 'center') : 'center', vertical: 'middle' };
      if (isTotal) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
      } else if (r % 2 === 1) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: GRAY_BG } };
      }
      if (c === 3) {
        cell.font = { name: '맑은 고딕', size: 9, bold: true, color: { argb: 'FF991B1B' } };
      }
    }
  }

  // Table 2: 담당자별 R&R 및 배정 현황
  const t2StartRow = 18;
  wsDash.mergeCells(`B${t2StartRow}:L${t2StartRow}`);
  const t2Header = wsDash.getCell(`B${t2StartRow}`);
  t2Header.value = '【 2. 담당자별 R&R 및 미완료 항목 배정 현황 】';
  t2Header.font = { name: '맑은 고딕', size: 11, bold: true, color: { argb: 'FF1E293B' } };
  t2Header.alignment = { vertical: 'middle' };
  wsDash.getRow(t2StartRow).height = 28;

  const t2Cols = ['담당자 (정)', '소속 부서', '직위', '주요 담당 업무', '배정건수', 'S등급', 'A등급', 'B등급', '1차기한(10/10)', '2차기한(10/20)', '최종(10/31)'];
  wsDash.getRow(t2StartRow + 1).height = 24;
  for (let c = 0; c < t2Cols.length; c++) {
    const cell = wsDash.getCell(t2StartRow + 1, c + 2);
    cell.value = t2Cols[c];
    cell.font = { name: '맑은 고딕', size: 9, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: TEAL_HEADER } };
  }

  const managerSummary = [
    ['설유철', '생산기술팀', '책임', '생산조건 표준화, PFMEA, 관리계획서, 파라미터 시건, 컴파운드 건조조건', 32, 16, 15, 1, 12, 18, 2],
    ['이창엽', '품질관리팀', '책임', 'SQ 레벨업 총괄, 품질경영체제, 4M변경, 검사협정서, Gage R&R, 한도견본, TFT', 28, 14, 13, 1, 9, 11, 8],
    ['전재율', '공무보전팀', '책임', '설비 TPM 일상점검, Fool Proof 구축, 정기보전, 금형/다이스 이력·세척·수명', 27, 11, 16, 0, 4, 15, 8],
    ['이상기', '품질관리팀', '사원', '초중종물 검사, 순회검사, 단면치수 CPK 관리, 검교정 전수조사, 부적합품 격리', 16, 9, 7, 0, 5, 6, 5],
    ['조인주', '자재물류팀', '선임', '원부자재/FMB 선입선출(JRMS), LOT 추적관리, FMB 항온보관실 온습도 F/P', 13, 6, 7, 0, 5, 8, 0],
    ['공영국', '생산관리팀', '대리', '현장 다국어 표준 게시, 작업일보 현장기록, 설비재가동 검증실적, 야간품질관리', 6, 2, 3, 1, 4, 2, 0],
    ['윤경수', '품질기획팀', '책임', '안전보건 프로세스, 도면 일치성 정기검증, 완성차/화승 협의 총괄', 2, 1, 0, 1, 1, 1, 0],
    ['합 계', '전사 TFT', '-', '오륙산업 SQ 레벨업 사전점검 124건 전수 조치', 124, 59, 61, 4, 40, 61, 23]
  ];

  for (let r = 0; r < managerSummary.length; r++) {
    const rowIdx = t2StartRow + 2 + r;
    wsDash.getRow(rowIdx).height = 22;
    const rowData = managerSummary[r];
    const isTotal = r === managerSummary.length - 1;
    for (let c = 0; c < rowData.length; c++) {
      const cell = wsDash.getCell(rowIdx, c + 2);
      cell.value = rowData[c];
      cell.font = { name: '맑은 고딕', size: 9, bold: isTotal };
      cell.alignment = { horizontal: c === 0 || c === 3 ? (c === 3 ? 'left' : 'center') : 'center', vertical: 'middle' };
      if (isTotal) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
      } else if (r % 2 === 1) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: GRAY_BG } };
      }
      if (c === 4) {
        cell.font = { name: '맑은 고딕', size: 9, bold: true, color: { argb: 'FF1B365D' } };
      }
    }
  }

  // Table 3: 단계별 완료 로드맵 & 핵심 착안사항
  const t3StartRow = 29;
  wsDash.mergeCells(`B${t3StartRow}:L${t3StartRow}`);
  const t3Header = wsDash.getCell(`B${t3StartRow}`);
  t3Header.value = '【 3. SQ 심사 대비 단계별 추진 로드맵 및 5대 중점 착안사항 】';
  t3Header.font = { name: '맑은 고딕', size: 11, bold: true, color: { argb: 'FF1E293B' } };
  t3Header.alignment = { vertical: 'middle' };
  wsDash.getRow(t3StartRow).height = 28;

  const roadmapItems = [
    ['1단계 (10/10 한)', '표준류·지침·양식 전면 제개정 (40건)', '관리계획서(CP) - 작업표준서 - PFMEA 일치화, 4M변경 규정, 외국어 번역 표준류 완료, 점검표 양식 제정'],
    ['2단계 (10/20 한)', '현장 적용 및 관리체계 정착 (61건)', '현장 표준 부착, 게이지 상하한 밴딩, 설비 번호표 부착, FMB 선입선출 렉/보관실 정비, 부적합 격리장 시건장치'],
    ['3단계 (10/31 한)', '데이터 확보 및 SQ 모의심사 검증 (23건)', '계측기 전수 검교정 완료, Gage R&R 보고서, 단면치수 Cpk 산포 추이도, 정성품질 실적, 최종 리허설']
  ];

  for (let r = 0; r < roadmapItems.length; r++) {
    const rowIdx = t3StartRow + 1 + r;
    wsDash.getRow(rowIdx).height = 24;
    const rItem = roadmapItems[r];
    wsDash.mergeCells(`B${rowIdx}:C${rowIdx}`);
    wsDash.mergeCells(`D${rowIdx}:F${rowIdx}`);
    wsDash.mergeCells(`G${rowIdx}:L${rowIdx}`);

    const c1 = wsDash.getCell(`B${rowIdx}`);
    c1.value = rItem[0];
    c1.font = { name: '맑은 고딕', size: 9, bold: true, color: { argb: 'FF1E40AF' } };
    c1.alignment = { horizontal: 'center', vertical: 'middle' };
    c1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEFF6FF' } };

    const c2 = wsDash.getCell(`D${rowIdx}`);
    c2.value = rItem[1];
    c2.font = { name: '맑은 고딕', size: 9, bold: true, color: { argb: 'FF1E293B' } };
    c2.alignment = { horizontal: 'left', vertical: 'middle' };

    const c3 = wsDash.getCell(`G${rowIdx}`);
    c3.value = rItem[2];
    c3.font = { name: '맑은 고딕', size: 8.5, color: { argb: 'FF475569' } };
    c3.alignment = { horizontal: 'left', vertical: 'middle' };
  }

  // Set borders for dashboard tables
  function setRangeBorder(startR, endR, startC, endC) {
    for (let r = startR; r <= endR; r++) {
      for (let c = startC; c <= endC; c++) {
        const cell = wsDash.getCell(r, c);
        cell.border = {
          top: { style: 'thin', color: { argb: BORDER_COLOR } },
          bottom: { style: 'thin', color: { argb: BORDER_COLOR } },
          left: { style: 'thin', color: { argb: BORDER_COLOR } },
          right: { style: 'thin', color: { argb: BORDER_COLOR } }
        };
      }
    }
  }

  setRangeBorder(8, 16, 2, 12);
  setRangeBorder(t2StartRow + 1, t2StartRow + 9, 2, 12);
  setRangeBorder(t3StartRow + 1, t3StartRow + 3, 2, 12);

  // Column widths for Dashboard
  wsDash.columns = [
    { width: 3 },  // A
    { width: 16 }, // B
    { width: 15 }, // C
    { width: 12 }, // D
    { width: 14 }, // E
    { width: 13 }, // F
    { width: 13 }, // G
    { width: 14 }, // H
    { width: 16 }, // I
    { width: 14 }, // J
    { width: 15 }, // K
    { width: 16 }, // L
    { width: 3 }   // M
  ];


  // ==========================================
  // SHEET 2: SQ미완료_조치계획대장 (124건)
  // ==========================================
  const wsOpen = workbook.addWorksheet('📋_SQ미완료_조치계획대장', {
    views: [{ state: 'frozen', ySplit: 2, showGridLines: true }]
  });

  // Main Header Banner
  wsOpen.mergeCells('A1:P1');
  const openTitle = wsOpen.getCell('A1');
  openTitle.value = '▣ SQ 레벨업 사전점검 미완료(OPEN) 124건 세부 조치계획 및 담당자/기한 지정 대장';
  openTitle.font = { name: '맑은 고딕', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
  openTitle.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
  openTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY_DARK } };
  wsOpen.getRow(1).height = 36;

  const openHeaders = [
    { header: 'No', key: 'idx', width: 6 },
    { header: '원문\n순번', key: 'seq', width: 7 },
    { header: '심사항목\n관리번호', key: 'no', width: 10 },
    { header: '대분류', key: 'category', width: 14 },
    { header: '중분류', key: 'subCategory', width: 16 },
    { header: '우선\n순위', key: 'priority', width: 8 },
    { header: '추진(점검) 세부항목', key: 'subItem', width: 28 },
    { header: '현 상태 및 지적사항 (문제점)', key: 'statusText', width: 34 },
    { header: '구체적 개선 조치 대책 (Action Plan)', key: 'actionPlan', width: 42 },
    { header: '주관\n부서', key: 'primaryDept', width: 12 },
    { header: '주관\n담당자', key: 'primaryOwner', width: 12 },
    { header: '지원\n부서/담당', key: 'support', width: 14 },
    { header: '완료목표\n기한', key: 'targetDate', width: 12 },
    { header: '필요 산출물 및 증빙자료', key: 'deliverable', width: 26 },
    { header: '양식\n보유', key: 'formYn', width: 7 },
    { header: '진행\n상태', key: 'status', width: 9 }
  ];

  wsOpen.getRow(2).height = 30;
  openHeaders.forEach((col, idx) => {
    const cell = wsOpen.getCell(2, idx + 1);
    cell.value = col.header;
    cell.font = { name: '맑은 고딕', size: 9.5, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: TEAL_HEADER } };
    wsOpen.getColumn(idx + 1).width = col.width;
  });

  // Populate Open Items
  openEnriched.forEach((item, index) => {
    const rowIdx = index + 3;
    const row = wsOpen.getRow(rowIdx);
    row.height = 48; // enough space for 2-3 lines

    row.getCell(1).value = index + 1;
    row.getCell(2).value = item.seq;
    row.getCell(3).value = item.no;
    row.getCell(4).value = item.category;
    row.getCell(5).value = item.subCategory;
    row.getCell(6).value = item.priority + '등급';
    row.getCell(7).value = item.subItem;
    row.getCell(8).value = item.statusText;
    row.getCell(9).value = item.actionPlan;
    row.getCell(10).value = item.primaryDept;
    row.getCell(11).value = item.primaryOwner;
    row.getCell(12).value = item.supportOwner;
    row.getCell(13).value = item.targetDate;
    row.getCell(14).value = item.deliverable;
    row.getCell(15).value = item.formYn || '-';
    row.getCell(16).value = item.status;

    // Formatting
    const isEven = index % 2 === 1;
    const rowBg = isEven ? GRAY_BG : 'FFFFFFFF';

    for (let c = 1; c <= 16; c++) {
      const cell = row.getCell(c);
      cell.font = { name: '맑은 고딕', size: 9 };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBg } };
      cell.border = {
        top: { style: 'thin', color: { argb: BORDER_COLOR } },
        bottom: { style: 'thin', color: { argb: BORDER_COLOR } },
        left: { style: 'thin', color: { argb: BORDER_COLOR } },
        right: { style: 'thin', color: { argb: BORDER_COLOR } }
      };

      // Alignment
      if ([1, 2, 3, 6, 10, 11, 12, 13, 15, 16].includes(c)) {
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      } else if ([4, 5].includes(c)) {
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      } else {
        cell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
      }
    }

    // Priority styling
    const priCell = row.getCell(6);
    priCell.font = { name: '맑은 고딕', size: 9, bold: true };
    if (item.priority === 'S') {
      priCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: S_RED_BG } };
      priCell.font.color = { argb: S_RED_TXT };
    } else if (item.priority === 'A') {
      priCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: A_ORG_BG } };
      priCell.font.color = { argb: A_ORG_TXT };
    } else {
      priCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: B_BLU_BG } };
      priCell.font.color = { argb: B_BLU_TXT };
    }

    // Primary Owner bold
    row.getCell(11).font = { name: '맑은 고딕', size: 9, bold: true, color: { argb: 'FF1B365D' } };

    // Due date bold
    row.getCell(13).font = { name: '맑은 고딕', size: 9, bold: true, color: { argb: 'FF1E293B' } };
  });

  // Enable Auto Filter
  wsOpen.autoFilter = {
    from: { row: 2, column: 1 },
    to: { row: openEnriched.length + 2, column: 16 }
  };


  // ==========================================
  // SHEET 3: SQ전체_점검원장 (160건 원본대조)
  // ==========================================
  const wsAll = workbook.addWorksheet('📑_전체항목_참조(160건)', {
    views: [{ state: 'frozen', ySplit: 2, showGridLines: true }]
  });

  wsAll.mergeCells('A1:N1');
  const allTitle = wsAll.getCell('A1');
  allTitle.value = '▣ SQ 레벨업 사전점검 전체 160개 항목 점검원장 (OPEN / CLOSE / 해당없음)';
  allTitle.font = { name: '맑은 고딕', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
  allTitle.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
  allTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY_LIGHT } };
  wsAll.getRow(1).height = 36;

  const allHeaders = [
    { header: '순번', key: 'seq', width: 6 },
    { header: 'No', key: 'no', width: 8 },
    { header: '대분류', key: 'category', width: 14 },
    { header: '세부 요구사항', key: 'detailReq', width: 30 },
    { header: '추진(준비) 항목', key: 'subItem', width: 28 },
    { header: '이행 상태 (지적사항)', key: 'statusText', width: 32 },
    { header: '팀', key: 'team', width: 10 },
    { header: '담당', key: 'manager', width: 12 },
    { header: '필요서류', key: 'doc', width: 22 },
    { header: '양식보유', key: 'formYn', width: 8 },
    { header: '개선여부', key: 'openClose', width: 10 },
    { header: '우선순위', key: 'priority', width: 9 },
    { header: '지정담당자', key: 'owner', width: 12 },
    { header: '완료목표', key: 'targetDate', width: 12 }
  ];

  wsAll.getRow(2).height = 28;
  allHeaders.forEach((col, idx) => {
    const cell = wsAll.getCell(2, idx + 1);
    cell.value = col.header;
    cell.font = { name: '맑은 고딕', size: 9.5, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF334155' } };
    wsAll.getColumn(idx + 1).width = col.width;
  });

  enrichedAllItems.forEach((item, index) => {
    const rowIdx = index + 3;
    const row = wsAll.getRow(rowIdx);
    row.height = 36;

    row.getCell(1).value = item.seq;
    row.getCell(2).value = item.no;
    row.getCell(3).value = item.category;
    row.getCell(4).value = item.detailReq;
    row.getCell(5).value = item.subItem;
    row.getCell(6).value = item.statusText;
    row.getCell(7).value = item.team || '오륙';
    row.getCell(8).value = item.manager || item.primaryOwner.split(' ')[0];
    row.getCell(9).value = item.doc;
    row.getCell(10).value = item.formYn;
    row.getCell(11).value = item.openClose;
    row.getCell(12).value = item.openClose === 'OPEN' ? item.priority + '등급' : '-';
    row.getCell(13).value = item.openClose === 'OPEN' ? item.primaryOwner : '-';
    row.getCell(14).value = item.openClose === 'OPEN' ? item.targetDate : '-';

    const isEven = index % 2 === 1;
    const rowBg = isEven ? GRAY_BG : 'FFFFFFFF';

    for (let c = 1; c <= 14; c++) {
      const cell = row.getCell(c);
      cell.font = { name: '맑은 고딕', size: 8.5 };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBg } };
      cell.border = {
        top: { style: 'thin', color: { argb: BORDER_COLOR } },
        bottom: { style: 'thin', color: { argb: BORDER_COLOR } },
        left: { style: 'thin', color: { argb: BORDER_COLOR } },
        right: { style: 'thin', color: { argb: BORDER_COLOR } }
      };
      if ([1, 2, 7, 8, 10, 11, 12, 13, 14].includes(c)) {
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      } else {
        cell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
      }
    }

    // Status styling
    const statusCell = row.getCell(11);
    statusCell.font = { name: '맑은 고딕', size: 9, bold: true };
    if (item.openClose === 'OPEN') {
      statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: S_RED_BG } };
      statusCell.font.color = { argb: S_RED_TXT };
    } else if (item.openClose === 'CLOSE') {
      statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1FAE5' } };
      statusCell.font.color = { argb: 'FF065F46' };
    } else {
      statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
      statusCell.font.color = { argb: 'FF64748B' };
    }
  });

  wsAll.autoFilter = {
    from: { row: 2, column: 1 },
    to: { row: enrichedAllItems.length + 2, column: 14 }
  };

  // Write file
  await workbook.xlsx.writeFile(destPath);
  console.log(`Excel action plan successfully generated at: ${destPath}`);
}

generateSQActionPlan().catch(console.error);
