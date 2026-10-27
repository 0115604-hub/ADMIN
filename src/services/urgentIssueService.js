import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  onSnapshot
} from "firebase/firestore";
import { db } from "../firebase";
import {
  sendQualityAlertTelegram,
  sendQualityOpinionTelegram,
  sendQualityActionTelegram,
  sendQualityDeleteTelegram,
  sendMeetingReplyTelegram,
  sendOpenIssueAlertTelegram,
  sendOpenIssueReplyTelegram,
  sendMeetingNoticeAlertTelegram,
  sendMeetingNoticeReplyTelegram
} from "./telegramService";
import { getKSTTimeInfo, getKSTDateString } from "../utils/dateUtils";
import { sanitizeForFirestore } from "../utils/firestoreUtils";
import { syncQualityAlertToFourMLedger, unregisterFromFourMLedger } from "./fourMChangePointService";

const COLLECTION_NAME = "urgent_issues";
const LOCAL_STORAGE_KEY = "oryuk_urgent_issues_v2";

const todayDateStrFallback = () => getKSTDateString();

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
  const cleanStr = String(rawDate).replace(/[.\/]/g, "-").trim();
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
 * @param {Object} item
 * @param {string} todayDateStr - YYYY-MM-DD
 * @returns {boolean}
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

  // 🌟 부적합경보는 조치결과가 입력되더라도 권태형/이명재/김동욱이 첫화면에서 [이 항목 삭제]를 처리할 때까지 첫화면 활성 상태 유지
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

// Initial urgent issue samples (Empty by default to prevent zombie deleted items)
export const INITIAL_URGENT_ISSUES = [];

// Helper: Sanitize legacy author names (e.g. 방상국 -> 권태형 / 설유철)
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

// Helper: 판별 - 개별 협력업체/공정 내부 관리 이슈 여부 (첫 화면 및 전사 긴급이슈 컬렉션에서 완전 분리/배제 대상)
// 🌟 첫 화면에서 등록된 이슈(한울 대표 등록 건 포함)는 첫 화면 보존 대상이므로 제외하지 않음
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

const FALLBACK_NE1A_ISSUE = {
  id: "issue_1792119149332",
  _docId: "issue_1792119149332",
  customId: "issue_1792119149332",
  category: "부적합경보",
  plant: "한림공장",
  author: "김동욱",
  authorTitle: "책임",
  title: "NE1a D/SIDE W사양 엠보불량발생",
  content: "1.NE1a W사양으로 출하대기중 제품이 엠보마모로 인하여 전량불량판정\n  (품질: 배성한 책임)",
  startDate: "2026-10-16",
  expireDate: "2026-10-16",
  targetDate: "2026-10-16",
  createdAt: "2026-10-16-11:52",
  updatedAt: "2026-10-21-08:10",
  actionResult: "토일요일 8벌 부식완료\n월요일 정상가동중",
  actionAuthor: "김동욱",
  actionAt: "2026-10-21-08:10",
  status: "RESOLVED",
  isResolved: true,
  isDeleted: false,
  isFirstScreenOrigin: true,
  origin: "FIRST_SCREEN",
  fourM: "Machine",
  replies: [],
  images: [],
  actionImages: []
};

// Helper: Read local storage with in-memory caching
let memoryUrgentIssues = null;

export const getLocalUrgentIssues = () => {
  if (memoryUrgentIssues && Array.isArray(memoryUrgentIssues)) {
    return memoryUrgentIssues;
  }
  try {
    if (typeof window === "undefined" || !window.localStorage) {
      return [{ ...FALLBACK_NE1A_ISSUE }];
    }
    const hardDeletedIdsRaw = localStorage.getItem("oryuk_hard_deleted_urgent_ids") || "[]";
    let hardDeletedIds = [];
    try {
      hardDeletedIds = JSON.parse(hardDeletedIdsRaw);
    } catch (_) {
      hardDeletedIds = [];
    }

    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    const parsed = data ? JSON.parse(data) : [];
    const list = Array.isArray(parsed) ? parsed : [];

    const clean = list
      .filter((item) => !isHanulManagedIssue(item))
      .map((item) => {
        const sanitized = sanitizeUrgentIssueItem(item);
        if (isLegacyDismissedQualityAlert(sanitized)) {
          return { ...sanitized, isDeleted: true, isClosedByAdmin: true };
        }
        return sanitized;
      });

    // Ctrl+F5 캐시 초기화 또는 쿼터 초과 시에도 NE1a 활성 경보가 증발하지 않도록 보장
    const hasNe1a = clean.some((i) => String(i.id || i._docId || "") === "issue_1792119149332");
    if (!hasNe1a && !hardDeletedIds.includes("issue_1792119149332")) {
      clean.unshift({ ...FALLBACK_NE1A_ISSUE });
    }

    memoryUrgentIssues = clean;
    return clean;
  } catch (e) {
    console.error("Local storage read error for urgent issues:", e);
    return [{ ...FALLBACK_NE1A_ISSUE }];
  }
};

