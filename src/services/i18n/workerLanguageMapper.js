// ============================================================================
// 🌍 국적(Nationality) ➔ 지원 언어 코드 자동 매핑 및 근로자 인사카드 연동 모듈
// ============================================================================
import { getWorkerPersonnelCard, getNationalityMeta } from "../personnelCardService.js";
import { SUPPORTED_LANGUAGES } from "./supportedLanguages.js";

const nationalityLangMap = new Map();

export const getLanguageForNationality = (nationality) => {
  if (!nationality) return "ko";
  const nat = String(nationality).trim().toLowerCase();
  const cached = nationalityLangMap.get(nat);
  if (cached) return cached;

  let result = "en";

  // 1. 한국 / 대한민국 ➔ 한국어 (ko)
  if (
    nat.includes("대한민국") ||
    nat.includes("한국") ||
    nat.includes("korea") ||
    nat.includes("korean") ||
    nat === "ko" ||
    nat === "kr"
  ) {
    result = "ko";
  }
  // 2. 4대 주요 국적: 태국, 인도네시아, 베트남, 미얀마
  else if (nat.includes("태국") || nat.includes("thailand") || nat.includes("thai") || nat === "th") {
    result = "th";
  } else if (nat.includes("인도네시아") || nat.includes("indonesia") || nat === "id") {
    result = "id";
  } else if (nat.includes("베트남") || nat.includes("vietnam") || nat.includes("viet") || nat === "vi") {
    result = "vi";
  } else if (nat.includes("미얀마") || nat.includes("myanmar") || nat.includes("burma") || nat.includes("burmese") || nat === "my") {
    result = "my";
  } else {
    // 3. 그 외 외국인 ➔ 영어 기본
    result = "en";
  }

  nationalityLangMap.set(nat, result);
  return result;
};

// ============================================================================
// 👤 근로자 인사카드 기반 국적 및 자동 언어 메타 조회 (Map 캐싱으로 가비지 제거)
// ============================================================================
const workerLangInfoCache = new Map();

export const getWorkerLanguageInfo = (workerOrProfile) => {
  if (!workerOrProfile) {
    return {
      code: "ko",
      name: "Korean",
      nativeName: "한국어",
      flag: "🇰🇷",
      country: "대한민국",
      nationality: "대한민국",
      nationalityFlag: "🇰🇷",
      isAutoTranslated: false
    };
  }

  const cacheKey = `${workerOrProfile.company || ""}_${workerOrProfile.name || ""}_${workerOrProfile.nationality || ""}_${workerOrProfile.nationalityOther || ""}`;
  if (workerLangInfoCache.has(cacheKey)) {
    return workerLangInfoCache.get(cacheKey);
  }

  let nationality = workerOrProfile.nationality;
  let nationalityOther = workerOrProfile.nationalityOther;

  // 인사카드 데이터 조회 보완
  if (!nationality) {
    try {
      const card = getWorkerPersonnelCard(workerOrProfile);
      if (card) {
        nationality = card.nationality;
        nationalityOther = card.nationalityOther;
      }
    } catch (e) {
      console.warn("getWorkerPersonnelCard lookup warning:", e);
    }
  }

  const effectiveNationality = (nationality === "기타" ? (nationalityOther || nationality) : nationality) || "대한민국";
  const langCode = getLanguageForNationality(effectiveNationality);
  const langMeta = SUPPORTED_LANGUAGES.find((l) => l.code === langCode) || SUPPORTED_LANGUAGES[1];
  const natMeta = typeof getNationalityMeta === "function" ? getNationalityMeta(effectiveNationality) : null;

  const result = {
    ...langMeta,
    nationality: effectiveNationality,
    nationalityFlag: natMeta?.flag || langMeta.flag,
    isAutoTranslated: langCode !== "ko"
  };

  workerLangInfoCache.set(cacheKey, result);
  return result;
};

export default {
  getLanguageForNationality,
  getWorkerLanguageInfo
};
