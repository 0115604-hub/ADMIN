/**
 * authIssueConstants.js
 * Pure utility functions & predicate helpers for AuthModal issues:
 * - Category matching helpers (Quality alert, Meeting, Notice, Open issue)
 * - First-screen origin validation (filters manager-only issues from public first screen)
 * - Safe date string normalization (YYYY-MM-DD)
 * - Empty category draft generator
 */

// Category matching helpers
export const isCatQualityAlert = (cat) =>
  cat === "품질경보" ||
  cat === "품질 경보" ||
  cat === "부적합경보" ||
  cat === "부적합 경보" ||
  cat === "quality_alert" ||
  (typeof cat === "string" && (cat.includes("품질경보") || cat.includes("부적합경보")));

export const isCatMeeting = (cat) =>
  cat === "회의일정" ||
  cat === "회의 일정" ||
  cat === "meeting" ||
  (typeof cat === "string" && cat.includes("회의"));

export const isCatNotice = (cat) =>
  cat === "공지사항" ||
  cat === "사내공지" ||
  cat === "공유사항" ||
  cat === "notice" ||
  (typeof cat === "string" && cat.includes("공지"));

export const isCatOpenIssue = (cat) =>
  cat === "오픈이슈" ||
  cat === "오픈 이슈" ||
  cat === "품질이슈" ||
  cat === "open_issue" ||
  (!isCatQualityAlert(cat) && !isCatMeeting(cat) && !isCatNotice(cat));

/**
 * 🌟 첫 화면 등록 여부 판별 헬퍼 (첫 화면에서 직접 등록된 이슈만 첫 화면에 노출 및 합산 허용)
 * 관리자들이 개별 로그인해서 올린 품질이슈 또는 경보는 관리자가 관리하는 인원에 한하여 공지되며 첫 화면 노출/합산 완전 제외
 * 🌟 한울 대표 등이 첫 화면에서 올린 공식 품질경보는 첫 화면에 보존됨
 */
export const isFirstScreenIssue = (item) => {
  if (!item) return false;

  // 1. 첫 화면 공식 등록 건은 작성자(한울 대표, 공장 관리자, 임원 등)에 관계없이 첫 화면 노출 보장
  if (item.isFirstScreenOrigin === true || item.origin === "FIRST_SCREEN") {
    return true;
  }

  // 2. 개별 공정/협력업체 관리자가 내부에서 등록한 이슈 제외 (ID 접두사: hanul_qual_, urg_hanul_qual_, ext_qual_ 등)
  const id = String(item.id || item._docId || item.customId || "");
  if (
    id.startsWith("hanul_") ||
    id.startsWith("urg_hanul_") ||
    id.startsWith("ext_") ||
    id.startsWith("urg_ext_") ||
    id.startsWith("bulim_") ||
    id.startsWith("urg_bulim_") ||
    id.startsWith("yuseong_") ||
    id.startsWith("urg_yuseong_") ||
    id.startsWith("partner_")
  ) {
    return false;
  }

  // 3. 출처(source) 플래그가 개별 관리자 내부 대시보드인 경우 제외
  const source = String(item.source || "").toLowerCase();
  if (source === "hanul" || source === "extrusion" || source === "partner" || source === "bulim" || source === "yuseong") {
    return false;
  }

  // 4. 명시적 첫 화면 제외 플래그
  if (item.isFirstScreenOrigin === false) return false;

  // 5. 개별 관리자 내부 등록 전용 태그
  const title = String(item.title || "");
  if (title.startsWith("[한울품질경보]") || title.startsWith("[압출품질이슈]")) {
    return false;
  }

  // 6. 첫 화면 기본 ID 패턴(issue_...)인 경우 첫 화면 등록 건으로 유지 (한울 대표가 첫 화면에서 등록한 건 포함)
  if (id.startsWith("issue_")) {
    return true;
  }

  return true;
};

// Safe date normalizer (YYYY-MM-DD)
export const normalizeDateStr = (raw, fallback = "") => {
  if (!raw) return fallback;
  if (typeof raw === "object" && raw.seconds) {
    return new Date(raw.seconds * 1000).toISOString().slice(0, 10);
  }
  const str = String(raw).trim();
  const match = str.match(/(\d{4})[.\-\/](\d{1,2})[.\-\/](\d{1,2})/);
  if (match) {
    return `${match[1]}-${String(match[2]).padStart(2, "0")}-${String(match[3]).padStart(2, "0")}`;
  }
  return str.slice(0, 10) || fallback;
};

// Empty draft factory
export const createEmptyCategoryDraft = (
  catName,
  currentPlant = "삼랑진공장",
  author = "",
  authorTitle = "",
  todayDateStr = ""
) => ({
  category: catName,
  plant: currentPlant,
  author: author,
  authorTitle: authorTitle,
  startDate: todayDateStr,
  expireDate:
    catName === "공지사항" || catName === "사내공지"
      ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
      : todayDateStr,
  meetingTime: "14:00",
  meetingLocation:
    currentPlant === "한림공장"
      ? "한림공장 회의실"
      : currentPlant === "인주공장"
      ? "인주공장 회의실"
      : "삼랑진공장 2층 대회의실",
  meetingAgenda: "",
  attendees: [],
  progress: 0,
  title: "",
  content: "",
  images: [],
  actionResult: "",
  actionAuthor: "",
  actionImages: [],
  isResolved: false,
  replies: []
});