// Helper: Save local storage (종결삭제관리 조회를 위해 isDeleted 항목도 함께 저장)
export const saveLocalUrgentIssues = (issues) => {
  const valid = Array.isArray(issues) ? issues : [];
  memoryUrgentIssues = valid;
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(valid));
  } catch (e) {
    console.warn("Local storage write error for urgent issues, attempting trim:", e);
    try {
      const trimmed = valid.map((item, idx) => {
        if (idx > 15 && Array.isArray(item.images) && item.images.length > 0) {
          return {
            ...item,
            images: item.images.map((img) => (typeof img === "object" ? { ...img, dataUrl: "" } : img))
          };
        }
        return item;
      });
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(trimmed));
    } catch (innerErr) {
      console.error("Local storage urgent issues error after trim:", innerErr);
    }
  }
};

// Helper: Sort strictly by latest registration/creation time (최신순 내림차순)
export const sortIssuesByLatest = (list = []) => {
  if (!Array.isArray(list) || list.length === 0) return [];
  return [...list].sort((a, b) => {
    // 1. 생성/등록/수정 일시 내림차순 (최신순)
    const timeA = a.createdAt || a.updatedAt || a.date || a.startDate || a.expireDate || "";
    const timeB = b.createdAt || b.updatedAt || b.date || b.startDate || b.expireDate || "";
    if (timeA !== timeB) {
      return timeB.localeCompare(timeA);
    }
    // 2. id 기준 최신순 내림차순
    return String(b.id || "").localeCompare(String(a.id || ""));
  });
};

// Helper: Category Priority and Smart Sorting (카테고리별 내부 최신순 정렬)
// 1위: 품질경보 (최신 등록일시 내림차순)
// 2위: 회의일정 (최신 등록/일시 내림차순)
// 3위: 오픈이슈/품질이슈 (최신 등록/목표일 내림차순)
// 4위: 공지사항/사내공지/공유사항 (최신 등록/공지일 내림차순)
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

    // 1. 카테고리 우선순위: 품질경보(1) -> 회의일정(2) -> 오픈이슈(3) -> 공지사항(4)
    if (prioA !== prioB) {
      return prioA - prioB;
    }

    // 2. 카테고리별 내부 정렬: 모두 최신순 (최근 등록일시/생성일시/목표일시 내림차순)
    const timeA = a.createdAt || a.updatedAt || a.date || a.startDate || a.expireDate || "";
    const timeB = b.createdAt || b.updatedAt || b.date || b.startDate || b.expireDate || "";
    if (timeA !== timeB) {
      return timeB.localeCompare(timeA);
    }
    return String(b.id || "").localeCompare(String(a.id || ""));
  });
};

// Real-time Cloud Synchronization (종결/삭제된 항목도 실시간 동기화하여 '종결삭제관리'에서 확인 및 복구 가능)
// ⚡ 성능 최적화: 싱글톤 멀티플렉싱 리스너(Single-Flight) 및 인메모리 캐시 공유
let activeUrgentIssuesUnsub = null;
const urgentIssuesSubscribers = new Set();
let cachedUrgentIssues = null;
let urgentIssuesTeardownTimer = null;

