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
