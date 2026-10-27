import { getKSTDateString } from "../../utils/dateUtils";

export const COLLECTION_NAME = "urgent_issues";
export const LOCAL_STORAGE_KEY = "oryuk_urgent_issues_v2";
export const HARD_DELETED_KEY = "oryuk_hard_deleted_urgent_ids";

export const todayDateStrFallback = () => getKSTDateString();

export const INITIAL_URGENT_ISSUES = [];

export const FALLBACK_NE1A_ISSUE = {
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