export const subscribeUrgentIssues = (onUpdate) => {
  if (typeof onUpdate !== "function") return () => {};

  // 1. 이미 메모리에 캐시가 있거나 로컬스토리지 데이터가 있으면 즉시 전달 (UI 지연 제로)
  if (cachedUrgentIssues) {
    onUpdate(cachedUrgentIssues);
  } else {
    const local = sortIssuesByCustomPriority(getLocalUrgentIssues());
    if (local && local.length > 0) {
      cachedUrgentIssues = local;
      onUpdate(local);
    }
  }

  urgentIssuesSubscribers.add(onUpdate);

  if (urgentIssuesTeardownTimer) {
    clearTimeout(urgentIssuesTeardownTimer);
    urgentIssuesTeardownTimer = null;
  }

  // 2. 단 하나의 공유 Firestore 리스너만 연결 (다중 컴포넌트 마운트 시 중복 쿼리/네트워크 차단)
  if (!activeUrgentIssuesUnsub) {
    try {
      const colRef = collection(db, COLLECTION_NAME);
      activeUrgentIssuesUnsub = onSnapshot(
        colRef,
        (snapshot) => {
          if (snapshot.empty) {
            const emptyList = sortIssuesByCustomPriority(getLocalUrgentIssues());
            cachedUrgentIssues = emptyList;
            urgentIssuesSubscribers.forEach((cb) => {
              try { cb(emptyList); } catch (e) { console.error("UrgentIssues listener cb error:", e); }
            });
            return;
          }
          const list = [];
          snapshot.forEach((d) => {
            const data = d.data();
            if (!data) return;
            // ⭐ 첫 화면 전용 목록에서 협력업체/공정별 개별 관리자 이슈(한울 품질경보 등) 영구 분리 및 Firestore 삭제
            if (isHanulManagedIssue({ id: d.id, ...data })) {
              deleteDoc(doc(db, COLLECTION_NAME, d.id)).catch(() => {});
              return;
            }
            const sanitized = sanitizeUrgentIssueItem({ ...data, id: d.id, _docId: d.id, customId: data.id });
            const isDel = Boolean(
              data.isDeleted === true ||
              data.deleted === true ||
              data.isDeleted === "true" ||
              data.deleted === "true" ||
              isLegacyDismissedQualityAlert(sanitized)
            );
            list.push({ ...sanitized, isDeleted: isDel, isClosedByAdmin: isDel ? true : Boolean(data.isClosedByAdmin) });
          });
          const sorted = sortIssuesByCustomPriority(list);
          cachedUrgentIssues = sorted;
          saveLocalUrgentIssues(sorted);
          urgentIssuesSubscribers.forEach((cb) => {
            try { cb(sorted); } catch (e) { console.error("UrgentIssues listener cb error:", e); }
          });
        },
        (error) => {
          console.warn("Firestore urgent_issues sync warning (offline/rule):", error);
          const fallback = sortIssuesByCustomPriority(getLocalUrgentIssues());
          cachedUrgentIssues = fallback;
          urgentIssuesSubscribers.forEach((cb) => {
            try { cb(fallback); } catch (e) { console.error("UrgentIssues listener cb error:", e); }
          });
        }
      );
    } catch (e) {
      console.error("subscribeUrgentIssues error:", e);
      const fallback = sortIssuesByCustomPriority(getLocalUrgentIssues());
      onUpdate(fallback);
    }
  }

  // 3. 디바운스된 리스너 해제 (탭 이동 등 빠른 언마운트/마운트 시 불필요한 재연결 방지)
  return () => {
    urgentIssuesSubscribers.delete(onUpdate);
    if (urgentIssuesSubscribers.size === 0) {
      urgentIssuesTeardownTimer = setTimeout(() => {
        if (urgentIssuesSubscribers.size === 0 && activeUrgentIssuesUnsub) {
          activeUrgentIssuesUnsub();
          activeUrgentIssuesUnsub = null;
        }
      }, 5000);
    }
  };
};

