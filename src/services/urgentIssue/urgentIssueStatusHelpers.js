import { getKSTTimeInfo, getKSTDateString } from "../../utils/dateUtils";

/**
 * 회의일정이 지정 일시 경과했는지 판별 (일정 경과 시 첫화면 및 활성목록에서 제외되어 [종결삭제관리]로 이동)
 * @param {Object} item - { category, startDate, date, expireDate, targetDate, meetingDate, meetingTime, isManuallyRestored }
 * @param {number} graceHours - 경과 기준 시간 (기본 0시간)
 * @returns {boolean}
 */
export const isMeetingExpired = (item, graceHours = 0) => {
  if (!item || typeof item !== "object") return false;
  const cat = String(item.category || "").trim();
  if (cat !== "회의일정" && !cat.includes("회의") && cat !== "meeting") return false;

  // Extract date string from all possible date fields
  let rawDate =
    item.meetingDate ||
    item.expireDate ||
    item.startDate ||
    item.targetDate ||
    item.date ||
    (item.createdAt ? String(item.createdAt).slice(0, 10) : "") ||
    "";

  if (!rawDate) return false;

  const kstInfo = getKSTTimeInfo();
  const todayStr = kstInfo.dateStr; // YYYY-MM-DD

  // Normalize date format
  const cleanStr = String(rawDate).replace(/[./]/g, "-").trim();
  const dateMatch = cleanStr.match(/(\d{4})[-년\s]*(\d{1,2})[-월\s]*(\d{1,2})/);

  let y, mon, d;
  if (dateMatch) {
    y = parseInt(dateMatch[1], 10);
    mon = parseInt(dateMatch[2], 10);
    d = parseInt(dateMatch[3], 10);
  } else {
    const mmddMatch = cleanStr.match(/(\d{1,2})[-월\s]*(\d{1,2})/);
    if (mmddMatch) {
      y = new Date().getFullYear();
      mon = parseInt(mmddMatch[1], 10);
      d = parseInt(mmddMatch[2], 10);
    } else {
      return false;
    }
  }

  const formattedItemDate = `${y}-${String(mon).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

  // 1. If meeting date is strictly before today (과거 일자), it is 100% expired
  if (formattedItemDate < todayStr) {
    return true;
  }

  // 2. If meeting date is today, check whether the meeting time (+ graceHours) has passed
  const mTime = String(item.meetingTime || item.time || "14:00").trim();
  let h = 14;
  let min = 0;
  const timeMatch = mTime.match(/(\d{1,2})\s*[:시]\s*(\d{1,2})?/);
  if (timeMatch) {
    h = parseInt(timeMatch[1], 10);
    if (timeMatch[2]) min = parseInt(timeMatch[2], 10);
    if (mTime.includes("오후") && h < 12) h += 12;
    if (mTime.includes("오전") && h === 12) h = 0;
  }

  const meetingStartTime = new Date(y, mon - 1, d, h, min, 0).getTime();
  const expireTimeMs = meetingStartTime + (graceHours * 60 * 60 * 1000);

  const [currY, currM, currD] = todayStr.split("-").map(Number);
  const nowKst = new Date(currY, currM - 1, currD, kstInfo.hour, kstInfo.minute, kstInfo.second || 0).getTime();

  return nowKst >= expireTimeMs;
};

/**
 * 항목이 종료(완료/만료/종결/삭제) 상태인지 종합 판별
 */
export const isLegacyDismissedQualityAlert = (item) => {
  if (!item || typeof item !== "object") return false;
  if (
    item.isManuallyRestored === true ||
    item.raw?.isManuallyRestored === true ||
    item.isClosedByAdmin === false ||
    item.raw?.isClosedByAdmin === false
  ) {
    return false;
  }

  const cat = String(item.category || "").trim();
  const isQualityAlert =
    cat === "품질경보" ||
    cat === "부적합경보" ||
    cat === "quality_alert" ||
    cat.includes("품질경보") ||
    cat.includes("부적합경보");
  if (!isQualityAlert) return false;

  // 기존 등록 건 중 NE1a D/SIDE W사양 엠보불량발생(issue_1792119149332) 건은 첫 화면 유지
  const idStr = String(item.id || item.rawId || item._docId || "");
  if (idStr.includes("1792119149332")) return false;
  const combined = `${item.title || ""} ${item.content || ""} ${item.raw?.title || ""} ${item.raw?.content || ""}`.toLowerCase();
  if (combined.includes("엠보불량") || combined.includes("ne1a d/side w사양")) return false;

  // 실제 브라우저 시간대(1776700000000 ~ 1789999999999) 및 1792541000000 이후 신규 등록 건은 정상 활성 노출
  const tsMatch = idStr.match(/(\d{13})/);
  if (tsMatch) {
    const ts = Number(tsMatch[1]);
    if (ts > 1792541000000 || (ts >= 1776700000000 && ts < 1790000000000)) {
      return false;
    }
  }

  return true;
};

export const isIssueClosed = (item, todayDateStr = "") => {
  if (!item || typeof item !== "object") return false;
  if (
    item.isDeleted === true ||
    item.isDeleted === "true" ||
    item.deleted === true ||
    item.status === "DELETED" ||
    item.isClosedByAdmin === true ||
    item.raw?.isClosedByAdmin === true ||
    isLegacyDismissedQualityAlert(item)
  ) {
    return true;
  }

  const cat = String(item.category || "").trim();
  const isQualityAlert =
    cat === "품질경보" ||
    cat === "부적합경보" ||
    cat === "quality_alert" ||
    cat.includes("품질경보") ||
    cat.includes("부적합경보");

  // 부적합경보는 조치결과가 입력되더라도 권태형/이명재/김동욱이 첫화면에서 [이 항목 삭제]를 처리할 때까지 첫화면 활성 상태 유지
  if (isQualityAlert) {
    return false;
  }

  if (item.isResolved === true || item.status === "RESOLVED" || item.status === "CLOSED" || item.status === "DONE") return true;
  if (typeof item.actionResult === "string" && item.actionResult.trim().length > 0) return true;

  // 1. 회의일정: 회의 시작 시간 경과 시 종료
  if (cat === "회의일정" || cat.includes("회의") || cat === "meeting") {
    if (isMeetingExpired(item, 0)) return true;
  }
  // 2. 사내공지: 만료일자 경과 시 종료 (수동 복구건 제외)
  if (cat === "공지사항" || cat === "사내공지" || cat === "공유사항" || cat.includes("공지") || cat === "notice") {
    const today = todayDateStr || getKSTDateString();
    if (item.expireDate && item.expireDate < today && !item.isManuallyRestored) return true;
  }
  return false;
};

// Helper: Sanitize legacy author names
export const sanitizeUrgentIssueItem = (item) => {
  if (!item) return item;
  let updated = { ...item };
  if (updated.author === "방상국") {
    updated.author = "권태형";
    updated.authorTitle = "대표이사";
  }
  if (updated.actionAuthor === "방상국") {
    updated.actionAuthor = "설유철";
  }
  if (Array.isArray(updated.replies)) {
    updated.replies = updated.replies.map((r) => {
      if (r.author === "방상국") {
        return { ...r, author: "설유철", authorTitle: "책임" };
      }
      return r;
    });
  }
  return updated;
};

// Helper: 판별 - 개별 협력업체/공정 내부 관리 이슈 여부
export const isHanulManagedIssue = (item) => {
  if (!item) return false;

  // 첫 화면 공식 등록 건은 절대 배제하지 않고 첫 화면에 온전히 유지
  if (item.isFirstScreenOrigin === true || item.origin === "FIRST_SCREEN") return false;

  const id = String(item.id || item._docId || item.customId || "");
  if (id.startsWith("urg_hanul_") || id.startsWith("hanul_qual_") || id.startsWith("hanul_issue_")) return true;

  const source = String(item.source || "").toLowerCase();
  if (source === "hanul") return true;

  const title = String(item.title || "").trim();
  if (title.startsWith("[한울품질경보]")) return true;

  return false;
};

// Helper: Sort strictly by latest registration/creation time
export const sortIssuesByLatest = (list = []) => {
  if (!Array.isArray(list) || list.length === 0) return [];
  return [...list].sort((a, b) => {
    const timeA = a.createdAt || a.updatedAt || a.date || a.startDate || a.expireDate || "";
    const timeB = b.createdAt || b.updatedAt || b.date || b.startDate || b.expireDate || "";
    if (timeA !== timeB) {
      return timeB.localeCompare(timeA);
    }
    return String(b.id || "").localeCompare(String(a.id || ""));
  });
};

// Helper: Category Priority and Smart Sorting
export const sortIssuesByCustomPriority = (list = []) => {
  if (!Array.isArray(list) || list.length === 0) return [];

  const getCategoryPriority = (item) => {
    const cat = item?.category || "";
    if (cat === "품질경보" || cat === "부적합경보") return 1;
    if (cat === "회의일정") return 2;
    if (cat === "오픈이슈" || cat === "품질이슈") return 3;
    return 4; // 공지사항, 사내공지, 공유사항
  };

  return [...list].sort((a, b) => {
    const prioA = getCategoryPriority(a);
    const prioB = getCategoryPriority(b);

    if (prioA !== prioB) {
      return prioA - prioB;
    }

    const timeA = a.createdAt || a.updatedAt || a.date || a.startDate || a.expireDate || "";
    const timeB = b.createdAt || b.updatedAt || b.date || b.startDate || b.expireDate || "";
    if (timeA !== timeB) {
      return timeB.localeCompare(timeA);
    }
    return String(b.id || "").localeCompare(String(a.id || ""));
  });
};

// Helper to determine if an issue has new updates / replies / opinions added
export const isIssueUpdated = (item) => {
  if (!item) return false;
  if (Array.isArray(item.replies) && item.replies.length > 0) return true;
  if (typeof item.actionResult === "string" && item.actionResult.trim().length > 0) return true;
  if (item.updatedAt && item.createdAt && item.updatedAt !== item.createdAt) return true;
  if (item.isUpdated || item.hasNewUpdate) return true;
  return false;
};
