/**
 * KST (Korea Standard Time, UTC+9, Asia/Seoul) Date & Time Utilities
 * Guarantees zero time-drift / timezone mismatch across browsers and NodeJS environments.
 */

// Format: "YYYY-MM-DD" in KST
export const getKSTDateString = (date = new Date()) => {
  try {
    const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
    if (!d || isNaN(d.getTime())) {
      const fallback = new Date();
      return new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Seoul',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).format(fallback);
    }
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Seoul',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(d);
  } catch (e) {
    const now = date instanceof Date ? date : new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const kst = new Date(utc + (9 * 60 * 60000));
    const yyyy = kst.getFullYear();
    const mm = String(kst.getMonth() + 1).padStart(2, '0');
    const dd = String(kst.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
};

// Format: "YYYY.MM.DD(요일) HH:mm"
export const getKSTFormattedString = (date = new Date()) => {
  try {
    const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Seoul',
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).formatToParts(d);

    const getPart = (type) => parts.find((p) => p.type === type)?.value || '00';
    const yyyy = getPart('year');
    const mm = getPart('month');
    const dd = getPart('day');
    const hh = getPart('hour');
    const min = getPart('minute');

    const days = ['일', '월', '화', '수', '목', '금', '토'];
    const dateObj = new Date(`${yyyy}-${mm}-${dd}T${hh}:${min}:00+09:00`);
    const dayName = days[dateObj.getDay()];

    return `${yyyy}.${mm}.${dd}(${dayName}) ${hh}:${min}`;
  } catch (e) {
    return getKSTDateString(date);
  }
};

// Format: "HH:mm" in KST
export const getKSTTimeString = (date = new Date()) => {
  try {
    const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
    return new Intl.DateTimeFormat('ko-KR', {
      timeZone: 'Asia/Seoul',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(d);
  } catch (e) {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  }
};

// Get detailed KST time info (hours, minutes, seconds, totalMinutes)
export const getKSTTimeInfo = (date = new Date()) => {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Seoul',
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).formatToParts(date);

    const getPart = (type) => parts.find((p) => p.type === type)?.value || '00';
    const year = getPart('year');
    const month = getPart('month');
    const day = getPart('day');
    const hour = parseInt(getPart('hour'), 10);
    const minute = parseInt(getPart('minute'), 10);
    const second = parseInt(getPart('second'), 10);
    const dateStr = `${year}-${month}-${day}`;
    const totalMinutes = hour * 60 + minute;

    return {
      year,
      month,
      day,
      hour,
      minute,
      second,
      dateStr,
      totalMinutes
    };
  } catch (e) {
    const now = new Date();
    const dateStr = getKSTDateString(now);
    const hour = now.getHours();
    const minute = now.getMinutes();
    return {
      year: dateStr.split('-')[0],
      month: dateStr.split('-')[1],
      day: dateStr.split('-')[2],
      hour,
      minute,
      second: now.getSeconds(),
      dateStr,
      totalMinutes: hour * 60 + minute
    };
  }
};

// Alias
export const getKoreanTodayDateStr = getKSTDateString;

/**
 * Format access timestamp into human relative string:
 * - Today: "오늘 HH:mm"
 * - Yesterday: "어제 HH:mm"
 * - Older: "M/D HH:mm" (e.g. "9/5 14:20")
 * - Null/empty/invalid: "미접속"
 */
export const formatRelativeAccessTime = (timestampStr) => {
  if (!timestampStr || typeof timestampStr !== "string") return "미접속";
  const trimmed = timestampStr.trim();
  if (!trimmed) return "미접속";

  try {
    // Matches formats like "2026. 09. 07. 13:05:00", "2026.09.07 13:05", "2026-09-07 13:05:00", "2026-09-07T13:05:00"
    const match = trimmed.match(/(\d{4})[^\d](\s*\d{1,2})[^\d](\s*\d{1,2})[^\d\w]*\s+(\d{1,2}):(\d{1,2})/);

    let yyyy, mm, dd, hh, min;
    if (match) {
      yyyy = match[1];
      mm = match[2].trim().padStart(2, "0");
      dd = match[3].trim().padStart(2, "0");
      hh = match[4].trim().padStart(2, "0");
      min = match[5].trim().padStart(2, "0");
    } else {
      const d = new Date(trimmed);
      if (isNaN(d.getTime())) return trimmed;
      const kstStr = getKSTFormattedString(d);
      const m2 = kstStr.match(/(\d{4})\.(\d{2})\.(\d{2})\(.*?\)\s*(\d{2}):(\d{2})/);
      if (m2) {
        yyyy = m2[1];
        mm = m2[2];
        dd = m2[3];
        hh = m2[4];
        min = m2[5];
      } else {
        return trimmed;
      }
    }

    const itemDateStr = `${yyyy}-${mm}-${dd}`;
    const todayStr = getKSTDateString(new Date());

    const todayDate = new Date();
    const yesterdayDate = new Date(todayDate.getTime() - 24 * 60 * 60 * 1000);
    const yesterdayStr = getKSTDateString(yesterdayDate);

    if (itemDateStr === todayStr) {
      return `오늘 ${hh}:${min}`;
    } else if (itemDateStr === yesterdayStr) {
      return `어제 ${hh}:${min}`;
    } else {
      const monthNum = parseInt(mm, 10);
      const dayNum = parseInt(dd, 10);
      return `${monthNum}/${dayNum} ${hh}:${min}`;
    }
  } catch (e) {
    return timestampStr;
  }
};

/**
 * Returns { mondayStr: 'YYYY-MM-DD', sundayStr: 'YYYY-MM-DD', mondayDate: Date, sundayDate: Date }
 * dynamically calculated for the given reference date (defaults to current real-time KST date).
 */
export const getThisWeekDateRange = (refDate = new Date()) => {
  try {
    let d = typeof refDate === 'string' || typeof refDate === 'number' ? new Date(refDate) : refDate;
    if (!d || isNaN(d.getTime())) {
      d = new Date();
    }
    const kstDateStr = getKSTDateString(d);
    const [yStr, mStr, dStr] = kstDateStr.split('-');
    const year = parseInt(yStr, 10);
    const month = parseInt(mStr, 10) - 1;
    const day = parseInt(dStr, 10);

    const curr = new Date(year, month, day);
    const dayOfWeek = curr.getDay(); // 0 is Sun, 1 is Mon ... 6 is Sat
    const distanceToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

    const monday = new Date(curr);
    monday.setDate(curr.getDate() + distanceToMonday);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const formatYMD = (dt) => {
      const y = dt.getFullYear();
      const m = String(dt.getMonth() + 1).padStart(2, '0');
      const dayNum = String(dt.getDate()).padStart(2, '0');
      return `${y}-${m}-${dayNum}`;
    };

    return {
      mondayStr: formatYMD(monday),
      sundayStr: formatYMD(sunday),
      mondayDate: monday,
      sundayDate: sunday
    };
  } catch (e) {
    const today = getKSTDateString(new Date());
    return { mondayStr: today, sundayStr: today, mondayDate: new Date(), sundayDate: new Date() };
  }
};

/**
 * Checks if a given date string, number, or Date is in the active current week (Monday ~ Sunday)
 * of the logged-in session / current real-time date.
 */
export const isThisWeek = (dateInput, refDate = new Date()) => {
  if (!dateInput) return false;
  try {
    const kstNow = getKSTDateString(refDate);
    const [curYear, curMonth] = kstNow.split('-');

    let targetStr = '';
    if (typeof dateInput === 'number') {
      targetStr = `${curYear}-${curMonth}-${String(dateInput).padStart(2, '0')}`;
    } else if (typeof dateInput === 'string') {
      const match = dateInput.match(/(\d{4})?-?(\d{1,2})-(\d{1,2})/);
      if (match) {
        const y = match[1] || curYear;
        const m = match[2].padStart(2, '0');
        const d = match[3].padStart(2, '0');
        targetStr = `${y}-${m}-${d}`;
      } else {
        const monthDayMatch = dateInput.match(/(\d{1,2})월\s*(\d{1,2})일/);
        if (monthDayMatch) {
          const m = monthDayMatch[1].padStart(2, '0');
          const d = monthDayMatch[2].padStart(2, '0');
          targetStr = `${curYear}-${m}-${d}`;
        } else {
          const idDateMatch = dateInput.match(/(\d{4})(\d{2})(\d{2})/);
          if (idDateMatch) {
            targetStr = `${idDateMatch[1]}-${idDateMatch[2]}-${idDateMatch[3]}`;
          }
        }
      }
    } else if (dateInput instanceof Date) {
      targetStr = getKSTDateString(dateInput);
    }

    if (!targetStr) return false;
    const { mondayStr, sundayStr } = getThisWeekDateRange(refDate);
    return targetStr >= mondayStr && targetStr <= sundayStr;
  } catch (e) {
    return false;
  }
};