// Add or update an urgent issue
export const saveUrgentIssue = async (issueData, options = {}) => {
  const current = getLocalUrgentIssues();
  const id = issueData.id || issueData._docId || issueData.customId || `issue_${Date.now()}`;
  const nowStr = new Date().toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).replace(/\. /g, "-").replace(/\./g, "");

  const existingIdx = current.findIndex(
    (i) => String(i.id) === String(id) || (i._docId && String(i._docId) === String(id)) || (i.customId && String(i.customId) === String(id))
  );

  const fullItem = {
    ...issueData,
    id,
    _docId: id,
    category: issueData.category || "오픈이슈",
    plant: issueData.plant || "삼랑진공장",
    author: issueData.author || "",
    authorTitle: issueData.authorTitle || "",
    title: issueData.title || "",
    content: issueData.content || "",
    startDate: issueData.startDate || issueData.expireDate || todayDateStrFallback(),
    expireDate: issueData.expireDate || issueData.targetDate || todayDateStrFallback(),
    targetDate: issueData.targetDate || issueData.expireDate || todayDateStrFallback(),
    meetingTime: issueData.meetingTime || "",
    images: Array.isArray(issueData.images) ? issueData.images : [],
    actionImages: Array.isArray(issueData.actionImages) ? issueData.actionImages : [],
    actionResult: issueData.actionResult || "",
    actionAuthor: issueData.actionAuthor || "",
    actionAt: issueData.actionAt || "",
    replies: Array.isArray(issueData.replies) ? issueData.replies : [],
    isResolved: issueData.isResolved !== undefined ? Boolean(issueData.isResolved) : Boolean((issueData.actionResult && issueData.actionResult.trim()) || (Array.isArray(issueData.actionImages) && issueData.actionImages.length > 0)),
    isDeleted: Boolean(issueData.isDeleted === true),
    isClosedByAdmin: issueData.isClosedByAdmin !== undefined ? Boolean(issueData.isClosedByAdmin) : Boolean(issueData.isDeleted === true),
    isManuallyRestored: issueData.isManuallyRestored !== undefined ? Boolean(issueData.isManuallyRestored) : Boolean(existingIdx >= 0 && current[existingIdx]?.isManuallyRestored),
    deletedAt: issueData.deletedAt || "",
    deletedBy: issueData.deletedBy || "",
    createdAt: issueData.createdAt || nowStr,
    updatedAt: (!options.isNew || existingIdx >= 0) ? nowStr : (issueData.updatedAt || "")
  };

  // Strip any undefined keys so Firestore setDoc does not throw
  Object.keys(fullItem).forEach((key) => {
    if (fullItem[key] === undefined) {
      delete fullItem[key];
    }
  });

  let updated;
  if (existingIdx >= 0) {
    updated = [...current];
    updated[existingIdx] = fullItem;
  } else {
    updated = [fullItem, ...current];
  }

  const sorted = sortIssuesByCustomPriority(updated);
  saveLocalUrgentIssues(sorted);

  try {
    const payload = sanitizeForFirestore(fullItem);
    await setDoc(doc(db, COLLECTION_NAME, id), payload);
  } catch (e) {
    console.warn("Firestore save urgent issue fallback to local:", e);
  }

  // 🔒 텔레그램 발송 가드: skipTelegram인 경우 완전 생략
  const skipTelegram = Boolean(options.skipTelegram);
  // 신규 등록(CREATE)은 options.isNew === true 이거나 기존 목록에 없는 신규 항목인 경우 발송
  const isTrulyNew = !skipTelegram && (
    options.isNew === true ||
    existingIdx < 0
  );

  if (!fullItem.isDeleted && !skipTelegram) {
    if (isTrulyNew) {
      // 1. 신규 등록 즉시 알림 (오직 신규 생성 시에만 발송)
      if (fullItem.category === "품질경보" || fullItem.category === "부적합경보") {
        sendQualityAlertTelegram(fullItem).catch((err) => {
          console.warn("Telegram alert error:", err);
        });
      } else if (fullItem.category === "오픈이슈" || fullItem.category === "open_issue" || fullItem.category === "품질이슈") {
        sendOpenIssueAlertTelegram(fullItem, "CREATE").catch((err) => {
          console.warn("Telegram open issue alert error:", err);
        });
      } else if (fullItem.category === "회의일정" || fullItem.category === "공지사항" || fullItem.category === "사내공지" || fullItem.category === "공유사항") {
        sendMeetingNoticeAlertTelegram(fullItem, "CREATE").catch((err) => {
          console.warn("Telegram meeting/notice alert error:", err);
        });
      }
    } else if (existingIdx >= 0 && !options.isNew) {
      // 2. 기존 항목 수정 / 상태 변경 / 조치완료 시 알림
      const prevItem = current[existingIdx];
      const isNewlyResolved = !prevItem?.isResolved && fullItem.isResolved;
      const progressChanged = prevItem?.progress !== undefined && fullItem.progress !== undefined && prevItem.progress !== fullItem.progress;
      const actionResultAdded = !prevItem?.actionResult && Boolean(fullItem.actionResult?.trim());

      if (fullItem.category === "품질경보" || fullItem.category === "부적합경보") {
        const actionResultChanged = Boolean(fullItem.actionResult?.trim()) && fullItem.actionResult !== prevItem?.actionResult;
        if (isNewlyResolved || actionResultAdded || actionResultChanged) {
          const actionImgs = (Array.isArray(fullItem.actionImages) && fullItem.actionImages.length > 0)
            ? fullItem.actionImages
            : (fullItem.replies?.[fullItem.replies.length - 1]?.files || []);

          sendQualityActionTelegram(fullItem, {
            actionAuthor: fullItem.actionAuthor || fullItem.author,
            actionContent: fullItem.actionResult,
            images: actionImgs
          }).catch((err) => {
            console.warn("Telegram quality action error:", err);
          });
        }
      } else if (fullItem.category === "오픈이슈" || fullItem.category === "open_issue" || fullItem.category === "품질이슈") {
        if (isNewlyResolved) {
          sendOpenIssueAlertTelegram(fullItem, "RESOLVE").catch((err) => {
            console.warn("Telegram open issue resolve alert error:", err);
          });
        } else if (progressChanged || actionResultAdded) {
          sendOpenIssueAlertTelegram(fullItem, "UPDATE").catch((err) => {
            console.warn("Telegram open issue update alert error:", err);
          });
        }
      }
    }
  }

  // 🌟 공식 4M 변동점 대장에 자동 동기화 (오직 품질경보/부적합경보만 동기화 - 오픈이슈, 회의, 공지 완전 제외)
  const catStr = String(fullItem.category || "").trim();
  const isOpenIssueOrNotice =
    catStr === "오픈이슈" ||
    catStr === "open_issue" ||
    catStr.includes("오픈이슈") ||
    catStr === "회의일정" ||
    catStr.includes("회의") ||
    catStr === "공지사항" ||
    catStr === "사내공지" ||
    catStr === "공유사항";

  const isQualAlert =
    !isOpenIssueOrNotice &&
    (catStr.includes("품질") ||
      catStr.includes("부적합") ||
      fullItem.type === "QUALITY_ALERT");

  return fullItem;
};

