// ============================================================================
// 🌐 제조현장 작업일보 다국어(12개국어) 번역 서비스 (Work Log Multi-Language i18n Service)
// 지원 언어: 한국어, 영어, 베트남어, 필리핀(타갈로그), 태국어, 스리랑카(싱할라), 우즈베크어,
//          인도네시아어, 미얀마(버마어), 네팔어, 캄보디아(크메르), 몽골어
// ============================================================================

import { SUPPORTED_LANGUAGES } from "./i18n/supportedLanguages.js";
import { WORK_LOG_TRANSLATIONS } from "./i18n/workLogTranslations.js";
import { WORK_REPORT_DICTIONARY, NORMALIZED_REPORT_DICTIONARY } from "./i18n/workReportDictionary.js";
import {
  getLanguageForNationality,
  getWorkerLanguageInfo
} from "./i18n/workerLanguageMapper.js";

// Re-export constants & dictionaries for backward compatibility
export {
  SUPPORTED_LANGUAGES,
  WORK_LOG_TRANSLATIONS,
  WORK_REPORT_DICTIONARY,
  getLanguageForNationality,
  getWorkerLanguageInfo
};

const LOCAL_STORAGE_LANG_KEY = "factory_worker_language_v1";

// 🚀 인메모리 언어 캐시 (매 렌더링/라벨 조회마다 수백 번의 LocalStorage 동기 I/O 발생 원천 차단)
let memoryCurrentLang = null;
const SUPPORTED_LANG_CODES = new Set(SUPPORTED_LANGUAGES.map((l) => l.code));

// 현재 언어 가져오기 (인메모리 O(1) 우선 조회, 기본값: 'ko')
export const getCurrentWorkLogLanguage = () => {
  if (memoryCurrentLang) return memoryCurrentLang;
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      const saved = localStorage.getItem(LOCAL_STORAGE_LANG_KEY);
      if (saved && SUPPORTED_LANG_CODES.has(saved)) {
        memoryCurrentLang = saved;
        return saved;
      }
    }
  } catch (e) {
    console.warn("Failed to get current work log language:", e);
  }
  memoryCurrentLang = "ko";
  return "ko";
};

// 언어 변경 및 저장 (동일 언어 중복 호출 시 불필요한 스토리지 쓰기 및 커스텀 이벤트 버블링 차단)
export const setWorkLogLanguage = (langCode) => {
  const target = SUPPORTED_LANG_CODES.has(langCode) ? langCode : "ko";
  if (memoryCurrentLang === target) {
    return target;
  }
  memoryCurrentLang = target;
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.setItem(LOCAL_STORAGE_LANG_KEY, target);
      window.dispatchEvent(new CustomEvent("factory_language_changed", { detail: { lang: target } }));
    }
  } catch (e) {
    console.warn("Failed to set work log language:", e);
  }
  return target;
};

// 번역 텍스트 조회 헬퍼 (초고속 O(1) 인메모리 조회)
export const getWorkLogText = (key, lang = null) => {
  if (!key) return "";
  const currentLang = lang || memoryCurrentLang || getCurrentWorkLogLanguage();
  const entry = WORK_LOG_TRANSLATIONS[key];
  if (!entry) return key;
  return entry[currentLang] || entry["ko"] || entry["en"] || key;
};

// ============================================================================
// 🌍 용어 번역 조회 함수 (초고속 O(1) 매칭)
// langCode: "ko", "en", "vi", "th", "id", "my" 등
// ============================================================================
export const translateTerm = (term, lang = null) => {
  if (!term || typeof term !== "string") return term;
  const currentLang = lang || getCurrentWorkLogLanguage();
  if (currentLang === "ko") return term; // 한국어면 원본 그대로 반환

  const trimmed = term.trim();
  // 1. 정확한 키 직접 일치
  if (WORK_REPORT_DICTIONARY[trimmed]) {
    const entry = WORK_REPORT_DICTIONARY[trimmed];
    return entry[currentLang] || entry["en"] || trimmed;
  }

  // 2. 공백·대소문자 정규화 일치
  const norm = trimmed.replace(/\s+/g, " ").toLowerCase();
  if (NORMALIZED_REPORT_DICTIONARY[norm]) {
    const entry = NORMALIZED_REPORT_DICTIONARY[norm];
    return entry[currentLang] || entry["en"] || trimmed;
  }

  // 3. WORK_LOG_TRANSLATIONS 기본 사전 일치
  const fallback = getWorkLogText(trimmed, currentLang);
  if (fallback && fallback !== trimmed) {
    return fallback;
  }

  return term;
};

// ============================================================================
// 🔄 근로자 프로필/작업자 변경 시 해당 모국어로 언어 자동 동기화
// ============================================================================
export const syncWorkerLanguage = (workerOrProfile) => {
  try {
    const langInfo = getWorkerLanguageInfo(workerOrProfile);
    if (langInfo?.code) {
      return setWorkLogLanguage(langInfo.code);
    }
  } catch (e) {
    console.warn("syncWorkerLanguage error:", e);
  }
  return "ko";
};

export default {
  SUPPORTED_LANGUAGES,
  WORK_LOG_TRANSLATIONS,
  WORK_REPORT_DICTIONARY,
  getCurrentWorkLogLanguage,
  setWorkLogLanguage,
  getWorkLogText,
  getLanguageForNationality,
  getWorkerLanguageInfo,
  translateTerm,
  syncWorkerLanguage
};