// Add a Reply / Attendance Response (회신란 / 조치결과 등록)
export const addIssueReply = async (issueId, replyData, fallbackIssue = null) => {
  const current = getLocalUrgentIssues();
  let target = current.find(
    (i) => String(i.id) === String(issueId) || (i._docId && String(i._docId) === String(issueId)) || (i.customId && String(i.customId) === String(issueId))
  );

  if (!target && fallbackIssue) {
    target = fallbackIssue;
  }

  if (!target) {
    try {
      const snap = await getDocs(collection(db, COLLECTION_NAME));
      snap.forEach((d) => {
        if (d.id === issueId || String(d.data()?.id) === String(issueId)) {
          target = sanitizeUrgentIssueItem({ id: d.id, _docId: d.id, ...d.data() });
        }
      });
    } catch (e) {
      console.warn("Firestore fetch in addIssueReply fallback:", e);
    }
  }

  if (!target) return null;

  const nowStr = new Date().toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).replace(/\. /g, "-").replace(/\./g, "");

  const newReply = {
    id: `rep_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    author: replyData.author || "작업자",
    authorTitle: replyData.authorTitle || "선임",
    plant: replyData.plant || target.plant || "삼랑진공장",
    attendanceStatus: replyData.attendanceStatus || "확인",
    actionDate: replyData.actionDate || replyData.date || nowStr.slice(0, 10),
    content: replyData.content ? replyData.content.trim() : (replyData.files?.length > 0 ? "파일이 첨부되었습니다." : "조치 완료"),
    files: replyData.files || replyData.images || [],
    createdAt: nowStr
  };

  const updatedReplies = [...(target.replies || []), newReply];
  const isQuality = target.category === "품질경보" || target.category === "부적합경보" || String(target.category || "").includes("경보");

  const updatedItem = {
    ...target,
    replies: updatedReplies,
    ...(isQuality
      ? {
          actionResult: newReply.content,
          actionAuthor: newReply.author,
          actionImages: (newReply.files && newReply.files.length > 0) ? newReply.files : (target.actionImages || []),
          actionAt: newReply.actionDate || nowStr,
          status: "RESOLVED",
          isResolved: true,
          // 🔒 관리자가 이미 삭제/종결한 건은 삭제 상태(isDeleted: true)를 온전히 유지하여 첫화면 재공지 방지
          isDeleted: target.isDeleted === true ? true : false,
          isClosedByAdmin: target.isDeleted === true ? true : false,
          isManuallyRestored: target.isDeleted === true ? Boolean(target.isManuallyRestored) : true
        }
      : {})
  };

  const saved = await saveUrgentIssue(updatedItem, { isNew: false, skipTelegram: true });

  // 개별 의견/회신 전용 텔레그램 알림 발송
  try {
    if (target.category === "품질경보" || target.category === "부적합경보") {
      sendQualityOpinionTelegram(target, newReply).catch(() => {});
    } else if (target.category === "오픈이슈" || target.category === "open_issue" || target.category === "품질이슈") {
      sendOpenIssueReplyTelegram(target, newReply).catch(() => {});
    } else if (target.category === "회의일정" || target.category === "공지사항" || target.category === "사내공지" || target.category === "공유사항") {
      sendMeetingNoticeReplyTelegram(target, newReply).catch(() => {});
    }
  } catch (err) {
    console.warn("Telegram reply alert error:", err);
  }

  return saved;
};

// Delete a Reply
export const deleteIssueReply = async (issueId, replyId) => {
  const current = getLocalUrgentIssues();
  let target = current.find(
    (i) => i.id === issueId || (i._docId && i._docId === issueId) || (i.customId && i.customId === issueId)
  );

  if (!target) {
    try {
      const snap = await getDocs(collection(db, COLLECTION_NAME));
      snap.forEach((d) => {
        if (d.id === issueId || d.data()?.id === issueId) {
          target = sanitizeUrgentIssueItem({ id: d.id, _docId: d.id, ...d.data() });
        }
      });
    } catch (e) {
      console.warn("Firestore fetch in deleteIssueReply fallback:", e);
    }
  }

  if (!target) return null;

  const currentReplies = Array.isArray(target.replies) ? [...target.replies] : [];
  // 🔒 정확히 대상 1개만 식별하여 삭제 (중복 등록된 동일 내용 의견도 1개만 안전하게 삭제)
  const targetIdx = currentReplies.findIndex(
    (r, idx) => r.id === replyId || String(idx) === String(replyId) || (r.id && String(r.id) === String(replyId))
  );

  let updatedReplies;
  if (targetIdx >= 0) {
    currentReplies.splice(targetIdx, 1);
    updatedReplies = currentReplies;
  } else {
    updatedReplies = currentReplies.filter((r) => r.id !== replyId);
  }

  const isQuality = target.category === "품질경보" || target.category === "부적합경보";
  const lastReply = updatedReplies[updatedReplies.length - 1];

  const updatedItem = {
    ...target,
    replies: updatedReplies,
    ...(isQuality
      ? {
          actionResult: lastReply ? lastReply.content : "",
          actionAuthor: lastReply ? lastReply.author : "",
          actionImages: lastReply?.files || [],
          actionAt: lastReply ? lastReply.actionDate || lastReply.createdAt : "",
          isResolved: Boolean(lastReply)
        }
      : {})
  };

  // 🔒 skipTelegram: true 및 isNew: false를 명시하여 의견 삭제 시 신규등록 텔레그램 발송 원천 차단
  return await saveUrgentIssue(updatedItem, { isNew: false, skipTelegram: true });
};

// In-flight deletion lock to prevent duplicate Telegram messages and race conditions
const activeDeletes = new Set();

// Delete an urgent issue (소프트 삭제 - 첫화면/카테고리에서는 내리고 '종결삭제관리'로 보존 및 이동)
export const deleteUrgentIssue = async (id, deleterName = "") => {
  const strId = String(id || "");
  if (!strId) return getLocalUrgentIssues();

  try {
    const current = getLocalUrgentIssues();
    let target = current.find(
      (i) =>
        String(i.id) === strId ||
        String(i._docId) === strId ||
        String(i.customId) === strId
    );

    if (!target) {
      try {
        const snap = await getDocs(collection(db, COLLECTION_NAME));
        snap.forEach((d) => {
          const data = d.data() || {};
          if (
            d.id === strId ||
            String(data.id) === strId ||
            String(data.customId) === strId ||
            String(data._docId) === strId
          ) {
            target = sanitizeUrgentIssueItem({ ...data, id: d.id, _docId: d.id });
          }
        });
      } catch (e) {
        console.warn("Firestore soft delete fetch fallback:", e);
      }
    }

    const nowStr = new Date().toLocaleString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    }).replace(/\. /g, "-").replace(/\./g, "");

    const archivedItem = {
      ...(target || { id: strId }),
      id: target?.id || strId,
      isDeleted: true,
      isManuallyRestored: false,
      deletedAt: nowStr,
      deletedBy: deleterName || "관리자"
    };

    // 1. Update in local storage (종결삭제관리에 보존)
    const exists = current.some((i) => String(i.id) === strId || String(i._docId) === strId);
    const updated = exists
      ? current.map((i) => (String(i.id) === strId || String(i._docId) === strId ? archivedItem : i))
      : [archivedItem, ...current];
    const sorted = sortIssuesByCustomPriority(updated);
    saveLocalUrgentIssues(sorted);

    // 2. Update in Firestore with setDoc
    try {
      await setDoc(doc(db, COLLECTION_NAME, target?.id || strId), archivedItem);
    } catch (e) {
      console.warn("Firestore soft delete error fallback to local:", e);
    }

    // 3. 6번 정책에 따라 품질경보 종결/삭제 텔레그램 알림은 비활성화됨
    return sorted;
  } catch (err) {
    console.error("deleteUrgentIssue error:", err);
    return getLocalUrgentIssues();
  }
};

// Hard Delete (영구 삭제 - DB에서 완전히 제거)
export const hardDeleteUrgentIssue = async (id, deleterName = "") => {
  activeDeletes.delete(id);
  const strId = String(id || "");
  if (!strId) return getLocalUrgentIssues();

  try {
    try {
      const hardDeletedIds = JSON.parse(localStorage.getItem("oryuk_hard_deleted_urgent_ids") || "[]");
      if (!hardDeletedIds.includes(strId)) {
        hardDeletedIds.push(strId);
        localStorage.setItem("oryuk_hard_deleted_urgent_ids", JSON.stringify(hardDeletedIds));
      }
    } catch (_) {}

    const current = getLocalUrgentIssues();
    const updated = current.filter(
      (i) =>
        String(i.id) !== strId &&
        String(i._docId) !== strId &&
        String(i.customId) !== strId
    );
    const sorted = sortIssuesByCustomPriority(updated);
    saveLocalUrgentIssues(sorted);

    try {
      await deleteDoc(doc(db, COLLECTION_NAME, strId));
    } catch (e) {
      console.warn("Direct doc deleteDoc fallback:", e);
    }

    // 영구삭제 시 4M 관리대장에서도 영구 제거
    try {
      await unregisterFromFourMLedger(strId);
    } catch (e) {
      console.warn("unregisterFromFourMLedger on hard delete warning:", e);
    }

    return sorted;
  } catch (err) {
    console.error("hardDeleteUrgentIssue error:", err);
    return getLocalUrgentIssues().filter((i) => String(i.id) !== strId);
  }
};

// Cancel Restore / Soft Archive (복구 취소 - 첫화면에서 내리고 관리대장에 보존)
export const cancelRestoreUrgentIssue = async (id, cancellerName = "복구 취소 (사용자)") => {
  try {
    const current = getLocalUrgentIssues();
    let target = current.find((i) => i.id === id);
    if (!target) {
      try {
        const snap = await getDocs(collection(db, COLLECTION_NAME));
        snap.forEach((d) => {
          if (d.id === id) {
            target = sanitizeUrgentIssueItem({ id: d.id, ...d.data() });
          }
        });
      } catch (e) {
        console.warn("Firestore cancel restore fetch fallback:", e);
      }
    }
    if (!target) return current;

    const nowStr = new Date().toLocaleString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    }).replace(/\. /g, "-").replace(/\./g, "");

    const archivedItem = {
      ...target,
      isDeleted: true,
      isManuallyRestored: false,
      deletedAt: nowStr,
      deletedBy: cancellerName || "관리자"
    };

    const exists = current.some((i) => i.id === id);
    const updated = exists
      ? current.map((i) => (i.id === id ? archivedItem : i))
      : [archivedItem, ...current];
    const sorted = sortIssuesByCustomPriority(updated);
    saveLocalUrgentIssues(sorted);

    try {
      await setDoc(doc(db, COLLECTION_NAME, id), archivedItem);
    } catch (e) {
      console.warn("Firestore cancel restore fallback to local:", e);
    }

    return sorted;
  } catch (err) {
    console.error("cancelRestoreUrgentIssue error:", err);
    return getLocalUrgentIssues();
  }
};

// Restore an issue (복구 지원)
export const restoreUrgentIssue = async (id) => {
  activeDeletes.delete(id);
  const current = getLocalUrgentIssues();
  let target = current.find((i) => i.id === id);
  if (!target) {
    try {
      const snap = await getDocs(collection(db, COLLECTION_NAME));
      snap.forEach((d) => {
        if (d.id === id) {
          target = sanitizeUrgentIssueItem({ id: d.id, ...d.data() });
        }
      });
    } catch (e) {
      console.warn("Firestore restore fetch fallback:", e);
    }
  }
  if (!target) return current;

  // If restoring an item whose date was in the past, update expireDate/targetDate to today
  const todayStr = new Date().toLocaleDateString("sv-SE"); // YYYY-MM-DD
  const isPast =
    (target.expireDate && target.expireDate < todayStr) ||
    (target.targetDate && target.targetDate < todayStr);

  const newExpireDate = isPast ? todayStr : (target.expireDate || target.targetDate || todayStr);

  // If meeting was in the past or expired today, bump meetingTime to future time so it does not immediately expire
  let newMeetingTime = target.meetingTime || "18:00";
  if (target.category === "회의일정" || target.category?.includes("회의")) {
    const kstNow = new Date();
    const utc = kstNow.getTime() + (kstNow.getTimezoneOffset() * 60000);
    const kstDate = new Date(utc + (9 * 3600000));
    const curH = kstDate.getHours();
    const curM = kstDate.getMinutes();
    const curTimeStr = `${String(curH).padStart(2, "0")}:${String(curM).padStart(2, "0")}`;
    if (!newMeetingTime || (newExpireDate <= todayStr && newMeetingTime <= curTimeStr)) {
      const nextH = Math.min(23, curH + 2);
      newMeetingTime = `${String(nextH).padStart(2, "0")}:00`;
    }
  }

  const nowStr = new Date().toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).replace(/\. /g, "-").replace(/\./g, "");

  const restoredItem = {
    ...target,
    id,
    isDeleted: false,
    isResolved: false,
    isManuallyRestored: true,
    restoredAt: nowStr,
    expireDate: newExpireDate,
    targetDate: newExpireDate,
    meetingTime: newMeetingTime,
    deletedAt: "",
    deletedBy: ""
  };

  const existingIdx = current.findIndex((i) => i.id === id);
  let updated;
  if (existingIdx >= 0) {
    updated = [...current];
    updated[existingIdx] = restoredItem;
  } else {
    updated = [restoredItem, ...current];
  }

  const sorted = sortIssuesByCustomPriority(updated);
  saveLocalUrgentIssues(sorted);

  try {
    await setDoc(doc(db, COLLECTION_NAME, id), restoredItem);
  } catch (e) {
    console.warn("Firestore restore fallback to local:", e);
  }

  return restoredItem;
};

// Update action result (조치결과 입력 및 조치완료 처리 - 품질경보만 텔레그램 발송)
export const updateUrgentIssueActionResult = async (id, actionResult, actionAuthor = "", actionImages = [], fallbackIssue = null) => {
  const current = getLocalUrgentIssues();
  let target = current.find(
    (i) => String(i.id) === String(id) || (i._docId && String(i._docId) === String(id)) || (i.customId && String(i.customId) === String(id))
  );

  if (!target && fallbackIssue) {
    target = fallbackIssue;
  }

  if (!target) {
    try {
      const snap = await getDocs(collection(db, COLLECTION_NAME));
      snap.forEach((d) => {
        if (d.id === id || String(d.data()?.id) === String(id)) {
          target = sanitizeUrgentIssueItem({ id: d.id, _docId: d.id, ...d.data() });
        }
      });
    } catch (e) {
      console.warn("Firestore fetch in updateUrgentIssueActionResult fallback:", e);
    }
  }

  if (!target) {
    console.warn("Target issue not found for updateUrgentIssueActionResult:", id);
    return null;
  }

  const nowStr = new Date().toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).replace(/\. /g, "-").replace(/\./g, "");

  const trimmed = actionResult ? actionResult.trim() : "";
  const effectiveImages = actionImages && actionImages.length > 0 ? actionImages : (target.actionImages || []);
  const hasActionData = Boolean(trimmed || effectiveImages.length > 0);
  const finalActionResult = trimmed || (effectiveImages.length > 0 ? "조치 후 사진 등록 완료 (현장 조치 완료)" : "");
  const effectiveAuthor = actionAuthor || target.actionAuthor || target.author || "현장담당자";

  // 기존 replies와 조치결과 동기화 (카드 및 상세모달에서 조치결과가 즉시 일치하도록 보장)
  const existingReplies = Array.isArray(target.replies) ? [...target.replies] : [];
  if (hasActionData) {
    const lastRep = existingReplies[existingReplies.length - 1];
    if (!lastRep || lastRep.content !== finalActionResult) {
      existingReplies.push({
        id: `rep_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        author: effectiveAuthor,
        authorTitle: target.authorTitle || "책임",
        plant: target.plant || "삼랑진공장",
        attendanceStatus: "확인",
        actionDate: nowStr.slice(0, 10),
        content: finalActionResult,
        files: effectiveImages,
        createdAt: nowStr
      });
    }
  }

  const updatedTarget = {
    ...target,
    ...(fallbackIssue ? {
      title: fallbackIssue.title || target.title,
      content: fallbackIssue.content !== undefined ? fallbackIssue.content : target.content,
      expireDate: fallbackIssue.expireDate || target.expireDate,
      meetingTime: fallbackIssue.meetingTime || target.meetingTime,
      meetingLocation: fallbackIssue.meetingLocation || target.meetingLocation
    } : {}),
    id: target.id || id,
    actionResult: finalActionResult,
    actionAuthor: effectiveAuthor,
    actionImages: effectiveImages,
    actionAt: hasActionData ? nowStr : "",
    replies: existingReplies,
    isResolved: hasActionData,
    status: hasActionData ? "RESOLVED" : (target.status || "ACTIVE"),
    isDeleted: target.isDeleted === true ? true : false,
    isClosedByAdmin: target.isDeleted === true ? true : false,
    isManuallyRestored: target.isDeleted === true ? Boolean(target.isManuallyRestored) : true
  };

  const saved = await saveUrgentIssue(updatedTarget, { isNew: false, skipTelegram: true });

  // Trigger real-time Telegram notification ONLY for 품질경보/부적합경보 조치완료 (사내공지/회의일정은 등록시만 발송)
  if (hasActionData && (updatedTarget.category === "품질경보" || updatedTarget.category === "부적합경보" || String(updatedTarget.category || "").includes("경보"))) {
    sendQualityActionTelegram(updatedTarget, {
      actionAuthor: updatedTarget.actionAuthor,
      actionContent: finalActionResult,
      actionRate: 100,
      images: updatedTarget.actionImages
    }).catch((err) => {
      console.warn("Telegram action notification error:", err);
    });
  }

  return saved;
};

// Toggle issue resolution status
export const toggleIssueResolved = async (id) => {
  const current = getLocalUrgentIssues();
  const target = current.find((i) => i.id === id);
  if (!target) return current;

  const updatedTarget = { ...target, isResolved: !target.isResolved };
  return await saveUrgentIssue(updatedTarget);
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